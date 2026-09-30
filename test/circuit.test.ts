import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { Contract, AuctionState, ledger, type Ledger, type Witnesses } from '../managed/contract/index.js';
import {
  derivePartyIdentity,
  generateRandomBytes,
  createWitnesses,
} from '../src/api.js';

describe('Midnight ShadowVault [Off-chain Circuit Test Suite]', () => {
  const test = it;

const testCoinPublicKey = '00'.repeat(32);
const testContractAddress = '00'.repeat(32);

// Test identities
const sellerSecret = generateRandomBytes(32);
const sellerId = derivePartyIdentity(sellerSecret);
const sellerPayoutAddress = generateRandomBytes(32);

const bidderASecret = generateRandomBytes(32);
const bidderAId = derivePartyIdentity(bidderASecret);
const bidderARefundAddress = generateRandomBytes(32);

const bidderBSecret = generateRandomBytes(32);
const bidderBId = derivePartyIdentity(bidderBSecret);
const bidderBRefundAddress = generateRandomBytes(32);

const bidderCSecret = generateRandomBytes(32);
const bidderCId = derivePartyIdentity(bidderCSecret);
const bidderCRefundAddress = generateRandomBytes(32);

const randomCallerSecret = generateRandomBytes(32);

const testItem = generateRandomBytes(32);
const defaultItemAmount = 1n;
const defaultReserve = 1000n;
const defaultDeadline = 500n; // Epoch seconds

function helperCreateAuction(
  deadline: bigint = defaultDeadline,
  reserve: bigint = defaultReserve,
  itemAmount: bigint = defaultItemAmount,
  customSellerSecret: Uint8Array = sellerSecret
) {
  const contract = new Contract(createWitnesses({ secretKey: customSellerSecret }));
  const ctorCtx = compactRuntime.createConstructorContext({}, testCoinPublicKey);
  const init = contract.initialState(ctorCtx, testItem, itemAmount, sellerPayoutAddress, reserve, deadline);
  return { contract, state: init.currentContractState.data };
}

function helperContext(state: any, time: bigint = 100n) {
  return compactRuntime.createCircuitContext(
    testContractAddress,
    testCoinPublicKey,
    state,
    {},
    undefined,
    undefined,
    Number(time)
  );
}

function getPendingRefund(l: Ledger, bidderId: Uint8Array): bigint {
  return l.pendingRefunds.member(bidderId) ? l.pendingRefunds.lookup(bidderId) : 0n;
}

// ----------------------------------------------------------------------------
// 1. Initial State & Enum Mapping (Req 1, 4)
// ----------------------------------------------------------------------------
test('[Off-chain] 1A. Initial State: Constructor sets Active & escrows item if itemAmount > 0', () => {
  assert.equal(AuctionState.Active, 0);
  assert.equal(AuctionState.Ended, 1);
  assert.equal(AuctionState.Settled, 2);
  assert.equal(AuctionState.Cancelled, 3);

  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const l = ledger(state);

  assert.equal(l.state, AuctionState.Active, 'Contract must initialize directly to Active');
  assert.deepEqual(l.item, testItem);
  assert.equal(l.itemAmount, 1n);
  assert.equal(l.itemDeposited, true, 'Item should be marked deposited');
  assert.deepEqual(l.seller, sellerId);
  assert.deepEqual(l.sellerRecipientAddress, sellerPayoutAddress);
  assert.equal(l.reservePrice, 1000n);
  assert.equal(l.deadline, 500n);
  assert.equal(l.highestBid, 0n);
  assert.equal(l.totalBids, 0n);
  assert.equal(l.totalRefundsClaimed, 0n);
  assert.equal(l.sellerFundsClaimed, false);
  assert.equal(l.sellerItemReclaimed, false);
  assert.equal(l.winnerItemClaimed, false);
});

test('[Off-chain] 1B. Initial State: Constructor with itemAmount == 0 leaves itemDeposited = false', () => {
  const { state } = helperCreateAuction(500n, 1000n, 0n);
  const l = ledger(state);
  assert.equal(l.itemDeposited, false);
  assert.equal(l.itemAmount, 0n);
});

// ----------------------------------------------------------------------------
// 2. Constructor Front-Running & Parameter Protection (Req 4)
// ----------------------------------------------------------------------------
test('[Off-chain] 2A. Constructor rejects deadline == 0', () => {
  const contract = new Contract(createWitnesses({ secretKey: sellerSecret }));
  const ctorCtx = compactRuntime.createConstructorContext({}, testCoinPublicKey);
  assert.throws(
    () => contract.initialState(ctorCtx, testItem, 1n, sellerPayoutAddress, defaultReserve, 0n),
    /Deadline must be greater than zero/,
    'Constructor must enforce positive deadline'
  );
});

test('[Off-chain] 2B. Constructor atomically binds seller identity preventing front-running', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const l = ledger(state);
  assert.deepEqual(l.seller, sellerId, 'Seller must be bound at construction time');
  const imposter = new Contract(createWitnesses({ secretKey: randomCallerSecret }));
  const ctx = helperContext(state, 100n);
  assert.throws(
    () => imposter.circuits.cancelAuction(ctx),
    /Unauthorized: Caller is not the auction seller/
  );
});

// ----------------------------------------------------------------------------
// 3. Item Deposit Circuit (Step 3)
// ----------------------------------------------------------------------------
test('[Off-chain] 3A. depositItem: Seller deposits item after zero-deposit construction', () => {
  const { contract: sellerContract, state } = helperCreateAuction(500n, 1000n, 0n);
  const ctx = helperContext(state, 50n);
  const newItem = generateRandomBytes(32);
  const res = sellerContract.circuits.depositItem(ctx, newItem, 5n);
  const l = ledger(res.context.currentQueryContext.state);
  assert.equal(l.itemDeposited, true);
  assert.equal(l.itemAmount, 5n);
  assert.deepEqual(l.item, newItem);
});

test('[Off-chain] 3B. depositItem: Non-seller cannot deposit item', () => {
  const { state } = helperCreateAuction(500n, 1000n, 0n);
  const imposter = new Contract(createWitnesses({ secretKey: randomCallerSecret }));
  const ctx = helperContext(state, 50n);
  assert.throws(
    () => imposter.circuits.depositItem(ctx, testItem, 1n),
    /Unauthorized: Caller is not the auction seller/
  );
});

test('[Off-chain] 3C. depositItem: Double deposit is strictly rejected', () => {
  const { contract: sellerContract, state } = helperCreateAuction(500n, 1000n, 1n);
  const ctx = helperContext(state, 50n);
  assert.throws(
    () => sellerContract.circuits.depositItem(ctx, testItem, 1n),
    /Item has already been deposited into escrow/
  );
});

test('[Off-chain] 3D. depositItem: Reject zero amount deposit', () => {
  const { contract: sellerContract, state } = helperCreateAuction(500n, 1000n, 0n);
  const ctx = helperContext(state, 50n);
  assert.throws(
    () => sellerContract.circuits.depositItem(ctx, testItem, 0n),
    /Item deposit amount must be greater than zero/
  );
});

// ----------------------------------------------------------------------------
// 4. Block-Time Deadline & Bidding Validation (Req 1, 3a, 3b)
// ----------------------------------------------------------------------------
test('[Off-chain] 4A. placeBid succeeds before deadline when item is deposited', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));

  const ctx = helperContext(state, 100n);
  const res = bidderA.circuits.placeBid(ctx, 1500n, bidderARefundAddress);
  const l = ledger(res.context.currentQueryContext.state);

  assert.equal(l.highestBid, 1500n);
  assert.deepEqual(l.highestBidder, bidderAId);
  assert.deepEqual(l.highestBidderRecipient, bidderARefundAddress);
  assert.equal(l.totalBids, 1n);
});

