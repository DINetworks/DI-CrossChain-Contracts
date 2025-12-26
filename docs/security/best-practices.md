# Best Practices

Follow these best practices when developing with or deploying DI-Contracts.

## Development Best Practices

### Smart Contract Development

#### Input Validation
```solidity
function sendToken(
    uint32 destinationChainId,
    address destinationAddress,
    string memory symbol,
    uint256 amount
) external 
    noZeroAddress(destinationAddress)
    supportedToken(symbol)
    nonZeroAmount(amount)
{
    // Function implementation
}
```

#### Error Handling
```solidity
function _safeExecuteCall(
    bytes32 commandId,
    uint32 sourceChainId,
    address sourceAddress,
    address contractAddress,
    bytes memory payload
) external {
    require(msg.sender == address(this), "Only self");
    
    (bool success, bytes memory returnData) = contractAddress.call(
        abi.encodeWithSignature(
            "execute(bytes32,uint32,address,bytes)",
            commandId,
            sourceChainId,
            sourceAddress,
            payload
        )
    );
    
    if (!success) {
        // Handle failure gracefully
        if (returnData.length > 0) {
            assembly {
                let returndata_size := mload(returnData)
                revert(add(32, returnData), returndata_size)
            }
        } else {
            revert("Contract call failed");
        }
    }
}
```

#### Gas Optimization
```solidity
// Use events for large data storage
event DataStored(bytes32 indexed id, bytes data);

// Batch operations when possible
function batchExecute(Command[] memory commands) external {
    for (uint256 i = 0; i < commands.length; i++) {
        _executeCommand(commands[i]);
    }
}

// Use mappings efficiently
mapping(bytes32 => bool) public executed; // More efficient than array
```

### Frontend Development

#### Signature Generation
```javascript
// Always use EIP-712 for structured data
const domain = {
    name: 'MetaTxGateway',
    version: '1',
    chainId: await provider.getNetwork().then(n => n.chainId),
    verifyingContract: contractAddress
};

// Validate all parameters before signing
function validateTransferParams(params) {
    if (!ethers.isAddress(params.destinationAddress)) {
        throw new Error('Invalid destination address');
    }
    
    if (params.amount <= 0) {
        throw new Error('Amount must be positive');
    }
    
    if (params.deadline < Math.floor(Date.now() / 1000)) {
        throw new Error('Transaction expired');
    }
    
    return true;
}
```

#### Error Handling
```javascript
async function handleTransaction(txPromise) {
    try {
        const tx = await txPromise;
        const receipt = await tx.wait();
        
        // Check for failed execution within successful transaction
        const failedEvents = receipt.logs.filter(log => 
            log.topics[0] === ethers.id("ExecutionFailed(bytes32,string)")
        );
        
        if (failedEvents.length > 0) {
            throw new Error("Transaction succeeded but execution failed");
        }
        
        return receipt;
        
    } catch (error) {
        if (error.code === 'INSUFFICIENT_FUNDS') {
            throw new Error('Insufficient gas or token balance');
        } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
            throw new Error('Transaction would fail - check parameters');
        } else {
            throw error;
        }
    }
}
```

## Deployment Best Practices

### Environment Management
```bash
# Use different environments
.env.development
.env.staging  
.env.production

# Never commit private keys
echo ".env*" >> .gitignore
echo "*.key" >> .gitignore
```

### Deployment Scripts
```javascript
// deployment/deploy-gateway.js
async function deployGateway(network) {
    console.log(`Deploying to ${network}...`);
    
    // Validate configuration
    const config = getNetworkConfig(network);
    if (!config) {
        throw new Error(`No configuration for network: ${network}`);
    }
    
    // Check deployer balance
    const balance = await deployer.getBalance();
    const minBalance = ethers.parseEther("0.1");
    
    if (balance < minBalance) {
        throw new Error(`Insufficient balance: ${ethers.formatEther(balance)} ETH`);
    }
    
    // Deploy with verification
    const gateway = await deployContract("DIGateway", [
        config.tokenRegistry,
        config.owner,
        config.feeInBps,
        config.feeReceiver
    ]);
    
    // Verify deployment
    await verifyContract(gateway.address, [
        config.tokenRegistry,
        config.owner,
        config.feeInBps,
        config.feeReceiver
    ]);
    
    return gateway;
}
```

### Configuration Management
```javascript
// Use centralized configuration
const config = {
    development: {
        networks: ['hyperevmTestnet', 'crossfiTestnet'],
        feeInBps: 30,
        confirmations: 1
    },
    production: {
        networks: ['hyperevm', 'crossfiMainnet', 'bsc'],
        feeInBps: 30,
        confirmations: 3
    }
};
```

## Security Best Practices

### Private Key Management
```bash
# Use hardware wallets for mainnet
# Use encrypted keystores
# Implement key rotation policies
# Use multi-signature wallets for critical operations
```

