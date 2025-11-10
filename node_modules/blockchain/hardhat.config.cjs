require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

require("dotenv").config();

const { LOCAL_RPC_URL, ALCHEMY_URL, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: LOCAL_RPC_URL || "http://127.0.0.1:8545",
      chainId: 31337
    },
    amoy: {
      url: ALCHEMY_URL || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 80002
    }
  }
};
