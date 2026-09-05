# soulbound.cert

> **Trustless infrastructure for verifiable skills & credentials.** `soulbound.cert` is a decentralized platform that lets trusted organizations issue **tamper-evident, non-transferable, publicly verifiable credentials** — academic, professional, skill-based, and more — directly to an individual's wallet.

Built for **HackBlox 2026 · Web3 Track · Problem Statement 02** — *On-Chain Verifiable Credentials (Soulbound Certificates)*.

---

## Highlights

1. 🧠 **Soulbound ERC-721** — tokens are minted to a wallet and can *never* be transferred or sold (overridden `_update`).
2. 🛡️ **Tamper-evident metadata** — credential details are content-addressed and pinned to IPFS, while only the `ipfs://` URI is stored on-chain. Any modification creates a different CID, while the original on-chain reference remains unchanged.
3. 🏗️ **Trusted issuer management** — owner-only `addIssuer` / `removeIssuer`; every credential records its issuer on-chain.
4. 🔄 **On-chain revocation** — issuers can invalidate credentials when necessary, with the revoked status instantly reflected across public verification.
5. ✅ **Zero-friction public verification** — anyone can verify a credential with just the wallet address or token ID, no wallet or login required.
6. 🔗 **QR code verification** — every credential has a QR code pointing to a shareable public verification page, scannable from a printed certificate, LinkedIn, or resume.
7. 📄 **Shareable credential pages** — `/credential/[tokenId]` gives anyone a self-contained, wallet-independent view of any credential with status, issuer, Etherscan link, and IPFS metadata.
8. 🎓 **Multiple credential types** — supports academic certificates, professional certifications, skill badges, course completions, and achievements — same contract, different metadata.
9. ✅ **Etherscan-verified contract** with a live Sepolia deployment.
10. 🧪 **End-to-end demo** — connect wallet → pin metadata → mint → share via QR → verify → revoke.

---

## Why Soulbound?

Credentials represent an individual's **identity, skills, and achievements** — not an asset that should be traded.

A traditional NFT can be transferred or sold, which makes it unsuitable for representing academic or professional credentials. `soulbound.cert` therefore uses non-transferable ERC-721 tokens that remain permanently bound to the recipient's wallet.

> **Your achievements should be portable and verifiable — but never transferable.**

---

## Trust Model

A credential is only meaningful when its issuer is trusted. `soulbound.cert` separates **credential ownership** from **credential authority**:

- 👤 **Holder** — owns the wallet-bound credential.
- 🏛️ **Issuer** — an authorized wallet that can issue credentials.
- 🔗 **Blockchain** — provides the public, independently verifiable record of issuance and revocation.
- 📦 **IPFS** — stores content-addressed credential metadata.

Verification answers four fundamental questions:

1. **Does the credential exist?**
2. **Who owns it?**
3. **Who issued it?**
4. **Is it currently valid?**

> `soulbound.cert` does not claim that blockchain determines whether an achievement is true — it provides a tamper-evident way to verify that a trusted issuer issued a specific credential and whether that issuer has revoked it.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Smart Contracts | Solidity `^0.8.24`, OpenZeppelin `v5.x`, Hardhat |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS v4 |
| Web3 | RainbowKit, Wagmi `v2`, Viem `v2` |
| Decentralized Storage | Pinata (IPFS pinning) |
| Network | Ethereum Sepolia (Chain ID `11155111`) |
| Runtime | Node.js 20+ |

---

## Architecture

```
┌─────────────┐   metadata JSON   ┌──────────────┐
│   /issue     │ ───────────────► │  /api/pin     │
│  (wallet)    │                  │ (Pinata JWT)  │
└──────┬──────┘                  └──────┬───────┘
       │                                │ ipfs://<CID>
       │ issueCertificate(to, ipfsURI)  ▼
       ▼                          ┌──────────────┐
┌─────────────┐   tokenURI ─────► │   IPFS       │
│  Contract    │ ◄──────────────  │  (stored)    │
│  (Sepolia)   │                  └──────────────┘
└──────┬──────┘
       │ certificatesOf / tokenURI / isValid
       ▼
┌─────────────┐
│   /verify    │  read-only, no wallet needed
└─────────────┘
```

1. Issuer fills the form → metadata JSON is pinned to Pinata → `ipfs://<hash>` returned.
2. Only the content-addressed IPFS URI (`uri`) is stored on-chain via `issueCertificate(recipient, uri)`.
3. Verification reads the on-chain `tokenURI`, resolves the referenced metadata from IPFS, and displays the credential. Because IPFS uses content addressing, modified content produces a different CID and cannot silently replace the metadata referenced on-chain.

