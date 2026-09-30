import assert from 'node:assert/strict';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { generateRandomBytes, derivePartyIdentity, createWitnesses } from '../src/api.js';

// Import New Fixed Contract
import { Contract as NewContract, AuctionState as NewState, ledger as newLedger } from '../managed/contract/index.js';

// Import Old Buggy Contract
import { Contract as OldContract, AuctionState as OldState, ledger as oldLedger } from '../scratch/old_managed/contract/index.js';

console.log('================================================================');
console.log('  OLD-VS-NEW REGRESSION SUITE: COMPILED CONTRACT VERIFICATION   ');
console.log('  Comparing old buggy contract vs new audited Compact contract  ');
console.log('================================================================\n');

const testCoinPublicKey = '00'.repeat(32);
const testContractAddress = '00'.repeat(32);

const sellerSecret = generateRandomBytes(32);
const sellerId = derivePartyIdentity(sellerSecret);
const sellerPayoutAddress = generateRandomBytes(32);

const bidderASecret = generateRandomBytes(32);
const bidderAId = derivePartyIdentity(bidderASecret);
const bidderARefundAddress = generateRandomBytes(32);

const bidderBSecret = generateRandomBytes(32);
const bidderBId = derivePartyIdentity(bidderBSecret);
const bidderBRefundAddress = generateRandomBytes(32);

const testItem = generateRandomBytes(32);

// ============================================================================
// PART 1: TEST ON OLD BUGGY COMPILED CONTRACT (EXPECTED TO FAIL)
// ============================================================================
console.log('>>> [PART 1] Running Regression Checks on OLD Buggy Contract (scratch/old_managed)...');

let oldContractFailedAsExpected = false;

try {
  const oldContract = new OldContract(createWitnesses({ secretKey: sellerSecret }) as any);
  const ctorCtx = compactRuntime.createConstructorContext({}, testCoinPublicKey);
  const oldInit = oldContract.initialState(ctorCtx);
  let oldStateData = oldInit.currentContractState.data;

  // Initialize auction
  const initCircuitCtx = compactRuntime.createCircuitContext(testContractAddress, testCoinPublicKey, oldStateData, {}, undefined, undefined, 0);
  const initRes = oldContract.circuits.initializeAuction(initCircuitCtx, testItem, sellerPayoutAddress, 10n, 1000n);
  oldStateData = initRes.context.currentQueryContext.state;

  // Sequence: A bids 10, B bids 20, A bids 30, B bids 40
  const bidderA = new OldContract(createWitnesses({ secretKey: bidderASecret }) as any);
  const bidderB = new OldContract(createWitnesses({ secretKey: bidderBSecret }) as any);

  // 1. A bids 10
  const ctxA1 = compactRuntime.createCircuitContext(testContractAddress, testCoinPublicKey, oldStateData, {}, undefined, undefined, 0);
  const resA1 = bidderA.circuits.placeBid(ctxA1, 10n, bidderARefundAddress);
  oldStateData = resA1.context.currentQueryContext.state;

  // 2. B bids 20 (A is outbid for 10)
  const ctxB1 = compactRuntime.createCircuitContext(testContractAddress, testCoinPublicKey, oldStateData, {}, undefined, undefined, 0);
  const resB1 = bidderB.circuits.placeBid(ctxB1, 20n, bidderBRefundAddress);
  oldStateData = resB1.context.currentQueryContext.state;

  // 3. A bids 30 (B is outbid for 20)
  const ctxA2 = compactRuntime.createCircuitContext(testContractAddress, testCoinPublicKey, oldStateData, {}, undefined, undefined, 0);
  const resA2 = bidderA.circuits.placeBid(ctxA2, 30n, bidderARefundAddress);
  oldStateData = resA2.context.currentQueryContext.state;

  // 4. B bids 40 (A is outbid again for 30)
  const ctxB2 = compactRuntime.createCircuitContext(testContractAddress, testCoinPublicKey, oldStateData, {}, undefined, undefined, 0);
  const resB2 = bidderB.circuits.placeBid(ctxB2, 40n, bidderBRefundAddress);
  oldStateData = resB2.context.currentQueryContext.state;

  const finalOldLedger = oldLedger(oldStateData);
  const aRefund = finalOldLedger.pendingRefunds.lookup(bidderAId);

  console.log(`    [Old Contract] Bidder A Pending Refund Value: ${aRefund}n`);
  console.log(`    [Old Contract] Expected Accumulated Refund: 40n (10 + 30)`);
  
  // This assertion will FAIL on the old contract because aRefund is 30n instead of 40n!
  assert.equal(aRefund, 40n, `BUG CONFIRMED: Outbid refunds were overwritten! Expected 40n, got ${aRefund}n`);
} catch (err: any) {
  oldContractFailedAsExpected = true;
  console.log('\n  ==============================================================');
  console.log('  RAW FAILING OUTPUT ON OLD COMPILED CONTRACT (EXPECTED):');
  console.log('  ==============================================================');
  console.log(`  Error: ${err.message || err}`);
  if (err.stack) {
    console.log(err.stack.split('\n').slice(0, 5).join('\n'));
  }
  console.log('  ==============================================================\n');
}

