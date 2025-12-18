// Centralized deployment configuration
  // Chain ID constants
const CHAIN_IDS = {
  HYPEREVM: 999,
  CROSSFI_MAINNET: 4158,
  CROSSFI_TESTNET: 4157,
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
    hyperevm: {
      chainId: CHAIN_IDS.HYPEREVM,
      name: 'HyperEVM',
      rpcKey: 'https://rpc.hyperliquid.xyz/evm',
      enabled: true,
      isBridgeHub: true
    },
    crossfiMainnet: {
      chainId: CHAIN_IDS.CROSSFI_MAINNET,
      name: 'CrossFi Mainnet',
      rpcKey: 'https://rpc.mainnet.ms/',
      enabled: true
    },
    crossfiTestnet: {
      chainId: CHAIN_IDS.CROSSFI_TESTNET,
      name: 'CrossFi Testnet',
      rpcKey: 'https://rpc.testnet.ms/',
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
    XUSD: {
      name: "XUSD",
      symbol: "XUSD",
      defaultDecimals: 18,
      chains: {
        [CHAIN_IDS.CROSSFI_MAINNET]: {
          address: "0x8BD5Fe9286B039cc38d9B63865a8E87736382CCF",
          decimals: 18
        },
        [CHAIN_IDS.CROSSFI_TESTNET]: {
          address: "0x7D55FBbdBc11D3EeaC4a33867c5c79517Be3C703",
          decimals: 18
        }
      }
    },
    XFI: {
      name: "Wrapped XFI",
      symbol: "WXFI",
      defaultDecimals: 18,
      chains: {
        [CHAIN_IDS.CROSSFI_MAINNET]: {
          address: "0xC537D12bd626B135B251cCa43283EFF69eC109c4",
          decimals: 18
        },
        [CHAIN_IDS.CROSSFI_TESTNET]: {
          address: "0x398D6abeF2D415C9E1545E8CFe94a5da71750fcd",
          decimals: 18
        }
      }
    },
    USDT: {
      name: "Tether USD",
      symbol: "USDT",
      defaultDecimals: 6,
      chains: {
        [CHAIN_IDS.BSC]: {
          address: "0x55d398326f99059fF775485246999027B3197955",
          decimals: 18
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
      chains: {
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
          address: chainConfig.address
        });
      } else {
        // Token needs to be deployed on this chain
        tokens.push({
          name: `DI Bridged ${tokenInfo.name}`,
          symbol: tokenInfo.symbol,
          decimals: decimals,
          originSymbol: symbol
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