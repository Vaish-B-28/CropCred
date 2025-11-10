// frontend/src/components/WalletConnect.jsx

import { useState } from "react";
import { ethers } from "ethers";
import { contractAddress, contractABI } from "../constants/contract";


export default function WalletConnect() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [explorerLink, setExplorerLink] = useState("");


  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);

        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
         const contract = new ethers.Contract(contractAddress, contractABI, signer);

try {
  const tx = await contract.registerFarmer(name, email); // replace with your actual function
  await tx.wait(); // optional: wait for confirmation

  const explorerUrl = `https://amoy.polygonscan.com/tx/${tx.hash}`;
  setExplorerLink(explorerUrl);
  console.log("🔗 View on Polygonscan:", explorerUrl);
} catch (err) {
  console.error("Contract call failed:", err);
}

        console.log("Connected wallet:", address);
        await fetch("http://localhost:5000/farmer", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, walletAddress: address }),
});

      } catch (err) {
        console.error("Wallet connection failed:", err);
      }
    } else {
      alert("MetaMask not detected. Please install it.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
    <input
  type="text"
  placeholder="Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  style={{ marginBottom: "10px", padding: "8px", width: "250px" }}
/>
<br />
<input
  type="email"
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  style={{ marginBottom: "10px", padding: "8px", width: "250px" }}
/>
<br />

      <button onClick={connectWallet}>Connect Wallet</button>
      <p>{walletAddress ? `Connected: ${walletAddress}` : "Not connected"}</p>
      {explorerLink && (
  <p>
    <a href={explorerLink} target="_blank" rel="noopener noreferrer">
      View Transaction on Polygonscan
    </a>
  </p>
)}

    </div>
  );
}

