import { Contract, VaultState, ledger, type Witnesses } from '../managed/contract/index.js';
import * as CompiledContract from '@midnight-ntwrk/compact-js/effect/CompiledContract';
import { setNetworkId, getNetworkId, NetworkId } from '../src/network.js';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import fs from 'fs';
import path from 'path';

interface DeploymentConfig {
  network: string;
  nodeUrl: string;
  indexerUrl: string;
  indexerWsUrl: string;
  proofServerUrl: string;
}

const PREPROD_CONFIG: DeploymentConfig = {
  network: 'Midnight Preprod Testnet',
  nodeUrl: process.env.MIDNIGHT_NODE_URL || 'https://rpc.preprod.midnight.network',
  indexerUrl: process.env.MIDNIGHT_INDEXER_URL || 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWsUrl: process.env.MIDNIGHT_INDEXER_WS_URL || 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  proofServerUrl: process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300',
};

async function deployShadowVault() {
  console.log('================================================================');
  console.log('    MIDNIGHT BLOCKCHAIN - CONTRACT DEPLOYMENT ENGINE (PREPROD)   ');
  console.log('================================================================\n');

  // Configure actual Preprod network ID
  setNetworkId(NetworkId.TestNet);
  console.log(`[1/5] Target Network Configuration:`);
  console.log(`      Network ID:    ${getNetworkId()}`);
  console.log(`      Network:       ${PREPROD_CONFIG.network}`);
  console.log(`      Node Endpoint: ${PREPROD_CONFIG.nodeUrl}`);
  console.log(`      Indexer URL:   ${PREPROD_CONFIG.indexerUrl}`);
  console.log(`      Proof Server:  ${PREPROD_CONFIG.proofServerUrl}\n`);

  console.log(`[2/5] Loading ZK Circuit & Proving Key Artifacts...`);
  const managedPath = path.resolve('managed');
  if (!fs.existsSync(managedPath)) {
    throw new Error('Managed keys and ZKIR artifacts not found! Run npm run compile first.');
  }

  const zkConfigProvider = new NodeZkConfigProvider(managedPath);
  console.log(`      ✓ Initialized NodeZkConfigProvider with local managed key artifacts\n`);

  console.log(`[3/5] Instantiating ShadowVault Smart Contract...`);
  const deployWitnesses: Witnesses<any> = {
    secretWitness: (context) => [context.privateState, new Uint8Array(32)],
    userSalt: (context) => [context.privateState, new Uint8Array(32)],
    ownerKey: (context) => [context.privateState, new Uint8Array(32)],
  };
  const compiledContract = CompiledContract.make('ShadowVault', Contract).pipe(
    CompiledContract.withWitnesses(deployWitnesses)
  );

  console.log(`[4/5] Constructing Midnight Providers & Initiating Real Deployment...`);
  const publicDataProvider = indexerPublicDataProvider(
    PREPROD_CONFIG.indexerUrl,
    PREPROD_CONFIG.indexerWsUrl
  );
  const proofProvider = httpClientProofProvider(
    PREPROD_CONFIG.proofServerUrl,
    zkConfigProvider
  );
  const privateStateProvider = levelPrivateStateProvider({
    midnightDbName: 'shadow_vault_deploy_db',
    accountId: 'deployer',
    privateStoragePasswordProvider: () => 'ShadowVaultDeploySecret2026!'
  });

  const coinPublicKey = process.env.MIDNIGHT_WALLET_COIN_PUBLIC_KEY;
  const encryptionPublicKey = process.env.MIDNIGHT_WALLET_ENCRYPTION_PUBLIC_KEY;

  if (!coinPublicKey || !encryptionPublicKey) {
    throw new Error(
      'Real deployment requires funded wallet keys: MIDNIGHT_WALLET_COIN_PUBLIC_KEY and MIDNIGHT_WALLET_ENCRYPTION_PUBLIC_KEY environment variables are required. Mock fallback keys are disabled.'
    );
  }

  const walletProvider = {
    balanceTx: async (tx: any) => {
      if (process.env.MIDNIGHT_BALANCING_URL) {
        const res = await fetch(process.env.MIDNIGHT_BALANCING_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tx: Buffer.from(tx.serialize()).toString('hex') })
        });
        if (!res.ok) throw new Error(`Balancing service failed: ${res.statusText}`);
        const data: any = await res.json();
        return (tx.constructor as any).deserialize(
          (tx as any).markerS?.instance,
          (tx as any).markerP?.instance,
          (tx as any).markerB?.instance,
          Buffer.from(data.tx, 'hex')
        );
      }
      throw new Error(
        'Real deployment requires wallet balancing. Please configure MIDNIGHT_BALANCING_URL or run within an active wallet provider environment.'
      );
    },
    getCoinPublicKey: () => coinPublicKey as any,
    getEncryptionPublicKey: () => encryptionPublicKey as any,
  };

  const midnightProvider = {
    submitTx: async (tx: any) => {
      const identifiers = tx.identifiers();
      if (!identifiers || identifiers.length === 0) {
        throw new Error('Transaction submission failed: no valid transaction identifiers generated.');
      }
      const serializedHex = Buffer.from(tx.serialize()).toString('hex');
      const rpcResponse = await fetch(PREPROD_CONFIG.nodeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'author_submitExtrinsic',
          params: [serializedHex]
        })
      });
      const rpcJson: any = await rpcResponse.json().catch(() => null);
      if (rpcJson?.error) {
        throw new Error(`Consensus node rejected transaction: ${JSON.stringify(rpcJson.error)}`);
      }
      return rpcJson?.result ? rpcJson.result.replace(/^0x/, '') : identifiers[0];
    }
  };

  // Execute genuine deploy flow on network
  const deployed = await deployContract(
    {
      privateStateProvider,
      publicDataProvider,
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    } as any,
    {
      compiledContract,
      privateStateId: 'shadowVaultState',
      initialPrivateState: {},
    } as any
  );

  const contractAddressHex = deployed.deployTxData.public.contractAddress;
  const txIdHex = deployed.deployTxData.public.txId;
  const blockNumber = deployed.deployTxData.public.blockHeight;

  if (!contractAddressHex) {
    throw new Error('Deployment failed: on-chain contract address was not returned by consensus node.');
  }

  console.log(`[5/5] DEPLOYMENT SUCCESSFUL!`);
  console.log(`================================================================`);
  console.log(`  CONTRACT ADDRESS: ${contractAddressHex}`);
  console.log(`  TRANSACTION ID:   ${txIdHex}`);
  console.log(`  BLOCK NUMBER:     #${blockNumber}`);
  console.log(`  NETWORK ID:       ${getNetworkId()}`);
  console.log(`  NETWORK:          ${PREPROD_CONFIG.network}`);
  console.log(`  DEPLOYMENT STATUS: CONFIRMED & ACTIVE ON LEDGER`);
  console.log(`================================================================\n`);

  const receipt = {
    contractName: 'ShadowVault',
    contractAddress: contractAddressHex,
    transactionId: txIdHex,
    blockNumber: blockNumber,
    networkId: getNetworkId(),
    network: PREPROD_CONFIG.network,
    deployedAt: new Date().toISOString(),
    circuits: ['incrementCounter', 'initializeVault', 'verifyAndClaim', 'revokeVault'],
  };

  fs.writeFileSync('deployment-receipt.json', JSON.stringify(receipt, null, 2));
  console.log(`✓ Real deployment receipt written to deployment-receipt.json\n`);
}

deployShadowVault().catch((err) => {
  console.error('Deployment Failed:', err.message || err);
  process.exit(1);
});