test('[Off-chain] 4B. placeBid strictly fails if item is NOT deposited', () => {
  const { state } = helperCreateAuction(500n, 1000n, 0n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const ctx = helperContext(state, 100n);
  assert.throws(
    () => bidderA.circuits.placeBid(ctx, 1500n, bidderARefundAddress),
    /Item must be deposited into escrow before bidding can start/
  );
});

test('[Off-chain] 4C. placeBid strictly fails at or after deadline (block time >= deadline)', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));

  const ctxAtDeadline = helperContext(state, 500n);
  assert.throws(
    () => bidderA.circuits.placeBid(ctxAtDeadline, 1500n, bidderARefundAddress),
    /Bidding deadline has passed/
  );

  const ctxAfterDeadline = helperContext(state, 600n);
  assert.throws(
    () => bidderA.circuits.placeBid(ctxAfterDeadline, 1500n, bidderARefundAddress),
    /Bidding deadline has passed/
  );
});

test('[Off-chain] 4D. Regression (a): Random caller CANNOT end bidding early', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const randomCaller = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  const ctx = helperContext(state, 200n);
  assert.throws(
    () => randomCaller.circuits.endAuction(ctx),
    /Cannot end auction before bidding deadline has passed/
  );
});

test('[Off-chain] 4E. Regression (b): Seller CANNOT end bidding early (even after bids)', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const seller = new Contract(createWitnesses({ secretKey: sellerSecret }));

  const ctxBid = helperContext(state, 100n);
  const resBid = bidderA.circuits.placeBid(ctxBid, 1500n, bidderARefundAddress);

  const ctxEnd = helperContext(resBid.context.currentQueryContext.state, 250n);
  assert.throws(
    () => seller.circuits.endAuction(ctxEnd),
    /Cannot end auction before bidding deadline has passed/
  );
});

