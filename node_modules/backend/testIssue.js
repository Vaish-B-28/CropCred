const { ethers } = require("ethers");
const contractJson = require("./contract.json");
const PRIVATE_KEY ="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";  
const CONTRACT_ADDRESS ="0x5FbDB2315678afecb367f032d93F642f64180aa3";
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractJson.abi, signer);
(async () => {
  const tx = await contract.issueCertificate(
    "test-id",
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  );
  console.log("✅ txHash:", tx.hash);
})();
