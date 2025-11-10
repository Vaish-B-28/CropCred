// blockchain/scripts/transfer-ownership.cjs
require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const NEW_OWNER = process.env.NEW_OWNER;
  const PROXY_ADDRESS = process.env.PROXY_ADDRESS;

  if (!NEW_OWNER) throw new Error("Set NEW_OWNER in env");
  if (!PROXY_ADDRESS) throw new Error("Set PROXY_ADDRESS in env");

  const CropCred = await ethers.getContractFactory("CropCred");
  const proxy = CropCred.attach(PROXY_ADDRESS);

  const current = await proxy.owner();
  console.log("Current owner:", current);
  console.log("Transferring ownership to:", NEW_OWNER);

  const tx = await proxy.transferOwnership(NEW_OWNER);
  await tx.wait();

  const updated = await proxy.owner();
  console.log("✅ New owner:", updated);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
