import {
  setNetworkId as setMidnightNetworkId,
  getNetworkId as getMidnightNetworkId,
  NetworkId as MidnightNetworkId
} from '@midnight-ntwrk/midnight-js-network-id';

export enum NetworkEnvironment {
  Undeployed = 'Undeployed',
  DevNet = 'DevNet',
  Preprod = 'Preprod',
  Preview = 'Preview',
  MainNet = 'MainNet',
}

export const NetworkId = {
  Undeployed: 'Undeployed',
  DevNet: 'DevNet',
  TestNet: 'TestNet',
  MainNet: 'MainNet',
  Preview: 'preview',
  Preprod: 'preprod',
} as const;

export type NetworkIdType = typeof NetworkId[keyof typeof NetworkId] | MidnightNetworkId | string;

export interface NetworkConfig {
  readonly environment: NetworkEnvironment;
  readonly name: string;
  readonly subdomain: string;
  readonly rpcUrl: string;
  readonly nodeUrl: string;
  readonly indexerUrl: string;
  readonly indexerWsUrl: string;
  readonly proofServerUrl: string;
  readonly isPreprod: boolean;
  readonly expectedChainName: string;
  readonly expectedGenesisHash?: string;
}

// Pinned network configurations per environment preventing cross-network confusion
// Citations:
// - Preprod: Chain name 'Midnight Preprod' (Node RPC system_chain), Genesis Hash from Midnight Preprod genesis block
// - Preview: Chain name 'Midnight Preview' (Node RPC system_chain), Genesis Hash from Midnight Preview genesis block
// - DevNet: Chain name 'Midnight DevNet' (Node RPC system_chain), local devnet genesis
// - MainNet: Chain name 'Midnight MainNet' (Node RPC system_chain), mainnet genesis specification
export const PINNED_NETWORK_CONFIGS: Record<NetworkEnvironment, NetworkConfig> = {
  [NetworkEnvironment.Preprod]: {
    environment: NetworkEnvironment.Preprod,
    name: 'Midnight Preprod Testnet',
    subdomain: 'preprod',
    rpcUrl: 'https://rpc.preprod.midnight.network',
    nodeUrl: 'wss://rpc.preprod.midnight.network',
    indexerUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWsUrl: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    proofServerUrl: (typeof process !== 'undefined' && process.env && process.env.MIDNIGHT_PROOF_SERVER_URL) ? process.env.MIDNIGHT_PROOF_SERVER_URL : 'http://localhost:6300',
    isPreprod: true,
    expectedChainName: 'Midnight Preprod',
    expectedGenesisHash: '0x011b7d34bf42b102b542023d6a5996cb03ae1ef4f7c234a991820fc129e925c4',
  },
  [NetworkEnvironment.Preview]: {
    environment: NetworkEnvironment.Preview,
    name: 'Midnight Preview Testnet',
    subdomain: 'preview',
    rpcUrl: 'https://rpc.preview.midnight.network',
    nodeUrl: 'wss://rpc.preview.midnight.network',
    indexerUrl: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWsUrl: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    proofServerUrl: (typeof process !== 'undefined' && process.env && process.env.MIDNIGHT_PROOF_SERVER_URL) ? process.env.MIDNIGHT_PROOF_SERVER_URL : 'http://localhost:6300',
    isPreprod: false,
    expectedChainName: 'Midnight Preview',
    expectedGenesisHash: '0x08538e1a1d953920e408ec22849ec7ecb575a6c0245a491f24d7756e09c855a0',
  },
  [NetworkEnvironment.DevNet]: {
    environment: NetworkEnvironment.DevNet,
    name: 'Midnight DevNet',
    subdomain: 'devnet',
    rpcUrl: 'http://localhost:9944',
    nodeUrl: 'ws://localhost:9944',
    indexerUrl: 'http://localhost:8088/api/v4/graphql',
    indexerWsUrl: 'ws://localhost:8088/api/v4/graphql/ws',
    proofServerUrl: (typeof process !== 'undefined' && process.env && process.env.MIDNIGHT_PROOF_SERVER_URL) ? process.env.MIDNIGHT_PROOF_SERVER_URL : 'http://localhost:6300',
    isPreprod: false,
    expectedChainName: 'Midnight DevNet',
    expectedGenesisHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
  [NetworkEnvironment.Undeployed]: {
    environment: NetworkEnvironment.Undeployed,
    name: 'Midnight Undeployed / Local',
    subdomain: 'local',
    rpcUrl: 'http://localhost:9944',
    nodeUrl: 'ws://localhost:9944',
    indexerUrl: 'http://localhost:8088/api/v4/graphql',
    indexerWsUrl: 'ws://localhost:8088/api/v4/graphql/ws',
    proofServerUrl: (typeof process !== 'undefined' && process.env && process.env.MIDNIGHT_PROOF_SERVER_URL) ? process.env.MIDNIGHT_PROOF_SERVER_URL : 'http://localhost:6300',
    isPreprod: false,
    expectedChainName: 'Midnight Undeployed',
    expectedGenesisHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
  [NetworkEnvironment.MainNet]: {
    environment: NetworkEnvironment.MainNet,
    name: 'Midnight MainNet',
    subdomain: 'mainnet',
    rpcUrl: 'https://rpc.mainnet.midnight.network',
    nodeUrl: 'wss://rpc.mainnet.midnight.network',
    indexerUrl: 'https://indexer.mainnet.midnight.network/api/v4/graphql',
    indexerWsUrl: 'wss://indexer.mainnet.midnight.network/api/v4/graphql/ws',
    proofServerUrl: (typeof process !== 'undefined' && process.env && process.env.MIDNIGHT_PROOF_SERVER_URL) ? process.env.MIDNIGHT_PROOF_SERVER_URL : 'http://localhost:6300',
    isPreprod: false,
    expectedChainName: 'Midnight MainNet',
    expectedGenesisHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
};

const CANONICAL_ALIAS_MAP: Record<string, NetworkEnvironment> = {
  preprod: NetworkEnvironment.Preprod,
  'midnight preprod': NetworkEnvironment.Preprod,
  'midnight preprod testnet': NetworkEnvironment.Preprod,
  preview: NetworkEnvironment.Preview,
  'midnight preview': NetworkEnvironment.Preview,
  'midnight preview testnet': NetworkEnvironment.Preview,
  devnet: NetworkEnvironment.DevNet,
  'midnight devnet': NetworkEnvironment.DevNet,
  undeployed: NetworkEnvironment.Undeployed,
  mainnet: NetworkEnvironment.MainNet,
  'midnight mainnet': NetworkEnvironment.MainNet,
  testnet: NetworkEnvironment.Preprod, // Default protocol testnet identifier
};

export function canonicalizeNetwork(network: string): NetworkEnvironment {
  if (!network || typeof network !== 'string' || network.trim() === '') {
    throw new Error(`Invalid network identifier: "${network}". Expected non-empty string.`);
  }
  const clean = network.trim().toLowerCase();
  const canonical = CANONICAL_ALIAS_MAP[clean];
  if (!canonical) {
    throw new Error(
      `Unknown or unsupported network identifier: "${network}". Supported networks: ${Object.values(NetworkEnvironment).join(', ')}.`
    );
  }
  return canonical;
}

let currentNetworkId: string = NetworkId.TestNet;

export function isValidNetworkId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return Object.prototype.hasOwnProperty.call(CANONICAL_ALIAS_MAP, id.trim().toLowerCase());
}

export function validateNetworkId(id: string): string {
  canonicalizeNetwork(id);
  return id;
}

/**
 * Validates that two network identifiers resolve to the identical NetworkEnvironment.
 * Fully symmetric: validateWalletNetwork(A, B) === validateWalletNetwork(B, A).
 * Rejects fuzzy substring matching to prevent Preview vs Preprod confusion.
 */
export function validateWalletNetwork(networkA: string, networkB: string = currentNetworkId): void {
  const envA = canonicalizeNetwork(networkA);
  const envB = canonicalizeNetwork(networkB);

  if (envA !== envB) {
    throw new Error(
      `Network mismatch detected: "${networkA}" (${envA}) does not match "${networkB}" (${envB}). Preprod and Preview environments cannot be mixed.`
    );
  }
}

export function setNetworkId(id: NetworkIdType): string {
  validateNetworkId(String(id));
  setMidnightNetworkId(id as MidnightNetworkId);
  currentNetworkId = String(id);
  return currentNetworkId;
}

export function getNetworkId(): string {
  return currentNetworkId;
}

export function getNetworkDetails(id?: NetworkIdType): NetworkConfig & { id: string } {
  const activeId = id || getNetworkId();
  const env = canonicalizeNetwork(String(activeId));
  const config = PINNED_NETWORK_CONFIGS[env];
  return {
    ...config,
    id: String(activeId),
  };
}

/**
 * Validates connection to the proof server.
 */
export async function validateProofServerConnection(proofServerUrl: string = 'http://localhost:6300'): Promise<boolean> {
  try {
    const res = await fetch(`${proofServerUrl.replace(/\/$/, '')}/health`, {
      method: 'GET',
    }).catch(() => null);
    return res !== null && (res.status === 200 || res.status === 404);
  } catch {
    return false;
  }
}

/**
 * Validates connection to the target indexer GraphQL endpoint.
 */
export async function validateIndexerConnection(indexerUrl: string): Promise<{ height: number; hash: string }> {
  const res = await fetch(indexerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'query { block { height hash } }' })
  });
  if (!res.ok) {
    throw new Error(`Failed to query indexer at ${indexerUrl}: ${res.statusText}`);
  }
  const json: any = await res.json();
  const height = json?.data?.block?.height;
  const hash = json?.data?.block?.hash;
  if (typeof height !== 'number' || typeof hash !== 'string') {
    throw new Error(`Indexer at ${indexerUrl} returned invalid block structure: ${JSON.stringify(json)}`);
  }
  return { height, hash };
}

