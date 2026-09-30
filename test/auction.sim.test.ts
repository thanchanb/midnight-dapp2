import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { Contract, AuctionState, ledger, type Ledger, type Witnesses } from '../managed/contract/index.js';
import {
  derivePartyIdentity,
  generateRandomBytes,
  createWitnesses,
} from '../src/api.js';

describe('Midnight ShadowVault Contract Simulator Suite (*.sim.test.ts) [Off-chain]', () => {
  const test = it;

const testCoinPublicKey = '00'.repeat(32);
const testContractAddress = '00'.repeat(32);

const sellerSecret = generateRandomBytes(32);
const sellerId = derivePartyIdentity(sellerSecret);
const sellerPayoutAddress = generateRandomBytes(32);

const bidder1Secret = generateRandomBytes(32);
const bidder1Id = derivePartyIdentity(bidder1Secret);
const bidder1RefundAddress = generateRandomBytes(32);

const bidder2Secret = generateRandomBytes(32);
const bidder2Id = derivePartyIdentity(bidder2Secret);
const bidder2RefundAddress = generateRandomBytes(32);

const testItem = generateRandomBytes(32);
const reservePrice = 5000n;
const simulatedDeadline = 1000n; // Epoch seconds

function makeSimulatedContext(state: any, simulatedTimestampSeconds: bigint) {
  return compactRuntime.createCircuitContext(
    testContractAddress,
    testCoinPublicKey,
    state,
    {},
    undefined,
    undefined,
    Number(simulatedTimestampSeconds)
  );
}

test('SIM-1: Constructor initializes Active state with simulated deadline', () => {
  const contract = new Contract(createWitnesses({ secretKey: sellerSecret }));
  const ctorCtx = compactRuntime.createConstructorContext({}, testCoinPublicKey);
  const init = contract.initialState(ctorCtx, testItem, 1n, sellerPayoutAddress, reservePrice, simulatedDeadline);
  const l = ledger(init.currentContractState.data);

  assert.equal(l.state, AuctionState.Active);
  assert.equal(l.deadline, simulatedDeadline);
  assert.deepEqual(l.seller, sellerId);
});

test('SIM-2: Simulated Bidding Phase before deadline (t=100 and t=200)', () => {
  const sellerContract = new Contract(createWitnesses({ secretKey: sellerSecret }));
  const ctorCtx = compactRuntime.createConstructorContext({}, testCoinPublicKey);
  const init = sellerContract.initialState(ctorCtx, testItem, 1n, sellerPayoutAddress, reservePrice, simulatedDeadline);

  const bidder1Contract = new Contract(createWitnesses({ secretKey: bidder1Secret }));
  const bidder2Contract = new Contract(createWitnesses({ secretKey: bidder2Secret }));

  // Bid 1 at simulated t=100
  const ctx1 = makeSimulatedContext(init.currentContractState.data, 100n);
  const res1 = bidder1Contract.circuits.placeBid(ctx1, 6000n, bidder1RefundAddress);
  let l = ledger(res1.context.currentQueryContext.state);
  assert.equal(l.highestBid, 6000n);
  assert.deepEqual(l.highestBidder, bidder1Id);

  // Bid 2 at simulated t=200
  const ctx2 = makeSimulatedContext(res1.context.currentQueryContext.state, 200n);
  const res2 = bidder2Contract.circuits.placeBid(ctx2, 8500n, bidder2RefundAddress);
  l = ledger(res2.context.currentQueryContext.state);
  assert.equal(l.highestBid, 8500n);
  assert.deepEqual(l.highestBidder, bidder2Id);
  assert.equal(l.pendingRefunds.lookup(bidder1Id), 6000n);
});

test('SIM-3: Early end rejection at simulated t=500 (< 1000)', () => {
  const sellerContract = new Contract(createWitnesses({ secretKey: sellerSecret }));
  const ctorCtx = compactRuntime.createConstructorContext({}, testCoinPublicKey);
  const init = sellerContract.initialState(ctorCtx, testItem, 1n, sellerPayoutAddress, reservePrice, simulatedDeadline);

  const bidder1Contract = new Contract(createWitnesses({ secretKey: bidder1Secret }));
  const ctx1 = makeSimulatedContext(init.currentContractState.data, 100n);
  const res1 = bidder1Contract.circuits.placeBid(ctx1, 6000n, bidder1RefundAddress);

  // Try ending early at simulated t=500
  const ctxEarly = makeSimulatedContext(res1.context.currentQueryContext.state, 500n);
  assert.throws(
    () => bidder1Contract.circuits.endAuction(ctxEarly),
    /Cannot end auction before bidding deadline has passed/
  );
});

test('SIM-4: Clock reaches simulated deadline (t=1000) -> Permissionless End & Settle', () => {
  const sellerContract = new Contract(createWitnesses({ secretKey: sellerSecret }));
  const ctorCtx = compactRuntime.createConstructorContext({}, testCoinPublicKey);
  const init = sellerContract.initialState(ctorCtx, testItem, 1n, sellerPayoutAddress, reservePrice, simulatedDeadline);

  const bidder1Contract = new Contract(createWitnesses({ secretKey: bidder1Secret }));
  const bidder2Contract = new Contract(createWitnesses({ secretKey: bidder2Secret }));
  const crankContract = new Contract(createWitnesses({ secretKey: generateRandomBytes(32) }));

  const res1 = bidder1Contract.circuits.placeBid(makeSimulatedContext(init.currentContractState.data, 100n), 6000n, bidder1RefundAddress);
  const res2 = bidder2Contract.circuits.placeBid(makeSimulatedContext(res1.context.currentQueryContext.state, 200n), 8500n, bidder2RefundAddress);

  // End at simulated t=1000
  const ctxEnd = makeSimulatedContext(res2.context.currentQueryContext.state, 1000n);
  const resEnd = crankContract.circuits.endAuction(ctxEnd);
  let l = ledger(resEnd.context.currentQueryContext.state);
  assert.equal(l.state, AuctionState.Ended);

  // Settle at simulated t=1001
  const ctxSettle = makeSimulatedContext(resEnd.context.currentQueryContext.state, 1001n);
  const resSettle = crankContract.circuits.settleAuction(ctxSettle);
  l = ledger(resSettle.context.currentQueryContext.state);
  assert.equal(l.state, AuctionState.Settled);
});
});