---

## Frontend Experience

- 💾 **Persistent local mint history** — issued credentials survive navigation and page reloads (with a one-click clear).
- 👛 **Wallet-aware issuer dashboard** — role-aware minting and revocation for whitelisted issuers.
- ⏳ **Transparent transaction feedback** — pinning, signature, and confirmation states with live Etherscan links.
- 🌐 **Public wallet-independent verification** — no extension, login, or fee required to verify.

---

## Live Deployments

| | |
| --- | --- |
| **Frontend (live demo)** | https://frontend-eight-xi-11.vercel.app |
| **Contract (Sepolia)** | [`0x03a2470a4b018E9BbaDD9742B9cb98745A1C3Fa8`](https://sepolia.etherscan.io/address/0x03a2470a4b018E9BbaDD9742B9cb98745A1C3Fa8) |
| **Etherscan (verified)** | https://sepolia.etherscan.io/address/0x03a2470a4b018E9BbaDD9742B9cb98745A1C3Fa8 |
| **Network** | Ethereum Sepolia · Chain ID `11155111` |

---

## Local Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v20+ and npm v10+
- A wallet (MetaMask / Rabby) with the Sepolia network added

### 1. Smart Contracts (`contracts/`)

```bash
cd contracts
npm install
cp .env.example .env   # fill with deployer PRIVATE_KEY + SEPOLIA_RPC_URL
npm run compile        # compile contracts
npm test               # run the test suite
npm run deploy:sepolia # deploy + verify on Etherscan
```

The account in `PRIVATE_KEY` becomes the contract **owner** and can mint immediately (owner is treated as an issuer in the frontend). Add other issuers with `addIssuer()`.

### 2. Frontend (`frontend/`)

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in values (see table)
npm run dev                  # http://localhost:3000
```

| Variable | Description |
| --- | --- |
| `PINATA_JWT` | Pinata API key JWT (server-side only, used by `/api/pin`) |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Public Sepolia RPC for read-only calls (verification portal) |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Contract override; defaults to `shared/contract.json` |
| `NEXT_PUBLIC_WC_PROJECT_ID` | WalletConnect Cloud project ID for RainbowKit connectors |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the app |

> `.env` files are git-ignored — never commit secrets to the repo.

---

## App Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page with contract status + quick verify search |
| `/issue` | Issuer dashboard — connect wallet, mint & revoke credentials |
| `/credential/[tokenId]` | Shareable public credential page with QR code (no wallet needed) |
| `/verify` | Public, read-only credential verification by address or token ID |
| `/api/pin` | Server route that pins credential metadata JSON to IPFS via Pinata |

---

## Contract Interface (`SoulboundCertificate.sol`)

| Function | Description |
| --- | --- |
| `addIssuer(address)` / `removeIssuer(address)` | Owner-only issuer management |
| `issueCertificate(to, uri)` | Mint a soulbound certificate (issuer only) |
| `revoke(tokenId)` | Revoke a certificate (issuing issuer or owner) |
| `certificatesOf(holder)` | List token IDs owned by an address |
| `isValid(tokenId)` | True if the token exists and is not revoked |
| `issuerOf(tokenId)` | Issuer who minted a token |
| `tokenURI(tokenId)` | IPFS metadata URI (ERC-721 standard) |

Verified source: [`contracts/contracts/SoulboundCertificate.sol`](contracts/contracts/SoulboundCertificate.sol)

---

## How to Use

1. **Issue** — open `/issue`, connect a whitelisted issuer wallet on Sepolia, pick a credential type, fill recipient `0x…`, holder name, course/skill, date (and optional grade), then **Pin & Mint**.
2. **Share** — open the credential page (`/credential/[tokenId]`), copy its link or scan its QR code. Paste it on LinkedIn, a resume, or print it — anyone can verify it directly.
3. **Verify** — open `/verify` or scan the QR, paste the wallet address or token ID. No wallet, no fee, instant.
4. **Revoke** — from the issuer's session history, hit **Revoke** on any minted token; it flips to invalid instantly everywhere.

---

## Demo Video

- **Video Link**: https://drive.google.com/file/d/17McMOvzWm8bN_mjuXxQkg2i9alZheBVk/view?usp=sharing

---

## License

[MIT](LICENSE) © 2026 Arjun S Pai