require('dotenv').config();
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("hardhat-contract-sizer");
require("@openzeppelin/hardhat-upgrades");

task("deploy-token", "Deploy a specific token")
  .addParam("token", "Token symbol to deploy")
  .addFlag("force", "Force deployment")
  .setAction(async (taskArgs, hre) => {
    const { deployTokens } = require('./scripts/deploy-tokens');
    await deployTokens(hre.network.name, taskArgs.force, taskArgs.token);
  });

task("deploy-tokens", "Deploy tokens")
  .addFlag("force", "Force deployment")
  .setAction(async (taskArgs, hre) => {
    const { deployTokens } = require('./scripts/deploy-tokens');
    await deployTokens(hre.network.name, taskArgs.force);
  });

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
    etherlinkShadownet: {
      chainId: 127823,
      url: process.env.ETHERLINK_RPC_URL || "https://node.shadownet.etherlink.com",
      accounts: [process.env.PRIVATE_KEY],
      timeout: 120000, // 2 minutes
      confirmations: 2
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
        network: "avalanche",
        chainId: 43114,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan",
          browserURL: "https://avalanche.routescan.io"
        }
      },
      {
        network: "etherlinkShadownet",
        chainId: 127823,
        urls: {
          apiURL: "https://shadownet.explorer.etherlink.com/api",
          browserURL: "https://shadownet.explorer.etherlink.com"
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