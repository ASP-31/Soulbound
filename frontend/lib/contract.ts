import { getAddress, getContract, isAddress } from "viem";
import type { Abi, PublicClient } from "viem";
import contractData from "../../shared/contract.json";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";

const FALLBACK_SOULBOUND_ABI: Abi = [
  {
    type: "function",
    name: "issuers",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "issueCertificate",
    inputs: [
      { name: "to", type: "address" },
      { name: "uri", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revoke",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revoked",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isValid",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "certificatesOf",
    inputs: [{ name: "holder", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenURI",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "issuerOf",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ownerOf",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
];

export const SOULBOUND_ABI: Abi =
  Array.isArray(contractData?.abi) && contractData.abi.length > 0
    ? (contractData.abi as Abi)
    : FALLBACK_SOULBOUND_ABI;

export function getContractAddress(): `0x${string}` {
  const candidates = [
    contractData?.address,
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && isAddress(candidate)) {
      return getAddress(candidate);
    }
  }
  return ZERO_ADDRESS;
}

export const CONTRACT_ADDRESS = getContractAddress();

export const isContractConfigured = CONTRACT_ADDRESS !== ZERO_ADDRESS;

export const soulboundContractConfig = {
  address: CONTRACT_ADDRESS,
  abi: SOULBOUND_ABI,
} as const;

export function getSoulboundContract(client: { public: PublicClient }) {
  return getContract({
    address: CONTRACT_ADDRESS,
    abi: SOULBOUND_ABI,
    client,
  });
}

export function shortenAddress(address?: string | null, chars = 5): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function etherscanAddressUrl(address: string): string {
  return `${SEPOLIA_EXPLORER}/address/${address}`;
}

export function etherscanTxUrl(txHash: string): string {
  return `${SEPOLIA_EXPLORER}/tx/${txHash}`;
}

export function etherscanTokenUrl(tokenId: bigint | string): string {
  return `${SEPOLIA_EXPLORER}/token/${CONTRACT_ADDRESS}?a=${tokenId.toString()}`;
}