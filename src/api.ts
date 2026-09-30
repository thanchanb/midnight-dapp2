import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  AuctionState,
  ledger,
  type Ledger,
  type Witnesses
} from '../managed/contract/index.js';

export { AuctionState, Contract, ledger, type Ledger, type Witnesses };

/**
 * Encodes an ASCII/UTF-8 string into a 32-byte right-padded Uint8Array matching Compact pad(32, str).
 */
export function encodePaddedString(str: string, length: number = 32): Uint8Array {
  const result = new Uint8Array(length);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  result.set(bytes.subarray(0, length));
  return result;
}

const VECTOR_2_BYTES32 = new compactRuntime.CompactTypeVector(
  2,
  new compactRuntime.CompactTypeBytes(32)
);

export const AUCTION_DOMAIN_SEPARATOR = encodePaddedString('midnight.auction.identity', 32);

/**
 * Derives a party's on-chain public identity from a secret key using Midnight's
 * documented domain-separated witness pattern:
 * persistentHash([pad(32, "midnight.auction.identity"), secretKey])
 */
export function derivePartyIdentity(secretKey: Uint8Array): Uint8Array {
  if (secretKey.length !== 32) throw new Error('Secret key must be exactly 32 bytes.');
  return compactRuntime.persistentHash(VECTOR_2_BYTES32, [
    AUCTION_DOMAIN_SEPARATOR,
    secretKey,
  ]);
}

/**
 * Generates secure, non-deterministic 32-byte cryptographic random values in ephemeral memory.
 * Never uses fixed seeds or fallback defaults.
 */
export function generateRandomBytes(length: number = 32): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

export interface WitnessConfig {
  secretKey?: Uint8Array;
}

/**
 * Builds contract witnesses from local, secure private states in client prover memory.
 * Uses a single secretKey() witness for cryptographic identity derivation.
 */
export function createWitnesses<PS = any>(config: WitnessConfig = {}): Witnesses<PS> {
  const emptyKey = new Uint8Array(32);
  return {
    secretKey: (context) => [context.privateState, config.secretKey || emptyKey],
  };
}

/**
 * Validates that an environment variable is defined and non-empty, throwing immediately if missing.
 */
export function requireEnv(name: string): string {
  const val = typeof process !== 'undefined' && process.env ? process.env[name] : undefined;
  if (!val || val.trim() === '') {
    throw new Error(
      `Missing required environment variable "${name}". Fail-fast security policy strictly forbids fallback defaults. Please configure it in .env or your environment.`
    );
  }
  return val.trim();
}

/**
 * Validates user-submitted bid inputs prior to proof generation.
 */
export function validateBidFormInputs(bidAmountStr: string, refundAddressStr: string): { amount: bigint; address: string } {
  if (!bidAmountStr || bidAmountStr.trim() === '') {
    throw new Error('Bid amount cannot be empty.');
  }
  const amount = BigInt(bidAmountStr.trim());
  if (amount <= 0n) {
    throw new Error('Bid amount must be strictly greater than zero.');
  }
  if (!refundAddressStr || refundAddressStr.trim() === '') {
    throw new Error('Bidder refund payout address is required.');
  }
  const cleanAddr = refundAddressStr.trim();
  if (cleanAddr.length < 10) {
    throw new Error('Invalid payout address format: address is too short.');
  }
  return { amount, address: cleanAddr };
}

