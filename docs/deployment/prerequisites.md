# Prerequisites

Before deploying DI-Contracts, ensure you have the following requirements met.

## System Requirements

### Software Dependencies
- **Node.js**: v16.0.0 or higher
- **npm**: v7.0.0 or higher (or yarn equivalent)
- **Git**: Latest version
- **Hardhat**: v2.19.0 or higher

### Development Tools
- Code editor (VS Code recommended)
- Terminal/Command line access
- Web3 wallet (MetaMask, etc.)

## Network Requirements

### RPC Endpoints
Ensure you have reliable RPC endpoints for target networks:

```bash
# Testnet RPCs
HYPEREVM_RPC_TESTNET_URL=https://rpc.hyperliquid-testnet.xyz/evm
CROSSFI_RPC_TESTNET_URL=https://rpc.testnet.ms/
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Mainnet RPCs  
HYPEREVM_RPC_URL=https://rpc.hyperliquid.xyz/evm
CROSSFI_RPC_URL=https://rpc.mainnet.ms/
BSC_RPC_URL=https://bsc-dataseed.binance.org/
```

### Network Access
- Stable internet connection
- Access to blockchain networks
- No firewall restrictions on RPC ports

## Wallet Requirements

### Private Key Setup
- Secure private key management
- Sufficient native tokens for gas fees
- Same deployer address across all chains

### Gas Requirements

| Network | Estimated Gas Cost | Native Token |
|---------|-------------------|--------------|
| HyperEVM Testnet | ~0.1 ETH | ETH |
| CrossFi Testnet | ~1 XFI | XFI |
| Ethereum Sepolia | ~0.05 ETH | ETH |
| BSC | ~0.01 BNB | BNB |

### Recommended Balances

```bash
# Testnet deployment
HyperEVM Testnet: 0.2 ETH
CrossFi Testnet: 2 XFI  
Sepolia: 0.1 ETH

# Mainnet deployment
HyperEVM: 0.5 ETH
CrossFi: 5 XFI
BSC: 0.05 BNB
```

## API Keys (Optional)

### Block Explorer Verification
```bash
# For contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
```

### External Services
- Alchemy/Infura API keys (if using hosted RPCs)
- Moralis API key (for enhanced monitoring)

## Security Requirements

### Environment Security
- Secure `.env` file handling
- Private key encryption
- No credentials in version control

### Network Security
- VPN usage recommended for mainnet
- Secure RPC endpoints
- Rate limiting awareness

## Deployment Checklist

### Pre-Deployment
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Sufficient gas balances
- [ ] Network connectivity verified
- [ ] Contracts compiled successfully

### Configuration Verification
- [ ] Correct chain IDs in config
- [ ] Valid RPC URLs
- [ ] Proper token configurations
- [ ] Fee settings configured

### Security Checks
- [ ] Private keys secured
- [ ] Environment file protected
- [ ] Deployment addresses verified
- [ ] Multi-signature setup (if required)

## Common Issues

### Insufficient Gas
```bash
# Error: insufficient funds for gas
# Solution: Add more native tokens to deployer wallet
```

### RPC Timeouts
```bash
# Error: timeout exceeded
# Solution: Use more reliable RPC endpoint or increase timeout
```

### Nonce Issues
```bash
# Error: nonce too low/high
# Solution: Reset wallet nonce or wait for network sync
```

### Contract Size Limits
```bash
# Error: contract code size exceeds limit
# Solution: Enable optimizer in hardhat.config.js
```

## Verification Steps

### Test Compilation
```bash
npm run compile
```

### Test Network Connection
```bash
npx hardhat console --network hyperevmTestnet
```

### Verify Balances
```bash
npx hardhat run scripts/check-balances.js --network hyperevmTestnet
```

### Test Deployment (Dry Run)
```bash
# Use --dry-run flag if available
npx hardhat run scripts/deploy-token-template.js --network hyperevmTestnet
```