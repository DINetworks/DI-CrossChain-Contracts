# DI Bridge Infrastructure

## Overview

This bridge infrastructure enables full interoperability between CrossFi Chain and supported EVM chains, with CrossFi serving as the omnichain hub for all bridge operations.

## Key Changes

### 1. IXFI → XUSD Replacement in Gasless Contracts

- **GasCreditVault**: Now uses XUSD as the primary credit token instead of IXFI
- **MetaTxGateway**: Updated to work with XUSD-based credit system
- **Deployment Script**: Modified to whitelist XUSD instead of IXFI

### 2. Bridge Infrastructure Components

#### Core Contracts

1. **InteroperableToken.sol** - Template for bridged tokens
   - Mintable/burnable by DIGateway
   - Tracks origin chain and symbol
   - Cloneable for gas efficiency

2. **InteroperableTokenFactory.sol** - Factory for deploying bridged tokens
   - Deploys tokens via cloning
   - Stores metadata for all deployed tokens
   - Only DIGateway can deploy new tokens

3. **DIGateway.sol** - Main bridge gateway
   - Handles lock/mint and burn/unlock operations
   - Logs all transactions on CrossFi chain
   - Supports multi-chain bridging

4. **BridgeMonitor.sol** - Health monitoring system
   - Tracks transaction status
   - Detects stuck/failed transactions
   - Provides emergency recovery mechanisms

5. **DIExecutable.sol** - Base contract for GMP recipients
   - Provides `execute()` and `executeWithToken()` functions
   - Validates calls from DIGateway
   - Abstract base for custom implementations

6. **GMPExample.sol** - Example GMP implementation
   - Demonstrates message sending/receiving
   - Shows token transfer with messages
   - Reference implementation for developers

## Bridge Operations

### Deposit (Lock → Mint)
Used when moving native tokens to a remote chain:
1. Lock original token in source chain contract
2. Mint interoperable token on destination chain
3. Log transaction on CrossFi hub

### Withdraw (Burn → Unlock)
Used when returning tokens to their original chain:
1. Burn interoperable token on destination chain
2. Unlock original token on source chain
3. Update transaction log on CrossFi hub

## General Message Processing (GMP)

DIGateway supports GMP functionality similar to IXFIGateway:

### Message Types
1. **Contract Call**: Send arbitrary data to contracts on other chains
2. **Contract Call with Token**: Send data + tokens to contracts
3. **Token Transfer**: Simple token transfers between chains

### GMP Functions
- `callContract()`: Send message to contract on another chain
- `callContractWithToken()`: Send message + tokens to contract
- `sendToken()`: Transfer tokens to address on another chain
- `execute()`: Relayer function to execute approved commands

### Command Types
- `COMMAND_APPROVE_CONTRACT_CALL = 0`
- `COMMAND_APPROVE_CONTRACT_CALL_WITH_MINT = 1`
- `COMMAND_BURN_TOKEN = 2`
- `COMMAND_MINT_TOKEN = 4`

## Transaction Data Structure

```solidity
struct BridgeTXInfo {
    uint32  sourceChainId;
    uint32  destChainId;
    uint8   txType;         // 0 = lock/mint, 1 = burn/unlock, 2 = message-only
    string  symbol;
    string  amount;
    bytes   payload;
    bytes32 sourceTxHash;
    bytes32 destTxHash;
    uint32  timestamp;
}
```

## Deployment Instructions

### 1. Deploy Bridge Infrastructure
```bash
npx hardhat run scripts/deploy-bridge.js --network crossfi
```

### 2. Deploy Bridge Tokens
```bash
# Update addresses in deploy-bridge-tokens.js first
npx hardhat run scripts/deploy-bridge-tokens.js --network crossfi
```

### 3. Deploy Updated Gasless Contracts
```bash
npx hardhat run scripts/deploy-metatx.js --network crossfi
```

## Supported Assets

