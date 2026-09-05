import { createPublicClient, defineChain, http } from "viem";
import { sepolia } from "viem/chains";
import type { Address, ReadContractParameters } from "viem";
import { CONTRACT_ADDRESS, SOULBOUND_ABI } from "./contract";
import { resolveIpfsUrl, fetchCertificateMetadata } from "./pinata";
import type { CertificateInfo, CertificateStatus } from "@/types";

const DEFAULT_SEPOLIA_RPC = "https://ethereum-sepolia.publicnode.com";

export const SEPOLIA_RPC_URL = (
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || DEFAULT_SEPOLIA_RPC
).trim();

export const sepoliaChain = defineChain({
  ...sepolia,
  rpcUrls: {
    default: { http: [SEPOLIA_RPC_URL] },
    public: { http: [SEPOLIA_RPC_URL] },
  },
});

export const publicClient = createPublicClient({
  chain: sepoliaChain,
  transport: http(SEPOLIA_RPC_URL),
});

type ContractReadArgs = Pick<
  ReadContractParameters,
  "functionName" | "args" | "address"
>;

async function safeRead<T>(
  { functionName, args, address = CONTRACT_ADDRESS }: ContractReadArgs,
): Promise<T> {
  try {
    return (await publicClient.readContract({
      address,
      abi: SOULBOUND_ABI,
      functionName,
      args,
    })) as T;
  } catch {
    return undefined as T;
  }
}

export async function isContractReachable(): Promise<{
  reachable: boolean;
  deployed: boolean;
}> {
  try {
    const code = await publicClient.getCode({ address: CONTRACT_ADDRESS });
    const chainId = await publicClient.getChainId();
    return {
      reachable: true,
      deployed: Boolean(code && code !== "0x" && chainId === 11155111),
    };
  } catch {
    return { reachable: false, deployed: false };
  }
}

export async function isIssuerAddress(address: Address): Promise<boolean> {
  const result = await safeRead<boolean>({
    functionName: "issuers",
    args: [address],
  });
  return Boolean(result);
}

export async function getCertificatesOf(
  holder: Address,
): Promise<bigint[]> {
  const result = await safeRead<bigint[]>({
    functionName: "certificatesOf",
    args: [holder],
  });
  return Array.isArray(result) ? result : [];
}

export async function getTokenValid(tokenId: bigint): Promise<boolean> {
  const result = await safeRead<boolean>({
    functionName: "isValid",
    args: [tokenId],
  });
  return Boolean(result);
}

export async function getTokenRevoked(tokenId: bigint): Promise<boolean> {
  const result = await safeRead<boolean>({
    functionName: "revoked",
    args: [tokenId],
  });
  return Boolean(result);
}

export async function getTokenIssuer(tokenId: bigint): Promise<Address> {
  const result = await safeRead<Address>({
    functionName: "issuerOf",
    args: [tokenId],
  });
  return result ?? "0x0000000000000000000000000000000000000000";
}

export async function getTokenOwner(tokenId: bigint): Promise<Address> {
  const result = await safeRead<Address>({
    functionName: "ownerOf",
    args: [tokenId],
  });
  return result ?? "0x0000000000000000000000000000000000000000";
}

export async function getTokenURI(tokenId: bigint): Promise<string> {
  const result = await safeRead<string>({
    functionName: "tokenURI",
    args: [tokenId],
  });
  return result ?? "";
}

export async function resolveTokenInfo(
  tokenId: bigint,
): Promise<CertificateInfo> {
  const [valid, revoked, issuer, owner, tokenURI] = await Promise.all([
    getTokenValid(tokenId),
    getTokenRevoked(tokenId),
    getTokenIssuer(tokenId),
    getTokenOwner(tokenId),
    getTokenURI(tokenId),
  ]);

  const existed = owner !== "0x0000000000000000000000000000000000000000";
  let status: CertificateStatus;
  if (!existed) status = "notFound";
  else if (revoked || !valid) status = "revoked";
  else status = "valid";

  const metadata = tokenURI ? await fetchCertificateMetadata(tokenURI) : null;

  return {
    tokenId,
    status,
    valid,
    revoked,
    existed,
    issuer,
    owner,
    tokenURI,
    metadata,
    imageUrl: metadata?.image ? resolveIpfsUrl(metadata.image) : null,
  };
}

export async function resolveHolderCertificates(
  holder: Address,
): Promise<CertificateInfo[]> {
  const tokenIds = await getCertificatesOf(holder);
  return Promise.all(tokenIds.map((tokenId) => resolveTokenInfo(tokenId)));
}