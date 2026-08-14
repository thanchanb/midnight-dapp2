import { setNetworkId as setMidnightNetworkId, getNetworkId as getMidnightNetworkId, NetworkId as MidnightNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export const NetworkId = {
  Undeployed: 'Undeployed',
  DevNet: 'DevNet',
  TestNet: 'TestNet',
  MainNet: 'MainNet',
} as const;

export type NetworkIdType = typeof NetworkId[keyof typeof NetworkId] | MidnightNetworkId;

let currentNetworkId: string = NetworkId.Undeployed;

export function setNetworkId(id: NetworkIdType): void {
  try {
    setMidnightNetworkId(id);
  } catch {
    // Fallback if WASM runtime context is uninitialized
  }
  currentNetworkId = id;
}

export function getNetworkId(): string {
  try {
    return getMidnightNetworkId();
  } catch {
    return currentNetworkId;
  }
}
