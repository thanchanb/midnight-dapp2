# Security Policy & Incident Log (SECURITY.md)

## Security Architecture & Zero Hardcoded Secrets Policy

Midnight ShadowVault enforces a zero-trust cryptographic model:
1. **Zero Hardcoded Credentials:** No private keys, mnemonic seeds, storage passwords, or fallback credentials are permitted in source code, configuration, or environment files.
2. **Throwaway Test Wallet Only (`MIDNIGHT_WALLET_SEED`):**
   > [!IMPORTANT]
   > The environment variable `MIDNIGHT_WALLET_SEED` is reserved **exclusively** for throwaway test wallets on the Midnight Preprod testnet. It must **NEVER** hold real value, native mainnet assets, or production funds. Any wallet initialized from a test seed must be treated as transient and expendable.
3. **Private State Storage & Cryptographic Protection:**
   - **Where Private State is Stored:** Private state and signing keys are stored in an encrypted LevelDB database (`levelPrivateStateProvider`) under `shadow_vault_persistent_db` (or user-defined database name). In the browser environment, LevelDB is backed by browser-local storage (IndexedDB).
   - **How It Is Protected:** Midnight's `@midnight-ntwrk/midnight-js-level-private-state-provider` provides authenticated symmetric encryption using PBKDF2 key derivation and AES-GCM encryption (`aesGcmEncrypt` / `aesGcmDecrypt`). All data written to the private state store and signing key store is ciphertext.
   - **Password Requirements:** The storage password is supplied via `privateStoragePasswordProvider: () => string | Promise<string>`. In scripts/E2E, the password must come from `requireEnv('MIDNIGHT_STORAGE_PASSWORD')` or direct user input—**never a hardcoded default**. In the browser frontend (`src/app.ts`), it is generated dynamically with cryptographic entropy (`globalThis.crypto.getRandomValues(32)`) satisfying the length and complexity requirements (minimum 16 characters, containing uppercase, lowercase, digits, and special characters).
4. **Browser Wallet Security (No Seeds or Mnemonics in Frontend):**
   - The browser dApp (`src/app.ts`) interacts **strictly** via the Midnight DApp Connector API (`window.midnight.mnLace.enable()`).
   - The frontend never prompts for, parses, receives, or stores wallet seeds, recovery phrases, or mnemonic words.
   - All transaction balancing (`api.balanceTx(tx)`) and transaction submission (`api.submitTx(tx)`) are delegated to the user's secure browser extension wallet, keeping cryptographic root keys safely inside the wallet enclave.
5. **Fail-Fast Configuration:** If required environment variables (e.g. `MIDNIGHT_WALLET_COIN_PUBLIC_KEY`, `MIDNIGHT_STORAGE_PASSWORD`, `MIDNIGHT_WALLET_SEED`) are missing during deployment or live testing, the process fails fast with an explicit error and will never silently fall back to insecure default strings or placeholder keys.
6. **Contract Escrow Protection:** Funds and items are held directly by the smart contract via native token primitives (`receiveUnshielded` and `sendUnshielded`). Outbid refunds accumulate safely per bidder address, with zeroing before transfer to eliminate re-entrancy risks.

---

## Audit of Past Commits & Compromised Credential Incident Log

During the comprehensive audit of the repository's git commit history (`git log -p`), the following test passphrases, fallback strings, and placeholder values were identified in early prototype commits and are recorded as compromised:

| Commit Hash | Artifact / Variable | Description & Mitigation |
| :--- | :--- | :--- |
| `ce88509` / `de68c57` | `testSecretPassphrase = 'midnight_secret_e2e_verification_...'` | Sample test passphrase used in legacy test files. **Compromised & Invalidated.** Replaced with dynamic `crypto.getRandomValues(32)` ephemeral memory generation. |
| `ad99b36` | `SV_Deploy_..._!9aZSecKey` / `E2E_..._!9aZSecStorage` | Template storage passwords generated via fallback strings in `deploy.ts`. **Compromised & Invalidated.** Removed in favor of strict user-supplied `MIDNIGHT_STORAGE_PASSWORD` with fail-fast validation. |
| `829e1f0` | `Mdn!Priv8Vault2026#SecStorageState_...` | Prototype fallback password in `src/app.ts`. **Compromised & Invalidated.** Removed completely. Client storage encryption requires non-deterministic entropy satisfying complexity policies. |
| `829e1f0` | `00`.repeat(32), `11`.repeat(32), `22`.repeat(32) | Test placeholder public keys in test scripts. Removed and replaced with authentic wallet derivation or explicit test fixtures. |

> **Warning:** None of the above credentials should ever be used on any network (DevNet, Preprod, or MainNet). Any wallet or address generated using these strings must be considered permanently compromised.

---

## Secret Scanning & CI Integration

The repository includes an automated secret scanner (`scripts/scan_secrets.py`) integrated into `npm test` and GitHub Actions CI (`.github/workflows/ci.yml`). The scanner checks:
- Any occurrence of `process.env.<VAR> || <string>` fallback patterns
- Hardcoded private keys, seed phrases, or mnemonics in working files
- Plaintext storage keys in client files
- Exposed `.env` files or tokens
- Full git commit history (`git log -p`) for committed seeds or raw private keys
