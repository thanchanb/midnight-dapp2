import { setNetworkId as setMidnightNetworkId, getNetworkId as getMidnightNetworkId, NetworkId as MidnightNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export const NetworkId = {
  Undeployed: 'Undeployed',
  DevNet: 'DevNet',
  TestNet: 'TestNet',
  MainNet: 'MainNet',
} as const;

export type NetworkIdType = typeof NetworkId[keyof typeof NetworkId] | MidnightNetworkId;

let currentNetworkId: string = NetworkId.TestNet;

export function isValidNetworkId(id: string): boolean {
  return Object.values(NetworkId).includes(id as any);
}

export function setNetworkId(id: NetworkIdType): string {
  try {
    setMidnightNetworkId(id as MidnightNetworkId);
  } catch {
    // Fallback in case of browser/non-WASM execution context
  }
  currentNetworkId = id;
  return getNetworkId();
}

export function getNetworkId(): string {
  try {
    const midnightId = getMidnightNetworkId();
    if (midnightId) return midnightId;
  } catch {
    // Fallback if WASM context is not loaded yet
  }
  return currentNetworkId;
}

export function getNetworkDetails(id?: NetworkIdType) {
  const activeId = id || getNetworkId();
  return {
    id: activeId,
    name: activeId === NetworkId.TestNet ? 'Midnight Preprod Testnet' : `${activeId} Environment`,
    rpcUrl: 'https://rpc.preprod.midnight.network',
    isPreprod: activeId === NetworkId.TestNet || activeId === NetworkId.Undeployed,
  };
}


