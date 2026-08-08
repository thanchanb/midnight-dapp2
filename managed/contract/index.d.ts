import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum VaultState { uninitialized = 0, active = 1, claimed = 2, revoked = 3
}

export type Witnesses<PS> = {
  secretWitness(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  userSalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  initializeVault(context: __compactRuntime.CircuitContext<PS>,
                  commitment_0: Uint8Array,
                  ownerId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  verifyAndClaim(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  revokeVault(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  initializeVault(context: __compactRuntime.CircuitContext<PS>,
                  commitment_0: Uint8Array,
                  ownerId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  verifyAndClaim(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  revokeVault(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  initializeVault(context: __compactRuntime.CircuitContext<PS>,
                  commitment_0: Uint8Array,
                  ownerId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  verifyAndClaim(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  revokeVault(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly state: VaultState;
  readonly publicCommitment: Uint8Array;
  readonly owner: Uint8Array;
  readonly totalDeposits: bigint;
  readonly lastDisclosedHash: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
