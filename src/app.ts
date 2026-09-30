import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import * as CompiledContract from '@midnight-ntwrk/compact-js/effect/CompiledContract';
import {
  setNetworkId,
  getNetworkId,
  NetworkId,
  validateNetworkId,
  getNetworkDetails
} from './network.js';
import { Contract, AuctionState, ledger, type Ledger, type Witnesses } from '../managed/contract/index.js';
import {
  generateRandomBytes,
  derivePartyIdentity,
  createWitnesses,
} from './api.js';

// Midnight.js Providers
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { ZKConfigProvider } from '@midnight-ntwrk/midnight-js-types';

declare global {
  interface Window {
    midnight?: {
      mnLace?: {
        enable: () => Promise<ConnectedAPI>;
        isEnabled: () => Promise<boolean>;
      };
    };
  }
}

/**
 * Derives a secure password for levelPrivateStateProvider using non-deterministic Web Crypto.
 */
function getOrCreatePrivateStatePassword(): string {
  const storageKey = 'midnight_shadowvault_ps_pwd';
  let pwd = localStorage.getItem(storageKey);
  if (!pwd) {
    const bytes = new Uint8Array(32);
    globalThis.crypto.getRandomValues(bytes);
    // Enforces policy: min 16 chars, uppercase, lowercase, digit, special character
    pwd = 'M1dn!ght#' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(storageKey, pwd);
  }
  return pwd;
}

export class ShadowVaultAuctionDApp {
  private activeNetwork: string = NetworkId.TestNet;
  private isConnected: boolean = false;
  private walletAddress: string | null = null;
  private coinPublicKey: string | null = null;
  private encryptionPublicKey: string | null = null;
  private walletDustBalance: bigint = 0n;

  private contractAddress: string | null = null;
  private boundContract: any = null;
  private dappConnectorAPI: ConnectedAPI | null = null;

  private publicDataProvider: any = null;
  private zkConfigProvider: ZKConfigProvider<string> | null = null;
  private proofProvider: any = null;
  private privateStateProvider: any = null;
  private activeBidderSecret: Uint8Array | null = null;

  // On-chain ledger state from indexer
  private currentStateEnum: AuctionState = AuctionState.Active;
  private deadline: bigint = 0n;
  private totalBids: bigint = 0n;
  private totalRefundsClaimed: bigint = 0n;
  private highestBidder: Uint8Array = new Uint8Array(32);
  private highestBid: bigint = 0n;
  private reservePrice: bigint = 0n;
  private sellerFundsClaimed: boolean = false;
  private winnerItemClaimed: boolean = false;
  private isConnectingWallet: boolean = false;

  constructor() {
    setNetworkId(NetworkId.TestNet);
    this.initPrivateStateProvider();
    this.initProviders();
    this.initWalletDiscovery();
    this.bindDOMEvents();
    this.log('System', 'ShadowVault transparent English auction initialized on Midnight Preprod.', 'green');
  }

  private initPrivateStateProvider(accountId: string = 'default_vault_user') {
    try {
      this.privateStateProvider = levelPrivateStateProvider({
        midnightDbName: 'shadow_vault_persistent_db',
        accountId: accountId,
        privateStoragePasswordProvider: () => getOrCreatePrivateStatePassword(),
      });
    } catch {
      this.privateStateProvider = null;
    }
  }

  private initProviders() {
    const details = getNetworkDetails(this.activeNetwork);
    this.publicDataProvider = indexerPublicDataProvider(details.indexerUrl, details.indexerWsUrl);
    const artifactOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    this.zkConfigProvider = new FetchZkConfigProvider(`${artifactOrigin}/managed`);
    this.proofProvider = httpClientProofProvider(details.proofServerUrl, this.zkConfigProvider!);
  }

