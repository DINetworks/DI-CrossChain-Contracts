# Installation

This guide will help you set up the DI-Contracts development environment.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## Clone Repository

```bash
git clone <repository-url>
cd DI-Contracts
```

## Install Dependencies

```bash
npm install
```

## Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env`:
```bash
# Private key for deployment
PRIVATE_KEY=your_private_key_here

# RPC URLs for different networks
HYPEREVM_RPC_URL=https://rpc.hyperliquid.xyz/evm
HYPEREVM_RPC_TESTNET_URL=https://rpc.hyperliquid-testnet.xyz/evm
CROSSFI_RPC_URL=https://rpc.mainnet.ms/
CROSSFI_RPC_TESTNET_URL=https://rpc.testnet.ms/
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# API Keys (optional)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Compile Contracts

```bash
npm run compile
```

## Run Tests

```bash
npm test
```

## Verify Installation

Check if everything is working correctly:

```bash
npx hardhat --version
```

You should see the Hardhat version information, confirming successful installation.