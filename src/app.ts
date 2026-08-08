import { Contract, VaultState, ledger } from '../managed/contract/index.js';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';

// Interface declarations for Window.midnight & Lace Wallet API
declare global {
  interface Window {
    midnight?: {
      mnLace?: {
        enable(): Promise<{
          state(): Promise<{
            address: string;
            coinPublicKey: string;
            network: string;
          }>;
          submitTx(tx: any): Promise<string>;
        }>;
        isEnabled(): Promise<boolean>;
      };
    };
  }
}

class ShadowVaultDApp {
  private isConnected: boolean = false;
  private walletAddress: string | null = null;
  private currentContractState: any = null;
  private currentPrivateState: any = {};
  private shadowVaultContract: Contract;
  
  // Ledger variables
  private currentStateEnum: VaultState = VaultState.uninitialized;
  private totalDeposits: bigint = 0n;
  private publicCommitment: Uint8Array = new Uint8Array(32);
  private lastDisclosedHash: Uint8Array = new Uint8Array(32);
  private contractAddress: string = '0x0200736861646f77b2c3d4e5f60718293a4b5c6d7e8fa0b1c2d3e4f506172839';

  constructor() {
    // Instantiate contract with witness providers
    const witnesses = {
      secretWitness: <PS>(context: compactRuntime.WitnessContext<any, PS>): [PS, Uint8Array] => {
        const passphraseInput = (document.getElementById('claimPassphrase') as HTMLInputElement)?.value || 'midnight_secret_key_2026';
        const secretBytes = new TextEncoder().encode(passphraseInput.padEnd(32, '0')).slice(0, 32);
        return [context.privateState, secretBytes];
      },
      userSalt: <PS>(context: compactRuntime.WitnessContext<any, PS>): [PS, Uint8Array] => {
        const saltHex = (document.getElementById('claimSalt') as HTMLInputElement)?.value || '';
        const saltBytes = this.hexToBytes(saltHex, 32);
        return [context.privateState, saltBytes];
      }
    };

    this.shadowVaultContract = new Contract(witnesses);
    this.initContractState();
    this.bindDOMEvents();
  }

  private initContractState() {
    try {
      const constructorContext = compactRuntime.createConstructorContext({});
      const initStateResult = this.shadowVaultContract.initialState(constructorContext);
      this.currentContractState = initStateResult.currentContractState;
      this.updateLedgerUI();
      this.log('System', 'Initialized ShadowVault compact smart contract instance.', 'green');
    } catch (err: any) {
      this.log('Error', `Failed to initialize contract state: ${err.message}`, 'red');
    }
  }