test('[Off-chain] 4F. endAuction is permissionless once deadline has passed', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const randomCaller = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  const ctxBid = helperContext(state, 100n);
  const resBid = bidderA.circuits.placeBid(ctxBid, 1500n, bidderARefundAddress);

  const ctxEnd = helperContext(resBid.context.currentQueryContext.state, 500n);
  const resEnd = randomCaller.circuits.endAuction(ctxEnd);
  const l = ledger(resEnd.context.currentQueryContext.state);

  assert.equal(l.state, AuctionState.Ended, 'State must transition to Ended');
});

test('[Off-chain] 4G. settleAuction is permissionless after Ended', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const randomCrank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  const ctxBid = helperContext(state, 100n);
  const resBid = bidderA.circuits.placeBid(ctxBid, 1500n, bidderARefundAddress);

  const ctxEnd = helperContext(resBid.context.currentQueryContext.state, 501n);
  const resEnd = randomCrank.circuits.endAuction(ctxEnd);

  const ctxSettle = helperContext(resEnd.context.currentQueryContext.state, 502n);
  const resSettle = randomCrank.circuits.settleAuction(ctxSettle);
  const l = ledger(resSettle.context.currentQueryContext.state);

  assert.equal(l.state, AuctionState.Settled, 'State must transition to Settled');
});

