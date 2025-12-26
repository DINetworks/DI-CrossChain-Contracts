# Network Setup

Configure network connections and parameters for DI-Contracts deployment.

## Supported Networks

### Testnet Networks

#### HyperEVM Testnet
```javascript
hyperevmTestnet: {
  chainId: 998,
  url: "https://rpc.hyperliquid-testnet.xyz/evm",
  accounts: [process.env.PRIVATE_KEY],
  timeout: 120000,
  confirmations: 2
}
```

#### CrossFi Testnet  
```javascript
crossfiTestnet: {
  chainId: 4157,
  url: "https://rpc.testnet.ms/",
  accounts: [process.env.PRIVATE_KEY]
}
```

#### Ethereum Sepolia
```javascript
sepolia: {
  chainId: 11155111,
  url: "https://ethereum-sepolia-rpc.publicnode.com",
  accounts: [process.env.PRIVATE_KEY]
}
```

### Mainnet Networks

#### HyperEVM Mainnet
```javascript
hyperevm: {
  chainId: 999,
  url: "https://rpc.hyperliquid.xyz/evm",
  accounts: [process.env.PRIVATE_KEY],
  timeout: 120000,
  confirmations: 2
}
```

#### CrossFi Mainnet
```javascript
crossfiMainnet: {
  chainId: 4158,
  url: "https://rpc.mainnet.ms/",
  accounts: [process.env.PRIVATE_KEY]
}
```

## Network Configuration

### Environment Variables
```bash
# Testnet RPCs
HYPEREVM_RPC_TESTNET_URL=https://rpc.hyperliquid-testnet.xyz/evm
CROSSFI_RPC_TESTNET_URL=https://rpc.testnet.ms/
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Mainnet RPCs
HYPEREVM_RPC_URL=https://rpc.hyperliquid.xyz/evm
CROSSFI_RPC_URL=https://rpc.mainnet.ms/
BSC_RPC_URL=https://bsc-dataseed.binance.org/
POLYGON_RPC_URL=https://polygon-rpc.com/
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
BASE_RPC_URL=https://mainnet.base.org
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc

# Deployment
PRIVATE_KEY=your_private_key_here
```

### Chain ID Reference
```javascript
const CHAIN_IDS = {
  HYPEREVM: 999,
  HYPEREVM_TESTNET: 998,
  CROSSFI_MAINNET: 4158,
  CROSSFI_TESTNET: 4157,
  SEPOLIA: 11155111,
  BSC: 56,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  AVALANCHE: 43114
};
```

## Network Testing

### Connection Test
```bash
# Test network connectivity
npx hardhat console --network hyperevmTestnet

# In console:
await ethers.provider.getNetwork()
await ethers.provider.getBlockNumber()
```

### Balance Check
```bash
# Check deployer balance
npx hardhat run scripts/check-balance.js --network hyperevmTestnet
```

### Gas Price Check
```bash
# Check current gas prices
npx hardhat run scripts/check-gas-price.js --network hyperevmTestnet
```

## Hub Chain Setup

### HyperEVM as Hub
HyperEVM serves as the central hub for the bridge protocol:

```javascript
// In deployment-config.js
hyperevmTestnet: {
  chainId: 998,
  name: 'HyperEVM Testnet',
  enabled: true,
  isBridgeHub: true  // Designates as hub chain
}
```

### Hub-Specific Components
- BridgeHub contract
- GasCreditVault contract  
- CrossChainAggregator contract

## Network Verification

### Block Explorer URLs
```javascript
// For contract verification
etherscan: {
  apiKey: process.env.ETHERSCAN_API_KEY,
  customChains: [
    {
      network: "hyperevmTestnet",
      chainId: 998,
      urls: {
        apiURL: "https://sourcify.parsec.finance",
        browserURL: "https://testnet.purrsec.com/"
      }
    },
    {
      network: "crossfiTestnet", 
      chainId: 4157,
      urls: {
        apiURL: "https://test.xfiscan.com/api",
        browserURL: "https://test.xfiscan.com"
      }
    }
  ]
}
```

## Troubleshooting

### Common Network Issues

#### RPC Connection Failed
```bash
# Error: could not detect network
# Solution: Check RPC URL and network connectivity
```

#### Invalid Chain ID
```bash
# Error: chain ID mismatch
# Solution: Verify chain ID in network config
```

#### Timeout Issues
```bash
# Error: timeout exceeded
# Solution: Increase timeout in network config
timeout: 300000 // 5 minutes
```

### Network-Specific Notes

#### HyperEVM
- Requires ETH for gas
- Fast block times (~1-2 seconds)
- EVM compatible

#### CrossFi
- Requires XFI for gas
- Cosmos-based with EVM compatibility
- Bridge between Cosmos and EVM ecosystems