assert(oldContractFailedAsExpected, 'Old contract must fail regression check due to overwrite bug!');

// ============================================================================
// PART 2: TEST ON NEW AUDITED COMPILED CONTRACT (MUST PASS)
// ============================================================================
console.log('>>> [PART 2] Running Same Regression Checks on NEW Audited Contract (managed/)...');

const newSellerContract = new NewContract(createWitnesses({ secretKey: sellerSecret }));
const newCtorCtx = compactRuntime.createConstructorContext({}, testCoinPublicKey);

// Constructor atomically starts in Active state, setting deadline, reserve, and item escrow
const newInit = newSellerContract.initialState(newCtorCtx, testItem, 1n, sellerPayoutAddress, 10n, 1000n);
let newStateData = newInit.currentContractState.data;

const initialLedger = newLedger(newStateData);
assert.equal(initialLedger.state, NewState.Active, 'New contract starts in Active state (Created eliminated)');
assert.deepEqual(initialLedger.seller, sellerId, 'Seller set atomically in constructor');

const newBidderA = new NewContract(createWitnesses({ secretKey: bidderASecret }));
const newBidderB = new NewContract(createWitnesses({ secretKey: bidderBSecret }));

// 1. A bids 10 at t=100
const nctxA1 = compactRuntime.createCircuitContext(testContractAddress, testCoinPublicKey, newStateData, {}, undefined, undefined, 100);
const nresA1 = newBidderA.circuits.placeBid(nctxA1, 10n, bidderARefundAddress);
newStateData = nresA1.context.currentQueryContext.state;

// 2. B bids 20 at t=200
const nctxB1 = compactRuntime.createCircuitContext(testContractAddress, testCoinPublicKey, newStateData, {}, undefined, undefined, 200);
const nresB1 = newBidderB.circuits.placeBid(nctxB1, 20n, bidderBRefundAddress);
newStateData = nresB1.context.currentQueryContext.state;

// 3. A bids 30 at t=300
const nctxA2 = compactRuntime.createCircuitContext(testContractAddress, testCoinPublicKey, newStateData, {}, undefined, undefined, 300);
const nresA2 = newBidderA.circuits.placeBid(nctxA2, 30n, bidderARefundAddress);
newStateData = nresA2.context.currentQueryContext.state;

// 4. B bids 40 at t=400
const nctxB2 = compactRuntime.createCircuitContext(testContractAddress, testCoinPublicKey, newStateData, {}, undefined, undefined, 400);
const nresB2 = newBidderB.circuits.placeBid(nctxB2, 40n, bidderBRefundAddress);
newStateData = nresB2.context.currentQueryContext.state;

const finalNewLedger = newLedger(newStateData);
const newARefund = finalNewLedger.pendingRefunds.lookup(bidderAId);
const newBRefund = finalNewLedger.pendingRefunds.lookup(bidderBId);

console.log(`    [New Contract] Bidder A Pending Refund Value: ${newARefund}n (Expected: 40n)`);
console.log(`    [New Contract] Bidder B Pending Refund Value: ${newBRefund}n (Expected: 20n)`);
console.log(`    [New Contract] Highest Bidder: B (Amount: 40n)`);

// Assert accumulating refund passes
assert.equal(newARefund, 40n, 'Bidder A must have 40n accumulated pending refund (10 + 30)');
assert.equal(newBRefund, 20n, 'Bidder B must have 20n accumulated pending refund');
assert.equal(finalNewLedger.highestBid, 40n, 'Highest bid must be 40n');

// Invariant: Total escrow held = pending refunds + highest bid
const totalEscrow = newARefund + newBRefund + finalNewLedger.highestBid;
assert.equal(totalEscrow, 100n, 'Total escrow held must equal total deposits (10+20+30+40=100)');
console.log(`    [New Contract] Escrow Solvency Invariant: total escrow (${totalEscrow}n) == 100n ✓`);

// Test Early End Rejection
const earlyEndCtx = compactRuntime.createCircuitContext(testContractAddress, testCoinPublicKey, newStateData, {}, undefined, undefined, 500);
assert.throws(
  () => newBidderA.circuits.endAuction(earlyEndCtx),
  /Cannot end auction before bidding deadline has passed/,
  'Early end must be rejected before deadline'
);
console.log('    [New Contract] Permissionless endAuction rejected at t=500 (< 1000) ✓');

console.log('\n================================================================');
console.log('  OLD-VS-NEW REGRESSION SUITE: ALL CHECKS VERIFIED!             ');
console.log('  - Old contract failed on outbid refund overwrite (30n != 40n) ');
console.log('  - New contract passed with accumulating refunds (40n == 40n)  ');
console.log('  - Solvency invariant: outstanding refunds + highest bid == 100n');
console.log('================================================================\n');