// ----------------------------------------------------------------------------
// 5. Accumulating Outbid Refunds (Req 2)
// ----------------------------------------------------------------------------
test('[Off-chain] 5. Accumulating Refunds: Sequence A=10, B=20, A=30, B=40 accumulates A to 40', () => {
  const { state } = helperCreateAuction(500n, 10n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const bidderB = new Contract(createWitnesses({ secretKey: bidderBSecret }));

  // Step 1: A bids 10 at t=100
  const ctx1 = helperContext(state, 100n);
  const res1 = bidderA.circuits.placeBid(ctx1, 10n, bidderARefundAddress);
  let l = ledger(res1.context.currentQueryContext.state);
  assert.equal(l.highestBid, 10n);
  assert.deepEqual(l.highestBidder, bidderAId);
  assert.equal(getPendingRefund(l, bidderAId), 0n);

  // Step 2: B bids 20 at t=105 -> A is outbid by 10
  const ctx2 = helperContext(res1.context.currentQueryContext.state, 105n);
  const res2 = bidderB.circuits.placeBid(ctx2, 20n, bidderBRefundAddress);
  l = ledger(res2.context.currentQueryContext.state);
  assert.equal(l.highestBid, 20n);
  assert.deepEqual(l.highestBidder, bidderBId);
  assert.equal(getPendingRefund(l, bidderAId), 10n);

  // Step 3: A bids 30 at t=110 -> B is outbid by 20; A's pending refund remains 10
  const ctx3 = helperContext(res2.context.currentQueryContext.state, 110n);
  const res3 = bidderA.circuits.placeBid(ctx3, 30n, bidderARefundAddress);
  l = ledger(res3.context.currentQueryContext.state);
  assert.equal(l.highestBid, 30n);
  assert.deepEqual(l.highestBidder, bidderAId);
  assert.equal(getPendingRefund(l, bidderAId), 10n);
  assert.equal(getPendingRefund(l, bidderBId), 20n);

  // Step 4: B bids 40 at t=115 -> A is outbid by 30!
  // A's refund accumulates: 10 + 30 = 40!
  const ctx4 = helperContext(res3.context.currentQueryContext.state, 115n);
  const res4 = bidderB.circuits.placeBid(ctx4, 40n, bidderBRefundAddress);
  l = ledger(res4.context.currentQueryContext.state);
  assert.equal(l.highestBid, 40n);
  assert.deepEqual(l.highestBidder, bidderBId);

  const aRefund = getPendingRefund(l, bidderAId);
  assert.equal(aRefund, 40n, "A's total withdrawable MUST be 40 (10 + 30 accumulated, not overwritten!)");

  const bRefund = getPendingRefund(l, bidderBId);
  assert.equal(bRefund, 20n);

  // Contract escrow accounting check:
  // Total deposited: 10 + 20 + 30 + 40 = 100
  // Outstanding claims: highestBid (40) + A refund (40) + B refund (20) = 100
  const totalEscrowClaims = l.highestBid + aRefund + bRefund;
  assert.equal(totalEscrowClaims, 100n);

  // Step 5: A withdraws refund of 40
  const ctxWithdrawA = helperContext(res4.context.currentQueryContext.state, 120n);
  const resWithdrawA = bidderA.circuits.withdrawRefund(ctxWithdrawA, bidderARefundAddress);
  l = ledger(resWithdrawA.context.currentQueryContext.state);
  assert.equal(getPendingRefund(l, bidderAId), 0n);
  assert.equal(l.totalRefundsClaimed, 1n);

  // A double withdrawal must fail
  const ctxWithdrawA2 = helperContext(resWithdrawA.context.currentQueryContext.state, 121n);
  assert.throws(
    () => bidderA.circuits.withdrawRefund(ctxWithdrawA2, bidderARefundAddress),
    /Refund amount must be greater than zero/
  );
});

// ----------------------------------------------------------------------------
// 6. Bid Validation Rules (Req 1, 5)
// ----------------------------------------------------------------------------
test('[Off-chain] 6A. Seller cannot bid on their own auction', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const seller = new Contract(createWitnesses({ secretKey: sellerSecret }));
  const ctx = helperContext(state, 100n);

  assert.throws(
    () => seller.circuits.placeBid(ctx, 2000n, sellerPayoutAddress),
    /Seller cannot bid on their own auction/
  );
});

test('[Off-chain] 6B. Bid below reserve price is rejected', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const ctx = helperContext(state, 100n);

  assert.throws(
    () => bidderA.circuits.placeBid(ctx, 999n, bidderARefundAddress),
    /Bid amount is below the reserve price/
  );
});

test('[Off-chain] 6C. Bid equal to or below current highest bid is rejected', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const bidderB = new Contract(createWitnesses({ secretKey: bidderBSecret }));

  const ctx1 = helperContext(state, 100n);
  const res1 = bidderA.circuits.placeBid(ctx1, 2000n, bidderARefundAddress);

  const ctx2 = helperContext(res1.context.currentQueryContext.state, 101n);
  assert.throws(
    () => bidderB.circuits.placeBid(ctx2, 2000n, bidderBRefundAddress),
    /Bid amount must strictly exceed current highest bid/
  );

  assert.throws(
    () => bidderB.circuits.placeBid(ctx2, 1999n, bidderBRefundAddress),
    /Bid amount must strictly exceed current highest bid/
  );
});

// ----------------------------------------------------------------------------
// 7. Seller Cancellation & Item Return (Step 3)
// ----------------------------------------------------------------------------
test('[Off-chain] 7A. Seller cancels auction before bids: returns item and sets Cancelled', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const seller = new Contract(createWitnesses({ secretKey: sellerSecret }));
  const ctx = helperContext(state, 100n);

  const res = seller.circuits.cancelAuction(ctx);
  const l = ledger(res.context.currentQueryContext.state);
  assert.equal(l.state, AuctionState.Cancelled);
  assert.equal(l.itemDeposited, false, 'Item must be returned to seller upon cancellation');
});

test('[Off-chain] 7B. Seller CANNOT cancel auction once bids have been submitted', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const seller = new Contract(createWitnesses({ secretKey: sellerSecret }));

  const ctxBid = helperContext(state, 100n);
  const resBid = bidderA.circuits.placeBid(ctxBid, 1500n, bidderARefundAddress);

  const ctxCancel = helperContext(resBid.context.currentQueryContext.state, 110n);
  assert.throws(
    () => seller.circuits.cancelAuction(ctxCancel),
    /Cannot cancel auction after bids have been submitted/
  );
});

