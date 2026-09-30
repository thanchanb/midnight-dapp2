import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  setNetworkId,
  getNetworkId,
  NetworkId,
  NetworkEnvironment,
  canonicalizeNetwork,
  isValidNetworkId,
  validateNetworkId,
  validateWalletNetwork,
  getNetworkDetails,
  validateNodeNetworkIdentity,
  validateIndexerNetworkIdentity,
  validateProofServerConnection,
  validateIndexerConnection,
} from '../src/network.js';
import {
  validateBidFormInputs,
  derivePartyIdentity,
  createWitnesses,
  generateRandomBytes,
} from '../src/api.js';
import { ShadowVaultAuctionDApp } from '../src/app.js';

describe('Midnight ShadowVault Frontend & UI Component Test Suite (Vitest + JSDOM)', () => {
  let app: ShadowVaultAuctionDApp;
  const htmlContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');

  beforeEach(() => {
    // Render real index.html structure into JSDOM document
    document.documentElement.innerHTML = htmlContent;

    // Reset localStorage & crypto mock
    localStorage.clear();
    setNetworkId(NetworkId.TestNet);

    // Instantiate real app against JSDOM document
    app = new ShadowVaultAuctionDApp();
  });

  afterEach(() => {
    delete (window as any).midnight;
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Bid Form Validation Errors & Inputs
  // --------------------------------------------------------------------------
  describe('1. Bid Form Validation', () => {
    it('1A. Accepts valid bid amount and valid refund payout address', () => {
      const valid = validateBidFormInputs('5000', 'mn1q8x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s');
      expect(valid.amount).toBe(5000n);
      expect(valid.address).toBe('mn1q8x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s');
    });

    it('1B. Strictly rejects zero or negative bids', () => {
      expect(() => validateBidFormInputs('0', 'mn1q8x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s'))
        .toThrowError(/Bid amount must be strictly greater than zero/);
      expect(() => validateBidFormInputs('-100', 'mn1q8x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s'))
        .toThrowError(/Bid amount must be strictly greater than zero/);
    });

    it('1C. Strictly rejects empty bid or missing refund address', () => {
      expect(() => validateBidFormInputs('', 'mn1q8x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s'))
        .toThrowError(/Bid amount cannot be empty/);
      expect(() => validateBidFormInputs('1000', ''))
        .toThrowError(/Bidder refund payout address is required/);
      expect(() => validateBidFormInputs('1000', 'short'))
        .toThrowError(/Invalid payout address format: address is too short/);
    });

    it('1D. UI bid submission triggers error banner on empty input', async () => {
      const bidInput = document.getElementById('bidAmountInput') as HTMLInputElement;
      if (bidInput) bidInput.value = '';

      await app.handleSubmitBid();

      const banner = document.getElementById('walletErrorBanner');
      const msg = document.getElementById('walletErrorMsg');
      expect(banner?.style.display).toBe('flex');
      expect(msg?.textContent).toContain('Submit Bid Failed');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Real UI Component State: Wallet Disconnected / Connecting / Connected / Error
  // --------------------------------------------------------------------------
  describe('2. Real UI Wallet Lifecycle States', () => {
    it('2A. Initial State: Wallet is disconnected with default UI', () => {
      const btnText = document.getElementById('walletBtnText');
      const balanceBox = document.getElementById('walletBalanceBox');
      const banner = document.getElementById('walletErrorBanner');

      expect(btnText?.textContent).toBe('Connect Lace Wallet');
      expect(balanceBox?.style.display).toBe('none');
      expect(banner?.style.display).toBe('none');
    });

    it('2B. Error State: Missing Lace wallet extension shows visible error banner', async () => {
      delete (window as any).midnight;

      await app.connectWallet();

      const banner = document.getElementById('walletErrorBanner');
      const msg = document.getElementById('walletErrorMsg');
      const btnText = document.getElementById('walletBtnText');

      expect(banner?.style.display).toBe('flex');
      expect(msg?.textContent).toBe('Midnight Lace wallet extension is not installed or detected.');
      expect(btnText?.textContent).toBe('Connect Lace Wallet');

      // Dismiss error banner via close button
      const closeBtn = document.getElementById('walletErrorClose');
      closeBtn?.click();
      expect(banner?.style.display).toBe('none');
    });

    it('2C. Connected State: Real UI renders wallet address and dust balance', async () => {
      const mockAddress = 'mn1q8x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s';
      const mockState = {
        address: mockAddress,
        coinPublicKey: '11'.repeat(32),
        encryptionPublicKey: '22'.repeat(32),
        balance: '75000000',
      };

      (window as any).midnight = {
        mnLace: {
          enable: vi.fn().mockResolvedValue({
            state: vi.fn().mockResolvedValue(mockState),
          }),
        },
      };

      await app.connectWallet();

      const btn = document.getElementById('connectWalletBtn');
      const btnText = document.getElementById('walletBtnText');
      const balanceBox = document.getElementById('walletBalanceBox');
      const balanceVal = document.getElementById('walletBalanceVal');
      const banner = document.getElementById('walletErrorBanner');

      expect(btn?.classList.contains('connected')).toBe(true);
      expect(btnText?.textContent).toBe('mn1q8x9a...8r9s');
      expect(balanceBox?.style.display).toBe('flex');
      expect(balanceVal?.textContent).toBe('75000000 Dust');
      expect(banner?.style.display).toBe('none');
    });

    it('2D. Connected State: Connects via official DApp connector spec (connect, getUnshieldedAddress, getDustBalance)', async () => {
      const mockUnshielded = 'mn1official_preprod_wallet_address_987654321';
      const mockShielded = {
        shieldedAddress: 'mn1shielded_wallet_addr_123',
        shieldedCoinPublicKey: 'aa'.repeat(32),
        shieldedEncryptionPublicKey: 'bb'.repeat(32),
      };

      (window as any).midnight = {
        lace: {
          name: 'Midnight Lace Official',
          connect: vi.fn().mockResolvedValue({
            getUnshieldedAddress: vi.fn().mockResolvedValue({ unshieldedAddress: mockUnshielded }),
            getShieldedAddresses: vi.fn().mockResolvedValue(mockShielded),
            getDustBalance: vi.fn().mockResolvedValue({ cap: 100000000n, balance: 42000000n }),
            getConfiguration: vi.fn().mockResolvedValue({ networkId: 'preprod' }),
          }),
        },
      };

      await app.connectWallet();

      const btn = document.getElementById('connectWalletBtn');
      const btnText = document.getElementById('walletBtnText');
      const balanceBox = document.getElementById('walletBalanceBox');
      const balanceVal = document.getElementById('walletBalanceVal');
      const banner = document.getElementById('walletErrorBanner');

      expect(btn?.classList.contains('connected')).toBe(true);
      expect(btnText?.textContent).toBe('mn1offic...4321');
      expect(balanceBox?.style.display).toBe('flex');
      expect(balanceVal?.textContent).toBe('42000000 Dust');
      expect(banner?.style.display).toBe('none');
    });

    it('2E. Network Switch: UI dropdown updates active network and re-initializes providers', () => {
      const select = document.getElementById('networkSelect') as HTMLSelectElement;
      if (select) {
        select.value = 'preview';
        select.dispatchEvent(new Event('change'));
      }

      const badge = document.getElementById('verifiedNetworkName');
      expect(badge?.textContent).toBe('Verified: preview');
      expect(getNetworkId()).toBe(NetworkId.Preview);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Network Identity, Pinned Values & Wrong-Network State
  // --------------------------------------------------------------------------
  describe('3. Network Identity Guards & Wrong-Network Detection', () => {
    it('3A. Wallet network sync updates verified badge to Preprod', async () => {
      const preprodAddress = 'mn1testnet_preprod_wallet_1234567890abcdef';
      (window as any).midnight = {
        mnLace: {
          enable: vi.fn().mockResolvedValue({
            state: vi.fn().mockResolvedValue({
              address: preprodAddress,
              coinPublicKey: '11'.repeat(32),
              encryptionPublicKey: '22'.repeat(32),
              balance: '1000',
            }),
          }),
        },
      };

      await app.connectWallet();

      const badge = document.getElementById('verifiedNetworkName');
      expect(badge?.textContent).toBe('Verified: TestNet');
      expect(getNetworkId()).toBe(NetworkId.TestNet);
    });

    it('3B. Wallet on Preview triggers Preview network sync', async () => {
      const previewAddress = 'mn1preview_wallet_1234567890abcdef';
      (window as any).midnight = {
        mnLace: {
          enable: vi.fn().mockResolvedValue({
            state: vi.fn().mockResolvedValue({
              address: previewAddress,
              coinPublicKey: '11'.repeat(32),
              encryptionPublicKey: '22'.repeat(32),
              balance: '1000',
            }),
          }),
        },
      };

      await app.connectWallet();

      const badge = document.getElementById('verifiedNetworkName');
      expect(badge?.textContent).toBe('Verified: preview');
      expect(getNetworkId()).toBe(NetworkId.Preview);
    });

    it('3C. Rejects cross-network execution between Preview and Preprod symmetrically', () => {
      expect(() => validateWalletNetwork('preview', 'preprod'))
        .toThrowError(/Preprod and Preview environments cannot be mixed/);
      expect(() => validateWalletNetwork('preprod', 'preview'))
        .toThrowError(/Preprod and Preview environments cannot be mixed/);
      expect(() => validateWalletNetwork('Midnight Preview Testnet', 'Midnight Preprod Testnet'))
        .toThrowError(/Preprod and Preview environments cannot be mixed/);
      expect(() => validateWalletNetwork('Midnight Preprod Testnet', 'Midnight Preview Testnet'))
        .toThrowError(/Preprod and Preview environments cannot be mixed/);
    });

    it('3D. canonicalizeNetwork rejects invalid strings and unknown networks', () => {
      expect(() => canonicalizeNetwork('')).toThrowError(/Invalid network identifier/);
      expect(() => canonicalizeNetwork('   ')).toThrowError(/Invalid network identifier/);
      expect(() => canonicalizeNetwork(null as any)).toThrowError(/Invalid network identifier/);
      expect(() => canonicalizeNetwork('unknown_network_xyz')).toThrowError(/Unknown or unsupported network identifier/);
      expect(canonicalizeNetwork('preprod')).toBe(NetworkEnvironment.Preprod);
      expect(canonicalizeNetwork('preview')).toBe(NetworkEnvironment.Preview);
      expect(canonicalizeNetwork('devnet')).toBe(NetworkEnvironment.DevNet);
      expect(canonicalizeNetwork('undeployed')).toBe(NetworkEnvironment.Undeployed);
      expect(canonicalizeNetwork('mainnet')).toBe(NetworkEnvironment.MainNet);
    });

    it('3E. isValidNetworkId validates alias mappings', () => {
      expect(isValidNetworkId('')).toBe(false);
      expect(isValidNetworkId(null as any)).toBe(false);
      expect(isValidNetworkId('random_network')).toBe(false);
      expect(isValidNetworkId('preprod')).toBe(true);
      expect(isValidNetworkId('preview')).toBe(true);
      expect(isValidNetworkId('TestNet')).toBe(true);
    });

    it('3F. Node Identity: Refuses node response with mismatching chain name', async () => {
      const fakeFetchMismatch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: 'Midnight Preview', // Mismatch: returned Preview when Preprod expected
        }),
      });

      await expect(
        validateNodeNetworkIdentity(
          'https://rpc.preprod.midnight.network',
          NetworkEnvironment.Preprod,
          fakeFetchMismatch as any
        )
      ).rejects.toThrowError(/FATAL NETWORK MISMATCH/);
    });

    it('3G. Node Identity: Handles node HTTP errors, RPC errors, and invalid results', async () => {
      const httpErrorFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });
      await expect(
        validateNodeNetworkIdentity('http://bad-node', NetworkEnvironment.Preprod, httpErrorFetch as any)
      ).rejects.toThrowError(/Failed to query node RPC at http:\/\/bad-node: HTTP 503/);

      const rpcErrorFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, error: { code: -32600, message: 'Invalid Request' } }),
      });
      await expect(
        validateNodeNetworkIdentity('http://rpc-err-node', NetworkEnvironment.Preprod, rpcErrorFetch as any)
      ).rejects.toThrowError(/Node RPC error from http:\/\/rpc-err-node/);

      const invalidResultFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: null }),
      });
      await expect(
        validateNodeNetworkIdentity('http://invalid-node', NetworkEnvironment.Preprod, invalidResultFetch as any)
      ).rejects.toThrowError(/returned invalid system_chain result/);
    });

    it('3H. Node Identity: Validates matching genesis hash and rejects mismatching node genesis hash', async () => {
      const validGenesisHash = '0x011b7d34bf42b102b542023d6a5996cb03ae1ef4f7c234a991820fc129e925c4';
      const fakeFetchMatching = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: 1, result: 'Midnight Preprod' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: 2, result: validGenesisHash }),
        });

      const res = await validateNodeNetworkIdentity(
        'https://rpc.preprod.midnight.network',
        NetworkEnvironment.Preprod,
        fakeFetchMatching as any
      );
      expect(res.chainName).toBe('Midnight Preprod');
      expect(res.genesisHash).toBe(validGenesisHash);

      const fakeFetchMismatchedGenesis = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: 1, result: 'Midnight Preprod' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: 2, result: '0x9999999999999999999999999999999999999999999999999999999999999999' }),
        });

      await expect(
        validateNodeNetworkIdentity(
          'https://rpc.preprod.midnight.network',
          NetworkEnvironment.Preprod,
          fakeFetchMismatchedGenesis as any
        )
      ).rejects.toThrowError(/FATAL NODE GENESIS MISMATCH/);
    });

    it('3I. Indexer Identity: Queries GraphQL for chain identity and validates matching genesis hash', async () => {
      const validGenesisHash = '0x011b7d34bf42b102b542023d6a5996cb03ae1ef4f7c234a991820fc129e925c4';
      const fakeFetchIndexer = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            genesis: { height: 0, hash: validGenesisHash },
            latest: { height: 1250, hash: '0xabcdef123456' },
          },
        }),
      });

      const res = await validateIndexerNetworkIdentity(
        'https://indexer.preprod.midnight.network/api/v4/graphql',
        NetworkEnvironment.Preprod,
        undefined,
        fakeFetchIndexer as any
      );
      expect(res.height).toBe(1250);
      expect(res.hash).toBe('0xabcdef123456');
      expect(res.genesisHash).toBe(validGenesisHash);
    });

    it('3J. Indexer Identity: Rejects indexer HTTP error, GraphQL error, invalid structure, and genesis mismatch', async () => {
      const httpErrorFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
      });
      await expect(
        validateIndexerNetworkIdentity('http://bad-indexer', NetworkEnvironment.Preprod, undefined, httpErrorFetch as any)
      ).rejects.toThrowError(/Failed to query indexer at http:\/\/bad-indexer: HTTP 502/);

      const gqlErrorFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ errors: [{ message: 'Syntax Error in GraphQL' }] }),
      });
      await expect(
        validateIndexerNetworkIdentity('http://gql-err', NetworkEnvironment.Preprod, undefined, gqlErrorFetch as any)
      ).rejects.toThrowError(/Indexer GraphQL error at http:\/\/gql-err: Syntax Error in GraphQL/);

      const invalidBlockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { block: null } }),
      });
      await expect(
        validateIndexerNetworkIdentity('http://invalid-block', NetworkEnvironment.Preprod, undefined, invalidBlockFetch as any)
      ).rejects.toThrowError(/returned invalid block structure/);

      const genesisMismatchFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            genesis: { height: 0, hash: '0xdeadbeef1234567890' },
            latest: { height: 500, hash: '0x123456' },
          },
        }),
      });
      await expect(
        validateIndexerNetworkIdentity(
          'https://indexer.preview.midnight.network/api/v4/graphql',
          NetworkEnvironment.Preprod,
          undefined,
          genesisMismatchFetch as any
        )
      ).rejects.toThrowError(/FATAL INDEXER CHAIN MISMATCH/);
    });

    it('3K. Proof Server Connection and Indexer Connection checks', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({ status: 200 });
      expect(await validateProofServerConnection('http://localhost:6300')).toBe(true);

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      expect(await validateProofServerConnection('http://offline-server:6300')).toBe(false);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { block: { height: 42, hash: '0xabc' } } }),
      });
      const conn = await validateIndexerConnection('http://localhost:8088');
      expect(conn.height).toBe(42);
      expect(conn.hash).toBe('0xabc');

      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, statusText: 'Not Found' });
      await expect(validateIndexerConnection('http://bad-url')).rejects.toThrowError(/Failed to query indexer/);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { block: { height: 'not-a-number', hash: 123 } } }),
      });
      await expect(validateIndexerConnection('http://bad-structure')).rejects.toThrowError(/returned invalid block structure/);

      globalThis.fetch = originalFetch;
    });

    it('3L. Node Identity: Non-fatal catch when genesis hash query endpoint fails', async () => {
      const fakeFetchWithGenesisFailure = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: 1, result: 'Midnight DevNet' }),
        })
        .mockRejectedValueOnce(new Error('genesis endpoint unavailable'));

      const res = await validateNodeNetworkIdentity(
        'http://localhost:9944',
        NetworkEnvironment.DevNet,
        fakeFetchWithGenesisFailure as any
      );
      expect(res.chainName).toBe('Midnight DevNet');
      expect(res.genesisHash).toBeUndefined();
    });

    it('3M. Indexer Identity: Accepts fallback block property and indexer without genesis block', async () => {
      const fallbackBlockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            block: { height: 999, hash: '0xfallback123' },
          },
        }),
      });

      const res = await validateIndexerNetworkIdentity(
        'http://pruned-indexer',
        NetworkEnvironment.Preprod,
        undefined,
        fallbackBlockFetch as any
      );
      expect(res.height).toBe(999);
      expect(res.hash).toBe('0xfallback123');
      expect(res.genesisHash).toBeUndefined();
    });

    it('3N. Proof server connection handles fetch errors gracefully', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = () => { throw new Error('Fetch hard crash'); };
      expect(await validateProofServerConnection('http://localhost:6300')).toBe(false);
      globalThis.fetch = originalFetch;
    });
  });

  // --------------------------------------------------------------------------
  // 4. Transaction UI States (Pending, Confirmed, Failed)
  // --------------------------------------------------------------------------
  describe('4. Transaction UI Lifecycle States', () => {
    it('4A. UI displays transaction progress tags and updates terminal', () => {
      const wEl = document.getElementById('privateWitnessStatus');
      const pEl = document.getElementById('proverStatus');
      const lEl = document.getElementById('ledgerStatusTag');
      const terminal = document.getElementById('terminalLog');

      expect(wEl?.textContent).toBe('🔒 Secret Key Witness');
      expect(pEl?.textContent).toBe('⚡ Prover Ready');
      expect(lEl?.textContent).toBe('📜 Indexer Verified');

      // Check terminal log contains initial initialization log
      expect(terminal?.textContent).toContain('ShadowVault transparent English auction initialized');
    });

    it('4B. Dispatches contract call failure to error banner', async () => {
      // Calling circuit before joining contract triggers error banner
      await app.handleCancelAuction();

      const banner = document.getElementById('walletErrorBanner');
      const msg = document.getElementById('walletErrorMsg');

      expect(banner?.style.display).toBe('flex');
      expect(msg?.textContent).toContain('Cancel Failed: Join or deploy a contract first.');
    });

    it('4C. Clears terminal log on button click', () => {
      const terminal = document.getElementById('terminalLog');
      expect(terminal?.children.length).toBeGreaterThan(0);

      const clearBtn = document.getElementById('btnClearLog');
      clearBtn?.click();

      expect(terminal?.children.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Direct Module Verification
  // --------------------------------------------------------------------------
  describe('5. Cryptographic Identity & Network Config Verification', () => {
    it('5A. derivePartyIdentity is strictly deterministic', () => {
      const secret = generateRandomBytes(32);
      const id1 = derivePartyIdentity(secret);
      const id2 = derivePartyIdentity(secret);
      expect(id1.length).toBe(32);
      expect(Buffer.from(id1).toString('hex')).toBe(Buffer.from(id2).toString('hex'));
    });

    it('5B. createWitnesses passes secretKey to witness context', () => {
      const secret = generateRandomBytes(32);
      const w = createWitnesses({ secretKey: secret });
      const [ps, returnedKey] = w.secretKey({
        privateState: { role: 'seller' },
        ledger: {} as any,
        contractAddress: '00'.repeat(32) as any,
      });
      expect(returnedKey).toEqual(secret);
      expect(ps).toEqual({ role: 'seller' });
    });

    it('5C. getNetworkDetails separates Preprod and Preview cleanly', () => {
      const defaultDetails = getNetworkDetails();
      expect(defaultDetails.id).toBeDefined();
      const preprod = getNetworkDetails(NetworkId.TestNet);
      const preview = getNetworkDetails(NetworkId.Preview);
      expect(preprod.isPreprod).toBe(true);
      expect(preview.isPreprod).toBe(false);
      expect(preprod.indexerUrl).not.toBe(preview.indexerUrl);
    });
  });
});
