# Contract Deployment

This guide covers the step-by-step deployment process for DI-Contracts.

## Deployment Order

Deploy contracts in the following sequence:

### 1. Deploy Token Template
```bash
npx hardhat run scripts/deploy-token-template.js --network hyperevmTestnet
```

### 2. Deploy Token Registry
```bash
npx hardhat run scripts/deploy-token-registry.js --network hyperevmTestnet
```

### 3. Deploy Gateway
```bash
npx hardhat run scripts/deploy-gateway.js --network hyperevmTestnet
```

### 4. Setup Gateway Connection
```bash
npx hardhat run scripts/setup-gateway-connection.js --network hyperevmTestnet
```

### 5. Deploy MetaTx Gateway
```bash
npx hardhat run scripts/deploy-metatx-gateway.js --network hyperevmTestnet
```

### 6. Setup Permissions
```bash
npx hardhat run scripts/setup-permissions.js --network hyperevmTestnet
```

## Hub Chain Deployment

For the hub chain (HyperEVM), deploy additional components:

### Deploy Bridge Hub
```bash
npx hardhat run scripts/deploy-bridge-hub.js --network hyperevmTestnet
```

### Deploy Gas Credit Vault
```bash
npx hardhat run scripts/deploy-gas-credit-vault.js --network hyperevmTestnet
```

### Register Bridge Hub
```bash
npx hardhat run scripts/register-bridgehub.js --network hyperevmTestnet
```

## Token Deployment

### Deploy Individual Token
```bash
npx hardhat deploy-token --network hyperevmTestnet --token USDT --force
```

### Deploy All Tokens
```bash
npx hardhat deploy-tokens --network hyperevmTestnet
npx hardhat deploy-tokens --network hyperevmTestnet --force
```

## Multi-Chain Deployment

Deploy to multiple networks:

### CrossFi Testnet
```bash
npx hardhat run scripts/deploy-all-micro.js --network crossfiTestnet
```

### Ethereum Sepolia
```bash
npx hardhat run scripts/deploy-all-micro.js --network sepolia
```

## Verification

Check deployment status:
```bash
npx hardhat run scripts/check/getDetailedChainsInfo.js --network hyperevmTestnet
```

## Environment Configuration

After deployment, update your `.env` file with:
- Hub Address
- Chain ID
- Contract addresses

## Notes

- Use `--force` flag to redeploy existing contracts
- Ensure sufficient gas and native tokens for deployment
- Verify contract addresses after each deployment step