### CrossFi Native → External Chains
- XUSD (CrossFi stablecoin)
- XFI (CrossFi native token)

### External → CrossFi
- USDT (from Ethereum/BSC/Polygon)
- USDC (from Ethereum/BSC/Polygon)
- Other ERC-20 tokens

## Chain Support

- **CrossFi Testnet**: 4157 (Hub chain)
- **Ethereum**: 1
- **BSC**: 56
- **Polygon**: 137
- **Base**: 8453
- **Arbitrum**: 42161
- **Avalanche**: 43114
- **Optimism**: 10

## Monitoring & Health Checks

The BridgeMonitor contract provides:
- Transaction status tracking
- Stuck transaction detection (1 hour timeout)
- Chain health scoring (0-100)
- Emergency recovery triggers

## Security Features

1. **Relayer Authorization**: Only whitelisted relayers can complete bridge operations
2. **Transaction Replay Protection**: Each transaction can only be executed once
3. **CrossFi Hub Logging**: All bridge operations are logged on CrossFi for auditability
4. **Emergency Recovery**: Manual intervention capabilities for stuck transactions
5. **Health Monitoring**: Automated detection of bridge issues

## Integration Examples

### Bridge Operations
```solidity
// Lock XUSD on CrossFi and mint on Ethereum
diGateway.lockAndMint(
    xusdToken,           // XUSD token address
    1000 * 10**18,      // 1000 XUSD
    1,                  // Ethereum chain ID
    recipient,          // Recipient on Ethereum
    ""                  // Empty payload
);

// Burn bridged XUSD on Ethereum and unlock on CrossFi
diGateway.burnAndUnlock(
    bridgedXUSD,        // Bridged XUSD token address
    1000 * 10**18,      // 1000 XUSD
    4157,               // CrossFi chain ID
    recipient           // Recipient on CrossFi
);
```

### GMP Operations
```solidity
// Send message to contract on another chain
diGateway.callContract(
    "ethereum",         // Destination chain
    "0x123...",        // Contract address
    abi.encode("Hello") // Message payload
);

// Send message with tokens
diGateway.callContractWithToken(
    "ethereum",         // Destination chain
    "0x123...",        // Contract address
    abi.encode("Hello"), // Message payload
    "XUSD",            // Token symbol
    100 * 10**18       // Token amount
);

// Simple token transfer
diGateway.sendToken(
    "ethereum",         // Destination chain
    "0x456...",        // Recipient address
    "XUSD",            // Token symbol
    100 * 10**18       // Amount
);
```

### Creating GMP-Enabled Contracts
```solidity
contract MyContract is DIExecutable {
    constructor(address gateway) DIExecutable(gateway) {}
    
    function _execute(
        bytes32 commandId,
        string memory sourceChain,
        string memory sourceAddress,
        bytes calldata payload
    ) internal override {
        // Handle incoming message
        string memory message = abi.decode(payload, (string));
        // Process message...
    }
    
    function _executeWithToken(
        bytes32 commandId,
        string memory sourceChain,
        string memory sourceAddress,
        bytes calldata payload,
        string memory tokenSymbol,
        uint256 amount
    ) internal override {
        // Handle incoming message with tokens
        // Tokens are already transferred to this contract
    }
}
```

## Contract Addresses (Testnet)

Update after deployment:

- **InteroperableToken Template**: `0x...`
- **InteroperableTokenFactory**: `0x...`
- **DIGateway**: `0x...`
- **BridgeMonitor**: `0x...`
- **MetaTxGateway**: `0x50266BC23D24Ef6Cd6D3CF3F1eb72A79f9a8B553`
- **GasCreditVault**: `0x03db94E0bA755553d5A317C4fe35bb193E4dA325`

## Next Steps

1. Deploy contracts on CrossFi testnet
2. Deploy corresponding contracts on target EVM chains
3. Set up relayer infrastructure
4. Implement monitoring dashboard
5. Conduct security audit
6. Deploy to mainnet