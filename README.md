# soulbound-certs

> An on-chain verifiable credential platform minting tamper-proof, non-transferable Soulbound ERC-721 certificates to student wallets with IPFS-anchored metadata and zero-friction public verification.

**HackBlox 2026** — **Web3 Track**  
**Problem Statement 02**: On-Chain Verifiable Credentials (Soulbound Certificates)

---

## Tech Stack
- **Smart Contracts**: Solidity `^0.8.24`, OpenZeppelin Contracts `v5.x`, Hardhat, TypeScript, Ethers `v6`, Chai
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Web3 / Wallet Integration**: RainbowKit, Wagmi `v2`, Viem
- **Decentralized Storage**: Pinata (IPFS)
- **Target Network**: Ethereum Sepolia Testnet
- **Runtime**: Node 20+

---

## Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v20+
- npm v10+

### 1. Smart Contracts (`contracts/`)
```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Configure environment variables (copy example and fill values)
cp .env.example .env

# Compile smart contracts
npm run compile

# Run test suite
npm test

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

### 2. Frontend Application (`frontend/`)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables (copy example and fill values)
cp .env.example .env.local

# Run local development server
npm run dev
```

---

## Deployed Contract (Sepolia)
<!-- Placeholder: to be updated post-deployment -->
- **Contract Address**: `TBD`
- **Etherscan Link**: `TBD`
- **Network**: Sepolia (Chain ID: 11155111)

---

## Live Demo
<!-- Placeholder: to be updated upon hosting -->
- **URL**: `TBD`

---

## Demo Video
<!-- Placeholder: to be added before final submission -->
- **Video Link**: `TBD`