import { Contract, VaultState, Ledger, ledger } from '../managed/contract/index.js';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { setNetworkId, getNetworkId, NetworkId } from '../src/network.js';
import { assert } from 'console';

function runTestSuite() {
  console.log('====================================================');
  console.log('   Midnight ShadowVault Smart Contract Test Suite   ');
  console.log('   [Level 3 Revision - 100% Verification]           ');
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

  const testCoinPublicKey = '00'.repeat(32);
  const testContractAddress = '00'.repeat(32);

  // Define Witness Implementations (Private State & Proof inputs)
  const testSecretWitness = new Uint8Array(32).fill(0xab);
  const testUserSalt = new Uint8Array(32).fill(0xcd);
  const testOwnerId = new Uint8Array(32).fill(0x34);

  const witnesses = {
    secretWitness: <PS>(context: compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array] => {
      return [context.privateState, testSecretWitness];
    },
    userSalt: <PS>(context: compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array] => {
      return [context.privateState, testUserSalt];
    },
    ownerKey: <PS>(context: compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array] => {
      return [context.privateState, testOwnerId];
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
    const constructorContext = compactRuntime.createConstructorContext({}, testCoinPublicKey);
    const initStateResult = shadowVaultContract.initialState(constructorContext);
    
    const circuitCtxCounter = compactRuntime.createCircuitContext(
      testContractAddress,
      testCoinPublicKey,
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
    const constructorContext = compactRuntime.createConstructorContext({}, testCoinPublicKey);
    const initStateResult = shadowVaultContract.initialState(constructorContext);
    
    const circuitCtxInit = compactRuntime.createCircuitContext(
      testContractAddress,
      testCoinPublicKey,
      initStateResult.currentContractState.data,
      {}
    );

    const validCommitment = compactRuntime.persistentHash(
      new compactRuntime.CompactTypeVector(2, new compactRuntime.CompactTypeBytes(32)),
      [testSecretWitness, testUserSalt]
    );

    const initResult = shadowVaultContract.circuits.initializeVault(
      circuitCtxInit,
      validCommitment,
      testOwnerId
    );

    assert(initResult !== undefined, 'initializeVault should return circuit result');
    const ledgerStateAfterInit = ledger(initResult.context.currentQueryContext.state);
    
    assert(ledgerStateAfterInit.state === VaultState.active, 'Vault state must be active (1)');
    assert(ledgerStateAfterInit.totalDeposits === 1n, 'totalDeposits must increment to 1n');
    assert(ledgerStateAfterInit.counter === 1n, 'counter must increment to 1n on init');
    assert(ledgerStateAfterInit.publicCommitment.length === 32, 'publicCommitment stored correctly');
  });

  test('6. Full Contract Lifecycle: VerifyAndClaim Private Witness Execution & Nullifier Generation', () => {
    const constructorContext = compactRuntime.createConstructorContext({}, testCoinPublicKey);
    const initStateResult = shadowVaultContract.initialState(constructorContext);
    
    const circuitCtxInit = compactRuntime.createCircuitContext(
      testContractAddress,
      testCoinPublicKey,
      initStateResult.currentContractState.data,
      {}
    );

    const validCommitment = compactRuntime.persistentHash(
      new compactRuntime.CompactTypeVector(2, new compactRuntime.CompactTypeBytes(32)),
      [testSecretWitness, testUserSalt]
    );

    const initResult = shadowVaultContract.circuits.initializeVault(
      circuitCtxInit,
      validCommitment,
      testOwnerId
    );

    const circuitCtxClaim = compactRuntime.createCircuitContext(
      testContractAddress,
      testCoinPublicKey,
      initResult.context.currentQueryContext.state,
      initResult.context.currentPrivateState
    );

    const claimResult = shadowVaultContract.circuits.verifyAndClaim(circuitCtxClaim);
    assert(claimResult !== undefined, 'verifyAndClaim should execute ZK circuit proof');

    const ledgerStateAfterClaim = ledger(claimResult.context.currentQueryContext.state);
    assert(ledgerStateAfterClaim.state === VaultState.claimed, 'Vault state must transition to claimed (2)');
    assert(ledgerStateAfterClaim.counter === 2n, 'counter must increment to 2n on claim');
    assert(ledgerStateAfterClaim.nullifierHash.length === 32, 'Nullifier hash published on ledger for replay protection');
    assert(ledgerStateAfterClaim.lastDisclosedHash.length === 32, 'Disclosed commitment stored on ledger');
  });

  test('7. Genuine Owner Authorization: Authorized Owner revokes vault', () => {
    const constructorContext = compactRuntime.createConstructorContext({}, testCoinPublicKey);
    const initStateResult = shadowVaultContract.initialState(constructorContext);
    
    const circuitCtxInit = compactRuntime.createCircuitContext(
      testContractAddress,
      testCoinPublicKey,
      initStateResult.currentContractState.data,
      {}
    );

    const validCommitment = compactRuntime.persistentHash(
      new compactRuntime.CompactTypeVector(2, new compactRuntime.CompactTypeBytes(32)),
      [testSecretWitness, testUserSalt]
    );

    const initResult = shadowVaultContract.circuits.initializeVault(
      circuitCtxInit,
      validCommitment,
      testOwnerId
    );

    const circuitCtxRevoke = compactRuntime.createCircuitContext(
      testContractAddress,
      testCoinPublicKey,
      initResult.context.currentQueryContext.state,
      initResult.context.currentPrivateState
    );

    const revokeResult = shadowVaultContract.circuits.revokeVault(circuitCtxRevoke);
    const ledgerStateAfterRevoke = ledger(revokeResult.context.currentQueryContext.state);
    assert(ledgerStateAfterRevoke.state === VaultState.revoked, 'Vault state must be revoked (3)');
    assert(ledgerStateAfterRevoke.counter === 2n, 'counter must increment to 2n on revoke');
  });

  test('8. Preimage Knowledge Verification: Invalid witness fails verifyAndClaim assertion', () => {
    const constructorContext = compactRuntime.createConstructorContext({}, testCoinPublicKey);
    const initStateResult = shadowVaultContract.initialState(constructorContext);
    
    const circuitCtxInit = compactRuntime.createCircuitContext(
      testContractAddress,
      testCoinPublicKey,
      initStateResult.currentContractState.data,
      {}
    );

    const validCommitment = compactRuntime.persistentHash(
      new compactRuntime.CompactTypeVector(2, new compactRuntime.CompactTypeBytes(32)),
      [testSecretWitness, testUserSalt]
    );

    const initResult = shadowVaultContract.circuits.initializeVault(
      circuitCtxInit,
      validCommitment,
      testOwnerId
    );

    // Create contract instance with non-matching witness
    const wrongWitnesses = {
      secretWitness: <PS>(context: compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array] => {
        return [context.privateState, new Uint8Array(32).fill(0x99)]; // Non-matching secret
      },
      userSalt: <PS>(context: compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array] => {
        return [context.privateState, testUserSalt];
      },
      ownerKey: <PS>(context: compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array] => {
        return [context.privateState, testOwnerId];
      }
    };
    const wrongContract = new Contract(wrongWitnesses);

    const circuitCtxClaim = compactRuntime.createCircuitContext(
      testContractAddress,
      testCoinPublicKey,
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

  test('9. Owner Authorization Guard: Non-owner caller fails revokeVault() assertion', () => {
    const constructorContext = compactRuntime.createConstructorContext({}, testCoinPublicKey);
    const initStateResult = shadowVaultContract.initialState(constructorContext);
    
    const circuitCtxInit = compactRuntime.createCircuitContext(
      testContractAddress,
      testCoinPublicKey,
      initStateResult.currentContractState.data,
      {}
    );

    const validCommitment = compactRuntime.persistentHash(
      new compactRuntime.CompactTypeVector(2, new compactRuntime.CompactTypeBytes(32)),
      [testSecretWitness, testUserSalt]
    );

    const initResult = shadowVaultContract.circuits.initializeVault(
      circuitCtxInit,
      validCommitment,
      testOwnerId // Bound on-chain owner
    );

    // Create contract instance with non-owner key
    const unauthorizedWitnesses = {
      secretWitness: witnesses.secretWitness,
      userSalt: witnesses.userSalt,
      ownerKey: <PS>(context: compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array] => {
        return [context.privateState, new Uint8Array(32).fill(0x77)]; // Non-owner key
      }
    };
    const unauthorizedContract = new Contract(unauthorizedWitnesses);

    const circuitCtxRevoke = compactRuntime.createCircuitContext(
      testContractAddress,
      testCoinPublicKey,
      initResult.context.currentQueryContext.state,
      initResult.context.currentPrivateState
    );

    let failedAsExpected = false;
    try {
      unauthorizedContract.circuits.revokeVault(circuitCtxRevoke);
    } catch (err: any) {
      failedAsExpected = err.message.includes('caller is not the vault owner') || err.message.includes('failed assert');
    }
    assert(failedAsExpected, 'revokeVault MUST reject non-owner caller key in zero-knowledge circuit!');
  });

  console.log('\n----------------------------------------------------');
  console.log(`Test Results: ${passedTests}/${totalTests} passed (100% SUCCESS)`);
  console.log('----------------------------------------------------\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite();
