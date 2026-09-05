# Architecture & System Design

## Problem Overview
Traditional academic and professional certificates face severe vulnerabilities including forgery, unauthorized issuance, and cumbersome manual verification processes. In the modern educational ecosystem, institutions require an immutable, tamper-evident, and decentralized credentialing mechanism. Soulbound Certificates (`soulbound-certs`) solves this by utilizing non-transferable ERC-721 tokens (Soulbound Tokens) anchored on Ethereum (Sepolia testnet). Authorized educational institutions mint verifiable credentials directly to a recipient's wallet, binding the credential irrevocably to the student while storing detailed certificate metadata on IPFS. This enables instantaneous, cryptographically guaranteed public verification of credential authenticity and issuer identity without requiring verifiers to connect a wallet.

## System Lifecycle
1. **Whitelist Issuer**: The contract owner authorizes institution addresses by granting them issuer permissions on-chain.
2. **Mint Soulbound Token**: An authorized issuer mints a non-transferable ERC-721 token bound to the recipient's wallet address with an auto-incrementing token ID (starting at 1).
3. **Pin Metadata to IPFS**: Certificate details (student name, course, issue date, grade, issuer) following the shared metadata schema are pinned to IPFS via Pinata through a secure server-side route, setting the on-chain `tokenURI` to `ipfs://<CID>`.
4. **Public Verification**: Any third party can look up the token ID or recipient address on the public web interface to inspect the on-chain validity, issuer authorization, and IPFS metadata without connecting a wallet.

## Directory Ownership & Boundaries

| Directory / File | Owner / Agent | Permissions & Responsibility |
| :--- | :--- | :--- |
| `contracts/` | Agent A (Contracts) | Smart contract implementation (`SoulboundCertificate.sol`), unit & integration tests, Hardhat deployment scripts. Must NOT edit files outside this directory. |
| `frontend/` | Agent B (Frontend) | Next.js App Router, RainbowKit/wagmi wallet connection, Pinata server route, public verification UI, certificate viewing/minting interfaces. Must NOT edit files outside this directory. |
| `shared/` | Handoff Surface | Read/Write coordination boundary. `contracts/` writes deployment artifacts to `shared/contract.json` after deploy; `frontend/` reads it. Neither agent writes into the other's directory. |
| `shared/metadata-schema.json` | Shared Standard | Definitive IPFS metadata schema contract between contracts and frontend. |
| Root (`README.md`, `.gitignore`, etc.) | Project Maintainer | Global documentation, project orchestration, and repository configurations. |