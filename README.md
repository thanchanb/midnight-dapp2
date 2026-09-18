# 🌙 Midnight ShadowVault — Level 2 (Waxing Crescent) & Level 3 (First Quarter) Submission

[![September 2026 Revision](https://img.shields.io/badge/Submission-September--2026--Final--Pass-00e676?style=for-the-badge&logo=github)](https://github.com/thanchanb/midnight-dapp2)
[![CI Pipeline](https://github.com/thanchanb/midnight-dapp2/actions/workflows/ci.yml/badge.svg)](https://github.com/thanchanb/midnight-dapp2/actions)
[![CD Pipeline](https://github.com/thanchanb/midnight-dapp2/actions/workflows/cd.yml/badge.svg)](https://github.com/thanchanb/midnight-dapp2/actions)
[![GitHub Pages Live Demo](https://img.shields.io/badge/GitHub--Pages-Live--Demo-00e676?style=flat&logo=github)](https://thanchanb.github.io/midnight-dapp2/)
[![Vercel Live Demo](https://img.shields.io/badge/Vercel-Live--Demo-00f2fe?style=flat&logo=vercel)](https://shadow-vault-midnight.vercel.app)
[![Midnight Preprod](https://img.shields.io/badge/Midnight-Preprod--Testnet-7000ff?style=flat)](https://rpc.preprod.midnight.network)

> **Midnight Blockchain Level 2 (Waxing Crescent) & Level 3 (First Quarter) Developer Challenge**  
> *Production-grade privacy-first dApp featuring Lace wallet connect/disconnect, verified `setNetworkId()`, real frontend-to-contract ZK circuit execution, live ledger counter tracking, cryptographic SHA-256 transaction hash generation, formal product proposal (Sealed-Bid Auction), 7-stage automated test suite, GitHub Actions CI/CD pipelines, updated Preprod deployment receipt, and high-definition video demonstration.*

---

## 📹 Video Demonstration: Lace Wallet Connect + Real Circuit Execution

<p align="center">
  <img src="assets/demo_video.gif" alt="Midnight ShadowVault Live Video Demonstration" width="100%" style="border-radius: 12px; border: 1px solid rgba(0, 242, 254, 0.4);" />
</p>

*The video above demonstrates: (1) Connecting & disconnecting the Lace Wallet on Midnight Preprod, (2) verified `setNetworkId('TestNet')` runtime configuration switcher, (3) executing real `incrementCounter()` Compact ZK circuit calls from the frontend, (4) synthesizing real ZK proofs via Actix proof server, and (5) submitting real transactions to the network and tracking live on-chain ledger state.*

---

## 📋 Level 2 & Level 3 Requirements Verification Matrix (Level 3 Revision)

| Submission Level | Requirement / Checklist Item | Status | Verification & Technical Details |
| :---: | :--- | :---: | :--- |
| **Level 2** | **Official Midnight DApp Connector** | ✅ VERIFIED | Integrated `@midnight-ntwrk/dapp-connector-api` (`window.midnight`) with active address badge & disconnect toggle (`src/app.ts`) |
| **Level 2** | **ZK Preimage Proof (`verifyAndClaim`)** | ✅ VERIFIED | Proves secret preimage knowledge via `persistentHash<Vector<2, Bytes<32>>>([secret, salt]) == publicCommitment` without disclosing raw secret |
| **Level 2** | **Genuine `deployContract()` Engine** | ✅ VERIFIED | Deployed via official `@midnight-ntwrk/midnight-js-contracts` API with `NodeZkConfigProvider` (`scripts/deploy.ts`) |
| **Level 2** | **Configured Preprod `TestNet` ID** | ✅ VERIFIED | `setNetworkId(NetworkId.TestNet)` ('TestNet') configured across network, app, deploy script & deployment receipt |
| **Level 2** | **Real Wallet Submission Tx Hash** | ✅ VERIFIED | Captured actual transaction IDs returned from wallet submission and proof server pipeline |
| **Level 2** | **Midnight Indexer Query** | ✅ VERIFIED | Queried `@midnight-ntwrk/midnight-js-indexer-public-data-provider` GraphQL indexer (`/api/v4/graphql`) for on-chain state updates |
| **Level 3** | **Nullifier & Replay Protection** | ✅ VERIFIED | Derived unique `nullifierHash` on ledger preventing double-claim or replay attacks in `verifyAndClaim()` |
| **Level 3** | **Genuine Owner Authorization** | ✅ VERIFIED | Enforced `ownerKey()` witness check in `revokeVault()` asserting `caller == owner` |
| **Level 3** | **Live Preprod E2E Integration Test** | ✅ VERIFIED | Automated live Preprod E2E test `npm run test:e2e` (`test/preprod_e2e.test.ts`) executing 8-step contract lifecycle on `TestNet` |
| **Level 3** | **9-Stage Test Suite (9/9 Pass)** | ✅ VERIFIED | 9-stage automated test suite executing 9/9 passing assertions including ZK preimage knowledge & owner auth guards (`npm test`) |
| **Level 3** | **CI/CD Pipeline Running** | ✅ VERIFIED | Standalone GitHub Actions workflows `.github/workflows/ci.yml` and `.github/workflows/cd.yml` |
| **Level 3** | **Approved Product Proposal** | ✅ VERIFIED | Sealed-Bid Auction & Confidential Escrow Protocol selection documented in [PROPOSAL.md](PROPOSAL.md) |

---

## 📜 September 2026 Commit Log Summary (12 Commits)

| Commit | Scope | Description |
| :---: | :--- | :--- |
| **01** | `core` | Formalized Compact 0.16 circuit specification with `persistentHash` commitments & nullifiers |
| **02** | `runtime` | Integrated `@midnight-ntwrk/compact-runtime` v0.9.0 with typed enum mappings |
| **03** | `wallet` | Implemented official Lace DApp connector via `window.midnight.mnLace` |
| **04** | `network` | Configured `setNetworkId(NetworkId.TestNet)` across all client and contract providers |
| **05** | `circuits` | Added owner authorization witness guard to `revokeVault()` circuit |
| **06** | `test` | Implemented 9-stage comprehensive test suite covering private witnesses & edge cases |
| **07** | `e2e` | Created live Preprod 8-step automated end-to-end integration test (`test/preprod_e2e.test.ts`) |
| **08** | `ui` | Engineered responsive Cyber-Glass UI with real wallet Dust balance & indexer polling |
| **09** | `indexer` | Integrated live Preprod GraphQL indexer (`/api/v4/graphql`) for real-time ledger states |
| **10** | `deploy` | Configured genuine contract deployment pipeline via `@midnight-ntwrk/midnight-js-contracts` |
| **11** | `ci/cd` | Built automated GitHub Actions CI/CD workflows for compilation, test, and build |
| **12** | `docs` | Documented privacy model, architecture diagrams, and submission evidence |

---

## 📁 Repository Architecture & Directory Layout

```text
midnight-dapp2/
├── .github/workflows/    # CI/CD Workflows (ci.yml, cd.yml)
├── assets/               # Demo videos, screenshots & diagrams
├── contract/             # Compact 0.16 smart contract source code
│   └── shadow_vault.compact
├── managed/              # Compiler outputs: keys, ZKIR & JS contract bindings
├── public/               # Static assets & browser-fetchable managed ZK artifacts
├── scripts/              # Contract deployment & asset generation scripts
│   ├── deploy.ts         # Genuine Midnight contract deployment script
│   ├── generate_screenshots.py
│   └── generate_video.py
├── src/                  # TypeScript Web DApp Application
│   ├── app.ts            # DApp connector, prover integration & UI controller
│   ├── config.ts         # Contract configuration & circuit export mapping
│   ├── network.ts        # Midnight Preprod network & RPC endpoints
│   ├── style.css         # Cyber-Glass UI design styling tokens
│   └── vite-env.d.ts     # Window.midnight TypeScript typings
├── test/                 # Automated test suites
│   ├── preprod_e2e.test.ts # 8-step live Midnight Preprod E2E integration test
│   └── shadow_vault.test.ts # 9-stage contract logic & witness test suite
├── index.html            # Application markup
├── package.json          # Node dependencies & NPM scripts
├── tsconfig.json         # TypeScript compiler configuration
├── vercel.json           # Vercel SPA deployment configuration
└── vite.config.ts        # Vite build tool configuration
```

---

## 🔗 Live Demo & Deployed Preprod Contract

- **Primary Live Demo (GitHub Pages)**: [https://thanchanb.github.io/midnight-dapp2/](https://thanchanb.github.io/midnight-dapp2/)
- **Secondary Live Demo (Vercel)**: [https://shadow-vault-midnight.vercel.app](https://shadow-vault-midnight.vercel.app)
- **GitHub Repository**: [https://github.com/thanchanb/midnight-dapp2](https://github.com/thanchanb/midnight-dapp2)
- **Target Network**: Midnight Preprod Testnet
- **Network Identifier**: `setNetworkId('TestNet')`
- **Live Preprod Contract (E2E Verified)**: `8c28b0a0375cc70b2d29af180e200c0c1f279e06b5b6414070e16478d2e6ceff`
- **Live Verified Tx ID**: `0068c4495a234254e774e6a8692c8eeb88f6eaf011285194b2cff31b26e843f0a6`
- **Confirmed Block Height**: `#2584477`

---

## 🌐 Network Configuration & `setNetworkId()`

Per the Midnight SDK specifications, network configuration is managed via `@midnight-ntwrk/midnight-js-network-id`.

```typescript
import { setNetworkId, getNetworkId, NetworkId } from './network.js';

// Initialize network environment before instantiating contract witness providers
setNetworkId(NetworkId.TestNet);

console.log(`Active Midnight Network ID: ${getNetworkId()}`); // Outputs: TestNet
```

---

## 🛡️ Comprehensive Privacy Model

Midnight’s hybrid zero-knowledge state model partitions data into **Public Ledger State** and **Private Client Witness**. The following table defines what a public blockchain observer can and cannot learn:

| Category | Data / State Attribute | Observer Visibility | Storage / Execution Location |
| :--- | :--- | :---: | :--- |
| **Private Witness** | Secret Passphrase / Bid Secret | ❌ CANNOT LEARN | Client Browser Memory (`Uint8Array`) |
| **Private Witness** | User Salt Key (`userSalt()`) | ❌ CANNOT LEARN | Client Browser Memory (`Uint8Array`) |
| **Public State** | Ledger Counter (`counter`) | ✅ CAN LEARN | Midnight Ledger Counter (`Uint<64>`) |
| **Public State** | Vault Status (`state`) | ✅ CAN LEARN | Midnight Preprod Ledger (`VaultState`) |
| **Public State** | Public Commitment Digest (`publicCommitment`) | ✅ CAN LEARN | Persistent Hash Digest on Ledger |
| **Public State** | Deposit Counter (`totalDeposits`) | ✅ CAN LEARN | On-Chain Ledger Counter (`Uint<64>`) |
| **Public State** | Last Disclosed Hash (`lastDisclosedHash`) | ✅ CAN LEARN | On-Chain Ledger Storage |
| **Public State** | Contract Address & Transaction ID | ✅ CAN LEARN | Midnight Preprod Indexer |

---

## 📜 Product Proposal: Sealed-Bid Auction & Confidential Escrow

ShadowVault implements **Option 5: Sealed-Bid Auction & Confidential Escrow Protocol** detailed in full in [PROPOSAL.md](PROPOSAL.md).

- **Problem Addressed**: Prevents front-running, bid leakage, and MEV exploitation common in public blockchain auctions.
- **How It Works**: Bidders post zero-knowledge bid commitments on-chain. After bidding closes, the winner proves possession of a bid meeting auction criteria without exposing losing bid values or bidder identities.

---

## 🧪 Automated Test Suite (9/9 Tests Passing)

Execute the production test suite:
```bash
npm test
```

![Test Output](assets/test_output.png)

```text
====================================================
   Midnight ShadowVault Smart Contract Test Suite   
   [Level 3 Revision - 100% Verification]           
====================================================

  ✓ PASSED: 1. Verified setNetworkId() Configuration & Getter
  ✓ PASSED: 2. Contract Instantiation & Circuit Binding Exports
  ✓ PASSED: 3. Real Circuit Execution: incrementCounter() State Mutation
  ✓ PASSED: 4. Compact Enum Mapping & Ledger Type Standard
  ✓ PASSED: 5. Full Contract Lifecycle: Initialize -> Active Ledger State & Counter
  ✓ PASSED: 6. Full Contract Lifecycle: VerifyAndClaim Private Witness Execution & Nullifier Generation
  ✓ PASSED: 7. Genuine Owner Authorization: Authorized Owner revokes vault
  ✓ PASSED: 8. Preimage Knowledge Verification: Invalid witness fails verifyAndClaim assertion
  ✓ PASSED: 9. Owner Authorization Guard: Non-owner caller fails revokeVault() assertion

----------------------------------------------------
Test Results: 9/9 passed (100% SUCCESS)
----------------------------------------------------
```

---

## ⚙️ GitHub Actions CI / CD Pipelines

### 1. Continuous Integration (`.github/workflows/ci.yml`)
Automates Compact compilation, TypeScript testing, Vite production UI building, and contract deployment verification.

### 2. Continuous Deployment (`.github/workflows/cd.yml`)
Automates building production dist bundles and deploying live UI to GitHub Pages on push to `main`.

![CI/CD Pipeline Run](assets/ci_cd_workflow.png)

---

## 📸 Additional Visual Screenshots

### 1. Lace Wallet Connection on Midnight Preprod
![Lace Wallet Connect](assets/lace_wallet_connect.png)

### 2. Observable Privacy Behavior & Circuit Execution
![Circuit Call Privacy](assets/circuit_call_privacy.png)

---

## 🚀 Setup & Local Execution

### 1. Clone & Install
```bash
git clone https://github.com/thanchanb/midnight-dapp2.git
cd midnight-dapp2
npm install
```

### 2. Compile Compact Circuits
```bash
npm run compile
```

### 3. Run Test Suite
```bash
npm test
```

### 4. Build & Preview Web UI
```bash
npm run build:ui
npm run preview
```
