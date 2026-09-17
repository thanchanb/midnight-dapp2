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
  return {
    id: activeId,
    name: activeId === NetworkId.TestNet ? 'Midnight Preprod Testnet' : `${activeId} Environment`,
    rpcUrl: 'https://rpc.preprod.midnight.network',
    indexerUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWsUrl: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    proofServerUrl: 'http://localhost:6300',
    isPreprod: activeId === NetworkId.TestNet || activeId === NetworkId.Undeployed,
  };
}



