require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    "kaia-testnet": {
      url: "https://api.baobab.klaytn.net:8651",
      chainId: 1001,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 750000000000
    },
    "kaia-mainnet": {
      url: "https://api.cypress.klaytn.net:8651", 
      chainId: 8217,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 750000000000
    }
  },
  etherscan: {
    apiKey: {
      klaytn: "unnecessary"
    },
    customChains: [
      {
        network: "klaytn",
        chainId: 8217,
        urls: {
          apiURL: "https://api-cypress.scope.klaytn.com/api",
          browserURL: "https://scope.klaytn.com"
        }
      }
    ]
  }
};