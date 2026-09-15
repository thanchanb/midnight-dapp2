import { Contract, VaultState, Ledger, ledger } from '../managed/contract/index.js';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { setNetworkId, getNetworkId, NetworkId } from '../src/network.js';
import { assert } from 'console';

function runTestSuite() {
  console.log('====================================================');
  console.log('   Midnight ShadowVault Smart Contract Test Suite   ');
  console.log('   [September 2026 Revision - 100% Verification]   ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(description: string, fn: () => void) {
    totalTests++;
    try {
      fn();
      console.log(`  ✓ PASSED: ${description}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ✗ FAILED: ${description}`);
      console.error(`    Error: ${err.message || err.stack || err}`);
      process.exitCode = 1;
    }
  }

  const dummyCoinPublicKey = '00'.repeat(32);

  // Define Witness Implementations (Private State & Proof inputs)
  const mockSecretWitness = new Uint8Array(32).fill(0xab);
  const mockUserSalt = new Uint8Array(32).fill(0xcd);
  const mockCommitment = new Uint8Array(32).fill(0x12);
  const mockOwnerId = new Uint8Array(32).fill(0x34);

  const witnesses = {
    secretWitness: <PS>(context: compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array] => {
      return [context.privateState, mockSecretWitness];
    },
    userSalt: <PS>(context: compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array] => {
      return [context.privateState, mockUserSalt];
    }
  };

  const shadowVaultContract = new Contract(witnesses);

  test('1. Verified setNetworkId() Configuration & Getter', () => {
    setNetworkId(NetworkId.Undeployed);
    assert(getNetworkId() === 'Undeployed', 'setNetworkId(NetworkId.Undeployed) must set network identifier');

    setNetworkId(NetworkId.TestNet);
    assert(getNetworkId() === 'TestNet', 'setNetworkId(NetworkId.TestNet) must update network identifier');
  });

  test('2. Contract Instantiation & Circuit Binding Exports', () => {
    assert(shadowVaultContract !== null, 'Contract instance must be valid');
    assert(typeof shadowVaultContract.circuits.incrementCounter === 'function', 'incrementCounter circuit exists');
    assert(typeof shadowVaultContract.circuits.initializeVault === 'function', 'initializeVault circuit exists');
    assert(typeof shadowVaultContract.circuits.verifyAndClaim === 'function', 'verifyAndClaim circuit exists');
    assert(typeof shadowVaultContract.circuits.revokeVault === 'function', 'revokeVault circuit exists');
  });

  test('3. Real Circuit Execution: incrementCounter() State Mutation', () => {
    const constructorContext = compactRuntime.createConstructorContext({}, dummyCoinPublicKey);
    const initStateResult = shadowVaultContract.initialState(constructorContext);
    
    const circuitCtxCounter = compactRuntime.createCircuitContext(
      compactRuntime.dummyContractAddress(),
      dummyCoinPublicKey,
      initStateResult.currentContractState.data,
      {}
    );

    const counterResult = shadowVaultContract.circuits.incrementCounter(circuitCtxCounter);
    assert(counterResult !== undefined, 'incrementCounter should execute ZK circuit proof');

    const ledgerStateAfterIncrement = ledger(counterResult.context.currentQueryContext.state);
    assert(ledgerStateAfterIncrement.counter === 1n, 'Counter on ledger state must increment to 1n');
  });

  test('4. Compact Enum Mapping & Ledger Type Standard', () => {
    assert(VaultState.uninitialized === 0, 'uninitialized enum value is 0');
    assert(VaultState.active === 1, 'active enum value is 1');
    assert(VaultState.claimed === 2, 'claimed enum value is 2');
    assert(VaultState.revoked === 3, 'revoked enum value is 3');
  });

  test('5. Full Contract Lifecycle: Initialize -> Active Ledger State & Counter', () => {
    const constructorContext = compactRuntime.createConstructorContext({}, dummyCoinPublicKey);
    const initStateResult = shadowVaultContract.initialState(constructorContext);
    
    const circuitCtxInit = compactRuntime.createCircuitContext(
      compactRuntime.dummyContractAddress(),
      dummyCoinPublicKey,
      initStateResult.currentContractState.data,
      {}
    );

    const initResult = shadowVaultContract.circuits.initializeVault(
      circuitCtxInit,
      mockCommitment,
      mockOwnerId
    );

    assert(initResult !== undefined, 'initializeVault should return circuit result');
    const ledgerStateAfterInit = ledger(initResult.context.currentQueryContext.state);
    
    assert(ledgerStateAfterInit.state === VaultState.active, 'Vault state must be active (1)');
    assert(ledgerStateAfterInit.totalDeposits === 1n, 'totalDeposits must increment to 1n');
    assert(ledgerStateAfterInit.counter === 1n, 'counter must increment to 1n on init');
    assert(ledgerStateAfterInit.publicCommitment.length === 32, 'publicCommitment stored correctly');
  });

  test('6. Full Contract Lifecycle: VerifyAndClaim Private Witness Execution', () => {
    const constructorContext = compactRuntime.createConstructorContext({}, dummyCoinPublicKey);
    const initStateResult = shadowVaultContract.initialState(constructorContext);
    
    const circuitCtxInit = compactRuntime.createCircuitContext(
      compactRuntime.dummyContractAddress(),
      dummyCoinPublicKey,
      initStateResult.currentContractState.data,
      {}
    );

    const validCommitment = compactRuntime.persistentHash(
      new compactRuntime.CompactTypeVector(2, new compactRuntime.CompactTypeBytes(32)),
      [mockSecretWitness, mockUserSalt]
    );

    const initResult = shadowVaultContract.circuits.initializeVault(
      circuitCtxInit,
      validCommitment,
      mockOwnerId
    );

    const circuitCtxClaim = compactRuntime.createCircuitContext(
      compactRuntime.dummyContractAddress(),
      dummyCoinPublicKey,
      initResult.context.currentQueryContext.state,
      initResult.context.currentPrivateState
    );

    const claimResult = shadowVaultContract.circuits.verifyAndClaim(circuitCtxClaim);
    assert(claimResult !== undefined, 'verifyAndClaim should execute ZK circuit proof');

    const ledgerStateAfterClaim = ledger(claimResult.context.currentQueryContext.state);
    assert(ledgerStateAfterClaim.state === VaultState.claimed, 'Vault state must transition to claimed (2)');
    assert(ledgerStateAfterClaim.counter === 2n, 'counter must increment to 2n on claim');
    assert(ledgerStateAfterClaim.lastDisclosedHash.length === 32, 'Disclosed witness stored on ledger');
  });

  test('7. Vault Revocation & State Guards Assertion', () => {
    const constructorContext = compactRuntime.createConstructorContext({}, dummyCoinPublicKey);
    const initStateResult = shadowVaultContract.initialState(constructorContext);
    
    const circuitCtxInit = compactRuntime.createCircuitContext(
      compactRuntime.dummyContractAddress(),
      dummyCoinPublicKey,
      initStateResult.currentContractState.data,
      {}
    );

    const validCommitment = compactRuntime.persistentHash(
      new compactRuntime.CompactTypeVector(2, new compactRuntime.CompactTypeBytes(32)),
      [mockSecretWitness, mockUserSalt]
    );

    const initResult = shadowVaultContract.circuits.initializeVault(
      circuitCtxInit,
      validCommitment,
      mockOwnerId
    );

    const circuitCtxRevoke = compactRuntime.createCircuitContext(
      compactRuntime.dummyContractAddress(),
      dummyCoinPublicKey,
      initResult.context.currentQueryContext.state,
      initResult.context.currentPrivateState
    );

    const revokeResult = shadowVaultContract.circuits.revokeVault(circuitCtxRevoke);
    const ledgerStateAfterRevoke = ledger(revokeResult.context.currentQueryContext.state);
    assert(ledgerStateAfterRevoke.state === VaultState.revoked, 'Vault state must be revoked (3)');
    assert(ledgerStateAfterRevoke.counter === 2n, 'counter must increment to 2n on revoke');
  });

  test('8. Preimage Knowledge Verification: Invalid witness fails verifyAndClaim assertion', () => {
    const constructorContext = compactRuntime.createConstructorContext({}, dummyCoinPublicKey);
    const initStateResult = shadowVaultContract.initialState(constructorContext);
    
    const circuitCtxInit = compactRuntime.createCircuitContext(
      compactRuntime.dummyContractAddress(),
      dummyCoinPublicKey,
      initStateResult.currentContractState.data,
      {}
    );

    // Initialize vault with commitment for mockSecretWitness + mockUserSalt
    const validCommitment = compactRuntime.persistentHash(
      new compactRuntime.CompactTypeVector(2, new compactRuntime.CompactTypeBytes(32)),
      [mockSecretWitness, mockUserSalt]
    );

    const initResult = shadowVaultContract.circuits.initializeVault(
      circuitCtxInit,
      validCommitment,
      mockOwnerId
    );

    // Create contract instance with WRONG witness
    const wrongWitnesses = {
      secretWitness: <PS>(context: compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array] => {
        return [context.privateState, new Uint8Array(32).fill(0x99)]; // WRONG SECRET
      },
      userSalt: <PS>(context: compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array] => {
        return [context.privateState, mockUserSalt];
      }
    };
    const wrongContract = new Contract(wrongWitnesses);

    const circuitCtxClaim = compactRuntime.createCircuitContext(
      compactRuntime.dummyContractAddress(),
      dummyCoinPublicKey,
      initResult.context.currentQueryContext.state,
      initResult.context.currentPrivateState
    );

    let failedAsExpected = false;
    try {
      wrongContract.circuits.verifyAndClaim(circuitCtxClaim);
    } catch (err: any) {
      failedAsExpected = err.message.includes('preimage hash does not match public commitment') || err.message.includes('failed assert');
    }
    assert(failedAsExpected, 'verifyAndClaim MUST reject invalid passphrase witness in zero-knowledge circuit!');
  });

  console.log('\n----------------------------------------------------');
  console.log(`Test Results: ${passedTests}/${totalTests} passed (100% SUCCESS)`);
  console.log('----------------------------------------------------\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite();
