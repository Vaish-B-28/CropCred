require("dotenv").config();
const { ethers } = require("ethers");
const contractJson = require("./contract.json");

const rpc = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(rpc);

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("PRIVATE_KEY missing in .env");
  process.exit(1);
}
const wallet = new ethers.Wallet(privateKey, provider);

const contractAddress = process.env.CONTRACT_ADDRESS;
if (!contractAddress) {
  console.error("CONTRACT_ADDRESS missing in .env");
  process.exit(1);
}

const cropCred = new ethers.Contract(contractAddress, contractJson.abi, wallet);

module.exports = { provider, wallet, cropCred };
