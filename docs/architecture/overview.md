# Architecture Overview

DI-Contracts implements a hub-and-spoke architecture for cross-chain bridging with HyperEVM as the central coordination hub.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chain A       │    │   HyperEVM      │    │   Chain B       │
│   (Spoke)       │    │   (Hub)         │    │   (Spoke)       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ DIGateway       │◄──►│ BridgeHub       │◄──►│ DIGateway       │
│ TokenRegistry   │    │ GasCreditVault  │    │ TokenRegistry   │
│ MetaTxGateway   │    │ Aggregator      │    │ MetaTxGateway   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### Hub Chain (HyperEVM)
- **BridgeHub**: Central coordination and event logging
- **GasCreditVault**: Gas credit management for cross-chain operations
- **CrossChainAggregator**: Price aggregation across chains

### Spoke Chains
- **DIGateway**: Main bridge interface for users
- **DIBridgedTokenRegistry**: Token management and registry
- **MetaTxGateway**: Meta-transaction support
- **DIBridgedToken**: Bridged token implementation

## Bridge Flow

### Token Transfer Flow
1. User initiates transfer on source chain
2. Gateway locks/burns tokens
3. Event emitted and relayed to hub
4. Hub validates and logs transaction
5. Relayer executes on destination chain
6. Gateway mints/unlocks tokens to recipient

### Contract Call Flow
1. User calls `callContract` or `callContractWithToken`
2. Gateway emits CrossChainMessage event
3. Relayer picks up event and validates
4. Relayer executes command on destination chain
5. Target contract receives execution call

## Token Management

### Native Tokens
- Locked on source chain
- Unlocked on destination chain
- Original contract remains on origin chain

### Bridged Tokens
- Burned on non-origin chains
- Minted on destination chains
- Managed by TokenRegistry

## Security Model

### Multi-Signature Validation
- Relayer signatures required for execution
- Command validation through cryptographic proofs
- Replay protection via command IDs

### Access Control
- Owner-based permissions
- Whitelisted relayers
- Contract-level validations

## Gas Management

### Gas Credits
- Pre-funded gas credits on hub chain
- Automatic gas estimation
- Cross-chain gas payment support

### Fee Structure
- Configurable bridge fees (basis points)
- Fee collection to designated receiver
- Dynamic fee adjustment based on network conditions