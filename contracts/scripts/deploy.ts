import { ethers, run, artifacts } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying SoulboundCertificate with account:", deployer.address);

  const SoulboundCertificate = await ethers.getContractFactory("SoulboundCertificate");
  const certificate = await SoulboundCertificate.deploy();
  await certificate.waitForDeployment();

  const certificateAddress = await certificate.getAddress();
  console.log("SoulboundCertificate deployed to:", certificateAddress);

  const deploymentTx = certificate.deploymentTransaction();
  if (deploymentTx) {
    console.log("Waiting for 5 block confirmations...");
    await deploymentTx.wait(5);
    console.log("5 confirmations received.");
  }

  console.log(`Contract deployed at: ${certificateAddress}`);

  console.log("Verifying contract on Etherscan...");
  try {
    await run("verify:verify", {
      address: certificateAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully on Etherscan!");
  } catch (error: any) {
    if (error.message?.toLowerCase().includes("already verified")) {
      console.log("Contract is already verified.");
    } else {
      console.warn("Verification notice:", error.message || error);
    }
  }

  // Load ABI from artifacts
  const artifact = await artifacts.readArtifact("SoulboundCertificate");

  const outputData = {
    address: certificateAddress,
    abi: artifact.abi,
    network: "sepolia",
  };

  // Determine path to ./shared/contract.json
  // Check relative to script file and current working directory
  const rootSharedDir = path.resolve(__dirname, "../../shared");
  const cwdSharedDir = path.resolve(process.cwd(), "shared");
  const targetDir = fs.existsSync(rootSharedDir)
    ? rootSharedDir
    : fs.existsSync(cwdSharedDir)
    ? cwdSharedDir
    : path.resolve(process.cwd(), "../shared");

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const outputPath = path.join(targetDir, "contract.json");
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf-8");
  console.log(`Updated shared contract details at: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});