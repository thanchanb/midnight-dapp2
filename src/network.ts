import { setNetworkId as setMidnightNetworkId, getNetworkId as getMidnightNetworkId, NetworkId as MidnightNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export const NetworkId = {
  Undeployed: 'Undeployed',
  DevNet: 'DevNet',
  TestNet: 'TestNet',
  MainNet: 'MainNet',
} as const;

export type NetworkIdType = typeof NetworkId[keyof typeof NetworkId] | MidnightNetworkId;

let currentNetworkId: string = NetworkId.Undeployed;

export function setNetworkId(id: NetworkIdType): string {
  try {
    setMidnightNetworkId(id as MidnightNetworkId);
  } catch {
    // Fallback in case of non-standard environment
  }
  currentNetworkId = id;
  return getNetworkId();
}

export function getNetworkId(): string {
  try {
    const midnightId = getMidnightNetworkId();
    if (midnightId) return midnightId;
  } catch {
    // Fallback if WASM context not initialized
  }
  return currentNetworkId;
}

