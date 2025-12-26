# Security Model

The DI-Contracts protocol implements multiple layers of security to protect cross-chain operations.

## Architecture Security

### Hub-and-Spoke Model
- **Centralized Coordination**: HyperEVM hub reduces attack surface
- **Isolated Execution**: Each chain operates independently
- **State Synchronization**: Hub maintains authoritative state

### Multi-Signature Validation
- **Relayer Signatures**: All commands require valid relayer signatures
- **Command Validation**: Cryptographic proof of authenticity
- **Replay Protection**: Unique command IDs prevent replay attacks

## Access Control

### Role-Based Permissions

```solidity
// Owner permissions
modifier onlyOwner() {
    require(msg.sender == owner(), "Only owner");
    _;
}

// Relayer permissions
modifier onlyRelayer() {
    require(whitelisted[msg.sender], "Only relayer");
    _;
}

// Gateway permissions
modifier onlyGateway() {
    require(msg.sender == gateway, "Only gateway");
    _;
}
```

### Relayer Management
- **Whitelist System**: Only authorized relayers can execute commands
- **Dynamic Management**: Owner can add/remove relayers
- **Signature Verification**: Each command must be signed by authorized relayer

## Token Security

### Lock/Mint Model
- **Native Tokens**: Locked on source, minted on destination
- **Bridged Tokens**: Burned on source, minted on destination
- **Supply Conservation**: Total supply remains constant across all chains

### Token Validation
```solidity
modifier supportedToken(string memory symbol) {
    require(bridgeTokenRegistry.isTokenSupported(symbol), "Token not supported");
    _;
}

modifier nonZeroAmount(uint256 amount) {
    require(amount > 0, "Amount must be greater than zero");
    _;
}
```

## Command Execution Security

### Command Structure
```solidity
struct Command {
    uint256 commandType;
    bytes data;
}
```

### Execution Validation
1. **Signature Verification**: Validate relayer signature
2. **Command ID Check**: Prevent duplicate execution
3. **Parameter Validation**: Validate all command parameters
4. **State Consistency**: Ensure consistent state updates

### Replay Protection
```solidity
mapping(bytes32 => bool) public commandExecuted;

modifier notExecuted(bytes32 commandId) {
    require(!commandExecuted[commandId], "Command already executed");
    _;
}
```

## Cross-Chain Security

### Message Integrity
- **Payload Hashing**: All payloads are hashed for integrity
- **Event Validation**: Events are validated before execution
- **Source Verification**: Source chain and address validation

### Bridge Event Security
```solidity
function logBridgeEvent(
    bytes32 eventId,
    uint32 sourceChainId,
    uint32 destinationChainId,
    // ... other parameters
) external {
    require(chainIds.contains(sourceChainId), "Source chain not supported");
    require(chainIds.contains(destinationChainId), "Destination chain not supported");
    require(!eventIds.contains(eventId), "Event already logged");
    
    // Log event securely
}
```

## Meta-Transaction Security

### EIP-712 Signatures
- **Structured Data**: Type-safe signature generation
- **Domain Separation**: Prevents cross-contract signature reuse
- **Nonce Management**: Prevents replay attacks

### Signature Validation
```solidity
function recoverSigner(
    bytes32 _hash,
    bytes memory _signature
) internal pure returns (address) {
    bytes32 ethSignedMessageHash = _hash.toEthSignedMessageHash();
    return ethSignedMessageHash.recover(_signature);
}
```

## Emergency Controls

### Pause Mechanism
```solidity
bool public paused = false;

modifier whenNotPaused() {
    require(!paused, "Contract is paused");
    _;
}

function pause() external onlyOwner {
    paused = true;
    emit Paused();
}
```

### Emergency Withdrawal
```solidity
function emergencyWithdraw(
    address token,
    address to,
    uint256 amount
) external onlyOwner {
    require(paused, "Only during emergency");
    IERC20(token).safeTransfer(to, amount);
}
```

## Fee Security

### Fee Validation
```solidity
function setBridgeFee(uint256 _feeInBps) external onlyOwner {
    require(_feeInBps <= 10000, "Fee cannot exceed 100%");
    feeInBps = _feeInBps;
}
```

### Fee Collection Security
- **Designated Receiver**: Fees sent to specific address
- **Fee Calculation**: Transparent fee calculation
- **Maximum Limits**: Fees capped at reasonable limits

## Audit Trail

### Event Logging
```solidity
event CrossChainMessage(
    address indexed sender,
    uint32 indexed destinationChainId,
    address indexed destinationAddress,
    bytes32 payloadHash,
    bytes payload,
    string symbol,
    uint256 amount,
    uint8 messageType
);
```

### Transaction Tracking
- **Unique IDs**: Every transaction has unique identifier
- **Complete History**: Full audit trail maintained
- **Status Tracking**: Transaction status updates logged

## Risk Mitigation

### Common Attack Vectors

#### Double Spending
- **Prevention**: Command execution tracking
- **Mitigation**: Unique command IDs and execution flags

#### Signature Replay
- **Prevention**: Nonce-based replay protection
- **Mitigation**: EIP-712 domain separation

#### Unauthorized Access
- **Prevention**: Role-based access control
- **Mitigation**: Multi-signature requirements

### Monitoring and Alerting
- **Event Monitoring**: Real-time event tracking
- **Anomaly Detection**: Unusual transaction patterns
- **Automated Alerts**: Immediate notification of issues

## Security Best Practices

### For Developers
1. **Input Validation**: Always validate all inputs
2. **Access Control**: Implement proper permissions
3. **Error Handling**: Handle all error cases gracefully
4. **Testing**: Comprehensive test coverage

### For Users
1. **Verify Addresses**: Always double-check recipient addresses
2. **Check Amounts**: Verify transfer amounts before signing
3. **Use Official Interfaces**: Only use verified frontend interfaces
4. **Monitor Transactions**: Track transaction status

### For Relayers
1. **Secure Key Management**: Protect relayer private keys
2. **Validate Commands**: Verify all commands before execution
3. **Monitor Gas Prices**: Ensure sufficient gas for execution
4. **Maintain Uptime**: Ensure reliable service availability