test('[Off-chain] 7C. Non-seller cannot cancel auction', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const randomCaller = new Contract(createWitnesses({ secretKey: randomCallerSecret }));
  const ctx = helperContext(state, 100n);

  assert.throws(
    () => randomCaller.circuits.cancelAuction(ctx),
    /Unauthorized: Caller is not the auction seller/
  );
});

// ----------------------------------------------------------------------------
// 8. Zero-Bid Settlement & Item Reclaim (Step 3)
// ----------------------------------------------------------------------------
test('[Off-chain] 8A. Zero-bid auction: Seller reclaims unsold item after settlement', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));
  const seller = new Contract(createWitnesses({ secretKey: sellerSecret }));

  // End and settle with 0 bids
  const ctxEnd = helperContext(state, 501n);
  const resEnd = crank.circuits.endAuction(ctxEnd);
  const ctxSettle = helperContext(resEnd.context.currentQueryContext.state, 502n);
  const resSettle = crank.circuits.settleAuction(ctxSettle);

  // Seller reclaims unsold item
  const ctxReclaim = helperContext(resSettle.context.currentQueryContext.state, 503n);
  const resReclaim = seller.circuits.sellerReclaimUnsoldItem(ctxReclaim);
  const l = ledger(resReclaim.context.currentQueryContext.state);
  assert.equal(l.sellerItemReclaimed, true);
  assert.equal(l.itemDeposited, false);

  // Double reclaim fails
  const ctxReclaim2 = helperContext(resReclaim.context.currentQueryContext.state, 504n);
  assert.throws(
    () => seller.circuits.sellerReclaimUnsoldItem(ctxReclaim2),
    /Item has already been reclaimed/
  );

  // Winner claim fails on zero-bid auction
  assert.throws(
    () => seller.circuits.winnerClaimItem(ctxReclaim2, new Uint8Array(32)),
    /No winner in zero-bid auction/
  );
});

test('[Off-chain] 8B. sellerReclaimUnsoldItem rejected if bids were placed', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));
  const seller = new Contract(createWitnesses({ secretKey: sellerSecret }));

  const resBid = bidderA.circuits.placeBid(helperContext(state, 100n), 1500n, bidderARefundAddress);
  const resEnd = crank.circuits.endAuction(helperContext(resBid.context.currentQueryContext.state, 501n));
  const resSettle = crank.circuits.settleAuction(helperContext(resEnd.context.currentQueryContext.state, 502n));

  assert.throws(
    () => seller.circuits.sellerReclaimUnsoldItem(helperContext(resSettle.context.currentQueryContext.state, 503n)),
    /Item can only be reclaimed if no bids were placed/
  );
});

test('[Off-chain] 8C. sellerReclaimUnsoldItem rejected for non-seller', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  const resEnd = crank.circuits.endAuction(helperContext(state, 501n));
  const resSettle = crank.circuits.settleAuction(helperContext(resEnd.context.currentQueryContext.state, 502n));

  assert.throws(
    () => crank.circuits.sellerReclaimUnsoldItem(helperContext(resSettle.context.currentQueryContext.state, 503n)),
    /Unauthorized: Caller is not the auction seller/
  );
});

test('[Off-chain] 8D. winnerClaimItem rejected for non-winner', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const bidderB = new Contract(createWitnesses({ secretKey: bidderBSecret }));
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  // Place bid by A, then B wins with higher bid
  const resBidA = bidderA.circuits.placeBid(helperContext(state, 100n), 1200n, bidderARefundAddress);
  const resBidB = bidderB.circuits.placeBid(helperContext(resBidA.context.currentQueryContext.state, 200n), 1500n, bidderBRefundAddress);
  const resEnd = crank.circuits.endAuction(helperContext(resBidB.context.currentQueryContext.state, 501n));
  const resSettle = crank.circuits.settleAuction(helperContext(resEnd.context.currentQueryContext.state, 502n));

  // Bidder A attempts to claim the won item (should fail: A is not the winner)
  assert.throws(
    () => bidderA.circuits.winnerClaimItem(helperContext(resSettle.context.currentQueryContext.state, 503n), bidderARefundAddress),
    /Unauthorized: Caller is not the winning bidder/
  );

  // Random caller attempts to claim the won item (should fail: random caller is not the winner)
  assert.throws(
    () => crank.circuits.winnerClaimItem(helperContext(resSettle.context.currentQueryContext.state, 504n), new Uint8Array(32)),
    /Unauthorized: Caller is not the winning bidder/
  );
});

