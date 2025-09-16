require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      },
      metadata: {
        bytecodeHash: "none"
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337,
      gas: "auto",
      gasPrice: "auto"
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
    "kaia-testnet": {
      url: process.env.KAIA_TESTNET_RPC || "https://public-en-baobab.klaytn.net",
      chainId: 1001,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 750000000000, // 750 gwei
      gas: 8500000,
      timeout: 60000,
      confirmations: 2
    },
    "kaia-mainnet": {
      url: process.env.KAIA_MAINNET_RPC || "https://public-en-cypress.klaytn.net",
      chainId: 8217,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 750000000000, // 750 gwei
      gas: 8500000,
      timeout: 60000,
      confirmations: 5
    }
  },
  etherscan: {
    apiKey: {
      klaytn: process.env.KLAYTNSCOPE_API_KEY || "unnecessary",
      kaia: process.env.KLAYTNSCOPE_API_KEY || "unnecessary"
    },
    customChains: [
      {
        network: "klaytn",
        chainId: 8217,
        urls: {
          apiURL: "https://api-cypress.klaytnscope.com/api",
          browserURL: "https://klaytnscope.com"
        }
      },
      {
        network: "kaia",
        chainId: 8217,
        urls: {
          apiURL: "https://api-cypress.klaytnscope.com/api",
          browserURL: "https://klaytnscope.com"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  },
  mocha: {
    timeout: 40000
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};