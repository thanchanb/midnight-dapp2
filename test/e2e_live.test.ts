import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { firstValueFrom, filter, combineLatest, map } from 'rxjs';
import * as CompiledContract from '@midnight-ntwrk/compact-js/effect/CompiledContract';
import { Contract, AuctionState, ledger, type Witnesses } from '../managed/contract/index.js';
import {
  setNetworkId,
  getNetworkId,
  NetworkId,
  NetworkEnvironment,
  canonicalizeNetwork,
  validateNetworkId,
  validateIndexerConnection,
  validateProofServerConnection,
  getNetworkDetails,
  validateNodeNetworkIdentity,
  validateIndexerNetworkIdentity,
} from '../src/network.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { WalletBuilder } from '@midnight-ntwrk/wallet';
import * as ledgerV8 from '@midnight-ntwrk/ledger-v8';
import {
  HDWallet,
  Roles,
  UnshieldedAddress,
  UnshieldedWallet,
  DustWallet,
  NoOpTransactionHistoryStorage,
  PublicKey,
  createKeystore,
} from '@midnight-ntwrk/wallet-sdk';
import {
  derivePartyIdentity,
  generateRandomBytes,
  createWitnesses,
} from '../src/api.js';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `FATAL: Required environment variable "${name}" is missing or empty. A real funded wallet seed is required for live network submission.`
    );
  }
  return value.trim();
}

interface IndexerBlockInfo {
  height: number;
  hash: string;
  timestampMs: number;
  timestampSec: bigint;
}