// ----------------------------------------------------------------------------
// 9. Full Settlement, Winner Item Claim & Claims Cycle (Step 3, Req 1, 5)
// ----------------------------------------------------------------------------
test('[Off-chain] 9. Full settlement and claim cycle with item escrow delivery', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const bidderB = new Contract(createWitnesses({ secretKey: bidderBSecret }));
  const seller = new Contract(createWitnesses({ secretKey: sellerSecret }));
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  // Bidding
  const ctx1 = helperContext(state, 100n);
  const res1 = bidderA.circuits.placeBid(ctx1, 1200n, bidderARefundAddress);

  const ctx2 = helperContext(res1.context.currentQueryContext.state, 150n);
  const res2 = bidderB.circuits.placeBid(ctx2, 2500n, bidderBRefundAddress);

  // End and Settle
  const ctxEnd = helperContext(res2.context.currentQueryContext.state, 500n);
  const resEnd = crank.circuits.endAuction(ctxEnd);

  const ctxSettle = helperContext(resEnd.context.currentQueryContext.state, 501n);
  const resSettle = crank.circuits.settleAuction(ctxSettle);
  let l = ledger(resSettle.context.currentQueryContext.state);
  assert.equal(l.state, AuctionState.Settled);

  // Seller claims funds
  const ctxSellerClaim = helperContext(resSettle.context.currentQueryContext.state, 502n);
  const resSellerClaim = seller.circuits.sellerClaimFunds(ctxSellerClaim);
  l = ledger(resSellerClaim.context.currentQueryContext.state);
  assert.equal(l.sellerFundsClaimed, true);

  // Double seller claim rejected
  const ctxSellerClaim2 = helperContext(resSellerClaim.context.currentQueryContext.state, 503n);
  assert.throws(
    () => seller.circuits.sellerClaimFunds(ctxSellerClaim2),
    /Seller funds have already been claimed/
  );

  // Non-winner cannot claim item
  assert.throws(
    () => bidderA.circuits.winnerClaimItem(ctxSellerClaim, bidderARefundAddress),
    /Unauthorized: Caller is not the winning bidder/
  );

  // Winner claims item with payout address
  const ctxWinnerClaim = helperContext(resSellerClaim.context.currentQueryContext.state, 504n);
  const resWinnerClaim = bidderB.circuits.winnerClaimItem(ctxWinnerClaim, bidderBRefundAddress);
  l = ledger(resWinnerClaim.context.currentQueryContext.state);
  assert.equal(l.winnerItemClaimed, true);
  assert.equal(l.itemDeposited, false, 'Item transferred out of escrow');

  // Double winner claim rejected
  const ctxWinnerClaim2 = helperContext(resWinnerClaim.context.currentQueryContext.state, 505n);
  assert.throws(
    () => bidderB.circuits.winnerClaimItem(ctxWinnerClaim2, bidderBRefundAddress),
    /Item has already been claimed/
  );

  // Outbid bidder A withdraws refund
  const ctxRefundA = helperContext(resWinnerClaim.context.currentQueryContext.state, 506n);
  const resRefundA = bidderA.circuits.withdrawRefund(ctxRefundA, bidderARefundAddress);
  l = ledger(resRefundA.context.currentQueryContext.state);
  assert.equal(getPendingRefund(l, bidderAId), 0n);
  assert.equal(l.totalRefundsClaimed, 1n);
});

