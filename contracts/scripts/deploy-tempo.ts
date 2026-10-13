import { ethers, network } from "hardhat";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const token = process.env.TEMPO_TOKEN ?? "0x20c0000000000000000000000000000000000000"; // pathUSD
  const vault = await (
    await ethers.getContractFactory("SettlementVault")
  ).deploy(token, deployer.address, deployer.address, 30);
  const tx = vault.deploymentTransaction();
  await vault.waitForDeployment();
  const out = {
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    vault: await vault.getAddress(),
    token,
    deployer: deployer.address,
    txHash: tx?.hash,
  };
  const dir = join(__dirname, "..", "deployments");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "tempo.json"), JSON.stringify(out, null, 2) + "\n");
  console.log(network.name, out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
