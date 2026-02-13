// Centralized deployment configuration
  // Chain ID constants
const CHAIN_IDS = {
  ETHERLINK_SHADOWNET: 127823,
  SEPOLIA: 11155111,
  BSC: 56,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  AVALANCHE: 43114
}

module.exports = {
  // Deployment settings
  DEPLOYER: '0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3',
  RELAYER: '0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3',
  FEE_IN_BPS: 30, // 0.3% fee
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  // Supported networks configuration
  NETWORKS: {
    etherlinkShadownet: {
      chainId: CHAIN_IDS.ETHERLINK_SHADOWNET,
      name: 'Etherlink Shadownet',
      rpcKey: 'https://node.shadownet.etherlink.com',
      enabled: true,
      isBridgeHub: true
    },
    sepolia: {
      chainId: CHAIN_IDS.SEPOLIA,
      name: 'Ethereum Sepolia',
      rpcKey: 'https://ethereum-sepolia-rpc.publicnode.com',
      enabled: true
    },
    bsc: {
      chainId: CHAIN_IDS.BSC,
      name: 'BNB Smart Chain',
      rpcKey: 'https://bsc-dataseed.binance.org/',
      enabled: true
    },
    polygon: {
      chainId: CHAIN_IDS.POLYGON,
      name: 'Polygon',
      rpcKey: 'POLYGON_RPC_URL',
      enabled: false
    },
    arbitrum: {
      chainId: CHAIN_IDS.ARBITRUM,
      name: 'Arbitrum One',
      rpcKey: 'ARBITRUM_RPC_URL',
      enabled: false
    },
    optimism: {
      chainId: CHAIN_IDS.OPTIMISM,
      name: 'Optimism',
      rpcKey: 'OPTIMISM_RPC_URL',
      enabled: false
    },
    base: {
      chainId: CHAIN_IDS.BASE,
      name: 'Base',
      rpcKey: 'BASE_RPC_URL',
      enabled: false
    },
    avalanche: {
      chainId: CHAIN_IDS.AVALANCHE,
      name: 'Avalanche',
      rpcKey: 'AVALANCHE_RPC_URL',
      enabled: false
    }
  },

  // Token configurations with contract addresses and decimals by chain
  TOKEN_CONTRACTS: {
    DUSD: {
      name: "DUSD",
      symbol: "DUSD",
      defaultDecimals: 18,
      isStablecoin: true,
      chains: {
      }
    },
    USDT: {
      name: "Tether USD",
      symbol: "USDT",
      defaultDecimals: 6,
      isStablecoin: true,
      chains: {
        [CHAIN_IDS.BSC]: {
          address: "0x55d398326f99059fF775485246999027B3197955",
          decimals: 18
        },
        [CHAIN_IDS.SEPOLIA]: {
          address: "0xA1d7f71cbBb361A77820279958BAC38fC3667c1a",
          decimals: 6
        },
        [CHAIN_IDS.ETHERLINK_SHADOWNET]: {
          address: "0x05382A914d4e46ddFC8608BbA03cD3D25dBE886E",
          decimals: 6
        },
        [CHAIN_IDS.POLYGON]: {
          address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
          decimals: 6
        },
        [CHAIN_IDS.ARBITRUM]: {
          address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
          decimals: 6
        },
        [CHAIN_IDS.OPTIMISM]: {
          address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
          decimals: 6
        },
        [CHAIN_IDS.AVALANCHE]: {
          address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
          decimals: 6
        }
      }
    },
    USDC: {
      name: "USD Coin",
      symbol: "USDC",
      defaultDecimals: 6,
      isStablecoin: true,
      chains: {
        [CHAIN_IDS.ETHERLINK_SHADOWNET]: {
          address: "0x064455f03b93bc1cDb8197F718aa055AE3115400",
          decimals: 6
        },
        [CHAIN_IDS.SEPOLIA]: {
          address: "0x51fCe89b9f6D4c530698f181167043e1bB4abf89",
          decimals: 6
        },
        [CHAIN_IDS.BSC]: {
          address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
          decimals: 18
        },
        [CHAIN_IDS.POLYGON]: {
          address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
          decimals: 6
        },
        [CHAIN_IDS.ARBITRUM]: {
          address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
          decimals: 6
        },
        [CHAIN_IDS.OPTIMISM]: {
          address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
          decimals: 6
        },
        [CHAIN_IDS.BASE]: {
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          decimals: 6
        },
        [CHAIN_IDS.AVALANCHE]: {
          address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
          decimals: 6
        }
      }
    }
  },

  // Get enabled networks
  getEnabledNetworks() {
    return Object.entries(this.NETWORKS)
      .filter(([_, config]) => config.enabled)
      .map(([name, _]) => name);
  },

  // Get network config
  getNetworkConfig(networkName) {
    return this.NETWORKS[networkName];
  },

  // Get all supported tokens
  getAllTokenSymbols() {
    return Object.keys(this.TOKEN_CONTRACTS);
  },

  // Get token info
  getTokenInfo(symbol) {
    return this.TOKEN_CONTRACTS[symbol];
  },

  // Get tokens for specific network
  getNetworkTokens(networkName) {
    const network = this.NETWORKS[networkName];
    if (!network) return [];
    
    const tokens = [];
    Object.entries(this.TOKEN_CONTRACTS).forEach(([symbol, tokenInfo]) => {
      const chainConfig = tokenInfo.chains[network.chainId];
      const decimals = chainConfig?.decimals || tokenInfo.defaultDecimals;
      
      if (chainConfig?.address) {
        tokens.push({
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          decimals: decimals,
          originSymbol: symbol,
          address: chainConfig.address,
          isStablecoin: tokenInfo.isStablecoin
        });
      } else {
        // Token needs to be deployed on this chain
        tokens.push({
          name: `DI Bridged ${tokenInfo.name}`,
          symbol: tokenInfo.symbol,
          decimals: decimals,
          originSymbol: symbol,
          isStablecoin: tokenInfo.isStablecoin
        });
      }
    });
    return tokens;
  },

  // Get token contract address for specific chain
  getTokenContract(symbol, chainId) {
    return this.TOKEN_CONTRACTS[symbol]?.chains[chainId]?.address;
  },

  // Get all token contracts for BridgeHub configuration
  getAllTokenContracts() {
    const contracts = [];
    Object.entries(this.TOKEN_CONTRACTS).forEach(([symbol, tokenInfo]) => {
      Object.entries(tokenInfo.chains).forEach(([chainId, chainConfig]) => {
        if (chainConfig.address) {
          contracts.push({
            symbol,
            chainId: parseInt(chainId),
            address: chainConfig.address
          });
        }
      });
    });
    return contracts;
  },

  // Get bridge hub network
  getBridgeHubNetwork() {
    for (const [networkName, config] of Object.entries(this.NETWORKS)) {
      if (config.isBridgeHub && config.enabled) {
        return { networkName, config };
      }
    }
    return null;
  },

  // Check if network is bridge hub
  isBridgeHubNetwork(networkName) {
    return this.NETWORKS[networkName]?.isBridgeHub || false;
  }
};