// blockchain/scripts/export-abi.cjs

const fs = require("fs");
const path = require("path");

const artifactPath = path.join(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "CropCred.sol",
  "CropCred.json"
);

const backendPath = path.join(
  __dirname,
  "..",
  "..",
  "backend",
  "contract.json"
);

if (!fs.existsSync(artifactPath)) {
  console.error("❌ ABI not found. Did you run `npm run compile:chain`?");
  process.exit(1);
}

const abiFile = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

fs.writeFileSync(
  backendPath,
  JSON.stringify({ abi: abiFile.abi }, null, 2)
);

console.log("✅ ABI exported to backend/contract.json");
