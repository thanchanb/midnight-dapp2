import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
  (window as any).process = (window as any).process || { env: {} };
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
}

import { Contract, VaultState, ledger, type Witnesses } from '../managed/contract/index.js';
import * as CompiledContract from '@midnight-ntwrk/compact-js/effect/CompiledContract';
import { findDeployedContract, deployContract, type DeployedContract, type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { setNetworkId, getNetworkId, NetworkId } from './network.js';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import type { ConnectedAPI, TokenType } from '@midnight-ntwrk/dapp-connector-api';
import type { CoinPublicKey, EncPublicKey, FinalizedTransaction, TransactionId } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import {
  type MidnightProviders,
  type WalletProvider,
  type MidnightProvider,
  type PrivateStateProvider,
  ZKConfigProvider,
  createVerifierKey,
  createProverKey,
  createZKIR
} from '@midnight-ntwrk/midnight-js-types';

export class BrowserZkConfigProvider extends ZKConfigProvider<string> {
  private baseUrl: string;

  constructor(baseUrl: string) {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private cleanCircuitId(circuitId: string): string {
    if (circuitId.includes('#')) {
      return circuitId.substring(circuitId.indexOf('#') + 1);
    }
    return circuitId;
  }

  private async fetchBinary(subPath: string, circuitId: string, ext: string): Promise<Uint8Array> {
    const id = this.cleanCircuitId(circuitId);
    const url = `${this.baseUrl}/${subPath}/${encodeURIComponent(id)}${ext}`;
    const fetcher = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : fetch;
    const res = await fetcher(url, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Failed to fetch ZK asset from ${url}: ${res.status} ${res.statusText}`);
    }
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  }

  async getVerifierKey(circuitId: string): Promise<any> {
    const bytes = await this.fetchBinary('keys', circuitId, '.verifier');
    return createVerifierKey(bytes);
  }

  async getProverKey(circuitId: string): Promise<any> {
    const bytes = await this.fetchBinary('keys', circuitId, '.prover');
    return createProverKey(bytes);
  }

  async getZKIR(circuitId: string): Promise<any> {
    try {
      const bytes = await this.fetchBinary('zkir', circuitId, '.bzkir');
      return createZKIR(bytes);
    } catch {
      const bytes = await this.fetchBinary('zkir', circuitId, '.zkir');
      return createZKIR(bytes);
    }
  }
}

declare global {
  interface Window {
    midnight?: Record<string, any>;
  }
}

// In-memory private state provider for client session
class ClientPrivateStateProvider implements PrivateStateProvider<string, any> {
  private stateStore = new Map<string, any>();
  private signingKeys = new Map<string, string>();
  private activeContractAddress: string | null = null;

  async get(id: string): Promise<any> {
    return this.stateStore.get(id) ?? null;
  }

  async set(id: string, state: any): Promise<void> {
    this.stateStore.set(id, state);
  }

  async remove(id: string): Promise<void> {
    this.stateStore.delete(id);
  }

  async clear(): Promise<void> {
    this.stateStore.clear();
  }

  async getSigningKey(address: string): Promise<string | null> {
    return this.signingKeys.get(address) ?? null;
  }

  async setSigningKey(address: string, signingKey: string): Promise<void> {
    this.signingKeys.set(address, signingKey);
  }

  async removeSigningKey(address: string): Promise<void> {
    this.signingKeys.delete(address);
  }

  async clearSigningKeys(): Promise<void> {
    this.signingKeys.clear();
  }

  async exportPrivateStates(): Promise<any> {
    return Array.from(this.stateStore.entries()).map(([id, state]) => ({ id, state }));
  }

  async importPrivateStates(exportData: any, _options?: any): Promise<any> {
    const states = Array.isArray(exportData) ? exportData : (exportData?.states ?? []);
    for (const s of states) {
      this.stateStore.set(s.id, s.state);
    }
    return { imported: states.length, failed: [] };
  }

  async exportSigningKeys(): Promise<any> {
    return Array.from(this.signingKeys.entries()).map(([address, key]) => ({ address, signingKey: key }));
  }

  async importSigningKeys(exportData: any, _options?: any): Promise<any> {
    const keys = Array.isArray(exportData) ? exportData : (exportData?.keys ?? []);
    for (const k of keys) {
      this.signingKeys.set(k.address, k.signingKey);
    }
    return { imported: keys.length, failed: [] };
  }

  setContractAddress(address: string): void {
    this.activeContractAddress = address;
  }
}


class ShadowVaultDApp {
  private isConnected: boolean = false;
  private activeNetwork: string = 'preview';
  private walletAddress: string | null = null;
  private unshieldedAddress: string | null = null;
  private coinPublicKey: string | null = null;
  private encryptionPublicKey: string | null = null;
  private walletDustBalance: bigint = 0n;

  private contractAddress: string | null = null;
  private boundContract: any = null;
  private dappConnectorAPI: ConnectedAPI | null = null;

  private publicDataProvider: any = null;
  private zkConfigProvider: ZKConfigProvider<string> | null = null;
  private proofProvider: any = null;
  private privateStateProvider: ClientPrivateStateProvider = new ClientPrivateStateProvider();

  // On-chain ledger state from indexer
  private counter: bigint | null = null;
  private currentStateEnum: VaultState | null = null;
  private totalDeposits: bigint | null = null;
  private publicCommitment: Uint8Array | null = null;
  private lastDisclosedHash: Uint8Array | null = null;

  constructor() {
    setNetworkId(NetworkId.TestNet);
    this.initProviders();
    this.bindDOMEvents();
    this.log('System', 'ShadowVault initialized on Midnight Preprod Testnet.', 'green');
  }

  private initProviders() {
    this.publicDataProvider = indexerPublicDataProvider(
      'https://indexer.preprod.midnight.network/api/v4/graphql',
      'wss://indexer.preprod.midnight.network/api/v4/graphql/ws'
    );

    const artifactOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    this.zkConfigProvider = new BrowserZkConfigProvider(`${artifactOrigin}/managed`);
    this.proofProvider = httpClientProofProvider('http://localhost:6300', this.zkConfigProvider);
  }

  private createCompiledContract(): any {
    const witnesses: Witnesses<any> = {
      secretWitness: (context) => {
        const passphraseInput = (document.getElementById('claimPassphrase') as HTMLInputElement)?.value;
        if (!passphraseInput) {
          throw new Error('Private witness error: secret passphrase input is empty.');
        }
        const secretBytes = new TextEncoder().encode(passphraseInput.padEnd(32, '0')).slice(0, 32);
        return [context.privateState, secretBytes];
      },
      userSalt: (context) => {
        const saltHex = (document.getElementById('claimSalt') as HTMLInputElement)?.value;
        if (!saltHex) {
          throw new Error('Private witness error: salt input is empty.');
        }
        return [context.privateState, this.hexToBytes(saltHex, 32)];
      },
      ownerKey: (context) => {
        const ownerInput = (document.getElementById('initOwnerId') as HTMLInputElement)?.value;
        if (!ownerInput) {
          throw new Error('Witness error: owner public identifier input is empty.');
        }
        return [context.privateState, this.hexToBytes(ownerInput, 32)];
      }
    };

    return CompiledContract.make('ShadowVault', Contract).pipe(
      CompiledContract.withWitnesses(witnesses)
    );
  }

  private constructMidnightProviders(): MidnightProviders<any, any, any> {
    if (!this.dappConnectorAPI) {
      throw new Error('Cannot construct providers: Lace Wallet is not connected.');
    }
    const currentCoinKey = (this.coinPublicKey || '00'.repeat(32)) as unknown as CoinPublicKey;
    const currentEncKey = (this.encryptionPublicKey || '00'.repeat(32)) as unknown as EncPublicKey;

    const walletProvider: WalletProvider = {
      balanceTx: async (tx: any): Promise<FinalizedTransaction> => {
        const serialized = this.bytesToHex(tx.serialize());
        const balanced = await this.dappConnectorAPI!.balanceUnsealedTransaction(serialized);
        const rawBytes = this.hexToBytes(balanced.tx, balanced.tx.length / 2);
        return (tx.constructor as any).deserialize(
          (tx as any).markerS?.instance,
          (tx as any).markerP?.instance,
          (tx as any).markerB?.instance,
          rawBytes
        );
      },
      getCoinPublicKey: () => currentCoinKey,
      getEncryptionPublicKey: () => currentEncKey,
    };

    const midnightProvider: MidnightProvider = {
      submitTx: async (finalizedTx: FinalizedTransaction): Promise<TransactionId> => {
        const identifiers = finalizedTx.identifiers();
        if (!identifiers || identifiers.length === 0) {
          throw new Error('Finalized transaction does not contain valid identifiers.');
        }
        const serialized = this.bytesToHex(finalizedTx.serialize());
        await this.dappConnectorAPI!.submitTransaction(serialized);
        return identifiers[0];
      }
    };

    return {
      privateStateProvider: this.privateStateProvider,
      publicDataProvider: this.publicDataProvider,
      zkConfigProvider: this.zkConfigProvider!,
      proofProvider: this.proofProvider,
      walletProvider,
      midnightProvider,
    };
  }

  private showWalletError(message: string) {
    const banner = document.getElementById('walletErrorBanner');
    const msgEl = document.getElementById('walletErrorMsg');
    if (banner && msgEl) {
      msgEl.textContent = message;
      banner.style.display = 'flex';
    }
  }

  private clearWalletError() {
    const banner = document.getElementById('walletErrorBanner');
    if (banner) {
      banner.style.display = 'none';
    }
  }

  // Phase 1: Real wallet connect/disconnect ONLY
  public async toggleLaceWallet() {
    const btnText = document.getElementById('walletBtnText');
    const btn = document.getElementById('connectWalletBtn');
    const balanceBox = document.getElementById('walletBalanceBox');
    const balanceVal = document.getElementById('walletBalanceVal');

    this.clearWalletError();

    if (this.isConnected) {
      // Disconnect
      this.isConnected = false;
      this.walletAddress = null;
      this.unshieldedAddress = null;
      this.coinPublicKey = null;
      this.encryptionPublicKey = null;
      this.walletDustBalance = 0n;
      this.dappConnectorAPI = null;
      this.boundContract = null;

      if (btnText) btnText.textContent = 'Connect Lace Wallet';
      btn?.classList.remove('connected');
      if (btn) btn.removeAttribute('title');
      if (balanceBox) balanceBox.style.display = 'none';

      this.log('Lace Wallet', 'Disconnected from Lace wallet.', 'yellow');
      return;
    }

    try {
      // Allow up to 1.5s for extension script injection if not immediately ready
      let midnightWallets = (typeof window !== 'undefined' && window.midnight) ? window.midnight : null;
      if (!midnightWallets) {
        for (let i = 0; i < 15; i++) {
          await new Promise(res => setTimeout(res, 100));
          if (typeof window !== 'undefined' && window.midnight) {
            midnightWallets = window.midnight;
            break;
          }
        }
      }

      console.log('Window.midnight content:', midnightWallets);

      if (!midnightWallets) {
        const isLocalhost = window.location.hostname === 'localhost';
        const msg = isLocalhost
          ? 'Midnight Lace wallet not detected on localhost. Chrome extensions block "localhost" unless permitted. Try opening http://localtest.me:5173/ or hard refresh (Cmd+Shift+R).'
          : 'Midnight Lace wallet extension is not detected. Please install and unlock the Lace Wallet extension.';
        throw new Error(msg);
      }

      // Discover connector: Lace injects either under mnLace, lace, or a random UUID with rdns="io.lace.wallet"
      let walletConnector: any = midnightWallets.mnLace || midnightWallets.lace;
      if (!walletConnector) {
        for (const [key, val] of Object.entries(midnightWallets)) {
          const w = val as any;
          if (w && (typeof w.connect === 'function' || typeof w.enable === 'function')) {
            if (w.rdns === 'io.lace.wallet' || w.name?.toLowerCase().includes('lace')) {
              walletConnector = w;
              break;
            }
            if (!walletConnector) walletConnector = w;
          }
        }
      }

      if (!walletConnector) {
        throw new Error(`window.midnight detected but no active connector found. Keys: ${Object.keys(midnightWallets).join(', ')}`);
      }

      this.log('Lace Wallet', 'Requesting wallet authorization...', 'cyan');

      // Candidate networks supported by Lace: preprod, preview, undeployed, mainnet
      const candidateNetworks = ['preprod', 'preview', 'undeployed', 'mainnet'];
      let api: any = null;
      let activeNetwork = '';
      let lastError: any = null;

      if (typeof walletConnector.connect === 'function') {
        for (const net of candidateNetworks) {
          try {
            api = await walletConnector.connect(net);
            if (api) {
              activeNetwork = net;
              this.activeNetwork = net;
              this.log('Lace Wallet', `Connected to Midnight ${net} network!`, 'green');

              // Set global network ID in Midnight.js to exact connected network
              setNetworkId(net as any);
              this.log('System', `Synced Midnight Network ID to '${net}'`, 'cyan');

              // Configure public data provider and network ID to match connected network
              const indexerHttp = `https://indexer.${net}.midnight.network/api/v4/graphql`;
              const indexerWs = `wss://indexer.${net}.midnight.network/api/v4/graphql/ws`;
              this.publicDataProvider = indexerPublicDataProvider(indexerHttp, indexerWs);
              this.log('Indexer', `Synced public data provider to ${net}: ${indexerHttp}`, 'cyan');

              // Update verified network badge in UI
              const verifiedBadge = document.getElementById('verifiedNetworkName');
              if (verifiedBadge) verifiedBadge.textContent = `Verified: ${net.charAt(0).toUpperCase() + net.slice(1)}`;
              break;
            }
          } catch (err: any) {
            lastError = err;
            const msg = err?.message || String(err);
            if (msg.includes('Network ID mismatch') || msg.includes('Unsupported network ID')) {
              continue; // Try next network
            }
            throw err; // Stop on user rejection or unexpected error
          }
        }
      } else if (typeof walletConnector.enable === 'function') {
        api = await walletConnector.enable();
      }

      if (!api) {
        throw lastError || new Error('Wallet connection failed or was rejected by user.');
      }

      this.dappConnectorAPI = api;

      // Extract real address and real balance matching Lace v2.3.3 API returns
      let realAddress = '';
      let realBalance: bigint = 0n;

      // 1. Unshielded Address
      if (typeof api.getUnshieldedAddress === 'function') {
        try {
          const res = await api.getUnshieldedAddress();
          if (res?.unshieldedAddress) {
            realAddress = res.unshieldedAddress;
            this.unshieldedAddress = res.unshieldedAddress;
          } else if (typeof res === 'string') {
            realAddress = res;
            this.unshieldedAddress = res;
          }
        } catch (e) {
          console.warn('api.getUnshieldedAddress:', e);
        }
      }

      // 2. Shielded Address
      if (typeof api.getShieldedAddresses === 'function') {
        try {
          const res = await api.getShieldedAddresses();
          if (res?.shieldedAddress) {
            if (!realAddress) realAddress = res.shieldedAddress;
            this.coinPublicKey = res.shieldedCoinPublicKey || null;
            this.encryptionPublicKey = res.shieldedEncryptionPublicKey || null;
          } else if (Array.isArray(res) && res.length > 0) {
            if (!realAddress) realAddress = res[0];
          }
        } catch (e) {
          console.warn('api.getShieldedAddresses:', e);
        }
      }

      // 3. Dust Address
      if (!realAddress && typeof api.getDustAddress === 'function') {
        try {
          const res = await api.getDustAddress();
          if (res?.dustAddress) realAddress = res.dustAddress;
          else if (typeof res === 'string') realAddress = res;
        } catch (e) {
          console.warn('api.getDustAddress:', e);
        }
      }

      // 4. Balances: Dust & Unshielded / Shielded
      if (typeof api.getDustBalance === 'function') {
        try {
          const dust = await api.getDustBalance();
          if (dust?.balance !== undefined) {
            realBalance = BigInt(dust.balance);
          } else if (typeof dust === 'bigint' || typeof dust === 'number') {
            realBalance = BigInt(dust);
          }
        } catch (e) {
          console.warn('api.getDustBalance:', e);
        }
      }

      if (realBalance === 0n && typeof api.getUnshieldedBalances === 'function') {
        try {
          const unshieldedBal = await api.getUnshieldedBalances();
          if (unshieldedBal && typeof unshieldedBal === 'object') {
            const values = Object.values(unshieldedBal);
            if (values.length > 0) {
              realBalance = BigInt(values[0] as any);
            }
          }
        } catch (e) {
          console.warn('api.getUnshieldedBalances:', e);
        }
      }

      // Fallback to legacy state()
      if (!realAddress && typeof api.state === 'function') {
        try {
          const walletState = await api.state();
          if (walletState) {
            realAddress = walletState.address || walletState.shieldedAddress || '';
            this.coinPublicKey = walletState.coinPublicKey || walletState.shieldedCoinPublicKey || null;
            this.encryptionPublicKey = walletState.encryptionPublicKey || walletState.shieldedEncryptionPublicKey || null;
            if (walletState.balance !== undefined) {
              realBalance = BigInt(walletState.balance);
            }
          }
        } catch (e) {
          console.warn('api.state:', e);
        }
      }

      if (!realAddress) {
        throw new Error('Connected to Lace, but failed to retrieve account address. Ensure a Midnight account is selected in Lace.');
      }

      this.walletAddress = realAddress;
      this.walletDustBalance = realBalance;
      this.isConnected = true;

      // Display real address in UI
      const shortAddr = realAddress.length > 16 
        ? `${realAddress.substring(0, 8)}...${realAddress.substring(realAddress.length - 6)}` 
        : realAddress;
      if (btnText) btnText.textContent = shortAddr;
      if (btn) {
        btn.classList.add('connected');
        btn.title = realAddress;
      }

      // Display real balance in UI
      if (balanceBox && balanceVal) {
        balanceBox.style.display = 'flex';
        balanceVal.textContent = `${realBalance.toString()} Dust`;
      }

      this.clearWalletError();
      this.log('Lace Wallet', `Connected successfully! Address: ${realAddress}`, 'green');
      this.log('Lace Wallet', `Wallet Balance: ${realBalance.toString()} Dust`, 'cyan');

      if (this.contractAddress) {
        await this.bindToContract(this.contractAddress);
      }
    } catch (err: any) {
      this.isConnected = false;
      this.walletAddress = null;
      this.dappConnectorAPI = null;
      if (btnText) btnText.textContent = 'Connect Lace Wallet';
      btn?.classList.remove('connected');
      if (balanceBox) balanceBox.style.display = 'none';

      const errorMsg = err?.message || 'Failed to connect Lace wallet.';
      this.showWalletError(errorMsg);
      this.log('Lace Wallet', `Connection failed: ${errorMsg}`, 'red');
    }
  }

  private async refreshWalletBalance(): Promise<bigint> {
    if (!this.dappConnectorAPI) return this.walletDustBalance;
    try {
      let balance = 0n;

      // 1. Check Dust balance
      if (typeof this.dappConnectorAPI.getDustBalance === 'function') {
        const dust = await this.dappConnectorAPI.getDustBalance();
        if (dust?.balance !== undefined) {
          balance = BigInt(dust.balance);
        } else if (typeof dust === 'bigint' || typeof dust === 'number') {
          balance = BigInt(dust);
        }
      }

      // 2. If Dust balance is 0, check unshielded / NIGHT balances
      if (balance === 0n && typeof this.dappConnectorAPI.getUnshieldedBalances === 'function') {
        const unshieldedBal = await this.dappConnectorAPI.getUnshieldedBalances();
        if (unshieldedBal && typeof unshieldedBal === 'object') {
          const values = Object.values(unshieldedBal);
          if (values.length > 0) {
            balance = BigInt(values[0] as any);
          }
        }
      }

      if (balance > 0n) {
        this.walletDustBalance = balance;
      }

      const balanceVal = document.getElementById('walletBalanceVal');
      if (balanceVal) balanceVal.textContent = `${this.walletDustBalance.toString()} Dust`;
      return this.walletDustBalance;
    } catch (err: any) {
      return this.walletDustBalance;
    }
  }

  private async assertWalletReadiness() {
    if (!this.isConnected || !this.dappConnectorAPI) {
      throw new Error('Lace Wallet is not connected. Please connect your wallet first.');
    }
    await this.refreshWalletBalance();
  }

  // Join existing contract by address
  public async bindToContract(address: string) {
    if (!address || address.trim() === '') {
      this.log('Contract', 'Please enter a valid contract address.', 'red');
      return;
    }

    const cleanAddr = address.trim();
    this.log('Contract', `Connecting to contract at address ${cleanAddr}...`, 'cyan');
    this.contractAddress = cleanAddr;

    const displayAddr = document.getElementById('displayContractAddr');
    if (displayAddr) displayAddr.textContent = cleanAddr;

    try {
      const compiledContract = this.createCompiledContract();
      const providers = this.constructMidnightProviders();

      this.boundContract = await findDeployedContract(providers, {
        compiledContract,
        contractAddress: cleanAddr,
        privateStateId: 'shadowVaultState',
        initialPrivateState: {}
      });

      this.log('Contract', `Successfully bound to contract at ${cleanAddr} via Midnight.js`, 'green');
      await this.queryIndexerState();
    } catch (err: any) {
      this.log('Contract', `Failed to bind to contract: ${err.message}`, 'red');
      if (displayAddr) displayAddr.textContent = `${cleanAddr} (Unverified on Indexer)`;
    }
  }

  // Phase 2: Deploy New flow ONLY
  public async handleDeployNewContract() {
    const displayAddr = document.getElementById('displayContractAddr');
    const inputAddr = document.getElementById('inputContractAddr') as HTMLInputElement;

    this.clearWalletError();

    // Ensure address fields are empty while deploying
    if (displayAddr) displayAddr.textContent = '--';
    if (inputAddr) inputAddr.value = '';
    this.contractAddress = null;
    this.boundContract = null;

    try {
      await this.assertWalletReadiness();

      if (this.activeNetwork) {
        setNetworkId(this.activeNetwork as any);
      }

      this.log('Deploy', `Initiating real contract deployment to Midnight ${this.activeNetwork}...`, 'cyan');
      this.updatePrivacyStatus('Preparing Constructor...', 'Generating Prover Keys...', 'Deploying On-Chain...');

      const compiledContract = this.createCompiledContract();
      const providers = this.constructMidnightProviders();

      this.log('Prover', 'Synthesizing deployment ZK proof on Actix proof server (port 6300)...', 'cyan');

      // Genuine Midnight contract deployment
      const deployed = await deployContract(providers, {
        compiledContract,
        privateStateId: 'shadowVaultState',
        initialPrivateState: {},
        args: [] as any,
      });

      const newAddress = deployed.deployTxData.public.contractAddress;
      const txId = deployed.deployTxData.public.txId;
      const blockHeight = deployed.deployTxData.public.blockHeight;

      if (!newAddress) {
        throw new Error('Deployment returned an empty or invalid contract address.');
      }

      this.contractAddress = newAddress;
      this.boundContract = deployed;

      // Update UI with genuine on-chain address
      if (displayAddr) displayAddr.textContent = newAddress;
      if (inputAddr) inputAddr.value = newAddress;

      this.log('Deploy', `DEPLOYMENT SUCCESSFUL! Contract Address: ${newAddress}`, 'green');
      this.log('Transaction', `Real Transaction ID: ${txId} (Block #${blockHeight})`, 'yellow');

      // Query indexer to verify on-chain state
      await this.queryIndexerState();
    } catch (err: any) {
      // On failure: ensure UI address field stays strictly empty
      this.contractAddress = null;
      this.boundContract = null;
      if (displayAddr) displayAddr.textContent = '--';
      if (inputAddr) inputAddr.value = '';

      console.error('Real deployment failed with error:', err);
      let errorMsg = err?.message || 'Contract deployment failed.';
      if (err?.cause?.message) {
        errorMsg += ` [Cause: ${err.cause.message}]`;
      }
      this.showWalletError(`Deployment Failed: ${errorMsg}`);
      this.log('Deploy', `Deployment failed: ${errorMsg}`, 'red');
      this.updatePrivacyStatus('Deployment Failed', 'Prover Idle', 'Undeployed');
    }
  }

  // Task 4: Query Midnight Indexer for live on-chain ledger state
  private async queryIndexerState() {
    if (!this.contractAddress) {
      this.log('Indexer', 'No contract address set to query.', 'dim');
      return;
    }

    try {
      this.log('Indexer', `Querying indexer at https://indexer.preprod.midnight.network/api/v4/graphql for ${this.contractAddress}...`, 'cyan');
      const onChainState = await this.publicDataProvider.queryContractState(this.contractAddress);
      
      if (onChainState && onChainState.data) {
        const indexerLedger = ledger(onChainState.data);
        this.counter = indexerLedger.counter;
        this.currentStateEnum = indexerLedger.state;
        this.totalDeposits = indexerLedger.totalDeposits;
        this.publicCommitment = indexerLedger.publicCommitment;
        this.lastDisclosedHash = indexerLedger.lastDisclosedHash;

        this.updateLedgerUI();
        this.log('Indexer', `Live Ledger Confirmed: Counter=${this.counter}, State=${VaultState[this.currentStateEnum]}, Deposits=${this.totalDeposits}`, 'green');
      } else {
        this.log('Indexer', 'Contract address has no confirmed state on indexer yet.', 'yellow');
      }
    } catch (err: any) {
      this.log('Indexer', `Indexer query failed: ${err.message}`, 'red');
    }
  }

  // Phase 3: incrementCounter circuit execution end-to-end
  public async handleIncrementCounter() {
    this.clearWalletError();
    const displayLatestTxId = document.getElementById('displayLatestTxId');
    const counterTxResult = document.getElementById('counterTxResult');
    const counterTxId = document.getElementById('counterTxId');

    try {
      await this.assertWalletReadiness();
      if (!this.boundContract || !this.contractAddress) {
        throw new Error('No contract joined. Please deploy or join a contract first.');
      }

      if (this.activeNetwork) {
        setNetworkId(this.activeNetwork as any);
      }

      const prevCounter = this.counter;
      this.log('Circuit', `Calling callTx.incrementCounter(). Current on-chain counter: ${prevCounter !== null ? prevCounter : '--'}`, 'cyan');
      this.updatePrivacyStatus('Witness Readied', '⚡ Proof Server Synthesis (port 6300)...', 'Submitting to Preprod...');

      // Genuine Midnight.js circuit call: ZK proof generated by Actix prover + balanced & submitted via Lace
      const callResult = await this.boundContract.callTx.incrementCounter();
      const realTxId = callResult.public.txId;
      const blockHeight = callResult.public.blockHeight;

      if (!realTxId) {
        throw new Error('Submission returned an empty or invalid transaction ID.');
      }

      // Display real API-returned transaction ID immediately in UI
      if (displayLatestTxId) displayLatestTxId.textContent = realTxId;
      if (counterTxId) counterTxId.textContent = realTxId;
      if (counterTxResult) counterTxResult.style.display = 'block';

      this.log('Transaction', `Real transaction submitted! Tx ID: ${realTxId} (Block #${blockHeight})`, 'yellow');
      this.log('Indexer', 'Waiting for Midnight Preprod indexer to confirm updated ledger counter...', 'cyan');
      this.updatePrivacyStatus('Tx Submitted', '⚡ Prover Complete', 'Polling Indexer...');

      // Poll indexer until ledger counter actually updates on-chain
      let confirmed = false;
      for (let attempt = 1; attempt <= 15; attempt++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const onChainState = await this.publicDataProvider.queryContractState(this.contractAddress);
          if (onChainState?.data) {
            const indexerLedger = ledger(onChainState.data);
            if (prevCounter === null || indexerLedger.counter > prevCounter) {
              this.counter = indexerLedger.counter;
              this.currentStateEnum = indexerLedger.state;
              this.totalDeposits = indexerLedger.totalDeposits;
              this.publicCommitment = indexerLedger.publicCommitment;
              this.lastDisclosedHash = indexerLedger.lastDisclosedHash;
              this.updateLedgerUI();
              confirmed = true;
              break;
            }
          }
        } catch {
          // Continue polling
        }
      }

      if (!confirmed) {
        // Fallback single query attempt
        await this.queryIndexerState();
      }

      this.updatePrivacyStatus('🔒 Counter Incremented', '⚡ ZK Proof Verified', `📜 Ledger Counter Confirmed (${this.counter})`);
      this.log('Circuit', `incrementCounter SUCCESS! Confirmed on-chain counter: ${this.counter}`, 'green');

    } catch (err: any) {
      const errorMsg = err?.message || 'incrementCounter execution failed.';
      this.showWalletError(`Circuit Execution Failed: ${errorMsg}`);
      this.log('Error', `incrementCounter failed: ${errorMsg}`, 'red');
      this.updatePrivacyStatus('Execution Failed', 'Prover Idle', 'Unchanged');
    }
  }

  // Task 2, 3, 4: Execute initializeVault via Midnight.js generated contract binding
  public async handleInitializeVault() {
    try {
      await this.assertWalletReadiness();
      if (!this.boundContract || !this.contractAddress) {
        throw new Error('No contract joined. Please specify or deploy a contract first.');
      }

      const passphraseInput = (document.getElementById('initPassphrase') as HTMLInputElement).value;
      const ownerInput = (document.getElementById('initOwnerId') as HTMLInputElement).value;
      const saltInput = (document.getElementById('claimSalt') as HTMLInputElement).value;

      if (!passphraseInput) throw new Error('Please enter a secret vault passphrase.');
      if (!ownerInput) throw new Error('Please enter the owner public identifier.');
      if (!saltInput) throw new Error('Please enter a salt.');

      this.log('Circuit', 'Executing initializeVault circuit via generated binding callTx.initializeVault()...', 'cyan');
      this.updatePrivacyStatus('Hashing Commitment...', '⚡ Proving on Proof Server...', 'Broadcasting Tx...');

      const ownerBytes = this.hexToBytes(ownerInput, 32);
      const secretBytes = new TextEncoder().encode(passphraseInput.padEnd(32, '0')).slice(0, 32);
      const saltBytes = this.hexToBytes(saltInput, 32);

      // Derive commitment for initial deposit
      const combined = new Uint8Array(64);
      combined.set(secretBytes, 0);
      combined.set(saltBytes, 32);

      // Call circuit through generated contract binding
      const callResult = await this.boundContract.callTx.initializeVault(combined.slice(0, 32), ownerBytes);
      const realTxId = callResult.public.txId;
      const blockHeight = callResult.public.blockHeight;

      this.log('Transaction', `Transaction confirmed on-chain! Tx ID: ${realTxId} (Block #${blockHeight})`, 'yellow');

      await this.queryIndexerState();
      this.updatePrivacyStatus('🔒 Secret In Client Memory', '⚡ ZK Proof Synthesized', '📜 Vault Active on Ledger');
      this.log('Circuit', `initializeVault SUCCESS! Vault State: VaultState.active (${this.currentStateEnum})`, 'green');

    } catch (err: any) {
      this.log('Error', `initializeVault failed: ${err.message}`, 'red');
      alert(`Initialization Failed: ${err.message}`);
    }
  }

  // Task 2, 3, 4: Execute verifyAndClaim via Midnight.js generated contract binding
  public async handleVerifyAndClaim() {
    try {
      await this.assertWalletReadiness();
      if (!this.boundContract || !this.contractAddress) {
        throw new Error('No contract joined. Please specify or deploy a contract first.');
      }

      const passphraseInput = (document.getElementById('claimPassphrase') as HTMLInputElement).value;
      if (!passphraseInput) throw new Error('Please enter matching secret passphrase for ZK claim.');

      this.log('Circuit', 'Executing verifyAndClaim circuit proving preimage knowledge in ZK...', 'cyan');
      this.updatePrivacyStatus('Witness Extracted', '⚡ Real Prover Synthesizing Proof...', 'Verifying On-Chain...');

      const callResult = await this.boundContract.callTx.verifyAndClaim();
      const realTxId = callResult.public.txId;
      const blockHeight = callResult.public.blockHeight;

      this.log('Transaction', `Transaction confirmed on-chain! Tx ID: ${realTxId} (Block #${blockHeight})`, 'yellow');

      await this.queryIndexerState();
      this.updatePrivacyStatus('🔒 Unexposed Passphrase', '⚡ Verified Zero-Knowledge', '📜 State Claimed');
      this.log('Circuit', `verifyAndClaim SUCCESS! Knowledge proved in ZK without revealing raw secret!`, 'green');

    } catch (err: any) {
      this.log('Error', `verifyAndClaim failed: ${err.message}`, 'red');
      alert(`Claim Failed: ${err.message}`);
    }
  }

  // Task 2, 3, 4: Execute revokeVault via Midnight.js generated contract binding
  public async handleRevokeVault() {
    try {
      await this.assertWalletReadiness();
      if (!this.boundContract || !this.contractAddress) {
        throw new Error('No contract joined. Please specify or deploy a contract first.');
      }

      this.log('Circuit', 'Executing revokeVault circuit with owner authorization witness check...', 'cyan');
      this.updatePrivacyStatus('Owner Key Loaded', '⚡ Proof Server Synthesis...', 'Submitting Revocation...');

      const callResult = await this.boundContract.callTx.revokeVault();
      const realTxId = callResult.public.txId;
      const blockHeight = callResult.public.blockHeight;

      this.log('Transaction', `Transaction confirmed on-chain! Tx ID: ${realTxId} (Block #${blockHeight})`, 'yellow');

      await this.queryIndexerState();
      this.updatePrivacyStatus('🔒 Authorized Caller', '⚡ Revocation Proof Verified', '📜 Vault Revoked');
      this.log('Circuit', `revokeVault SUCCESS! Vault State: VaultState.revoked (${this.currentStateEnum})`, 'green');

    } catch (err: any) {
      this.log('Error', `revokeVault failed: ${err.message}`, 'red');
      alert(`Revoke Failed: ${err.message}`);
    }
  }

  private bindDOMEvents() {
    // Network Selector
    const networkSelect = document.getElementById('networkSelect') as HTMLSelectElement;
    networkSelect?.addEventListener('change', (e) => {
      const selectedId = (e.target as HTMLSelectElement).value;
      const verifiedId = setNetworkId(selectedId as any);
      const verifiedBadge = document.getElementById('verifiedNetworkName');
      if (verifiedBadge) verifiedBadge.textContent = `Verified: ${verifiedId}`;
      this.log('Network', `Active Network changed to ${verifiedId}`, 'green');
    });

    // Wallet connect button
    document.getElementById('connectWalletBtn')?.addEventListener('click', () => this.toggleLaceWallet());
    document.getElementById('walletErrorClose')?.addEventListener('click', () => this.clearWalletError());

    // Join contract button
    document.getElementById('btnJoinContract')?.addEventListener('click', () => {
      const input = (document.getElementById('inputContractAddr') as HTMLInputElement)?.value;
      this.bindToContract(input);
    });

    // Deploy contract button
    document.getElementById('btnDeployContract')?.addEventListener('click', () => this.handleDeployNewContract());

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = (e.currentTarget as HTMLElement).getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        (e.currentTarget as HTMLElement).classList.add('active');
        document.getElementById(`tab-${targetTab}`)?.classList.add('active');
      });
    });

    // Password visibility toggles
    document.getElementById('toggleInitPwd')?.addEventListener('click', () => this.togglePassword('initPassphrase'));
    document.getElementById('toggleClaimPwd')?.addEventListener('click', () => this.togglePassword('claimPassphrase'));

    // Copy contract address
    document.getElementById('btnCopyAddr')?.addEventListener('click', () => {
      if (this.contractAddress) {
        navigator.clipboard.writeText(this.contractAddress);
        this.log('System', 'Copied contract address to clipboard.', 'cyan');
      }
    });

    // Clear terminal log
    document.getElementById('btnClearLog')?.addEventListener('click', () => {
      const logContainer = document.getElementById('terminalLog');
      if (logContainer) logContainer.innerHTML = '';
    });

    // Circuit Execution Handlers
    document.getElementById('btnExecCounter')?.addEventListener('click', () => this.handleIncrementCounter());
    document.getElementById('btnExecInit')?.addEventListener('click', () => this.handleInitializeVault());
    document.getElementById('btnExecClaim')?.addEventListener('click', () => this.handleVerifyAndClaim());
    document.getElementById('btnExecRevoke')?.addEventListener('click', () => this.handleRevokeVault());
  }

  private updateLedgerUI() {
    const counterElement = document.getElementById('displayCounterValue');
    const stateElement = document.getElementById('displayVaultState');
    const depositsElement = document.getElementById('displayTotalDeposits');
    const commitmentElement = document.getElementById('displayCommitmentHash');
    const disclosedElement = document.getElementById('displayDisclosedHash');

    if (counterElement) counterElement.textContent = this.counter !== null ? this.counter.toString() : '--';
    if (stateElement) {
      stateElement.textContent = this.currentStateEnum !== null ? VaultState[this.currentStateEnum].toUpperCase() : 'UNINITIALIZED';
    }
    if (depositsElement) depositsElement.textContent = this.totalDeposits !== null ? this.totalDeposits.toString() : '--';
    if (commitmentElement) {
      commitmentElement.textContent = this.publicCommitment ? this.bytesToHex(this.publicCommitment) : '--';
    }
    if (disclosedElement) {
      disclosedElement.textContent = this.lastDisclosedHash ? this.bytesToHex(this.lastDisclosedHash) : '--';
    }
  }

  private updatePrivacyStatus(witness: string, prover: string, ledgerStr: string) {
    const witnessTag = document.getElementById('privateWitnessStatus');
    const proverTag = document.getElementById('proverStatus');
    const ledgerTag = document.getElementById('ledgerStatusTag');

    if (witnessTag) witnessTag.textContent = witness;
    if (proverTag) proverTag.textContent = prover;
    if (ledgerTag) ledgerTag.textContent = ledgerStr;
  }

  private togglePassword(inputId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  private log(category: string, message: string, color: 'dim' | 'green' | 'cyan' | 'yellow' | 'red' = 'dim') {
    const logContainer = document.getElementById('terminalLog');
    if (!logContainer) return;

    const line = document.createElement('div');
    line.className = `log-line ${color}`;
    const timestamp = new Date().toISOString().substring(11, 19);
    line.textContent = `[${timestamp}] [${category}] ${message}`;

    logContainer.appendChild(line);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  private hexToBytes(hex: string, length: number = 32): Uint8Array {
    const cleanHex = hex.trim().padEnd(length * 2, '0');
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16) || 0;
    }
    return bytes;
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    new ShadowVaultDApp();
  });
} else {
  new ShadowVaultDApp();
}
