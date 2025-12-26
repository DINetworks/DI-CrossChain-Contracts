# Quick Start

Get up and running with DI-Contracts in minutes.

## 1. Installation

```bash
git clone <repository-url>
cd DI-Contracts
npm install
```

## 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

## 3. Compile Contracts

```bash
npm run compile
```

## 4. Deploy to Testnet

Deploy the complete bridge infrastructure:

```bash
# Deploy core contracts
npx hardhat run scripts/deploy-token-template.js --network hyperevmTestnet
npx hardhat run scripts/deploy-token-registry.js --network hyperevmTestnet
npx hardhat run scripts/deploy-gateway.js --network hyperevmTestnet
npx hardhat run scripts/setup-gateway-connection.js --network hyperevmTestnet

# Deploy hub components
npx hardhat run scripts/deploy-bridge-hub.js --network hyperevmTestnet
npx hardhat run scripts/deploy-gas-credit-vault.js --network hyperevmTestnet

# Setup permissions
npx hardhat run scripts/setup-permissions.js --network hyperevmTestnet
```

## 5. Deploy Tokens

```bash
# Deploy all supported tokens
npx hardhat deploy-tokens --network hyperevmTestnet

# Or deploy specific token
npx hardhat deploy-token --network hyperevmTestnet --token USDT
```

## 6. Test Transfer

Use the gateway to transfer tokens:

```javascript
const gateway = await ethers.getContractAt("DIGateway", gatewayAddress);

await gateway.sendToken(
  4157, // CrossFi Testnet
  "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87", // recipient
  "USDT", // token symbol
  ethers.parseUnits("10", 6) // 10 USDT
);
```

## 7. Verify Deployment

```bash
npx hardhat run scripts/check/getDetailedChainsInfo.js --network hyperevmTestnet
```

## Next Steps

- [Architecture Overview](../architecture/overview.md)
- [API Reference](../api/digateway.md)
- [Token Transfer Examples](../examples/token-transfer.md)