/**
 * Queries the node RPC for its chain identity (system_chain and genesis hash)
 * and verifies it matches the pinned expected environment.
 * Refuses execution on any mismatch.
 */
export async function validateNodeNetworkIdentity(
  rpcUrl: string,
  expectedEnvironment: NetworkEnvironment,
  fetchFn: typeof fetch = fetch
): Promise<{ chainName: string; genesisHash?: string }> {
  const chainPayload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'system_chain',
    params: [],
  };

  const res = await fetchFn(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chainPayload),
  });

  if (!res.ok) {
    throw new Error(`Failed to query node RPC at ${rpcUrl}: HTTP ${res.status} ${res.statusText}`);
  }

  const json: any = await res.json();
  if (json.error) {
    throw new Error(`Node RPC error from ${rpcUrl}: ${JSON.stringify(json.error)}`);
  }

  const chainName: string = json.result;
  if (!chainName || typeof chainName !== 'string') {
    throw new Error(`Node RPC at ${rpcUrl} returned invalid system_chain result: ${JSON.stringify(json)}`);
  }

  // Check canonical environment from the node's chainName
  const detectedEnv = canonicalizeNetwork(chainName);
  if (detectedEnv !== expectedEnvironment) {
    throw new Error(
      `FATAL NETWORK MISMATCH: Connected node at ${rpcUrl} identified as "${chainName}" (${detectedEnv}), but required environment is "${expectedEnvironment}". Aborting execution to prevent cross-network corruption.`
    );
  }

  // Query genesis block hash from node RPC
  let genesisHash: string | undefined;
  try {
    const genesisRes = await fetchFn(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'chain_getBlockHash',
        params: [0],
      }),
    });
    if (genesisRes.ok) {
      const genesisJson: any = await genesisRes.json();
      if (genesisJson.result && typeof genesisJson.result === 'string') {
        genesisHash = genesisJson.result;
      }
    }
  } catch {
    // Non-fatal if genesis hash endpoint is restricted
  }

  // If node returned a genesis hash, verify it matches pinned expected genesis hash
  const config = PINNED_NETWORK_CONFIGS[expectedEnvironment];
  if (config?.expectedGenesisHash && genesisHash) {
    const cleanExpected = config.expectedGenesisHash.toLowerCase().replace(/^0x/, '');
    const cleanNode = genesisHash.toLowerCase().replace(/^0x/, '');
    if (cleanNode !== cleanExpected) {
      throw new Error(
        `FATAL NODE GENESIS MISMATCH: Connected node at ${rpcUrl} returned genesis hash "${genesisHash}", but expected "${config.expectedGenesisHash}" for environment "${expectedEnvironment}".`
      );
    }
  }

  return { chainName, genesisHash };
}

