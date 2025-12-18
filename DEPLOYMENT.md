# Multi-Chain Deployment Guide

This guide explains how to deploy the DI Bridge infrastructure across all supported chains.

## Prerequisites

1. Configure environment variables in `.env`:
```bash
PRIVATE_KEY=your_private_key
CROSSFI_RPC_URL=https://rpc.mainnet.ms
CROSSFI_RPC_TESTNET_URL=https://rpc.testnet.ms
BSC_RPC_URL=https://bsc-dataseed.binance.org/
POLYGON_RPC_URL=https://polygon-rpc.com/
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
BASE_RPC_URL=https://mainnet.base.org
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
HYPEREVM_RPC_URL=https://rpc.hyperliquid.xyz/evm
```

2. Ensure you have sufficient native tokens on each chain for deployment

## Supported Networks

- **CrossFi Mainnet** (4158)
- **CrossFi Testnet** (4157)
- **BSC** (56)
- **Polygon** (137)
- **Arbitrum** (42161)
- **Optimism** (10)
- **Base** (8453)
- **Avalanche** (43114)
- **HyperEVM** (999) - Bridge Hub

## Deployment Scripts

### 1. Deploy to All Networks (Batch)

Deploy to all supported networks automatically:

```bash
npm run deploy:all
```

This will:
- Deploy bridge infrastructure to each network sequentially
- Create deployment files for each network
- Generate a combined `deployments-all.json` file
- Create a deployment summary

### 2. Deploy to Single Network

Deploy to a specific network:

```bash
npm run deploy:single -- --network crossfiMainnet
npm run deploy:single -- --network bsc
npm run deploy:single -- --network hyperevm
```

### 3. Configure States

After deployment, configure cross-chain relationships:

```bash
# Configure Bridge Hub (run on hyperevm)
npm run configure:states -- --network hyperevm

# Configure gateways on each network
npm run configure:states -- --network crossfiMainnet
npm run configure:states -- --network bsc
```

## Deployed Contracts

Each network will have:

### Core Bridge Infrastructure
- **DIBridgedToken Template**: Template for bridged tokens
- **DIBridgedTokenRegistry**: Factory for creating bridged tokens
- **DIGateway**: Main bridge gateway contract
- **MetaTxGateway**: Meta-transaction gateway
- **GasCreditVault**: Gas credit management

### Bridge Tokens
Based on `token-config.js`:
- **XUSD**: CrossFi USD stablecoin
- **XFI/WXFI**: CrossFi native token
- **USDT**: Tether USD
- **USDC**: USD Coin

### HyperEVM Only
- **BridgeHub**: Central hub for cross-chain coordination

## Configuration

### Relayer Setup
- Default relayer: `0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3`
- Bridge fee: 0.3% (30 bps)
- Fee receiver: Same as deployer

### Token Whitelisting
- All deployed tokens are automatically whitelisted in GasCreditVault
- Existing tokens (with addresses in config) are used instead of deploying new ones

## Verification

After deployment, check:

1. **Deployment Files**: 
   - `deployments-all.json` - All contract addresses
   - `deployment-summary.json` - Deployment status
   - `configuration-summary.json` - Configuration status

2. **Contract Verification**:
   ```bash
   # Verify contracts on block explorers
   npx hardhat verify --network crossfiMainnet <contract_address>
   ```

3. **Functionality Tests**:
   ```bash
   npm run test:gmp
   npm run test:meta-tx
   ```

## Troubleshooting

### Common Issues

1. **Insufficient Gas**: Increase gas limit in network config
2. **RPC Timeout**: Use alternative RPC endpoints
3. **Nonce Issues**: Wait between deployments or reset nonce

### Manual Recovery

If batch deployment fails, deploy individually:

```bash
# Deploy to specific networks that failed
npx hardhat run scripts/deploy-all-chains.js --network bsc
npx hardhat run scripts/deploy-all-chains.js --network polygon
```

### Verify Deployment

Check contract addresses in deployment files and verify on block explorers:
- CrossFi: https://xfiscan.com
- BSC: https://bscscan.com
- Polygon: https://polygonscan.com
- Arbitrum: https://arbiscan.io
- Optimism: https://optimistic.etherscan.io
- Base: https://basescan.org
- Avalanche: https://snowtrace.io

## Post-Deployment

1. **Update Relayer Config**: Update relayer with new contract addresses
2. **Test Bridge**: Perform test transactions between chains
3. **Monitor**: Set up monitoring for bridge operations
4. **Documentation**: Update API documentation with new addresses

## Security Notes

- Keep private keys secure
- Verify all contract addresses before use
- Test on testnets before mainnet deployment
- Monitor for any unusual activity post-deployment