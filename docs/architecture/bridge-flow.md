# Bridge Flow

This document explains the step-by-step process of how tokens and messages flow across chains in the DI-Contracts protocol.

## Token Transfer Flow

### 1. User Initiates Transfer

```javascript
// User calls sendToken on source chain
await gateway.sendToken(
  destinationChainId,
  recipientAddress,
  "USDT",
  amount
);
```

### 2. Source Chain Processing

1. **Validation**: Gateway validates parameters
2. **Token Handling**:
   - **Native tokens**: Lock in TokenRegistry
   - **Bridged tokens**: Burn from user balance
3. **Event Emission**: CrossChainMessage event emitted
4. **Fee Collection**: Bridge fee deducted if applicable

### 3. Relayer Processing

1. **Event Detection**: Relayer monitors CrossChainMessage events
2. **Validation**: Verify event authenticity and parameters
3. **Command Creation**: Create execution command for destination chain
4. **Signature**: Sign command with authorized relayer key

### 4. Destination Chain Execution

1. **Command Submission**: Relayer calls `execute()` on destination gateway
2. **Signature Verification**: Validate relayer signature
3. **Token Release**:
   - **Native tokens**: Unlock from TokenRegistry
   - **Bridged tokens**: Mint to recipient
4. **Event Logging**: Transaction logged in BridgeHub

## Contract Call Flow

### 1. Contract Call Initiation

```javascript
// User calls contract with optional token transfer
await gateway.callContractWithToken(
  destinationChainId,
  targetContract,
  payload,
  "USDT",
  amount
);
```

### 2. Source Chain Processing

1. **Token Handling**: Same as token transfer (if tokens included)
2. **Payload Validation**: Ensure payload is valid
3. **Event Emission**: CrossChainMessage with contract call data

### 3. Destination Chain Execution

1. **Token Release**: Release tokens to target contract (if applicable)
2. **Contract Execution**: Call target contract with:
   ```solidity
   targetContract.executeWithToken(
     commandId,
     sourceChainId,
     sourceAddress,
     payload,
     symbol,
     amount
   );
   ```

## Message Types

### Type 0: Contract Call
- Pure message passing
- No token transfer
- Payload execution only

### Type 1: Contract Call with Token
- Message + token transfer
- Tokens released to contract
- Contract receives both tokens and message

### Type 2: Token Transfer
- Simple token transfer
- No contract execution
- Direct recipient transfer

## State Synchronization

### Hub Chain Logging

```solidity
// All bridge events logged on hub chain
bridgeHub.logBridgeEvent(
  eventId,
  sourceChainId,
  destinationChainId,
  sourceAddress,
  destinationAddress,
  tokenSymbol,
  amount,
  txHash,
  eventType,
  payload
);
```

### Cross-Chain State

1. **Event Tracking**: All events tracked with unique IDs
2. **Status Updates**: Transaction status updated on completion
3. **Failure Handling**: Failed transactions can be retried
4. **Audit Trail**: Complete history maintained on hub

## Error Handling

### Common Failures

1. **Insufficient Balance**: User lacks required tokens
2. **Invalid Destination**: Target chain/address invalid
3. **Execution Failure**: Target contract execution fails
4. **Signature Invalid**: Relayer signature verification fails

### Recovery Mechanisms

1. **Retry Logic**: Failed transactions can be retried
2. **Manual Intervention**: Admin can resolve stuck transactions
3. **Refund Process**: Failed transfers can be refunded
4. **Emergency Pause**: System can be paused if needed

## Flow Diagram

```
Source Chain          Hub Chain           Destination Chain
     │                    │                      │
     │ 1. sendToken()     │                      │
     ├─────────────────►  │                      │
     │                    │                      │
     │ 2. Event Emitted   │                      │
     ├─────────────────►  │                      │
     │                    │ 3. Log Event         │
     │                    ├─────────────────►    │
     │                    │                      │
     │                    │ 4. Relayer Execute   │
     │                    │ ◄─────────────────   │
     │                    │                      │
     │ 5. Confirmation    │                      │
     │ ◄─────────────────────────────────────────┤
```