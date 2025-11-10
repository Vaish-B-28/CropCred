const { ethers, upgrades } = require("hardhat");

async function main() {
  const CropCred = await ethers.getContractFactory("CropCred");

  const cropCred = await upgrades.deployProxy(CropCred, [], {
    initializer: "initialize",
  });

  await cropCred.waitForDeployment(); // ✅ correct for Ethers v6


  console.log("✅ CropCred proxy deployed to:", await cropCred.getAddress());

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
