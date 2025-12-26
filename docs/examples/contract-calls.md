# Contract Calls Examples

Learn how to execute cross-chain contract calls using DI-Contracts.

## Basic Contract Call

### Target Contract Example
```solidity
pragma solidity ^0.8.20;

import "./interfaces/IExecutable.sol";

contract CrossChainReceiver is IExecutable {
    event MessageReceived(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        bytes payload
    );
    
    function execute(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        bytes calldata payload
    ) external override {
        // Decode payload
        (string memory message, uint256 value) = abi.decode(payload, (string, uint256));
        
        // Process message
        processMessage(message, value);
        
        emit MessageReceived(commandId, sourceChainId, sourceAddress, payload);
    }
    
    function processMessage(string memory message, uint256 value) internal {
        // Custom logic here
    }
}
```

### Calling Contract
```javascript
const { ethers } = require("ethers");

async function callCrossChainContract() {
    const gateway = await ethers.getContractAt("DIGateway", gatewayAddress);
    
    // Encode payload
    const message = "Hello from another chain!";
    const value = 12345;
    const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "uint256"],
        [message, value]
    );
    
    // Execute cross-chain call
    const tx = await gateway.callContract(
        4157, // CrossFi Testnet
        "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87", // Target contract
        payload
    );
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
}
```

## Contract Call with Token

### Target Contract with Token Support
```solidity
contract TokenReceiver is IExecutable {
    event TokensReceived(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        string symbol,
        uint256 amount,
        bytes payload
    );
    
    function executeWithToken(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        bytes calldata payload,
        string calldata symbol,
        uint256 amount
    ) external override {
        // Decode additional data
        (address beneficiary, uint256 minAmount) = abi.decode(payload, (address, uint256));
        
        // Validate minimum amount
        require(amount >= minAmount, "Insufficient amount");
        
        // Transfer tokens to beneficiary
        IERC20 token = IERC20(getTokenAddress(symbol));
        token.transfer(beneficiary, amount);
        
        emit TokensReceived(commandId, sourceChainId, sourceAddress, symbol, amount, payload);
    }
    
    function getTokenAddress(string memory symbol) internal view returns (address) {
        // Get token address from registry
        return tokenRegistry.getTokenContract(symbol);
    }
}
```

### Calling with Tokens
```javascript
async function callContractWithTokens() {
    const gateway = await ethers.getContractAt("DIGateway", gatewayAddress);
    
    // Encode payload with beneficiary and minimum amount
    const beneficiary = "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87";
    const minAmount = ethers.parseUnits("5", 6); // 5 USDT minimum
    const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [beneficiary, minAmount]
    );
    
    const amount = ethers.parseUnits("10", 6); // 10 USDT
    
    // Execute cross-chain call with tokens
    const tx = await gateway.callContractWithToken(
        4157, // CrossFi Testnet
        targetContractAddress,
        payload,
        "USDT",
        amount
    );
    
    await tx.wait();
}
```

## Advanced Examples

### Multi-Step Contract Call
```solidity
contract MultiStepReceiver is IExecutable {
    enum ActionType { SWAP, STAKE, BRIDGE }
    
    struct Action {
        ActionType actionType;
        bytes data;
    }
    
    function executeWithToken(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        bytes calldata payload,
        string calldata symbol,
        uint256 amount
    ) external override {
        Action[] memory actions = abi.decode(payload, (Action[]));
        
        uint256 currentAmount = amount;
        address currentToken = getTokenAddress(symbol);
        
        for (uint i = 0; i < actions.length; i++) {
            (currentToken, currentAmount) = executeAction(
                actions[i],
                currentToken,
                currentAmount
            );
        }
    }
    
    function executeAction(
        Action memory action,
        address token,
        uint256 amount
    ) internal returns (address newToken, uint256 newAmount) {
        if (action.actionType == ActionType.SWAP) {
            return executeSwap(token, amount, action.data);
        } else if (action.actionType == ActionType.STAKE) {
            return executeStake(token, amount, action.data);
        }
        // Add more action types as needed
    }
}
```

### Cross-Chain DEX Aggregator
```javascript
async function crossChainSwap() {
    // Encode swap parameters
    const swapData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "bytes"],
        [
            inputToken,    // USDT
            outputToken,   // USDC
            minOutput,     // Minimum USDC to receive
            deadline,      // Swap deadline
            swapCalldata   // DEX-specific calldata
        ]
    );
    
    const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8", "bytes"],
        [0, swapData] // ActionType.SWAP = 0
    );
    
    await gateway.callContractWithToken(
        destinationChainId,
        dexAggregatorAddress,
        payload,
        "USDT",
        swapAmount
    );
}
```

## Error Handling

### Contract Call Failures
```solidity
contract SafeReceiver is IExecutable {
    event ExecutionFailed(bytes32 commandId, string reason);
    
    function execute(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        bytes calldata payload
    ) external override {
        try this._safeExecute(commandId, sourceChainId, sourceAddress, payload) {
            // Success
        } catch Error(string memory reason) {
            emit ExecutionFailed(commandId, reason);
        } catch {
            emit ExecutionFailed(commandId, "Unknown error");
        }
    }
    
    function _safeExecute(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        bytes calldata payload
    ) external {
        require(msg.sender == address(this), "Only self");
        // Actual execution logic here
    }
}
```

### JavaScript Error Handling
```javascript
async function safeContractCall() {
    try {
        const tx = await gateway.callContract(
            destinationChainId,
            targetContract,
            payload
        );
        
        const receipt = await tx.wait();
        
        // Check for execution events
        const executionEvents = receipt.logs.filter(log => 
            log.topics[0] === ethers.id("ContractCallApproved(bytes32,uint32,address,address,bytes32,bytes32,uint256)")
        );
        
        if (executionEvents.length > 0) {
            console.log("Contract call approved and executed");
        }
        
    } catch (error) {
        if (error.message.includes("Invalid contract")) {
            console.error("Target contract is invalid");
        } else if (error.message.includes("execution reverted")) {
            console.error("Contract execution failed");
        } else {
            console.error("Unexpected error:", error);
        }
    }
}
```

## Best Practices

### Payload Validation
```solidity
function execute(
    bytes32 commandId,
    uint32 sourceChainId,
    address sourceAddress,
    bytes calldata payload
) external override {
    // Validate source
    require(trustedSources[sourceChainId][sourceAddress], "Untrusted source");
    
    // Validate payload size
    require(payload.length <= MAX_PAYLOAD_SIZE, "Payload too large");
    
    // Decode and validate parameters
    (address target, uint256 value, bytes memory data) = abi.decode(
        payload, 
        (address, uint256, bytes)
    );
    
    require(target != address(0), "Invalid target");
    require(value > 0, "Invalid value");
}
```

### Gas Optimization
```solidity
// Use events for large data instead of storage
event DataProcessed(bytes32 indexed id, bytes data);

function execute(bytes32 commandId, uint32 sourceChainId, address sourceAddress, bytes calldata payload) external override {
    // Process data
    bytes32 dataId = processData(payload);
    
    // Emit event instead of storing
    emit DataProcessed(dataId, payload);
}
```