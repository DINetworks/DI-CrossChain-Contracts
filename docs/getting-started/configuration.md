# Configuration

Configure your DI-Contracts environment for development and deployment.

## Network Configuration

The project supports multiple networks configured in `hardhat.config.js`:

### Testnet Networks
- **HyperEVM Testnet** (Chain ID: 998)
- **CrossFi Testnet** (Chain ID: 4157)  
- **Ethereum Sepolia** (Chain ID: 11155111)

### Mainnet Networks
- **HyperEVM** (Chain ID: 999)
- **CrossFi Mainnet** (Chain ID: 4158)
- **BSC** (Chain ID: 56)
- **Polygon** (Chain ID: 137)

## Environment Variables

Configure these variables in your `.env` file:

```bash
# Deployment
PRIVATE_KEY=your_private_key_here
DEPLOYER_ADDRESS=0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3
RELAYER_ADDRESS=0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3

# Network RPCs
HYPEREVM_RPC_URL=https://rpc.hyperliquid.xyz/evm
HYPEREVM_RPC_TESTNET_URL=https://rpc.hyperliquid-testnet.xyz/evm
CROSSFI_RPC_URL=https://rpc.mainnet.ms/
CROSSFI_RPC_TESTNET_URL=https://rpc.testnet.ms/
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Deployment Configuration

The `deployment-config.js` file contains:

### Supported Tokens
```javascript
TOKEN_CONTRACTS: {
  USDT: {
    name: "Tether USD",
    symbol: "USDT", 
    defaultDecimals: 6,
    isStablecoin: true
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    defaultDecimals: 6, 
    isStablecoin: true
  }
}
```

### Network Settings
```javascript
NETWORKS: {
  hyperevmTestnet: {
    chainId: 998,
    name: 'HyperEVM Testnet',
    enabled: true,
    isBridgeHub: true
  }
}
```

## Contract Addresses

After deployment, addresses are stored in `addresses/{network}.json`:

```json
{
  "DIGateway": "0x...",
  "BridgeHub": "0x...",
  "DIBridgedTokenRegistry": "0x...",
  "MetaTxGateway": "0x...",
  "GasCreditVault": "0x..."
}
```