// Function showing how chain time and block height are read from the live indexer
async function fetchLiveIndexerBlock(indexerUrl: string): Promise<IndexerBlockInfo> {
  const query = '{ block { height hash timestamp } }';
  const response = await fetch(indexerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    throw new Error(`Failed to query indexer: HTTP ${response.status} ${response.statusText}`);
  }
  const json: any = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Indexer GraphQL error: ${json.errors[0].message}`);
  }
  const blk = json.data?.block;
  if (!blk) {
    throw new Error('Indexer returned null block header');
  }
  return {
    height: blk.height,
    hash: blk.hash,
    timestampMs: blk.timestamp,
    timestampSec: BigInt(Math.floor(blk.timestamp / 1000)),
  };
}

async function runLiveAuctionE2ETest() {
  console.log('================================================================');
  console.log('  MIDNIGHT PREPROD LIVE NETWORK E2E INTEGRATION SUITE           ');
  console.log('  [Strict Network, Live Wallet Sync & Real Consensus Broadcast] ');
  console.log('================================================================\n');

  console.log('  ⚠️  WARNING: Ephemeral party secrets are generated in memory and NOT persisted.');
  console.log('  ⚠️  If the test run aborts before settlement and claim circuits complete,');
  console.log('  ⚠️  escrowed funds cannot be recovered! Bid amounts are intentionally kept');
  console.log('  ⚠️  small (Bid 1: 6,000 tNIGHT, Bid 2: 8,500 tNIGHT) to minimize testnet exposure.\n');


  // Step 1: Enforce presence of authentic funded wallet seed (Fail Fast & Fail Loudly)
  console.log('[Step 1/8] Validating Environment & Wallet Seed Configuration...');
  const walletSeed = requireEnv('MIDNIGHT_WALLET_SEED');
  console.log('      ✓ Verified MIDNIGHT_WALLET_SEED is configured.');

  // Step 2: Validate Target Network ID (Preprod / TestNet)
  console.log('\n[Step 2/8] Validating Target Network Configuration...');
  const targetNetwork = setNetworkId(NetworkId.TestNet);
  validateNetworkId(targetNetwork);
  assert.equal(getNetworkId(), 'TestNet');
  console.log(`      ✓ Target Network ID: ${targetNetwork}`);

  const details = getNetworkDetails(targetNetwork);
  const proofServerUrl = details.proofServerUrl;
  const indexerUrl = details.indexerUrl;
  const indexerWsUrl = details.indexerWsUrl;
  const nodeUrl = (details as any).nodeUrl || details.rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');

  // Step 3: Validate Connectivity to Real Proof Server, Node & Preprod Indexer Identity
  console.log('\n[Step 3/8] Connecting to Live Preprod Infrastructure & Validating Identity...');
  const targetEnv = canonicalizeNetwork(targetNetwork);

  console.log(`      Querying Node RPC network identity at ${details.rpcUrl}...`);
  const nodeIdentity = await validateNodeNetworkIdentity(details.rpcUrl, targetEnv);
  console.log(`      ✓ Verified Node Network Identity: "${nodeIdentity.chainName}" matches pinned environment "${targetEnv}"`);
  if (nodeIdentity.genesisHash) {
    console.log(`        Node Genesis Block Hash: ${nodeIdentity.genesisHash}`);
  }

  console.log(`      Validating Indexer Network Identity at ${indexerUrl}...`);
  await validateIndexerNetworkIdentity(indexerUrl, targetEnv);
  console.log(`      ✓ Verified Indexer Network Identity matches pinned environment "${targetEnv}"`);

  const isProofServerHealthy = await validateProofServerConnection(proofServerUrl);
  if (!isProofServerHealthy) {
    throw new Error(
      `FATAL: Proof server at "${proofServerUrl}" is unreachable. Real ZK proof generation requires the Actix proof server to be running.`
    );
  }
  console.log(`      ✓ Connected to Real Actix Proof Server at ${proofServerUrl}`);

  const initialBlock = await fetchLiveIndexerBlock(indexerUrl);
  assert(initialBlock.height > 0, 'Indexer block height must be positive');
  assert(initialBlock.hash.length === 64, 'Indexer block hash must be 64-char hex');
  console.log(`      ✓ Live Preprod Indexer Block #${initialBlock.height} (${initialBlock.hash.slice(0, 16)}...)`);
  console.log(`        Chain Timestamp: ${initialBlock.timestampSec}s (${new Date(initialBlock.timestampMs).toISOString()})`);

  // Step 4: Build and Sync Real Wallet using Midnight Wallet SDK
  console.log('\n[Step 4/8] Building & Synchronizing Live Wallet from Seed...');

  // Derive HD keys matching ledger-v8 and modular wallet SDK
  const seedBytes = /^[0-9a-fA-F]+$/.test(walletSeed)
    ? new Uint8Array(Buffer.from(walletSeed, 'hex'))
    : new TextEncoder().encode(walletSeed);

  const hdResult = HDWallet.fromSeed(seedBytes);
  if (hdResult.type !== 'seedOk') {
    throw new Error(`Failed to derive HD wallet from seed: ${JSON.stringify(hdResult)}`);
  }
  const account = hdResult.hdWallet.selectAccount(0);
  const dustKeyDerivation = account.selectRole(Roles.Dust).deriveKeyAt(0);
  const nightKeyDerivation = account.selectRole(Roles.NightExternal).deriveKeyAt(0);

  if (dustKeyDerivation.type !== 'keyDerived' || nightKeyDerivation.type !== 'keyDerived') {
    throw new Error('Failed to derive required Dust and Night keys from HD wallet seed');
  }

  const unshieldedWalletAddress = new UnshieldedAddress(Buffer.from(nightKeyDerivation.key));

  const keystore = createKeystore(nightKeyDerivation.key, targetNetwork as any);
  const publicKey = PublicKey.fromKeyStore(keystore);

  // Initialize modular unshielded and dust wallets for strict balance & identity tracking
  const unshieldedStorage = new NoOpTransactionHistoryStorage();
  const unshieldedWalletClass = UnshieldedWallet({
    networkId: targetNetwork as any,
    indexerClientConnection: {
      indexerHttpUrl: indexerUrl,
      indexerWsUrl,
    },
    txHistoryStorage: unshieldedStorage,
  });
  const unshieldedWallet = unshieldedWalletClass.startWithPublicKey(publicKey);

  const dustStorage = new NoOpTransactionHistoryStorage();
  const dustWalletClass = DustWallet({
    networkId: targetNetwork as any,
    costParameters: {
      feeBlocksMargin: 5,
    },
    indexerClientConnection: {
      indexerHttpUrl: indexerUrl,
    },
    txHistoryStorage: dustStorage,
  });
  // Source Citation: @midnight-ntwrk/ledger-v8/ledger-v8.d.ts line 2629 & 2638 (LedgerParameters.initialParameters().dust)
  const dustParams = ledgerV8.LedgerParameters.initialParameters().dust;
  const dustWallet = dustWalletClass.startWithSeed(dustKeyDerivation.key, dustParams);

  // Initialize base wallet for transaction balancing, proving, and submission
  const baseWallet = await WalletBuilder.build(
    indexerUrl,
    indexerWsUrl,
    proofServerUrl,
    nodeUrl,
    walletSeed,
    targetNetwork as any,
    'info'
  );
  baseWallet.start();

  // Unified wallet exposing transaction submission, unshielded balances, and Dust state
  const wallet = {
    balanceTransaction: (tx: any, coins: any) => baseWallet.balanceTransaction(tx, coins),
    proveTransaction: (recipe: any) => baseWallet.proveTransaction(recipe),
    submitTransaction: (tx: any) => baseWallet.submitTransaction(tx),
    close: async () => {
      await baseWallet.close();
      if (typeof (unshieldedWallet as any).close === 'function') await (unshieldedWallet as any).close();
      if (typeof (dustWallet as any).close === 'function') await (dustWallet as any).close();
    },
    state: () =>
      combineLatest([
        baseWallet.state(),
        unshieldedWallet.state,
        dustWallet.state,
      ]).pipe(
        map(([baseState, unshieldedState, dustState]: any) => ({
          ...baseState,
          unshielded: unshieldedState,
          dust: dustState,
          unshieldedAddress: unshieldedWalletAddress,
          coinPublicKey: unshieldedWalletAddress.hexString,
        }))
      ),
  };

  console.log('      Waiting for wallet synchronization against Preprod indexer...');
  const walletState: any = await firstValueFrom(
    wallet.state().pipe(
      filter(
        (s: any) =>
          s.syncProgress !== undefined &&
          s.syncProgress.synced &&
          s.unshielded !== undefined &&
          s.dust !== undefined
      )
    )
  );

  console.log(`      ✓ Wallet Synchronized successfully!`);
  console.log(`        Unshielded Address: ${unshieldedWalletAddress.hexString}`);
  console.log(`        Bech32m Address:    ${walletState.address}`);
  console.log(`        Coin Public Key:    ${walletState.coinPublicKey}`);
  console.log(`        Unshielded Balances:${JSON.stringify(walletState.unshielded.balances, null, 2)}`);

  // E2E Preflight: Check Dust balance is positive for consensus fee payments
  const preflightDust = walletState.dust.balance(new Date());
  console.log(`        Dust Balance:       ${preflightDust} Dust (time-dependent balance via dust.balance(Date))`);
  if (preflightDust <= 0n) {
    throw new Error(
      `FATAL PREFLIGHT FAILURE: Wallet Dust balance is ${preflightDust} Dust. Live transaction submission requires a positive Dust balance for consensus fee payments. Ensure wallet has registered for Dust generation and accumulated fee capacity.`
    );
  }
  console.log(`      ✓ Preflight Checked: Dust balance (${preflightDust} Dust) > 0.`);

  // Step 5: Initialize Contract Providers
  console.log('\n[Step 5/8] Assembling Real Transaction Proving & Submission Providers...');
  const managedPath = path.resolve('managed');
  const zkConfigProvider = new NodeZkConfigProvider(managedPath);

  // Proving time tracking around the real proof call
  let currentProvingMs = 0;
  let currentProofBytes = 0;
  const rawProofProvider = httpClientProofProvider(proofServerUrl, zkConfigProvider);
  const proofProvider = {
    async proveTx(unprovenTx: any, partialProveTxConfig: any) {
      const tStart = Date.now();
      const provenTx = await rawProofProvider.proveTx(unprovenTx, partialProveTxConfig);
      currentProvingMs = Date.now() - tStart;
      try {
        const serialized = (provenTx as any).serialize ? (provenTx as any).serialize() : null;
        currentProofBytes = serialized ? serialized.length : 0;
      } catch {
        currentProofBytes = 0;
      }
      return provenTx;
    }
  };

  const publicDataProvider = indexerPublicDataProvider(indexerUrl, indexerWsUrl);
  const privateStateProvider = levelPrivateStateProvider({
    privateStateStoreName: 'preprod-live-e2e-private-state',
    accountId: 'live-e2e-account',
    privateStoragePasswordProvider: () => 'A1b2C3d4E5f6G7h8!',
  });

  const walletProvider = {
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await wallet.balanceTransaction(tx, []);
      if (recipe.type === 'NothingToProve') {
        return tx;
      }
      return await wallet.proveTransaction(recipe as any);
    },
    getCoinPublicKey() {
      return walletState.coinPublicKey as any;
    },
    getEncryptionPublicKey() {
      return walletState.encryptionPublicKey as any;
    },
  };

  const midnightProvider = {
    async submitTx(tx: any) {
      return await wallet.submitTransaction(tx);
    },
  };

  const providers: any = {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  };

  // Helper to create party-scoped providers with isolated local private state
  function createPartyProviders(partyName: string) {
    return {
      ...providers,
      privateStateProvider: levelPrivateStateProvider({
        privateStateStoreName: `preprod-${partyName}-private-state`,
        accountId: `preprod-${partyName}-account`,
        privateStoragePasswordProvider: () => 'A1b2C3d4E5f6G7h8!',
      }),
    };
  }

  // Step 6: Deploy Contract For Real (Prove, Balance, Broadcast, Confirm)
  console.log('\n[Step 6/8] Deploying Auction Contract on Preprod Consensus Node...');

  // Extract real 32-byte unshielded address from the funded wallet
  function extractWalletAddressBytes(state: any): Uint8Array {
    if (!state || typeof state !== 'object') {
      throw new Error('Failed to extract unshielded address: wallet state is null or invalid');
    }
    if (!state.unshielded) {
      throw new Error('Failed to extract unshielded address: unshielded state is missing from wallet state');
    }
    const addr = state.unshielded.address;
    if (!addr) {
      throw new Error('Failed to extract unshielded address: address property is missing from unshielded state');
    }

    const rawBytes = new Uint8Array(addr.data);
    assert(rawBytes instanceof Uint8Array, 'Extracted address must be an instance of Uint8Array');
    assert.equal(rawBytes.length, 32, `Extracted address must be exactly 32 bytes (got ${rawBytes.length} bytes)`);

    return rawBytes;
  }

  const walletAddressBytes = extractWalletAddressBytes(walletState);
  const sellerPayoutAddress = walletAddressBytes;
  const bidder1RefundAddress = walletAddressBytes;
  const bidder2RefundAddress = walletAddressBytes;

  const sellerSecret = generateRandomBytes(32);

  // Custom non-native item token (must strictly NOT be nativeToken())
  // Derivation source: domain-separated cryptographic identity for the auctioned asset
  const testItem = derivePartyIdentity(new TextEncoder().encode('SHADOW_VAULT_ITEM_TOKEN_V1'));
  const nativeTokenRaw = ledgerV8.nativeToken().raw;
  const itemTokenRaw = Buffer.from(testItem).toString('hex');
  assert.notEqual(itemTokenRaw, nativeTokenRaw, 'Item token must not be nativeToken()');
  const reservePrice = 5000n;

  // Set deadline to current chain block time + 8 minutes (480 seconds)
  const windowSec = 480n;
  const auctionDeadline = initialBlock.timestampSec + windowSec;
  console.log(`      Current Chain Time: ${initialBlock.timestampSec}s`);
  console.log(`      Auction Deadline:   ${auctionDeadline}s (Chain Time + 8 minutes)`);
  console.log(`      Item Token ID:      ${itemTokenRaw.slice(0, 16)}... (Non-native custom item)`);
  console.log(`      Real Payout Address: ${Buffer.from(sellerPayoutAddress).toString('hex').slice(0, 16)}...`);

  const deployWitnesses: Witnesses<any> = createWitnesses({ secretKey: sellerSecret });
  const deployCompiledContract = CompiledContract.make('ShadowVault', Contract).pipe(
    CompiledContract.withWitnesses(deployWitnesses)
  );

  const tDeployStart = Date.now();
  const deployedContract: any = await deployContract(providers, {
    compiledContract: deployCompiledContract as any,
    args: [testItem, 0n, sellerPayoutAddress, reservePrice, auctionDeadline],
    initialPrivateState: {},
    privateStateId: 'shadowVaultAuctionState',
  });
  const tDeployEnd = Date.now() - tDeployStart;

  const contractAddress = deployedContract.deployTxData.public.contractAddress;
  const deployTxHash = deployedContract.deployTxData.public.txHash;
  const deployBlockHeight = deployedContract.deployTxData.public.blockHeight;

  console.log(`      ✓ Auction Contract Deployed & Confirmed On-Chain!`);
  console.log(`        Contract Address: ${contractAddress}`);
  console.log(`        Transaction Hash: ${deployTxHash}`);
  console.log(`        Block Height:     #${deployBlockHeight}`);
  console.log(`        Proving Time:     ${currentProvingMs}ms (Proof call) | Total: ${tDeployEnd}ms`);

  // Verify contract state through the live indexer
  const initialContractState = await publicDataProvider.queryContractState(contractAddress);
  assert(initialContractState !== null, 'Contract state must be queryable via indexer');
  const initialLedger = ledger(initialContractState.data);
  assert.equal(initialLedger.state, AuctionState.Active);
  assert.equal(initialLedger.deadline, auctionDeadline);
  console.log(`      ✓ Indexer State Verified: State=Active (0), Deadline=${auctionDeadline}`);

  // Step 7: Create Isolated Contract Handles for Seller, Bidder 1, Bidder 2, and Crank
  console.log('\n[Step 7/8] Initializing Distinct Caller Handles with Private Witnesses...');
  const bidder1Secret = generateRandomBytes(32);
  const bidder2Secret = generateRandomBytes(32);
  const crankSecret = generateRandomBytes(32);

  async function createPartyHandle(partyName: string, partySecret: Uint8Array, partyProviders: any) {
    const partyWitnesses = createWitnesses({ secretKey: partySecret });
    const partyCompiled = CompiledContract.make('ShadowVault', Contract).pipe(
      CompiledContract.withWitnesses(partyWitnesses)
    );
    return await findDeployedContract(partyProviders, {
      compiledContract: partyCompiled as any,
      contractAddress,
      privateStateId: `${partyName}State`,
      initialPrivateState: {},
    });
  }

  const sellerContract = await createPartyHandle('seller', sellerSecret, createPartyProviders('seller'));
  const bidder1Contract = await createPartyHandle('bidder1', bidder1Secret, createPartyProviders('bidder1'));
  const bidder2Contract = await createPartyHandle('bidder2', bidder2Secret, createPartyProviders('bidder2'));
  const crankContract = await createPartyHandle('crank', crankSecret, createPartyProviders('crank'));
  console.log('      ✓ Successfully bound dedicated handles for Seller, Bidder 1, Bidder 2, and Crank.');

  // Balance query helpers distinguishing unshielded tNIGHT from Dust fee balances
  interface WalletBalances {
    tNight: bigint; // Unshielded native token balance
    dust: bigint;   // Fee balance
  }

  async function getWalletBalance(): Promise<WalletBalances> {
    const s: any = await firstValueFrom(wallet.state());
    if (!s || typeof s !== 'object') {
      throw new Error('Failed to read wallet state: state is null or not an object');
    }
    if (!s.unshielded) {
      throw new Error('Failed to read wallet state: unshielded state is missing');
    }
    if (!s.dust) {
      throw new Error('Failed to read wallet state: dust state is missing');
    }

    const nativeTokenRaw = ledgerV8.nativeToken().raw;
    const balances = s.unshielded.balances;
    if (!balances || typeof balances !== 'object') {
      throw new Error(
        'Failed to read unshielded balances: unshielded balances object missing.'
      );
    }

    if (!(nativeTokenRaw in balances) || balances[nativeTokenRaw] === undefined) {
      throw new Error(
        `Failed to read tNIGHT balance: unshielded balance for exact native token "${nativeTokenRaw}" is not present in wallet state.`
      );
    }
    const tNight = BigInt(balances[nativeTokenRaw]);

    // Read Dust from DustWalletState using the time-dependent balance(Date) method as required by installed type
    const dust = BigInt(s.dust.balance(new Date()));

    return { tNight, dust };
  }

  async function getContractBalance(): Promise<bigint> {
    const nativeTokenRaw = ledgerV8.nativeToken().raw;
    const balances = await publicDataProvider.queryUnshieldedBalances(contractAddress);
    if (!balances) {
      throw new Error(
        `Failed to query unshielded balances for contract "${contractAddress}": response was null or unavailable from indexer.`
      );
    }

    if (Array.isArray(balances)) {
      const match = balances.find((entry: any) => entry.tokenType === nativeTokenRaw);
      if (match) {
        return BigInt((match as any).amount !== undefined ? (match as any).amount : match.balance);
      }
      return 0n;
    } else if (typeof balances === 'object') {
      if (nativeTokenRaw in balances) {
        return BigInt((balances as any)[nativeTokenRaw]);
      }
      return 0n;
    }

    throw new Error(
      `Failed to query unshielded balance for contract "${contractAddress}": unexpected balance structure returned from indexer.`
    );
  }

  async function getContractItemBalance(): Promise<bigint> {
    const balances = await publicDataProvider.queryUnshieldedBalances(contractAddress);
    if (!balances) return 0n;
    if (Array.isArray(balances)) {
      const match = balances.find((entry: any) => entry.tokenType === itemTokenRaw);
      if (match) {
        return BigInt((match as any).amount !== undefined ? (match as any).amount : match.balance);
      }
      return 0n;
    } else if (typeof balances === 'object' && itemTokenRaw in balances) {
      return BigInt((balances as any)[itemTokenRaw]);
    }
    return 0n;
  }

  async function getWalletItemBalance(): Promise<bigint> {
    const s: any = await firstValueFrom(wallet.state());
    if (!s || !s.unshielded || !s.unshielded.balances) return 0n;
    const val = s.unshielded.balances[itemTokenRaw];
    return val !== undefined ? BigInt(val) : 0n;
  }

  async function waitForWalletSyncedToBlock(targetHeight: number, timeoutMs: number = 60000): Promise<any> {
    const t0 = Date.now();
    return await firstValueFrom(
      wallet.state().pipe(
        filter((state: any) => {
          // Check modular wallet-sdk sync progress
          const unshieldedProgress = state.unshielded?.progress;
          const dustProgress = state.dust?.progress;
          if (unshieldedProgress && typeof unshieldedProgress.appliedIndex === 'bigint') {
            if (unshieldedProgress.appliedIndex >= BigInt(targetHeight)) {
              return true;
            }
          }
          if (dustProgress && typeof dustProgress.appliedIndex === 'bigint') {
            if (dustProgress.appliedIndex >= BigInt(targetHeight)) {
              return true;
            }
          }
          // Check top-level progress / syncProgress
          const progress = state.syncProgress || state.progress;
          if (progress) {
            if (typeof progress.appliedIndex === 'bigint' && progress.appliedIndex >= BigInt(targetHeight)) {
              return true;
            }
            if (typeof progress.appliedBlock === 'number' && progress.appliedBlock >= targetHeight) {
              return true;
            }
            if (progress.synced && (progress.currentHeight === undefined || progress.currentHeight >= targetHeight)) {
              return true;
            }
          }
          if (state.isSynced && (state.appliedIndex === undefined || state.appliedIndex >= BigInt(targetHeight))) {
            return true;
          }
          if (Date.now() - t0 > timeoutMs) {
            throw new Error(`Timeout waiting for wallet to sync past block #${targetHeight}`);
          }
          return false;
        })
      )
    );
  }

  interface TxReport {
    circuit: string;
    role: string;
    provingMs: number;
    proofSize: number;
    txHash: string;
    blockHeight: number;
    walletBefore: WalletBalances;
    walletAfter: WalletBalances;
    contractBefore: bigint;
    contractAfter: bigint;
    walletItemBefore: bigint;
    walletItemAfter: bigint;
    contractItemBefore: bigint;
    contractItemAfter: bigint;
    itemMovement: string;
    stateBefore: any;
    stateAfter: any;
  }

  const allTxReports: TxReport[] = [];

  async function executeAndReport(
    circuitName: string,
    callerIdentity: string,
    callFn: () => Promise<any>,
    checkDelta: (report: TxReport) => void
  ): Promise<any> {
    const walletBefore = await getWalletBalance();
    const contractStateBefore = await publicDataProvider.queryContractState(contractAddress);
    const ledgerBefore = ledger(contractStateBefore!.data);
    const contractBefore = await getContractBalance();
    const contractItemBefore = await getContractItemBalance();
    const walletItemBefore = await getWalletItemBalance();

    currentProvingMs = 0;
    const tx = await callFn();
    const provingMs = currentProvingMs;
    const txBlockHeight = tx.public.blockHeight;

    // Wait until wallet has synced past the tx's block height before reading "after" balances
    console.log(`        Waiting for wallet to sync past block #${txBlockHeight}...`);
    await waitForWalletSyncedToBlock(txBlockHeight);

    const walletAfter = await getWalletBalance();
    const contractStateAfter = await publicDataProvider.queryContractState(contractAddress);
    const ledgerAfter = ledger(contractStateAfter!.data);
    const contractAfter = await getContractBalance();
    const contractItemAfter = await getContractItemBalance();
    const walletItemAfter = await getWalletItemBalance();

    const itemMovement = circuitName === 'depositItem'
      ? '1 item token deposited into contract escrow by seller'
      : (circuitName === 'winnerClaimItem'
        ? '1 item token transferred from contract escrow to winner'
        : (circuitName === 'cancelAuction' || circuitName === 'sellerReclaimUnsoldItem'
          ? '1 item token returned from contract escrow to seller'
          : 'None'));

    const report: TxReport = {
      circuit: circuitName,
      role: callerIdentity,
      provingMs,
      proofSize: currentProofBytes,
      txHash: tx.public.txHash,
      blockHeight: tx.public.blockHeight,
      walletBefore,
      walletAfter,
      contractBefore,
      contractAfter,
      walletItemBefore,
      walletItemAfter,
      contractItemBefore,
      contractItemAfter,
      itemMovement,
      stateBefore: ledgerBefore,
      stateAfter: ledgerAfter,
    };
    allTxReports.push(report);

    console.log(`\n      [TRANSACTION CONFIRMED: ${circuitName}]`);
    console.log(`        Identity:         ${callerIdentity}`);
    console.log(`        Circuit:          ${report.circuit}`);
    console.log(`        Proving Time:     ${report.provingMs} ms (measured around proof-server call)`);
    console.log(`        Tx Hash:          ${report.txHash}`);
    console.log(`        Block Height:     #${report.blockHeight}`);
    console.log(`        Wallet tNIGHT:    Before: ${report.walletBefore.tNight} tNIGHT | After: ${report.walletAfter.tNight} tNIGHT (Δ: ${report.walletAfter.tNight - report.walletBefore.tNight})`);
    console.log(`        Wallet Dust:      Before: ${report.walletBefore.dust} Dust | After: ${report.walletAfter.dust} Dust (Fee: ${report.walletBefore.dust - report.walletAfter.dust})`);
    console.log(`        Contract tNIGHT:  Before: ${report.contractBefore} tNIGHT | After: ${report.contractAfter} tNIGHT (Δ: ${report.contractAfter - report.contractBefore})`);
    console.log(`        Item Token Escrow:Before: ${report.contractItemBefore} Item | After: ${report.contractItemAfter} Item (Δ: ${report.contractItemAfter - report.contractItemBefore})`);

    checkDelta(report);
    return tx;
  }

  // Exploit & Regression Tests Before Bidding
  console.log('\n[Exploit Verification 1/8] Asserting Bid before deposit is strictly rejected...');
  await assert.rejects(
    () => bidder1Contract.callTx.placeBid(6000n, bidder1RefundAddress),
    /Item must be deposited into escrow before bidding can start/,
    'Circuit must strictly reject placeBid before item is deposited'
  );
  console.log('      ✓ Verified: Bid before item deposit rejected (assert.rejects).');

  console.log('\n[Exploit Verification 2/8] Asserting Non-seller cannot deposit item...');
  await assert.rejects(
    () => bidder1Contract.callTx.depositItem(testItem, 1n),
    /Caller is not the auction seller/,
    'Circuit must strictly reject unauthorized item deposit'
  );
  console.log('      ✓ Verified: Non-seller item deposit rejected (assert.rejects).');

  // Seller deposits item into escrow
  console.log('\n      Submitting Item Deposit (1 unit of custom item token) by Seller...');
  const depositTx = await executeAndReport(
    'depositItem',
    'Seller (with sellerSecret)',
    () => sellerContract.callTx.depositItem(testItem, 1n),
    (r) => {
      assert.equal(r.contractItemAfter - r.contractItemBefore, 1n, 'Contract item token balance must increase by +1 after deposit');
      assert.equal(r.walletItemBefore - r.walletItemAfter, 1n, 'Seller wallet item holdings must decrease by -1 after deposit');
      assert(r.walletAfter.dust < r.walletBefore.dust, 'Wallet Dust balance must decrease on every transaction for fees');
      assert.equal(r.stateAfter.itemDeposited, true, 'Contract ledger itemDeposited must equal true');
      assert.equal(r.stateAfter.itemAmount, 1n, 'Contract ledger itemAmount must equal 1');
    }
  );

  console.log('\n[Exploit Verification 3/8] Asserting Double depositItem is strictly rejected...');
  await assert.rejects(
    () => sellerContract.callTx.depositItem(testItem, 1n),
    /Item has already been deposited into escrow/,
    'Circuit must strictly reject duplicate item deposit'
  );
  console.log('      ✓ Verified: Double item deposit rejected (assert.rejects).');

  console.log('\n[Exploit Verification 4/8] Asserting Seller cannot bid on own auction...');
  await assert.rejects(
    () => sellerContract.callTx.placeBid(9999n, walletAddressBytes),
    /Seller cannot bid/,
    'Circuit must strictly reject seller placeBid'
  );
  console.log('      ✓ Verified: Seller cannot bid on own auction (assert.rejects).');

  console.log('\n[Exploit Verification 5/8] Asserting Non-Seller cannot cancel auction...');
  await assert.rejects(
    () => bidder1Contract.callTx.cancelAuction(),
    /Caller is not the auction seller/,
    'Circuit must strictly reject unauthorized cancelAuction'
  );
  console.log('      ✓ Verified: Non-seller cannot cancel auction (assert.rejects).');

  console.log('\n[Exploit Verification 6/8] Asserting Early endAuction rejected before deadline...');
  await assert.rejects(
    () => crankContract.callTx.endAuction(),
    /Cannot end auction before bidding deadline has passed/,
    'Circuit must strictly reject early endAuction'
  );
  console.log('      ✓ Verified: Early endAuction rejected before deadline (assert.rejects).');

  // Bid 1: 6,000 tNIGHT by Bidder 1
  const bid1Block = await fetchLiveIndexerBlock(indexerUrl);
  if (bid1Block.timestampSec >= auctionDeadline) {
    throw new Error(`Bidding deadline has passed (current: ${bid1Block.timestampSec}s, deadline: ${auctionDeadline}s)`);
  }
  console.log('\n      Submitting Bid 1 (6,000 tNIGHT) by Bidder 1...');
  const bid1Tx = await executeAndReport(
    'placeBid',
    'Bidder 1 (with bidder1Secret)',
    () => bidder1Contract.callTx.placeBid(6000n, bidder1RefundAddress),
    (r) => {
      assert.equal(r.contractAfter - r.contractBefore, 6000n, 'Contract tNIGHT must increase by exactly +6000');
      assert(r.walletAfter.dust < r.walletBefore.dust, 'Wallet Dust balance must decrease on every transaction for fees');
      assert.equal(r.stateAfter.highestBid, 6000n, 'Contract ledger highestBid must equal 6000');
      assert.equal(r.stateAfter.totalBids, r.stateBefore.totalBids + 1n, 'Contract totalBids must increment by 1');
    }
  );

  // Bid 2: 8,500 tNIGHT by Bidder 2 (outbidding Bidder 1)
  const bid2Block = await fetchLiveIndexerBlock(indexerUrl);
  if (bid2Block.timestampSec >= auctionDeadline) {
    throw new Error(`Bidding deadline has passed (current: ${bid2Block.timestampSec}s, deadline: ${auctionDeadline}s)`);
  }
  console.log('\n      Submitting Bid 2 (8,500 tNIGHT) by Bidder 2 (outbidding Bidder 1)...');
  const bid2Tx = await executeAndReport(
    'placeBid',
    'Bidder 2 (with bidder2Secret)',
    () => bidder2Contract.callTx.placeBid(8500n, bidder2RefundAddress),
    (r) => {
      assert.equal(r.contractAfter - r.contractBefore, 8500n, 'Contract tNIGHT must increase by exactly +8500');
      assert(r.walletAfter.dust < r.walletBefore.dust, 'Wallet Dust balance must decrease on every transaction for fees');
      assert.equal(r.stateAfter.highestBid, 8500n, 'Contract ledger highestBid must equal 8500');
      assert.equal(r.stateAfter.totalBids, r.stateBefore.totalBids + 1n, 'Contract totalBids must increment by 1');
    }
  );

  // Step 8: Wait Real-Time for Deadline to Pass -> End, Settle, Claim & Refund
  console.log(`\n[Step 8/8] Polling Indexer until Chain Block Time passes ${auctionDeadline}s...`);
  let latestBlock = await fetchLiveIndexerBlock(indexerUrl);
  while (latestBlock.timestampSec < auctionDeadline) {
    const diff = auctionDeadline - latestBlock.timestampSec;
    console.log(`      ... Block #${latestBlock.height} | Chain Time: ${latestBlock.timestampSec}s (Waiting for ${diff}s)...`);
    await new Promise((r) => setTimeout(r, 6000));
    latestBlock = await fetchLiveIndexerBlock(indexerUrl);
  }
  console.log(`      ✓ Consensus Block Time Passed Deadline: ${latestBlock.timestampSec}s >= ${auctionDeadline}s`);

  // End Auction (Permissionless Crank)
  console.log('\n      Executing endAuction (Permissionless Crank)...');
  const endTx = await executeAndReport(
    'endAuction',
    'Crank (Permissionless with crankSecret)',
    () => crankContract.callTx.endAuction(),
    (r) => {
      assert.equal(r.contractAfter, r.contractBefore, 'Contract tNIGHT balance unchanged during endAuction');
      assert(r.walletAfter.dust < r.walletBefore.dust, 'Wallet Dust balance must decrease on every transaction for fees');
      assert.equal(r.stateBefore.state, AuctionState.Active, 'Expected previous state Active (0)');
      assert.equal(r.stateAfter.state, AuctionState.Ended, 'Expected new state Ended (1)');
    }
  );

  // Settle Auction (Permissionless Crank)
  console.log('\n      Executing settleAuction (Permissionless Crank)...');
  const settleTx = await executeAndReport(
    'settleAuction',
    'Crank (Permissionless with crankSecret)',
    () => crankContract.callTx.settleAuction(),
    (r) => {
      assert.equal(r.contractAfter, r.contractBefore, 'Contract tNIGHT balance unchanged during settleAuction');
      assert(r.walletAfter.dust < r.walletBefore.dust, 'Wallet Dust balance must decrease on every transaction for fees');
      assert.equal(r.stateBefore.state, AuctionState.Ended, 'Expected previous state Ended (1)');
      assert.equal(r.stateAfter.state, AuctionState.Settled, 'Expected new state Settled (2)');
    }
  );

  // Seller Claim Funds (Seller Payout)
  console.log('\n      Executing sellerClaimFunds (Seller Payout of 8,500 tNIGHT)...');
  const sellerClaimTx = await executeAndReport(
    'sellerClaimFunds',
    'Seller (with sellerSecret)',
    () => sellerContract.callTx.sellerClaimFunds(),
    (r) => {
      assert.equal(r.contractBefore - r.contractAfter, 8500n, 'Contract tNIGHT must decrease by exactly -8500 payout');
      assert.equal(r.walletAfter.tNight - r.walletBefore.tNight, 8500n, 'Wallet tNIGHT must increase by exactly +8500 winning payout');
      assert(r.walletAfter.dust < r.walletBefore.dust, 'Wallet Dust balance must decrease on every transaction for fees');
      assert.equal(r.stateBefore.sellerFundsClaimed, false, 'Expected sellerFundsClaimed to be false prior to claim');
      assert.equal(r.stateAfter.sellerFundsClaimed, true, 'Expected sellerFundsClaimed to be true after claim');
    }
  );

  // Double Seller Claim Test
  console.log('\n[Exploit Verification 4/6] Asserting Double sellerClaimFunds rejected...');
  await assert.rejects(
    () => sellerContract.callTx.sellerClaimFunds(),
    /Seller funds have already been claimed/,
    'Circuit must strictly reject duplicate sellerClaimFunds'
  );
  console.log('      ✓ Verified: Double seller claim rejected (assert.rejects).');

  // Withdraw Refund (Outbid Bidder 1)
  console.log('\n      Executing withdrawRefund (Outbid Bidder 1 Reclaiming 6,000 tNIGHT Escrow)...');
  const refundTx = await executeAndReport(
    'withdrawRefund',
    'Bidder 1 (with bidder1Secret)',
    () => bidder1Contract.callTx.withdrawRefund(bidder1RefundAddress),
    (r) => {
      assert.equal(r.contractBefore - r.contractAfter, 6000n, 'Contract tNIGHT must decrease by exactly -6000 refund');
      assert.equal(r.walletAfter.tNight - r.walletBefore.tNight, 6000n, 'Wallet tNIGHT must increase by exactly +6000 refund deposit');
      assert(r.walletAfter.dust < r.walletBefore.dust, 'Wallet Dust balance must decrease on every transaction for fees');
      assert.equal(r.stateAfter.totalRefundsClaimed, r.stateBefore.totalRefundsClaimed + 1n, 'Expected totalRefundsClaimed to increment');
    }
  );

  // Double Withdraw Refund Test
  console.log('\n[Exploit Verification 7/8] Asserting Double withdrawRefund rejected...');
  await assert.rejects(
    () => bidder1Contract.callTx.withdrawRefund(bidder1RefundAddress),
    /Refund amount must be greater than zero/,
    'Circuit must strictly reject duplicate withdrawRefund'
  );
  console.log('      ✓ Verified: Double refund withdraw rejected (assert.rejects).');

  // Non-Winner Claim Item Test
  console.log('\n[Exploit Verification 8/8] Asserting Non-winner winnerClaimItem rejected...');
  await assert.rejects(
    () => bidder1Contract.callTx.winnerClaimItem(bidder1RefundAddress),
    /Caller is not the winning bidder/,
    'Circuit must strictly reject non-winner winnerClaimItem'
  );
  console.log('      ✓ Verified: Non-winner winnerClaimItem rejected (assert.rejects).');

  // Winner Claim Item (Winner Entitlement)
  console.log('\n      Executing winnerClaimItem (Winner Claiming Vault Item)...');
  const winnerClaimTx = await executeAndReport(
    'winnerClaimItem',
    'Bidder 2 (with bidder2Secret)',
    () => bidder2Contract.callTx.winnerClaimItem(bidder2RefundAddress),
    (r) => {
      assert.equal(r.contractItemBefore - r.contractItemAfter, 1n, 'Contract item token balance must decrease by 1 upon winner claim');
      assert.equal(r.walletItemAfter - r.walletItemBefore, 1n, 'Winner wallet item holdings must increase by +1 upon winner claim');
      assert.equal(r.contractAfter, r.contractBefore, 'Contract tNIGHT balance unchanged during winnerClaimItem');
      assert(r.walletAfter.dust < r.walletBefore.dust, 'Wallet Dust balance must decrease on every transaction for fees');
      assert.equal(r.stateBefore.winnerItemClaimed, false, 'Expected winnerItemClaimed to be false prior to claim');
      assert.equal(r.stateAfter.winnerItemClaimed, true, 'Expected winnerItemClaimed to be true after claim');
      assert.equal(r.stateAfter.itemDeposited, false, 'Expected itemDeposited to be false after item claim');
    }
  );

  console.log('\n================================================================');
  console.log('  LIVE PREPROD E2E INTEGRATION SUITE: 100% BROADCAST & CONFIRMED');
  console.log('================================================================');
  console.log(`  Contract Address: ${contractAddress}`);
  console.log(`  Deploy Tx Hash:   ${deployTxHash}`);
  console.log(`  depositItem Hash: ${depositTx.public.txHash}`);
  console.log(`  placeBid 1 Hash:  ${bid1Tx.public.txHash}`);
  console.log(`  placeBid 2 Hash:  ${bid2Tx.public.txHash}`);
  console.log(`  endAuction Hash:  ${endTx.public.txHash}`);
  console.log(`  settleAuction:    ${settleTx.public.txHash}`);
  console.log(`  sellerClaim:      ${sellerClaimTx.public.txHash}`);
  console.log(`  withdrawRefund:   ${refundTx.public.txHash}`);
  console.log(`  winnerClaimItem:  ${winnerClaimTx.public.txHash}`);
  console.log('================================================================\n');

  // Persist machine-readable e2e-result.json
  const e2eResult = {
    network: {
      environment: targetEnv,
      chainName: nodeIdentity.chainName,
      genesisHash: nodeIdentity.genesisHash || 'N/A',
      nodeUrl: details.rpcUrl,
      indexerUrl,
    },
    contractAddress,
    transactions: allTxReports.map((r, idx) => ({
      stepIndex: idx + 1,
      circuit: r.circuit,
      role: r.role,
      txHash: r.txHash,
      blockHeight: r.blockHeight,
      provingTimeMs: r.provingMs,
      proofSize: r.proofSize,
      walletBefore: {
        tNight: r.walletBefore.tNight.toString(),
        dust: r.walletBefore.dust.toString(),
      },
      walletAfter: {
        tNight: r.walletAfter.tNight.toString(),
        dust: r.walletAfter.dust.toString(),
      },
      contractBefore: r.contractBefore.toString(),
      contractAfter: r.contractAfter.toString(),
      itemMovement: r.itemMovement || 'None',
      explorerUrl: `https://preprod.midnight.network/tx/${r.txHash}`,
    })),
  };
  fs.writeFileSync(path.resolve('e2e-result.json'), JSON.stringify(e2eResult, null, 2), 'utf-8');
  console.log('      ✓ Persisted machine-readable execution log to e2e-result.json\n');

  await wallet.close();
}

runLiveAuctionE2ETest().catch((err) => {
  console.error('\n❌ Live E2E Integration Suite Failed:', err.message || err);
  process.exit(1);
});