### Access Control
```solidity
// Implement time-locked operations for critical functions
contract TimeLocked {
    mapping(bytes32 => uint256) public timelock;
    uint256 public constant TIMELOCK_DURATION = 24 hours;
    
    function proposeChange(bytes32 operation) external onlyOwner {
        timelock[operation] = block.timestamp + TIMELOCK_DURATION;
    }
    
    function executeChange(bytes32 operation) external onlyOwner {
        require(timelock[operation] != 0, "Not proposed");
        require(block.timestamp >= timelock[operation], "Timelock not expired");
        
        // Execute operation
        delete timelock[operation];
    }
}
```

### Monitoring and Alerting
```javascript
// Monitor critical events
const gateway = new ethers.Contract(gatewayAddress, gatewayABI, provider);

gateway.on("CrossChainMessage", (sender, destChain, destAddress, payloadHash, payload, symbol, amount, messageType) => {
    // Log transaction
    console.log(`Cross-chain transfer: ${symbol} ${amount} to chain ${destChain}`);
    
    // Alert on large amounts
    if (amount > ethers.parseUnits("10000", 6)) { // > $10k USDT
        sendAlert(`Large transfer detected: ${ethers.formatUnits(amount, 6)} ${symbol}`);
    }
});

// Monitor failed executions
gateway.on("ExecutionFailed", (commandId, reason) => {
    sendAlert(`Execution failed: ${commandId} - ${reason}`);
});
```

## Testing Best Practices

### Unit Testing
```javascript
describe("DIGateway", function() {
    beforeEach(async function() {
        // Deploy fresh contracts for each test
        const tokenRegistry = await deployContract("DIBridgedTokenRegistry");
        const gateway = await deployContract("DIGateway", [
            tokenRegistry.address,
            owner.address,
            30, // 0.3% fee
            feeReceiver.address
        ]);
    });
    
    it("should validate token transfers", async function() {
        // Test valid transfer
        await expect(gateway.sendToken(998, recipient.address, "USDT", 1000000))
            .to.emit(gateway, "CrossChainMessage");
        
        // Test invalid parameters
        await expect(gateway.sendToken(0, recipient.address, "USDT", 1000000))
            .to.be.revertedWith("Invalid chain ID");
            
        await expect(gateway.sendToken(998, ethers.ZeroAddress, "USDT", 1000000))
            .to.be.revertedWith("Invalid address");
    });
});
```

### Integration Testing
```javascript
describe("Cross-Chain Integration", function() {
    it("should complete full bridge flow", async function() {
        // 1. Send token on source chain
        const tx1 = await sourceGateway.sendToken(destChainId, recipient, "USDT", amount);
        const receipt1 = await tx1.wait();
        
        // 2. Extract event data
        const event = receipt1.logs.find(log => log.topics[0] === crossChainMessageTopic);
        const eventData = parseEventData(event);
        
        // 3. Create and sign command
        const command = createCommand(eventData);
        const signature = await relayer.signMessage(command);
        
        // 4. Execute on destination chain
        const tx2 = await destGateway.execute(commandId, [command], signature);
        await tx2.wait();
        
        // 5. Verify recipient balance
        const balance = await destToken.balanceOf(recipient);
        expect(balance).to.equal(amount);
    });
});
```

## Performance Best Practices

### Gas Optimization
```solidity
// Pack structs efficiently
struct PackedData {
    uint32 chainId;      // 4 bytes
    uint32 timestamp;    // 4 bytes  
    uint64 amount;       // 8 bytes
    address user;        // 20 bytes
    // Total: 36 bytes (fits in 2 storage slots)
}

// Use events for data that doesn't need on-chain storage
event DataLogged(bytes32 indexed id, bytes data);

// Batch operations
function batchTransfer(
    uint32[] calldata chainIds,
    address[] calldata recipients,
    string[] calldata symbols,
    uint256[] calldata amounts
) external {
    require(chainIds.length == recipients.length, "Length mismatch");
    
    for (uint256 i = 0; i < chainIds.length; i++) {
        _sendToken(chainIds[i], recipients[i], symbols[i], amounts[i]);
    }
}
```

### Frontend Optimization
```javascript
// Cache contract instances
const contractCache = new Map();

function getContract(address, abi, provider) {
    const key = `${address}-${provider.network.chainId}`;
    
    if (!contractCache.has(key)) {
        contractCache.set(key, new ethers.Contract(address, abi, provider));
    }
    
    return contractCache.get(key);
}

// Batch RPC calls
async function getBatchData(addresses) {
    const multicall = new ethers.Contract(multicallAddress, multicallABI, provider);
    
    const calls = addresses.map(addr => ({
        target: addr,
        callData: tokenInterface.encodeFunctionData("balanceOf", [userAddress])
    }));
    
    const results = await multicall.aggregate(calls);
    return results.returnData.map(data => 
        tokenInterface.decodeFunctionResult("balanceOf", data)[0]
    );
}
```

## Maintenance Best Practices

### Monitoring
- Set up comprehensive logging
- Monitor gas prices and adjust accordingly
- Track bridge volumes and patterns
- Alert on unusual activity

### Upgrades
- Use proxy patterns for upgradeable contracts
- Implement proper migration procedures
- Test upgrades thoroughly on testnets
- Coordinate upgrades across all chains

### Documentation
- Keep documentation up to date
- Document all configuration changes
- Maintain deployment runbooks
- Create incident response procedures