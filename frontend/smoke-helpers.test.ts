import { encodeFunctionData, isAddress, toFunctionSelector } from "viem";
import {
  CONTRACT_ADDRESS,
  getContractAddress,
  isContractConfigured,
  shortenAddress,
  SOULBOUND_ABI,
  ZERO_ADDRESS,
} from "./lib/contract";
import { resolveIpfsUrl } from "./lib/pinata";
import {
  getCertificatesOf,
  isIssuerAddress,
  publicClient,
  resolveTokenInfo,
  SEPOLIA_RPC_URL,
} from "./lib/viemPublicClient";

async function main() {
  const failures: string[] = [];
  const check = (name: string, ok: boolean) => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
    if (!ok) failures.push(name);
  };

  console.log("CONTRACT_ADDRESS =", CONTRACT_ADDRESS);
  console.log("isContractConfigured =", isContractConfigured);
  console.log("ZERO_ADDRESS =", ZERO_ADDRESS);
  console.log("SEPOLIA_RPC_URL =", SEPOLIA_RPC_URL);

  check("contract address is a valid address", isAddress(CONTRACT_ADDRESS));
  check(
    "getContractAddress matches resolved address",
    getContractAddress() === CONTRACT_ADDRESS,
  );
  check(
    "resolved address is configured (non-zero)",
    isContractConfigured && CONTRACT_ADDRESS !== ZERO_ADDRESS,
  );
  check(
    "shortenAddress",
    shortenAddress("0x1234567890abcdef1234567890abcdef12345678") ===
      "0x12345…45678",
  );

  const issuedCalldata = encodeFunctionData({
    abi: SOULBOUND_ABI,
    functionName: "issueCertificate",
    args: ["0x0000000000000000000000000000000000000001", "ipfs://QmTest"],
  });
  console.log("issueCertificate() call :=>", issuedCalldata.slice(0, 10));
  check(
    "issueCertificate() selector matches canonical signature",
    issuedCalldata.startsWith(
      toFunctionSelector("issueCertificate(address,string)"),
    ),
  );
  check(
    "revoke() selector matches canonical signature",
    encodeFunctionData({ abi: SOULBOUND_ABI, functionName: "revoke", args: [BigInt(1)] }).startsWith(
      toFunctionSelector("revoke(uint256)"),
    ),
  );
  check(
    "isValid() selector matches canonical signature",
    encodeFunctionData({ abi: SOULBOUND_ABI, functionName: "isValid", args: [BigInt(1)] }).startsWith(
      toFunctionSelector("isValid(uint256)"),
    ),
  );

  const gateway = resolveIpfsUrl("ipfs://QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P4isapbJq1VN");
  console.log("gateway url =", gateway);
  check(
    "ipfs:// resolves to pinata gateway",
    gateway ===
      "https://gateway.pinata.cloud/ipfs/QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P4isapbJq1VN",
  );
  check(
    "https passthrough",
    resolveIpfsUrl("https://example.com/a.json") === "https://example.com/a.json",
  );
  check("null on garbage", resolveIpfsUrl("foobar") === null);

  try {
    const chainId = await publicClient.getChainId();
    console.log("publicClient chainId =", chainId);
    check("public client reaches Sepolia RPC", Number(chainId) === 11155111);
  } catch (err) {
    console.log("RPC unreachable:", err instanceof Error ? err.message : String(err));
  }

  try {
    const id = "0x0000000000000000000000000000000000000001" as `0x${string}`;
    const issuer = await isIssuerAddress(id);
    console.log("issuers(0x…01) =", issuer);
    const ids = await getCertificatesOf(id);
    console.log("certificatesOf(0x…01) =", ids);
    check("certificatesOf returns array", Array.isArray(ids));
  } catch (err) {
    console.log("read test error:", err instanceof Error ? err.message : String(err));
  }

  try {
    const info = await resolveTokenInfo(BigInt(0));
    console.log(
      "resolveTokenInfo(0) => status=",
      info.status,
      "valid=",
      info.valid,
      "revoked=",
      info.revoked,
    );
    check("resolveTokenInfo returns well-formed object", Boolean(info) && info.tokenId === BigInt(0));
  } catch (err) {
    console.log("resolveTokenInfo error:", err instanceof Error ? err.message : String(err));
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} assertion(s) failed`);
    process.exit(1);
  }
  console.log("\nAll contract-helper & public-client assertions passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});