require('dotenv').config();
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("hardhat-contract-sizer");
require("@openzeppelin/hardhat-upgrades");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          viaIR: true
        }
      }
    ]
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  networks: {
    hyperevm: {
      chainId: 999,
      url: process.env.HYPEREVM_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY],
      timeout: 120000, // 2 minutes
      confirmations: 2
    },
    hyperevmTestnet: {
      chainId: 998,
      url: process.env.HYPEREVM_RPC_TESTNET_URL || "",
      accounts: [process.env.PRIVATE_KEY],
      timeout: 120000, // 2 minutes
      confirmations: 2
    },
    crossfiTestnet: {
      chainId: 4157,
      url: process.env.CROSSFI_RPC_TESTNET_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    crossfiMainnet: {
      chainId: 4158,
      url: process.env.CROSSFI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY],
      timeout: 300000, // 5 minutes for mainnet
      confirmations: 3
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY]
    },
    base: {
      url: process.env.BASE_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY],
      timeout: 120000, // 2 minutes
      confirmations: 2
    },
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY],
      timeout: 120000, // 2 minutes
      confirmations: 2
    },
    avalanche: {
      url: process.env.AVALANCHE_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY],
      timeout: 120000, // 2 minutes timeout
      confirmations: 2, // Wait for 2 confirmations
      gasPrice: "auto"
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY],
      timeout: 120000, // 2 minutes
      confirmations: 2
    },    
    polygon: {
      url: process.env.POLYGON_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY],
      timeout: 180000, // 3 minutes for Polygon
      confirmations: 3
    },
    bsc: {
      chainId: 56,
      url: process.env.BSC_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY],
      timeout: 120000, // 2 minutes
      confirmations: 2
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "crossfi",
        chainId: 4157,
        urls: {
          apiURL: "https://test.xfiscan.com/api",     // block explorer API
          browserURL: "https://test.xfiscan.com",     // explorer base URL
        },
      },
      {
        network: "avalanche",
        chainId: 43114,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan",
          browserURL: "https://avalanche.routescan.io"
        }
      }
    ]
  },
  // Add paths if needed
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};