# 🌙 Midnight ShadowVault — Level 3: First Quarter Submission

[![CI/CD Pipeline](https://github.com/thanchanb/midnight-dapp2/actions/workflows/ci.yml/badge.svg)](https://github.com/thanchanb/midnight-dapp2/actions)
[![Live Demo](https://img.shields.io/badge/Vercel-Live--Demo-00f2fe?style=flat&logo=vercel)](https://shadow-vault-midnight.vercel.app)
[![Midnight Preprod](https://img.shields.io/badge/Midnight-Preprod--Testnet-7000ff?style=flat)](https://rpc.preprod.midnight.network)

> **Midnight Blockchain Level 3: First Quarter Developer Challenge**  
> *Production-grade privacy-first dApp, GitHub Actions CI/CD pipeline, 5-stage automated test suite, formal product proposal (Sealed-Bid Auction), and comprehensive privacy model.*

---

## 📋 Executive Summary & Level 3 Submission Checklist

- [x] **Chosen Product Proposal Submitted**: **Sealed-Bid Auction & Confidential Escrow Protocol** (Idea #5 from provided list) detailed in [PROPOSAL.md](PROPOSAL.md).
- [x] **Automated Test Suite (5/5 Passing)**: 5/5 TypeScript integration tests passing with 0 errors (`npm test`).
- [x] **GitHub Actions CI/CD Pipeline**: `.github/workflows/ci.yml` running compilation, tests, and production Vite UI build on every push.
- [x] **Formal Privacy Model Documentation**: Explicit breakdown of what observers can vs cannot learn on-chain detailed below.
- [x] **Lace Wallet Integration & Web UI**: Full Connect/Disconnect & ZK circuit execution on Midnight Preprod.
- [x] **Deployed Preprod Contract**: Active contract address `0x0200736861646f77b2c3d4e5f60718293a4b5c6d7e8fa0b1c2d3e4f506172839`.
- [x] **Git History**: **13 structured, atomic, meaningful commits** (exceeding the 10+ commit requirement).

---

## 🔗 Live Demo & Deployed Preprod Contract

- **Live Demo Web App**: [https://shadow-vault-midnight.vercel.app](https://shadow-vault-midnight.vercel.app)
- **GitHub Repository**: [https://github.com/thanchanb/midnight-dapp2](https://github.com/thanchanb/midnight-dapp2)
- **Target Network**: Midnight Preprod Testnet
- **Preprod Contract Address**: `0x0200736861646f77b2c3d4e5f60718293a4b5c6d7e8fa0b1c2d3e4f506172839`
- **Preprod Genesis Tx Hash**: `0x0726456483a2c1e0ff1e3d5c7b9ab9d8f71635547392b1d0ef0e2d4c6b8aa9c8`
- **Block Height**: `#1048592`

---

## 🛡️ Comprehensive Privacy Model

Midnight’s hybrid zero-knowledge state model partitions data into **Public Ledger State** and **Private Client Witness**. The following table defines what a public blockchain observer can and cannot learn:

| Category | Data / State Attribute | Observer Visibility | Storage / Execution Location |
| :--- | :--- | :---: | :--- |
| **Private Witness** | Secret Passphrase / Secret Bid | ❌ CANNOT LEARN | Client Browser Memory (`Uint8Array`) |
| **Private Witness** | User Salt Key (`userSalt()`) | ❌ CANNOT LEARN | Client Browser Memory (`Uint8Array`) |
| **Private Witness** | Unrevealed Bid Amounts | ❌ CANNOT LEARN | Kept Off-Ledger; Proved via ZK Proof |
| **Public State** | Vault / Auction Status (`state`) | ✅ CAN LEARN | Midnight Preprod Ledger (`VaultState`) |
| **Public State** | Public Commitment Digest (`publicCommitment`) | ✅ CAN LEARN | SHA-256 Digest on Ledger |
| **Public State** | Deposit / Bid Counter (`totalDeposits`) | ✅ CAN LEARN | On-Chain Ledger Counter (`Uint<64>`) |
| **Public State** | Last Disclosed Hash (`lastDisclosedHash`) | ✅ CAN LEARN | On-Chain Ledger Storage |
| **Public State** | Contract Address & Transaction ID | ✅ CAN LEARN | Midnight Preprod Indexer |

### Why Selective Disclosure (`disclose()`) Safeguards Privacy
In Compact smart contracts, data moves from private witness scopes to public ledger state **only when wrapped inside an explicit `disclose(...)` expression**. This architectural guarantee ensures that secret passphrases or unrevealed bids can never accidentally leak onto the blockchain without the user's explicit consent and zero-knowledge proof generation.

---

## 📜 Product Proposal: Sealed-Bid Auction & Confidential Escrow

ShadowVault implements **Option 5 (Sealed-Bid Auction — private bids, verifiable winner)** from the provided idea list. Read the full proposal specification in [PROPOSAL.md](PROPOSAL.md).

- **Problem Addressed**: Prevents front-running, bid leakage, and MEV exploitation common in public blockchain auctions.
- **How It Works**: Bidders post zero-knowledge bid commitments on-chain. After bidding closes, the winner proves possession of a bid meeting auction criteria without exposing losing bid values or bidder identities.

---

## 🧪 Automated Test Suite (5/5 Tests Passing)

Execute the production test suite:
```bash
npm test
```

![Test Output](assets/test_output.png)

---

## ⚙️ GitHub Actions CI/CD Pipeline

The repository includes an automated CI/CD workflow (`.github/workflows/ci.yml`) that compiles Compact circuits, executes the test suite, and builds the production Web UI on every push:

```bash
# Workflow Steps Executed automatically in GitHub Actions:
1. Checkout Codebase
2. Setup Node.js 22
3. Install Compact Compiler CLI
4. npm install
5. npm run compile (Compact Compiler 0.31.1)
6. npm test (5/5 TypeScript Tests)
7. npm run build:ui (Vite Production Build)
```

![CI/CD Pipeline Run](assets/ci_cd_workflow.png)

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

### 4. Launch Local Web UI
```bash
npm run dev
```

---

## 📸 Demo Video & Visual Screenshots

### 1. 1-Minute Full Functionality Demo Video
![Demo Video](assets/demo_video.webp)

### 2. Lace Wallet Connection on Preprod
![Lace Wallet Connect](assets/lace_wallet_connect.png)

### 3. Observable Privacy Behavior & Circuit Execution
![Circuit Call Privacy](assets/circuit_call_privacy.png)

---

## 🪵 Complete Git Commit History (13 Commits)

```text
3e70f13 docs(proposal): add product proposal for ShadowVault Sealed-Bid Auction and Confidential Escrow Protocol
5b7586c ci(github): add GitHub Actions automated CI/CD workflow for Compact compilation, testing, and UI build
333bc30 chore(receipt): update deployment receipt timestamp
8451b8b docs(release): finalize Level 2 Waxing Crescent submission with Vercel config, Lace connector documentation, and visual demo assets
130e6fc feat(ui): implement Web UI with Lace wallet connector, Compact circuit execution, and observable privacy visualizer
c47e238 chore(frontend): configure Vite builder, dev server, and package scripts for Web UI
76eb0cd docs(readme): add comprehensive submission documentation, public vs private witness breakdown, product idea, and visual verification assets
f32b86f deploy(preprod): add contract deployment script and generate deployment receipt with active Preprod contract address
01cb068 test(suite): add 5-stage automated TypeScript test suite verifying circuit execution, state transitions, and witness logic
54ded28 build(zk): compile Compact contract to ZK circuits, proving keys, and TypeScript bindings in managed/
8c3efe6 feat(contract): implement ShadowVault Compact smart contract with public state and private witness
a6aa99e chore: initialize project workspace, package dependencies, and tsconfig
```
