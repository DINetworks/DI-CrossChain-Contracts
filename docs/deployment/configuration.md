# Configuration

Configure your deployment settings and environment for DI-Contracts.

## Environment Configuration

### Required Environment Variables

```bash
# Deployment Account
PRIVATE_KEY=your_private_key_here
DEPLOYER_ADDRESS=0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3
RELAYER_ADDRESS=0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3

# Network RPC URLs
HYPEREVM_RPC_URL=https://rpc.hyperliquid.xyz/evm
HYPEREVM_RPC_TESTNET_URL=https://rpc.hyperliquid-testnet.xyz/evm
CROSSFI_RPC_URL=https://rpc.mainnet.ms/
CROSSFI_RPC_TESTNET_URL=https://rpc.testnet.ms/
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# API Keys (Optional)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Deployment Configuration

### Network Settings

The `deployment-config.js` file contains all network and token configurations:

```javascript
// Chain ID constants
const CHAIN_IDS = {
  HYPEREVM: 999,
  HYPEREVM_TESTNET: 998,
  CROSSFI_MAINNET: 4158,
  CROSSFI_TESTNET: 4157,
  SEPOLIA: 11155111,
  BSC: 56
};

// Network configurations
NETWORKS: {
  hyperevmTestnet: {
    chainId: 998,
    name: 'HyperEVM Testnet',
    rpcKey: 'https://rpc.hyperliquid-testnet.xyz/evm',
    enabled: true,
    isBridgeHub: true
  }
}
```

### Token Configuration

```javascript
TOKEN_CONTRACTS: {
  USDT: {
    name: "Tether USD",
    symbol: "USDT",
    defaultDecimals: 6,
    isStablecoin: true,
    chains: {
      [CHAIN_IDS.SEPOLIA]: {
        address: "0xA1d7f71cbBb361A77820279958BAC38fC3667c1a",
        decimals: 6
      },
      [CHAIN_IDS.HYPEREVM_TESTNET]: {
        address: "0x7f9722758a3e70210d78b107f9069cb12150e8a5",
        decimals: 6
      }
    }
  }
}
```

## Deployment Parameters

### Core Settings

```javascript
module.exports = {
  DEPLOYER: '0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3',
  RELAYER: '0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3',
  FEE_IN_BPS: 30, // 0.3% fee
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000'
};
```

### Gas Settings

```javascript
// In hardhat.config.js
networks: {
  hyperevmTestnet: {
    chainId: 998,
    url: process.env.HYPEREVM_RPC_TESTNET_URL,
    accounts: [process.env.PRIVATE_KEY],
    timeout: 120000, // 2 minutes
    confirmations: 2
  }
}
```

## Contract Addresses

After deployment, addresses are stored in `addresses/{network}.json`:

### HyperEVM Testnet
```json
{
  "DIGateway": "0x...",
  "BridgeHub": "0x...",
  "DIBridgedTokenRegistry": "0x...",
  "MetaTxGateway": "0x...",
  "GasCreditVault": "0x...",
  "tokens": {
    "USDT": "0x...",
    "USDC": "0x..."
  }
}
```

## Configuration Validation

### Pre-Deployment Checks

```bash
# Validate configuration
npx hardhat run scripts/validate-config.js --network hyperevmTestnet

# Check balances
npx hardhat run scripts/check-balances.js --network hyperevmTestnet

# Test network connectivity
npx hardhat console --network hyperevmTestnet
```

### Configuration Functions

```javascript
// Get network configuration
function getNetworkConfig(networkName) {
  return NETWORKS[networkName];
}

// Get enabled networks
function getEnabledNetworks() {
  return Object.entries(NETWORKS)
    .filter(([_, config]) => config.enabled)
    .map(([name, _]) => name);
}

// Get tokens for network
function getNetworkTokens(networkName) {
  const network = NETWORKS[networkName];
  if (!network) return [];
  
  const tokens = [];
  Object.entries(TOKEN_CONTRACTS).forEach(([symbol, tokenInfo]) => {
    const chainConfig = tokenInfo.chains[network.chainId];
    if (chainConfig?.address) {
      tokens.push({
        symbol: tokenInfo.symbol,
        address: chainConfig.address,
        decimals: chainConfig.decimals
      });
    }
  });
  return tokens;
}
```

## Environment-Specific Settings

### Development
```javascript
const developmentConfig = {
  networks: ['hyperevmTestnet', 'crossfiTestnet'],
  feeInBps: 30,
  confirmations: 1,
  gasPrice: 'auto'
};
```

### Production
```javascript
const productionConfig = {
  networks: ['hyperevm', 'crossfiMainnet', 'bsc'],
  feeInBps: 30,
  confirmations: 3,
  gasPrice: 'auto'
};
```

## Configuration Updates

### Adding New Network

1. Update `deployment-config.js`:
```javascript
NETWORKS: {
  newNetwork: {
    chainId: 12345,
    name: 'New Network',
    rpcKey: 'https://rpc.newnetwork.com',
    enabled: true
  }
}
```

2. Update `hardhat.config.js`:
```javascript
networks: {
  newNetwork: {
    chainId: 12345,
    url: process.env.NEW_NETWORK_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

### Adding New Token

1. Update token configuration:
```javascript
TOKEN_CONTRACTS: {
  NEWTOKEN: {
    name: "New Token",
    symbol: "NEWTOKEN",
    defaultDecimals: 18,
    isStablecoin: false,
    chains: {
      [CHAIN_IDS.HYPEREVM_TESTNET]: {
        address: "0x...",
        decimals: 18
      }
    }
  }
}
```

2. Deploy token:
```bash
npx hardhat deploy-token --network hyperevmTestnet --token NEWTOKEN
```