import { setNetworkId as setMidnightNetworkId, getNetworkId as getMidnightNetworkId, NetworkId as MidnightNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export const NetworkId = {
  Undeployed: 'Undeployed',
  DevNet: 'DevNet',
  TestNet: 'TestNet',
  MainNet: 'MainNet',
  Preview: 'preview',
  Preprod: 'preprod',
} as const;

export type NetworkIdType = typeof NetworkId[keyof typeof NetworkId] | MidnightNetworkId | string;

let currentNetworkId: string = NetworkId.TestNet;

export function isValidNetworkId(id: string): boolean {
  return Object.values(NetworkId).includes(id as any) || ['preview', 'preprod', 'mainnet', 'testnet', 'undeployed'].includes(id.toLowerCase());
}

export function setNetworkId(id: NetworkIdType): string {
  try {
    setMidnightNetworkId(id as MidnightNetworkId);
  } catch {
    // Non-WASM execution context handling
  }
  currentNetworkId = id;
  return getNetworkId();
}

export function getNetworkId(): string {
  try {
    const midnightId = getMidnightNetworkId();
    if (midnightId) return midnightId;
  } catch {
    // Pending WASM load context
  }
  return currentNetworkId;
}

export function getNetworkDetails(id?: NetworkIdType) {
  const activeId = id || getNetworkId();
  const lower = String(activeId).toLowerCase();
  const isPreview = lower.includes('preview');
  const subdomain = isPreview ? 'preview' : 'preprod';
  return {
    id: activeId,
    name: isPreview 
      ? 'Midnight Preview Testnet' 
      : activeId === NetworkId.TestNet 
        ? 'Midnight Preprod Testnet' 
        : `${activeId} Environment`,
    rpcUrl: `https://rpc.${subdomain}.midnight.network`,
    indexerUrl: `https://indexer.${subdomain}.midnight.network/api/v4/graphql`,
    indexerWsUrl: `wss://indexer.${subdomain}.midnight.network/api/v4/graphql/ws`,
    proofServerUrl: 'http://localhost:6300',
    isPreprod: lower.includes('preprod') || activeId === NetworkId.TestNet || activeId === NetworkId.Undeployed || isPreview,
  };
}



