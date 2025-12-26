# DIGateway API Reference

The DIGateway contract is the main interface for cross-chain operations on each supported network.

## Contract Address
Check deployment addresses in `addresses/{network}.json`

## Core Functions

### Token Transfer

#### `sendToken(uint32 destinationChainId, address destinationAddress, string memory symbol, uint256 amount)`

Transfers tokens to another chain.

**Parameters:**
- `destinationChainId`: Target chain ID
- `destinationAddress`: Recipient address on destination chain
- `symbol`: Token symbol (e.g., "USDT", "USDC")
- `amount`: Amount to transfer (in token decimals)

**Example:**
```solidity
gateway.sendToken(998, 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87, "USDT", 1000000); // 1 USDT
```

### Contract Calls

#### `callContract(uint32 destinationChainId, address destinationContractAddress, bytes memory payload)`

Executes a contract call on another chain.

**Parameters:**
- `destinationChainId`: Target chain ID
- `destinationContractAddress`: Target contract address
- `payload`: Encoded function call data

#### `callContractWithToken(uint32 destinationChainId, address destinationContractAddress, bytes memory payload, string memory symbol, uint256 amount)`

Executes a contract call with token transfer.

**Parameters:**
- Same as `callContract` plus:
- `symbol`: Token symbol to transfer
- `amount`: Token amount to transfer

### Command Execution (Relayer Only)

#### `execute(bytes32 commandId, Command[] memory commands, bytes memory signature)`

Executes relayer commands (internal use).

**Parameters:**
- `commandId`: Unique command identifier
- `commands`: Array of commands to execute
- `signature`: Relayer signature

## View Functions

### `getBridgeFee() → uint256`
Returns current bridge fee in basis points.

### `isCommandExecuted(bytes32 commandId) → bool`
Checks if a command has been executed.

### `getAllRelayers() → address[]`
Returns list of authorized relayers.

### `getBridgeTransaction(bytes32 txId) → BridgeTXInfo`
Returns bridge transaction details.

## Events

### `CrossChainMessage`
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

### `ContractCallApproved`
```solidity
event ContractCallApproved(
    bytes32 indexed commandId,
    uint32 indexed sourceChainId,
    address indexed sourceAddress,
    address contractAddress,
    bytes32 payloadHash,
    bytes32 sourceTxHash,
    uint256 sourceEventIndex
);
```

### `BridgeTransactionLogged`
```solidity
event BridgeTransactionLogged(
    bytes32 indexed txId,
    BridgeTXInfo txInfo
);
```

## Admin Functions (Owner Only)

### `addRelayer(address relayer)`
Adds a new authorized relayer.

### `removeRelayer(address relayer)`
Removes a relayer from authorization.

### `setBridgeFee(uint256 _feeInBps)`
Sets bridge fee (max 10000 = 100%).

### `setFeeReceiver(address _feeReceiver)`
Sets fee collection address.

## Error Handling

Common errors:
- `"Only relayer"`: Caller not authorized relayer
- `"Command already executed"`: Duplicate command execution
- `"Amount must be greater than zero"`: Invalid amount
- `"Token not supported"`: Token not in registry
- `"Invalid contract"`: Target contract invalid