// ----------------------------------------------------------------------------
// 10. Invariant Tests: Token Escrow & Item Escrow Invariant (Step 3)
// ----------------------------------------------------------------------------
test('[Off-chain] 10. Invariant: Token & Item escrow balances strictly equal outstanding liabilities', () => {
  let simContractBalance = 0n;
  let simContractItemCount = 1n; // 1 item deposited at construction

  function computeOutstandingTokenClaims(l: Ledger): bigint {
    const winningLiability = l.sellerFundsClaimed ? 0n : l.highestBid;
    let sumRefunds = 0n;
    for (const [_, refund] of l.pendingRefunds) {
      sumRefunds += refund;
    }
    return winningLiability + sumRefunds;
  }

  function assertInvariants(currState: any, label: string) {
    const l = ledger(currState);
    const expectedTokens = computeOutstandingTokenClaims(l);
    assert.equal(
      simContractBalance,
      expectedTokens,
      `Token invariant violated at [${label}]: Contract (${simContractBalance}) != Expected (${expectedTokens})`
    );
    const expectedItem = l.itemDeposited ? l.itemAmount : 0n;
    assert.equal(
      simContractItemCount,
      expectedItem,
      `Item invariant violated at [${label}]: Contract item (${simContractItemCount}) != Expected (${expectedItem})`
    );
  }

  const { state: init } = helperCreateAuction(500n, 100n, 1n);
  let currentState = init;
  assertInvariants(currentState, 'Initial State');

  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const bidderB = new Contract(createWitnesses({ secretKey: bidderBSecret }));
  const bidderC = new Contract(createWitnesses({ secretKey: bidderCSecret }));
  const seller = new Contract(createWitnesses({ secretKey: sellerSecret }));
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  // 1. A bids 200
  simContractBalance += 200n;
  currentState = bidderA.circuits.placeBid(helperContext(currentState, 100n), 200n, bidderARefundAddress).context.currentQueryContext.state;
  assertInvariants(currentState, 'After A bids 200');

  // 2. B bids 500
  simContractBalance += 500n;
  currentState = bidderB.circuits.placeBid(helperContext(currentState, 150n), 500n, bidderBRefundAddress).context.currentQueryContext.state;
  assertInvariants(currentState, 'After B bids 500');

  // 3. C bids 800
  simContractBalance += 800n;
  currentState = bidderC.circuits.placeBid(helperContext(currentState, 200n), 800n, bidderCRefundAddress).context.currentQueryContext.state;
  assertInvariants(currentState, 'After C bids 800');

  // 4. A bids 1200
  simContractBalance += 1200n;
  currentState = bidderA.circuits.placeBid(helperContext(currentState, 250n), 1200n, bidderARefundAddress).context.currentQueryContext.state;
  assertInvariants(currentState, 'After A bids 1200');

  // 5. B withdraws refund of 500
  simContractBalance -= 500n;
  currentState = bidderB.circuits.withdrawRefund(helperContext(currentState, 300n), bidderBRefundAddress).context.currentQueryContext.state;
  assertInvariants(currentState, 'After B withdraws 500');

  // 6. B bids 1500
  simContractBalance += 1500n;
  currentState = bidderB.circuits.placeBid(helperContext(currentState, 350n), 1500n, bidderBRefundAddress).context.currentQueryContext.state;
  assertInvariants(currentState, 'After B bids 1500');

  // 7. End auction at t=500
  currentState = crank.circuits.endAuction(helperContext(currentState, 500n)).context.currentQueryContext.state;
  assertInvariants(currentState, 'After endAuction');

  // 8. Settle auction
  currentState = crank.circuits.settleAuction(helperContext(currentState, 501n)).context.currentQueryContext.state;
  assertInvariants(currentState, 'After settleAuction');

  // 9. Seller claims winning funds (1500)
  simContractBalance -= 1500n;
  currentState = seller.circuits.sellerClaimFunds(helperContext(currentState, 502n)).context.currentQueryContext.state;
  assertInvariants(currentState, 'After sellerClaimFunds');

  // 10. Winner claims item (simContractItemCount goes from 1 to 0)
  simContractItemCount -= 1n;
  currentState = bidderB.circuits.winnerClaimItem(helperContext(currentState, 503n), bidderBRefundAddress).context.currentQueryContext.state;
  assertInvariants(currentState, 'After winnerClaimItem');

  // 11. C withdraws refund of 800
  simContractBalance -= 800n;
  currentState = bidderC.circuits.withdrawRefund(helperContext(currentState, 504n), bidderCRefundAddress).context.currentQueryContext.state;
  assertInvariants(currentState, 'After C withdraws 800');

  // 12. A withdraws accumulated refund (200 + 1200 = 1400)
  simContractBalance -= 1400n;
  currentState = bidderA.circuits.withdrawRefund(helperContext(currentState, 505n), bidderARefundAddress).context.currentQueryContext.state;
  assertInvariants(currentState, 'After A withdraws 1400');

  // Final check: All funds and items claimed, contract liabilities are 0
  assert.equal(simContractBalance, 0n, 'Final contract token balance must be strictly 0');
  assert.equal(simContractItemCount, 0n, 'Final contract item balance must be strictly 0');
  assertInvariants(currentState, 'Final State: Complete payout & refund');
});