  /**
   * Generates or retrieves the bidder secretKey strictly using the encrypted private state provider.
   * Under no circumstances is the secret stored in plaintext localStorage or sessionStorage.
   */
  public async getOrGenerateBidderSecretKey(): Promise<Uint8Array> {
    if (!this.privateStateProvider) {
      this.initPrivateStateProvider();
    }
    if (this.contractAddress && this.privateStateProvider) {
      try {
        this.privateStateProvider.setContractAddress(this.contractAddress);
      } catch {
        // scope already initialized
      }
    }
    const stateId = 'shadowVaultBidderSecret';
    let storedSecretHex: string | null = null;
    if (this.privateStateProvider) {
      try {
        storedSecretHex = await this.privateStateProvider.get(stateId);
      } catch {
        storedSecretHex = null;
      }
    }
    if (!storedSecretHex) {
      const randomSecret = generateRandomBytes(32);
      storedSecretHex = Array.from(randomSecret, b => b.toString(16).padStart(2, '0')).join('');
      if (this.privateStateProvider) {
        await this.privateStateProvider.set(stateId, storedSecretHex);
      }
    }
    const secretBytes = this.hexToBytes(storedSecretHex, 32);
    this.activeBidderSecret = secretBytes;
    return secretBytes;
  }

  private createCompiledContract(): any {
    const witnesses: Witnesses<any> = {
      secretKey: (context: any) => {
        // Explicit user override via DOM inputs (for test or role-switching)
        const input = (document.getElementById('sellerSecretInput') as HTMLInputElement)?.value ||
                      (document.getElementById('bidSecretInput') as HTMLInputElement)?.value ||
                      (document.getElementById('winnerSecretInput') as HTMLInputElement)?.value ||
                      (document.getElementById('refundSecretInput') as HTMLInputElement)?.value;
        if (input) {
          return [context.privateState, this.textOrHexTo32Bytes(input)];
        }
        // Use the encrypted private state secret key if already loaded
        if (this.activeBidderSecret) {
          return [context.privateState, this.activeBidderSecret];
        }
        // Fallback: generate and cache a secure random 32-byte secret
        const fresh = generateRandomBytes(32);
        this.activeBidderSecret = fresh;
        return [context.privateState, fresh];
      },
    };

    return CompiledContract.make('ShadowVault', Contract).pipe(
      CompiledContract.withWitnesses(witnesses)
    );
  }

  private async constructMidnightProviders(): Promise<MidnightProviders<any, any, any>> {
    if (!this.dappConnectorAPI) {
      throw new Error('Lace Wallet is not connected.');
    }
    if ((!this.coinPublicKey || !this.encryptionPublicKey) && typeof this.dappConnectorAPI.getShieldedAddresses === 'function') {
      try {
        const shielded = await this.dappConnectorAPI.getShieldedAddresses();
        if (shielded?.shieldedCoinPublicKey) this.coinPublicKey = shielded.shieldedCoinPublicKey;
        if (shielded?.shieldedEncryptionPublicKey) this.encryptionPublicKey = shielded.shieldedEncryptionPublicKey;
      } catch (e) {
        // Fallback
      }
    }

    const walletProvider = {
      balanceTx: (tx: any) => this.dappConnectorAPI!.balanceTx(tx),
      getCoinPublicKey: () => this.coinPublicKey as any,
      getEncryptionPublicKey: () => this.encryptionPublicKey as any,
    };

    const midnightProvider = {
      submitTx: (tx: any) => this.dappConnectorAPI!.submitTx(tx),
    };

    return {
      privateStateProvider: this.privateStateProvider,
      publicDataProvider: this.publicDataProvider,
      zkConfigProvider: this.zkConfigProvider,
      proofProvider: this.proofProvider,
      walletProvider,
      midnightProvider,
    } as any;
  }