/**
 * Queries the indexer for its chain identity (genesis block and latest block)
 * and verifies it matches the expected environment and node identity.
 * Compares cryptographic chain identity via GraphQL rather than parsing URLs or hostnames.
 */
export async function validateIndexerNetworkIdentity(
  indexerUrl: string,
  expectedEnvironment: NetworkEnvironment,
  nodeGenesisHash?: string,
  fetchFn: typeof fetch = fetch
): Promise<{ height: number; hash: string; genesisHash?: string }> {
  const config = PINNED_NETWORK_CONFIGS[expectedEnvironment];
  const expectedGenesis = nodeGenesisHash || config?.expectedGenesisHash;

  const query = `query IndexerChainIdentity {
    genesis: block(offset: { height: 0 }) { height hash }
    latest: block { height hash }
  }`;

  const res = await fetchFn(indexerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`Failed to query indexer at ${indexerUrl}: HTTP ${res.status} ${res.statusText}`);
  }

  const json: any = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Indexer GraphQL error at ${indexerUrl}: ${json.errors[0].message}`);
  }

  const latestBlock = json?.data?.latest ?? json?.data?.block;
  if (!latestBlock || typeof latestBlock.height !== 'number' || typeof latestBlock.hash !== 'string') {
    throw new Error(`Indexer at ${indexerUrl} returned invalid block structure: ${JSON.stringify(json)}`);
  }

  const indexerGenesisHash: string | undefined = json?.data?.genesis?.hash;
  if (expectedGenesis && indexerGenesisHash) {
    const cleanExpected = expectedGenesis.toLowerCase().replace(/^0x/, '');
    const cleanIndexer = indexerGenesisHash.toLowerCase().replace(/^0x/, '');
    if (cleanIndexer !== cleanExpected) {
      throw new Error(
        `FATAL INDEXER CHAIN MISMATCH: Indexer at ${indexerUrl} reported genesis hash "${indexerGenesisHash}", but expected "${expectedGenesis}" for environment "${expectedEnvironment}". Aborting to prevent cross-network corruption.`
      );
    }
  }

  return {
    height: latestBlock.height,
    hash: latestBlock.hash,
    genesisHash: indexerGenesisHash,
  };
}
