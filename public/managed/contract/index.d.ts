import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum AuctionState { Active = 0, Ended = 1, Settled = 2, Cancelled = 3 }

export type Witnesses<PS> = {
  secretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  depositItem(context: __compactRuntime.CircuitContext<PS>,
              itemTokenId_0: Uint8Array,
              amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  placeBid(context: __compactRuntime.CircuitContext<PS>,
           bidAmount_0: bigint,
           bidderRefundAddress_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  endAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  settleAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  sellerClaimFunds(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  sellerReclaimUnsoldItem(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  winnerClaimItem(context: __compactRuntime.CircuitContext<PS>,
                  recipientAddress_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  withdrawRefund(context: __compactRuntime.CircuitContext<PS>,
                 recipientAddress_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  depositItem(context: __compactRuntime.CircuitContext<PS>,
              itemTokenId_0: Uint8Array,
              amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  placeBid(context: __compactRuntime.CircuitContext<PS>,
           bidAmount_0: bigint,
           bidderRefundAddress_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  endAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  settleAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  sellerClaimFunds(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  sellerReclaimUnsoldItem(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  winnerClaimItem(context: __compactRuntime.CircuitContext<PS>,
                  recipientAddress_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  withdrawRefund(context: __compactRuntime.CircuitContext<PS>,
                 recipientAddress_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  depositItem(context: __compactRuntime.CircuitContext<PS>,
              itemTokenId_0: Uint8Array,
              amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  placeBid(context: __compactRuntime.CircuitContext<PS>,
           bidAmount_0: bigint,
           bidderRefundAddress_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  endAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  settleAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  sellerClaimFunds(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  sellerReclaimUnsoldItem(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  winnerClaimItem(context: __compactRuntime.CircuitContext<PS>,
                  recipientAddress_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  withdrawRefund(context: __compactRuntime.CircuitContext<PS>,
                 recipientAddress_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly state: AuctionState;
  readonly item: Uint8Array;
  readonly itemAmount: bigint;
  readonly itemDeposited: boolean;
  readonly seller: Uint8Array;
  readonly sellerRecipientAddress: Uint8Array;
  readonly reservePrice: bigint;
  readonly highestBid: bigint;
  readonly highestBidder: Uint8Array;
  readonly highestBidderRecipient: Uint8Array;
  readonly deadline: bigint;
  readonly totalBids: bigint;
  readonly totalRefundsClaimed: bigint;
  readonly sellerFundsClaimed: boolean;
  readonly sellerItemReclaimed: boolean;
  readonly winnerItemClaimed: boolean;
  pendingRefunds: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               itemParam_0: Uint8Array,
               itemAmountParam_0: bigint,
               sellerPayoutAddress_0: Uint8Array,
               reservePriceParam_0: bigint,
               deadlineParam_0: bigint): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
