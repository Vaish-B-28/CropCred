import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// adjust these if your paths differ
const artifactPath = `${__dirname}/../blockchain/artifacts/contracts/CropCred.sol/CropCred.json`;
const outPath = `${__dirname}/../backend/contract.json`;

try {
  const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
  const { abi } = artifact;
  if (!abi || !Array.isArray(abi)) {
    throw new Error("ABI not found in artifact");
  }
  const payload = { abi }; // keep it lean; add bytecode if you want
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log("ABI synced → backend/contract.json");
} catch (e) {
  console.error("Failed to sync ABI:", e.message);
  process.exit(1);
}
