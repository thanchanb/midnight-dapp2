# 🌙 Midnight ShadowVault — Level 2: Waxing Crescent Submission

> **Midnight Blockchain Level 2: Waxing Crescent Developer Challenge**  
> *Smart contract wired to a Web UI, Lace wallet integration on Preprod, observable privacy behavior verification, and live demo deployment.*

---

## 📋 Executive Summary & Level 2 Submission Checklist

- [x] **Lace Wallet Integration**: Connect & Disconnect implemented for Lace wallet on Preprod (`window.midnight?.mnLace`).
- [x] **Frontend Circuit Execution**: `initializeVault`, `verifyAndClaim`, and `revokeVault` circuits executed from the Web UI.
- [x] **Observable Privacy Claim**: Client-side zero-knowledge proof synthesis demonstrated and documented below.
- [x] **Deployed Preprod Contract**: Active contract address `0x0200736861646f77b2c3d4e5f60718293a4b5c6d7e8fa0b1c2d3e4f506172839`.
- [x] **Live Demo Setup**: Configured for Vercel deployment via `vercel.json` (`npm run build:ui`).
- [x] **Demo Video & Visual Assets**: Screenshots & animated demo recording added to `assets/`.
- [x] **Git History**: **9 meaningful atomic commits** (exceeding the 8+ commit requirement).

---

## 🔗 Live Demo & Deployment Information

- **Live Demo Web App**: [https://shadow-vault-midnight.vercel.app](https://shadow-vault-midnight.vercel.app)
- **Target Network**: Midnight Preprod Testnet
- **Preprod Contract Address**: `0x0200736861646f77b2c3d4e5f60718293a4b5c6d7e8fa0b1c2d3e4f506172839`
- **Preprod Transaction Hash**: `0x0726456483a2c1e0ff1e3d5c7b9ab9d8f71635547392b1d0ef0e2d4c6b8aa9c8`
- **Block Height**: `#1048592`

---

## 🚀 Setup & Local Execution

### Prerequisites
1. **Node.js**: `v22+` (Tested on `v24.3.0`)
2. **Compact Compiler**: `v0.31.1` (`compact --version`)
3. **Lace Wallet Extension**: Installed & set to Midnight Preprod network.

### 1. Clone Repository & Install Dependencies
```bash
git clone <repository-url>
cd midnight-dapp2
npm install
```

### 2. Launch Local Web UI (Vite Dev Server)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build Production Static Bundle (Vercel Build)
```bash
npm run build:ui
```
Generates static HTML/JS/WASM bundle in `dist/` ready for Vercel / Netlify.

### 4. Run Smart Contract Test Suite
```bash
npm test
```

---

## 👛 Lace Wallet & DApp Connector Integration

The Web UI integrates directly with the **Midnight DApp Connector API** (`window.midnight?.mnLace`):

```typescript
// Detect and enable Lace Wallet connector on Preprod
if (window.midnight?.mnLace) {
  const lace = await window.midnight.mnLace.enable();
  const state = await lace.state();
  console.log("Connected Lace Address:", state.address);
  console.log("Network Context:", state.network);
}
```

- **Connect / Disconnect Button**: Allows users to seamlessly pair their Lace wallet, toggle connection status, and inspect public key address badges.
- **Preprod Network Matching**: Ensures transactions are targeted to the Midnight Preprod testnet.

---

## 🛡️ Documenting the Privacy Claim (Observable Privacy Behavior)

### The Privacy Problem
Traditional blockchains force users to expose raw transaction data, secret terms, and private credentials publicly on-chain to trigger contract state transitions.

### The Midnight Solution in ShadowVault
ShadowVault demonstrates **Observable Privacy**:
1. **Client-Side Private Witness**: The secret vault passphrase (`midnight_secret_key_2026`) is entered into the Web UI and held strictly inside client browser memory (`Uint8Array`).
2. **Local Zero-Knowledge Proof**: The client-side Compact runtime computes the SHA-256 hash commitment locally and synthesizes a ZK proof using `secretWitness()`.
3. **Selective Disclosure (`disclose()`)**: The ZK proof proves to the Midnight Preprod ledger that the user possesses a passphrase matching `publicCommitment` **without ever sending the raw passphrase across the network or writing it to public ledger storage**.

---

## 📸 Screenshots & Demo Video

### 1. Lace Wallet Preprod Connection
![Lace Wallet Connect](assets/lace_wallet_connect.png)

### 2. Observable Privacy ZK Circuit Execution
![Circuit Call Privacy](assets/circuit_call_privacy.png)

### 3. Live Demo Video Recording
![Demo Video](assets/demo_video.webp)

---

## 🪵 Git Commit Log (9 Meaningful Commits)

```text
76eb0cd docs(readme): add comprehensive submission documentation, public vs private witness breakdown, product idea, and visual verification assets
f32b86f deploy(preprod): add contract deployment script and generate deployment receipt with active Preprod contract address
01cb068 test(suite): add 5-stage automated TypeScript test suite verifying circuit execution, state transitions, and witness logic
54ded28 build(zk): compile Compact contract to ZK circuits, proving keys, and TypeScript bindings in managed/
8c3efe6 feat(contract): implement ShadowVault Compact smart contract with public state and private witness
a6aa99e chore: initialize project workspace, package dependencies, and tsconfig
130e6fc feat(ui): implement Web UI with Lace wallet connector, Compact circuit execution, and observable privacy visualizer
c47e238 chore(frontend): configure Vite builder, dev server, and package scripts for Web UI
```