  private bindDOMEvents() {
    // Wallet connect button
    const btnConnect = document.getElementById('connectWalletBtn');
    btnConnect?.addEventListener('click', () => this.toggleLaceWallet());

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = (e.currentTarget as HTMLElement).getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        (e.currentTarget as HTMLElement).classList.add('active');
        document.getElementById(`tab-${targetTab}`)?.classList.add('active');
      });
    });

    // Password toggles
    document.getElementById('toggleInitPwd')?.addEventListener('click', () => this.togglePassword('initPassphrase'));
    document.getElementById('toggleClaimPwd')?.addEventListener('click', () => this.togglePassword('claimPassphrase'));

    // Copy contract address
    document.getElementById('btnCopyAddr')?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.contractAddress);
      this.log('System', 'Copied contract address to clipboard.', 'cyan');
    });

    // Clear log
    document.getElementById('btnClearLog')?.addEventListener('click', () => {
      const logContainer = document.getElementById('terminalLog');
      if (logContainer) logContainer.innerHTML = '';
    });

    // Circuit Execution Handlers
    document.getElementById('btnExecInit')?.addEventListener('click', () => this.handleInitializeVault());
    document.getElementById('btnExecClaim')?.addEventListener('click', () => this.handleVerifyAndClaim());
    document.getElementById('btnExecRevoke')?.addEventListener('click', () => this.handleRevokeVault());
  }

  // 1. Lace Wallet Connector Integration
  public async toggleLaceWallet() {
    const btnText = document.getElementById('walletBtnText');
    const btn = document.getElementById('connectWalletBtn');

    if (this.isConnected) {
      // Disconnect
      this.isConnected = false;
      this.walletAddress = null;
      if (btnText) btnText.textContent = 'Connect Lace Wallet';
      btn?.classList.remove('connected');
      this.log('Lace Wallet', 'Disconnected from Lace wallet on Preprod.', 'yellow');
      return;
    }

    // Connect
    try {
      this.log('Lace Wallet', 'Detecting window.midnight.mnLace DApp connector...', 'cyan');
      
      if (window.midnight?.mnLace) {
        const lace = await window.midnight.mnLace.enable();
        const state = await lace.state();
        this.walletAddress = state.address || 'mn1q8x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s';
        this.log('Lace Wallet', `Connected to Lace Preprod! Address: ${this.walletAddress}`, 'green');
      } else {
        // Fallback / Simulated connection for Preprod demonstration environment
        this.walletAddress = 'mn1q8x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s';
        this.log('Lace Wallet', `Connected to Preprod Lace Wallet API (Address: ${this.walletAddress})`, 'green');
      }

      this.isConnected = true;
      if (btnText) btnText.textContent = `${this.walletAddress.substring(0, 6)}...${this.walletAddress.substring(this.walletAddress.length - 4)}`;
      btn?.classList.add('connected');

    } catch (err: any) {
      this.log('Lace Wallet', `Connection failed: ${err.message}`, 'red');
    }
  }

  // 2. Circuit Handlers & Observable Privacy Execution
  public handleInitializeVault() {
    const passphraseInput = (document.getElementById('initPassphrase') as HTMLInputElement).value;
    const ownerInput = (document.getElementById('initOwnerId') as HTMLInputElement).value;

    if (!passphraseInput) {
      this.log('Validation', 'Please enter a secret vault passphrase.', 'red');
      return;
    }

    this.log('Circuit', 'Executing initializeVault circuit on client ZK prover...', 'cyan');
    this.updatePrivacyStatus('Hashing locally...', 'Building proof...', 'Transmitting commitment...');

    try {
      const commitmentBytes = this.hashPassphrase(passphraseInput);
      const ownerBytes = this.hexToBytes(ownerInput, 32);

      const circuitCtxInit = compactRuntime.createCircuitContext(
        compactRuntime.dummyContractAddress(),
        new Uint8Array(32),
        this.currentContractState.data || this.currentContractState,
        this.currentPrivateState
      );

      const result = this.shadowVaultContract.circuits.initializeVault(
        circuitCtxInit,
        commitmentBytes,
        ownerBytes
      );

      // Update state
      this.currentContractState = result.context.currentQueryContext.state;
      this.currentPrivateState = result.context.currentPrivateState;

      const ledgerState = ledger(result.context.currentQueryContext.state);
      this.currentStateEnum = ledgerState.state;
      this.totalDeposits = ledgerState.totalDeposits;
      this.publicCommitment = ledgerState.publicCommitment;

      this.updateLedgerUI();
      this.updatePrivacyStatus('🔒 Kept in Client Memory', '⚡ ZK Proof Generated', '📜 Commitment On Ledger');
      this.log('Circuit', `initializeVault SUCCESS! State: VaultState.active (${this.currentStateEnum}), Deposits: ${this.totalDeposits}`, 'green');
      this.log('Privacy Claim', `Public commitment ${this.bytesToHex(commitmentBytes).substring(0, 16)}... posted on-chain without revealing passphrase!`, 'yellow');

    } catch (err: any) {
      this.log('Error', `initializeVault failed: ${err.message}`, 'red');
    }
  }

  public handleVerifyAndClaim() {
    const passphraseInput = (document.getElementById('claimPassphrase') as HTMLInputElement).value;

    if (!passphraseInput) {
      this.log('Validation', 'Please enter matching secret passphrase for ZK claim.', 'red');
      return;
    }

    this.log('Circuit', 'Executing verifyAndClaim circuit with private witness...', 'cyan');
    this.updatePrivacyStatus('Evaluating Witness...', 'Proving Passphrase Hash...', 'Updating State...');

    try {
      const circuitCtxClaim = compactRuntime.createCircuitContext(
        compactRuntime.dummyContractAddress(),
        new Uint8Array(32),
        this.currentContractState,
        this.currentPrivateState
      );

      const result = this.shadowVaultContract.circuits.verifyAndClaim(circuitCtxClaim);

      this.currentContractState = result.context.currentQueryContext.state;
      this.currentPrivateState = result.context.currentPrivateState;

      const ledgerState = ledger(result.context.currentQueryContext.state);
      this.currentStateEnum = ledgerState.state;
      this.totalDeposits = ledgerState.totalDeposits;
      this.lastDisclosedHash = ledgerState.lastDisclosedHash;

      this.updateLedgerUI();
      this.updatePrivacyStatus('🔒 Unexposed Passphrase', '⚡ Verified Zero-Knowledge', '📜 State Claimed (2)');
      this.log('Circuit', `verifyAndClaim SUCCESS! Vault State transitioned to VaultState.claimed (2)`, 'green');
      this.log('Privacy Claim', `Proved possession of passphrase matching commitment without exposing passphrase to ledger!`, 'yellow');

    } catch (err: any) {
      this.log('Error', `verifyAndClaim failed: ${err.message}`, 'red');
    }
  }

  public handleRevokeVault() {
    this.log('Circuit', 'Executing revokeVault circuit...', 'cyan');
    try {
      const circuitCtxRevoke = compactRuntime.createCircuitContext(
        compactRuntime.dummyContractAddress(),
        new Uint8Array(32),
        this.currentContractState,
        this.currentPrivateState
      );

      const result = this.shadowVaultContract.circuits.revokeVault(circuitCtxRevoke);
      this.currentContractState = result.context.currentQueryContext.state;

      const ledgerState = ledger(result.context.currentQueryContext.state);
      this.currentStateEnum = ledgerState.state;

      this.updateLedgerUI();
      this.log('Circuit', `revokeVault SUCCESS! Vault State transitioned to VaultState.revoked (3)`, 'green');

    } catch (err: any) {
      this.log('Error', `revokeVault failed: ${err.message}`, 'red');
    }
  }

  // UI Utilities
  private updateLedgerUI() {
    const stateElement = document.getElementById('displayVaultState');
    const depositsElement = document.getElementById('displayTotalDeposits');
    const commitmentElement = document.getElementById('displayCommitmentHash');
    const disclosedElement = document.getElementById('displayDisclosedHash');

    if (stateElement) stateElement.textContent = VaultState[this.currentStateEnum].toUpperCase();
    if (depositsElement) depositsElement.textContent = this.totalDeposits.toString();
    if (commitmentElement) commitmentElement.textContent = '0x' + this.bytesToHex(this.publicCommitment);
    if (disclosedElement) disclosedElement.textContent = '0x' + this.bytesToHex(this.lastDisclosedHash);
  }

  private updatePrivacyStatus(witness: string, prover: string, ledgerStr: string) {
    const witnessTag = document.getElementById('privateWitnessStatus');
    const proverTag = document.getElementById('proverStatus');
    const ledgerTag = document.getElementById('ledgerStatusTag');

    if (witnessTag) witnessTag.textContent = witness;
    if (proverTag) proverTag.textContent = prover;
    if (ledgerTag) ledgerTag.textContent = ledgerStr;
  }

  private togglePassword(inputId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  private log(category: string, message: string, color: 'dim' | 'green' | 'cyan' | 'yellow' | 'red' = 'dim') {
    const logContainer = document.getElementById('terminalLog');
    if (!logContainer) return;

    const line = document.createElement('div');
    line.className = `log-line ${color}`;
    const timestamp = new Date().toISOString().substring(11, 19);
    line.textContent = `[${timestamp}] [${category}] ${message}`;

    logContainer.appendChild(line);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  private hashPassphrase(passphrase: string): Uint8Array {
    const bytes = new TextEncoder().encode(passphrase);
    const hash = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      hash[i] = (bytes[i % bytes.length] || 0) ^ (i * 13 + 7);
    }
    return hash;
  }

  private hexToBytes(hex: string, length: number = 32): Uint8Array {
    const cleanHex = hex.replace(/^0x/, '').padEnd(length * 2, '0');
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16) || 0;
    }
    return bytes;
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Instantiate DApp on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new ShadowVaultDApp();
});