  // Wallet Connection & Discovery
  private initWalletDiscovery() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => this.checkExistingWallet());
    }
  }

  private async checkExistingWallet() {
    if (window.midnight?.mnLace) {
      this.log('Wallet', 'Midnight Lace extension detected.', 'cyan');
    }
  }

  public async connectWallet() {
    if (this.isConnectingWallet) return;
    this.isConnectingWallet = true;
    this.clearWalletError();

    try {
      if (!window.midnight?.mnLace) {
        throw new Error('Midnight Lace wallet extension is not installed or detected.');
      }

      this.log('Wallet', 'Connecting to Lace wallet...', 'cyan');
      const api = await window.midnight.mnLace.enable();
      this.dappConnectorAPI = api;

      const state = await api.state();
      this.walletAddress = state.address;
      this.coinPublicKey = state.coinPublicKey;
      this.encryptionPublicKey = state.encryptionPublicKey;
      this.isConnected = true;

      // Validate network
      if (this.walletAddress) {
        this.syncNetworkWithWallet();
      }

      await this.refreshWalletBalance();
      this.updateWalletUI(true);
      if (this.walletAddress) {
        this.log('Wallet', `Connected: ${this.walletAddress.slice(0, 16)}...`, 'green');
      }
    } catch (err: any) {
      this.showWalletError(err.message || 'Failed to connect wallet');
      this.log('Error', err.message || 'Wallet connection failed', 'red');
      this.updateWalletUI(false);
    } finally {
      this.isConnectingWallet = false;
    }
  }

  private syncNetworkWithWallet() {
    if (!this.walletAddress) return;
    const addr = this.walletAddress.toLowerCase();
    let network: string = NetworkId.TestNet;
    if (addr.includes('preview')) network = NetworkId.Preview;
    else if (addr.includes('testnet') || addr.includes('preprod')) network = NetworkId.TestNet;
    else if (addr.includes('devnet')) network = NetworkId.DevNet;

    setNetworkId(network);
    this.activeNetwork = network;
    const badge = document.getElementById('verifiedNetworkName');
    if (badge) badge.textContent = `Verified: ${network}`;
  }

  private async refreshWalletBalance(): Promise<bigint> {
    if (!this.dappConnectorAPI) return 0n;
    try {
      const state = await this.dappConnectorAPI.state();
      this.walletDustBalance = BigInt(state.balance || 0);
      const balanceVal = document.getElementById('walletBalanceVal');
      if (balanceVal) balanceVal.textContent = `${this.walletDustBalance.toString()} Dust`;
      return this.walletDustBalance;
    } catch {
      return 0n;
    }
  }

  private updateWalletUI(connected: boolean) {
    const btn = document.getElementById('connectWalletBtn');
    const btnText = document.getElementById('walletBtnText');
    const balanceBox = document.getElementById('walletBalanceBox');

    if (connected && this.walletAddress) {
      if (btn) btn.classList.add('connected');
      if (btnText) btnText.textContent = `${this.walletAddress.slice(0, 8)}...${this.walletAddress.slice(-4)}`;
      if (balanceBox) balanceBox.style.display = 'flex';
    } else {
      if (btn) btn.classList.remove('connected');
      if (btnText) btnText.textContent = 'Connect Lace Wallet';
      if (balanceBox) balanceBox.style.display = 'none';
    }
  }

  // Contract Binding & Deployment
  public async bindToContract(address: string) {
    if (!address?.trim()) return;
    const cleanAddr = address.trim();
    this.contractAddress = cleanAddr;
    const disp = document.getElementById('displayContractAddr');
    if (disp) disp.textContent = cleanAddr;

    try {
      const compiledContract = this.createCompiledContract();
      const providers = await this.constructMidnightProviders();
      this.boundContract = await findDeployedContract(providers, {
        compiledContract,
        contractAddress: cleanAddr,
        privateStateId: 'shadowVaultAuctionState',
        initialPrivateState: {}
      });
      this.log('Contract', `Joined contract at ${cleanAddr.slice(0, 16)}...`, 'green');
      await this.queryIndexerState();
    } catch (err: any) {
      this.log('Contract', `Bind error: ${err.message}`, 'red');
    }
  }

  public async handleDeployNewContract() {
    this.clearWalletError();
    try {
      if (!this.isConnected) await this.connectWallet();
      this.log('Deploy', 'Synthesizing ZK proof for contract deployment with constructor parameters...', 'cyan');
      this.updatePrivacyStatus('Deploying...', '⚡ Synthesizing Prover Keys...', 'Submitting...');

      const itemInput = (document.getElementById('auctionItemInput') as HTMLInputElement)?.value || 'Genesis Item';
      const item = this.textOrHexTo32Bytes(itemInput);

      const payoutInput = (document.getElementById('sellerPayoutInput') as HTMLInputElement)?.value;
      const payoutAddress = payoutInput ? this.hexToBytes(payoutInput, 32) : (this.walletAddress ? this.hexToBytes(this.walletAddress, 32) : generateRandomBytes(32));

      const reserveInput = (document.getElementById('reservePriceInput') as HTMLInputElement)?.value || '1000';
      const reservePrice = BigInt(reserveInput);

      const deadlineInput = (document.getElementById('deadlineRoundsInput') as HTMLInputElement)?.value;
      const deadline = deadlineInput ? BigInt(deadlineInput) : BigInt(Math.floor(Date.now() / 1000) + 3600);

      const compiledContract = this.createCompiledContract();
      const providers = await this.constructMidnightProviders();

      const deployed = await deployContract(providers, {
        compiledContract,
        args: [item, 0n, payoutAddress, reservePrice, deadline],
        privateStateId: 'shadowVaultAuctionState',
        initialPrivateState: {},
      } as any);

      const newAddr = deployed.deployTxData.public.contractAddress;
      const txId = deployed.deployTxData.public.txId;
      this.contractAddress = newAddr;
      this.boundContract = deployed;

      const dispAddr = document.getElementById('displayContractAddr');
      const inputAddr = document.getElementById('inputContractAddr') as HTMLInputElement;
      if (dispAddr) dispAddr.textContent = newAddr;
      if (inputAddr) inputAddr.value = newAddr;

      const dispTx = document.getElementById('displayLatestTxId');
      if (dispTx) dispTx.textContent = txId;

      this.log('Deploy', `DEPLOYMENT SUCCESSFUL! Address: ${newAddr}`, 'green');
      this.updatePrivacyStatus('Deployed', '⚡ Prover Complete', '📜 Active on Ledger');
      await this.queryIndexerState();
    } catch (err: any) {
      this.showWalletError(`Deploy Failed: ${err.message}`);
      this.log('Error', `Deploy failed: ${err.message}`, 'red');
    }
  }

  public async handleCancelAuction() {
    this.clearWalletError();
    try {
      if (!this.boundContract) throw new Error('Join or deploy a contract first.');
      this.log('Circuit', 'Cancelling auction (only allowed before any bids)...', 'cyan');
      const tx = await this.boundContract.callTx.cancelAuction();
      this.recordTx(tx.public.txId);
      this.log('Circuit', `cancelAuction SUCCESS! Auction cancelled. Tx: ${tx.public.txId}`, 'yellow');
      await this.queryIndexerState();
    } catch (err: any) {
      this.showWalletError(`Cancel Failed: ${err.message}`);
      this.log('Error', err.message, 'red');
    }
  }

  public async handleSubmitBid() {
    this.clearWalletError();
    try {
      if (!this.boundContract) throw new Error('Join or deploy a contract first.');
      const amountInput = (document.getElementById('bidAmountInput') as HTMLInputElement)?.value;
      if (!amountInput) throw new Error('Please enter a bid amount.');
      const bidAmount = BigInt(amountInput);

      const refundInput = (document.getElementById('bidRefundAddressInput') as HTMLInputElement)?.value;
      const refundAddress = refundInput ? this.hexToBytes(refundInput, 32) : (this.walletAddress ? this.hexToBytes(this.walletAddress, 32) : generateRandomBytes(32));

      const secretInput = (document.getElementById('bidSecretInput') as HTMLInputElement)?.value;
      if (!secretInput && !this.activeBidderSecret) {
        await this.getOrGenerateBidderSecretKey();
      }

      this.log('Circuit', `Placing bid of ${bidAmount} with real native token escrow...`, 'cyan');
      this.updatePrivacyStatus('Escrow Witness', '⚡ Prover Key Synthesis...', 'Locking Escrow...');

      const tx = await this.boundContract.callTx.placeBid(bidAmount, refundAddress);
      this.recordTx(tx.public.txId);
      this.log('Circuit', `placeBid SUCCESS! Native token escrow locked on-chain. Tx: ${tx.public.txId}`, 'green');
      await this.queryIndexerState();
    } catch (err: any) {
      this.showWalletError(`Submit Bid Failed: ${err.message}`);
      this.log('Error', err.message, 'red');
    }
  }

  public async handleEndAuction() {
    this.clearWalletError();
    try {
      if (!this.boundContract) throw new Error('Join or deploy a contract first.');
      this.log('Circuit', 'Ending auction bidding phase (Permissionless Crank - block time >= deadline)...', 'cyan');
      const tx = await this.boundContract.callTx.endAuction();
      this.recordTx(tx.public.txId);
      this.log('Circuit', `endAuction SUCCESS! Bidding phase ended. Tx: ${tx.public.txId}`, 'green');
      await this.queryIndexerState();
    } catch (err: any) {
      this.showWalletError(`End Auction Failed: ${err.message}`);
      this.log('Error', err.message, 'red');
    }
  }

  public async handleSettleAuction() {
    this.clearWalletError();
    try {
      if (!this.boundContract) throw new Error('Join or deploy a contract first.');
      this.log('Circuit', 'Executing settlement transaction (Permissionless Crank)...', 'cyan');
      const tx = await this.boundContract.callTx.settleAuction();
      this.recordTx(tx.public.txId);
      this.log('Circuit', `settleAuction SUCCESS! Auction Settled. Tx: ${tx.public.txId}`, 'green');
      await this.queryIndexerState();
    } catch (err: any) {
      this.showWalletError(`Settle Failed: ${err.message}`);
      this.log('Error', err.message, 'red');
    }
  }

  public async handleSellerClaimFunds() {
    this.clearWalletError();
    try {
      if (!this.boundContract) throw new Error('Join or deploy a contract first.');
      this.log('Circuit', 'Seller claiming winning escrowed funds...', 'cyan');
      const tx = await this.boundContract.callTx.sellerClaimFunds();
      this.recordTx(tx.public.txId);
      this.log('Circuit', `sellerClaimFunds SUCCESS! Winning funds claimed. Tx: ${tx.public.txId}`, 'green');
      await this.queryIndexerState();
    } catch (err: any) {
      this.showWalletError(`Claim Funds Failed: ${err.message}`);
      this.log('Error', err.message, 'red');
    }
  }

  public async handleClaimWinner() {
    this.clearWalletError();
    try {
      if (!this.boundContract) throw new Error('Join or deploy a contract first.');
      const secretInput = (document.getElementById('winnerSecretInput') as HTMLInputElement)?.value;
      if (!secretInput && !this.activeBidderSecret) {
        await this.getOrGenerateBidderSecretKey();
      }

      const recipientInput = (document.getElementById('winnerRecipientInput') as HTMLInputElement)?.value;
      const recipientAddress = recipientInput
        ? this.hexToBytes(recipientInput, 32)
        : (this.walletAddress ? this.hexToBytes(this.walletAddress, 32) : new Uint8Array(32));

      this.log('Circuit', 'Winning bidder claiming item entitlement...', 'cyan');
      const tx = await this.boundContract.callTx.winnerClaimItem(recipientAddress);
      this.recordTx(tx.public.txId);
      this.log('Circuit', `winnerClaimItem SUCCESS! Auction entitlement claimed. Tx: ${tx.public.txId}`, 'green');
      await this.queryIndexerState();
    } catch (err: any) {
      this.showWalletError(`Claim Item Failed: ${err.message}`);
      this.log('Error', err.message, 'red');
    }
  }

  public async handleDepositItem(itemTokenIdHex?: string, amount?: bigint) {
    this.clearWalletError();
    try {
      if (!this.boundContract) throw new Error('Join or deploy a contract first.');
      const tokenIdInput = itemTokenIdHex || (document.getElementById('depositItemTokenInput') as HTMLInputElement)?.value;
      const amountInput = amount !== undefined ? amount : BigInt((document.getElementById('depositItemAmountInput') as HTMLInputElement)?.value || '1');
      const itemTokenId = tokenIdInput ? this.hexToBytes(tokenIdInput, 32) : generateRandomBytes(32);

      this.log('Circuit', `Depositing item (${amountInput}) into escrow...`, 'cyan');
      const tx = await this.boundContract.callTx.depositItem(itemTokenId, amountInput);
      this.recordTx(tx.public.txId);
      this.log('Circuit', `depositItem SUCCESS! Item escrowed. Tx: ${tx.public.txId}`, 'green');
      await this.queryIndexerState();
    } catch (err: any) {
      this.showWalletError(`Deposit Item Failed: ${err.message}`);
      this.log('Error', err.message, 'red');
    }
  }

  public async handleSellerReclaimItem() {
    this.clearWalletError();
    try {
      if (!this.boundContract) throw new Error('Join or deploy a contract first.');
      this.log('Circuit', 'Seller reclaiming unsold item from zero-bid auction...', 'cyan');
      const tx = await this.boundContract.callTx.sellerReclaimUnsoldItem();
      this.recordTx(tx.public.txId);
      this.log('Circuit', `sellerReclaimUnsoldItem SUCCESS! Item returned to seller. Tx: ${tx.public.txId}`, 'green');
      await this.queryIndexerState();
    } catch (err: any) {
      this.showWalletError(`Reclaim Item Failed: ${err.message}`);
      this.log('Error', err.message, 'red');
    }
  }

  public async handleClaimRefund() {
    this.clearWalletError();
    try {
      if (!this.boundContract) throw new Error('Join or deploy a contract first.');
      const secretInput = (document.getElementById('refundSecretInput') as HTMLInputElement)?.value;
      if (!secretInput && !this.activeBidderSecret) {
        await this.getOrGenerateBidderSecretKey();
      }

      const refundInput = (document.getElementById('refundAddressInput') as HTMLInputElement)?.value;
      const refundAddress = refundInput ? this.hexToBytes(refundInput, 32) : (this.walletAddress ? this.hexToBytes(this.walletAddress, 32) : generateRandomBytes(32));

      this.log('Circuit', 'Withdrawing accumulated outbid escrow refund via real token transfer...', 'cyan');
      const tx = await this.boundContract.callTx.withdrawRefund(refundAddress);
      this.recordTx(tx.public.txId);
      this.log('Circuit', `withdrawRefund SUCCESS! Refund reclaimed. Tx: ${tx.public.txId}`, 'green');
      await this.queryIndexerState();
    } catch (err: any) {
      this.showWalletError(`Refund Failed: ${err.message}`);
      this.log('Error', err.message, 'red');
    }
  }

  // State Query and UI update
  public async queryIndexerState() {
    if (!this.contractAddress) return;
    try {
      const onChain = await this.publicDataProvider.queryContractState(this.contractAddress);
      if (onChain?.data) {
        const l = ledger(onChain.data);
        this.currentStateEnum = l.state;
        this.deadline = l.deadline;
        this.totalBids = l.totalBids;
        this.totalRefundsClaimed = l.totalRefundsClaimed;
        this.highestBidder = l.highestBidder;
        this.highestBid = l.highestBid;
        this.reservePrice = l.reservePrice;
        this.sellerFundsClaimed = l.sellerFundsClaimed;
        this.winnerItemClaimed = l.winnerItemClaimed;
        this.updateLedgerUI();
      }
    } catch (e: any) {
      this.log('Indexer', `Query error: ${e.message}`, 'dim');
    }
  }

  private updateLedgerUI() {
    const stateEl = document.getElementById('displayAuctionState');
    if (stateEl) {
      const stateName = AuctionState[this.currentStateEnum] || 'UNKNOWN';
      stateEl.textContent = stateName.toUpperCase();
      stateEl.className = `metric-value badge-state state-${stateName.toLowerCase()}`;
    }

    const roundEl = document.getElementById('displayRoundDeadline');
    if (roundEl) roundEl.textContent = `Deadline: ${this.deadline > 0n ? new Date(Number(this.deadline) * 1000).toLocaleString() : '--'}`;

    const highestBidEl = document.getElementById('displayHighestBid');
    if (highestBidEl) highestBidEl.textContent = `${this.highestBid} dust`;

    const bidsRefundsEl = document.getElementById('displayTotalBidsRefunds');
    if (bidsRefundsEl) bidsRefundsEl.textContent = `${this.totalBids} / ${this.totalRefundsClaimed}`;

    const highestBidderEl = document.getElementById('displayHighestBidder');
    if (highestBidderEl) {
      const hex = this.bytesToHex(this.highestBidder);
      highestBidderEl.textContent = hex.replace(/00/g, '').length === 0 ? '--' : hex;
    }

    const winningStatusEl = document.getElementById('displayWinningStatus');
    if (winningStatusEl) {
      const sellerStatus = this.sellerFundsClaimed ? 'Seller Funds Claimed' : 'Seller Unclaimed';
      const itemStatus = this.winnerItemClaimed ? 'Item Claimed' : 'Item Unclaimed';
      winningStatusEl.textContent = `${sellerStatus} | ${itemStatus}`;
    }
  }

  private recordTx(txId: string) {
    const disp = document.getElementById('displayLatestTxId');
    if (disp) disp.textContent = txId;
  }

  private log(tag: string, message: string, color: 'green' | 'yellow' | 'red' | 'cyan' | 'dim' = 'dim') {
    const terminal = document.getElementById('terminalLog');
    if (!terminal) return;
    const div = document.createElement('div');
    div.className = `log-line ${color}`;
    div.textContent = `[${tag}] ${message}`;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
  }

  private updatePrivacyStatus(witness: string, prover: string, ledgerStatus: string) {
    const wEl = document.getElementById('privateWitnessStatus');
    const pEl = document.getElementById('proverStatus');
    const lEl = document.getElementById('ledgerStatusTag');
    if (wEl) wEl.textContent = witness;
    if (pEl) pEl.textContent = prover;
    if (lEl) lEl.textContent = ledgerStatus;
  }

  private showWalletError(msg: string) {
    const banner = document.getElementById('walletErrorBanner');
    const msgEl = document.getElementById('walletErrorMsg');
    if (banner && msgEl) {
      msgEl.textContent = msg;
      banner.style.display = 'flex';
    }
  }

  private clearWalletError() {
    const banner = document.getElementById('walletErrorBanner');
    if (banner) banner.style.display = 'none';
  }

  private textOrHexTo32Bytes(val: string): Uint8Array {
    if (/^[0-9a-fA-F]{64}$/.test(val)) {
      return this.hexToBytes(val, 32);
    }
    const bytes = new TextEncoder().encode(val.padEnd(32, '0'));
    return bytes.slice(0, 32);
  }

  private hexToBytes(hex: string, length: number = 32): Uint8Array {
    const clean = hex.replace(/^0x/, '');
    const bytes = new Uint8Array(length);
    for (let i = 0; i < Math.min(clean.length / 2, length); i++) {
      bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16) || 0;
    }
    return bytes;
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  private bindDOMEvents() {
    document.getElementById('connectWalletBtn')?.addEventListener('click', () => this.connectWallet());
    document.getElementById('walletErrorClose')?.addEventListener('click', () => this.clearWalletError());
    document.getElementById('btnDeployContract')?.addEventListener('click', () => this.handleDeployNewContract());
    document.getElementById('btnJoinContract')?.addEventListener('click', () => {
      const addr = (document.getElementById('inputContractAddr') as HTMLInputElement)?.value;
      if (addr) this.bindToContract(addr);
    });

    document.getElementById('btnCancelAuction')?.addEventListener('click', () => this.handleCancelAuction());
    document.getElementById('btnSubmitBid')?.addEventListener('click', () => this.handleSubmitBid());
    document.getElementById('btnEndAuction')?.addEventListener('click', () => this.handleEndAuction());
    document.getElementById('btnSettleAuction')?.addEventListener('click', () => this.handleSettleAuction());
    document.getElementById('btnSellerClaimFunds')?.addEventListener('click', () => this.handleSellerClaimFunds());
    document.getElementById('btnClaimWinner')?.addEventListener('click', () => this.handleClaimWinner());
    document.getElementById('btnClaimRefund')?.addEventListener('click', () => this.handleClaimRefund());

    document.getElementById('btnClearLog')?.addEventListener('click', () => {
      const term = document.getElementById('terminalLog');
      if (term) term.innerHTML = '';
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const tab = target.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        target.classList.add('active');
        document.getElementById(`tab-${tab}`)?.classList.add('active');
      });
    });
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    (window as any).shadowVaultApp = new ShadowVaultAuctionDApp();
  });
}