// ----------------------------------------------------------------------------
// 11. Exhaustive Circuit Assert Failure Paths (100% Assert Branch Coverage)
// ----------------------------------------------------------------------------
test('[Off-chain] 11A. depositItem rejected when auction is not Active', () => {
  const { contract: sellerContract, state } = helperCreateAuction(500n, 1000n, 0n);
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));
  const endedState = crank.circuits.endAuction(helperContext(state, 501n)).context.currentQueryContext.state;

  assert.throws(
    () => sellerContract.circuits.depositItem(helperContext(endedState, 502n), testItem, 1n),
    /Auction is not active/
  );
});

test('[Off-chain] 11B. placeBid rejected when auction is Ended or Settled', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));

  const endedState = crank.circuits.endAuction(helperContext(state, 501n)).context.currentQueryContext.state;
  assert.throws(
    () => bidderA.circuits.placeBid(helperContext(endedState, 502n), 1200n, bidderARefundAddress),
    /Auction is not active for bidding/
  );
});

test('[Off-chain] 11C. endAuction rejected when auction is already Ended', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  const endedState = crank.circuits.endAuction(helperContext(state, 501n)).context.currentQueryContext.state;
  assert.throws(
    () => crank.circuits.endAuction(helperContext(endedState, 502n)),
    /Auction is not active/
  );
});

test('[Off-chain] 11D. settleAuction rejected when auction is still Active', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  assert.throws(
    () => crank.circuits.settleAuction(helperContext(state, 100n)),
    /Auction must be Ended to settle/
  );
});

test('[Off-chain] 11E. sellerClaimFunds rejected when auction is not Settled', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const seller = new Contract(createWitnesses({ secretKey: sellerSecret }));
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  const endedState = crank.circuits.endAuction(helperContext(state, 501n)).context.currentQueryContext.state;
  assert.throws(
    () => seller.circuits.sellerClaimFunds(helperContext(endedState, 502n)),
    /Auction must be Settled to claim funds/
  );
});

test('[Off-chain] 11F. sellerClaimFunds rejected on zero-bid auction', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const seller = new Contract(createWitnesses({ secretKey: sellerSecret }));
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  const endedState = crank.circuits.endAuction(helperContext(state, 501n)).context.currentQueryContext.state;
  const settledState = crank.circuits.settleAuction(helperContext(endedState, 502n)).context.currentQueryContext.state;

  assert.throws(
    () => seller.circuits.sellerClaimFunds(helperContext(settledState, 503n)),
    /No winning funds to claim in zero-bid auction/
  );
});

test('[Off-chain] 11G. sellerReclaimUnsoldItem rejected when auction is not Settled', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const seller = new Contract(createWitnesses({ secretKey: sellerSecret }));
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  const endedState = crank.circuits.endAuction(helperContext(state, 501n)).context.currentQueryContext.state;
  assert.throws(
    () => seller.circuits.sellerReclaimUnsoldItem(helperContext(endedState, 502n)),
    /Auction must be Settled to reclaim unsold item/
  );
});

test('[Off-chain] 11H. winnerClaimItem rejected when auction is not Settled', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const bidderA = new Contract(createWitnesses({ secretKey: bidderASecret }));
  const crank = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  const bidState = bidderA.circuits.placeBid(helperContext(state, 100n), 1500n, bidderARefundAddress).context.currentQueryContext.state;
  const endedState = crank.circuits.endAuction(helperContext(bidState, 501n)).context.currentQueryContext.state;

  assert.throws(
    () => bidderA.circuits.winnerClaimItem(helperContext(endedState, 502n), bidderARefundAddress),
    /Auction must be Settled to claim item/
  );
});

test('[Off-chain] 11I. withdrawRefund rejected when caller has no pending refund', () => {
  const { state } = helperCreateAuction(500n, 1000n, 1n);
  const randomCaller = new Contract(createWitnesses({ secretKey: randomCallerSecret }));

  assert.throws(
    () => randomCaller.circuits.withdrawRefund(helperContext(state, 100n), new Uint8Array(32)),
    /No pending escrow refund found for caller/
  );
});
});

