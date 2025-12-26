# DI-Contracts Documentation

Welcome to the DI-Contracts documentation - a comprehensive omnichain bridging protocol built on Solidity.

## Overview

DI-Contracts is a cross-chain bridge infrastructure that enables seamless token transfers and contract calls across multiple blockchain networks. The protocol uses HyperEVM as the central hub for coordinating bridge operations while supporting various EVM-compatible chains.

## Key Features

- **Omnichain Bridging**: Transfer tokens across multiple blockchain networks
- **General Message Passing (GMP)**: Execute contract calls across chains
- **Meta-Transaction Support**: Gasless transactions for improved UX
- **Centralized Hub Architecture**: HyperEVM serves as the coordination hub
- **Token Registry**: Unified token management across all supported chains
- **Fee Management**: Configurable bridge fees with designated receivers

## Supported Networks

- **HyperEVM** (Hub Chain)
- **CrossFi Testnet/Mainnet**
- **Ethereum Sepolia**
- **BSC (Binance Smart Chain)**
- **Polygon**
- **Arbitrum**
- **Optimism**
- **Base**
- **Avalanche**

## Architecture Components

### Core Contracts

1. **DIGateway** - Main gateway contract for cross-chain operations
2. **BridgeHub** - Central hub deployed on HyperEVM for coordination
3. **DIBridgedTokenRegistry** - Token registry and management
4. **DIBridgedToken** - Bridged token implementation
5. **MetaTxGateway** - Meta-transaction support
6. **GasCreditVault** - Gas credit management

### Libraries

- **CalldataLibrary** - Calldata encoding/decoding utilities
- **MulticallLibraryV2** - Batch transaction support
- **QuoteLibrary** - DEX integration for price quotes

## Quick Start

1. **Installation**: Set up the development environment
2. **Configuration**: Configure network settings and private keys
3. **Deployment**: Deploy contracts to target networks
4. **Setup**: Configure cross-chain connections and permissions

## Documentation Structure

- [Getting Started](getting-started/README.md) - Setup and installation guide
- [Architecture](architecture/README.md) - System design and components
- [Deployment](deployment/README.md) - Contract deployment procedures
- [API Reference](api/README.md) - Contract interfaces and methods
- [Examples](examples/README.md) - Usage examples and tutorials
- [Security](security/README.md) - Security considerations and audits

## Contributing

We welcome contributions to improve the DI-Contracts protocol. Please read our contributing guidelines and submit pull requests for review.

## License

This project is licensed under the MIT License - see the LICENSE file for details.