# BridgeHub API Reference

The BridgeHub contract serves as the central coordination hub deployed on HyperEVM.

## Contract Address
Check `addresses/hyperevmTestnet.json` for deployment address.

## Chain Management

### `addChain(uint32 chainId, string memory name, string memory rpcUrl, address gatewayAddress, address metaTxGateway, address tokenRegistryAddress)`

Adds a new supported chain to the bridge network.

**Parameters:**
- `chainId`: Unique chain identifier
- `name`: Human-readable chain name
- `rpcUrl`: RPC endpoint URL
- `gatewayAddress`: DIGateway contract address on the chain
- `metaTxGateway`: MetaTxGateway contract address
- `tokenRegistryAddress`: TokenRegistry contract address

**Access:** Owner only

### `updateChain(uint32 chainId, string memory name, string memory rpcUrl, address gatewayAddress, address metaTxGateway)`

Updates existing chain configuration.

### `deactivateChain(uint32 chainId)`

Deactivates a chain (stops accepting new transactions).

## Token Management

### `addToken(string memory symbol, string memory name, uint8 decimals)`

Adds a new supported token to the bridge.

**Parameters:**
- `symbol`: Token symbol (e.g., "USDT")
- `name`: Full token name (e.g., "Tether USD")
- `decimals`: Token decimal places

### `addTokenContract(string memory symbol, uint32 chainId, address contractAddress, uint32 originChainId, string memory originSymbol, bool isDeployed)`

Associates a token contract with a specific chain.

**Parameters:**
- `symbol`: Token symbol
- `chainId`: Target chain ID
- `contractAddress`: Token contract address
- `originChainId`: Original chain where token is native
- `originSymbol`: Original token symbol
- `isDeployed`: Whether token is deployed (true) or native (false)

## Event Logging

### `logBridgeEvent(bytes32 eventId, uint32 sourceChainId, uint32 destinationChainId, address sourceAddress, address destinationAddress, string memory tokenSymbol, uint256 amount, bytes32 txHash, uint8 eventType, bytes memory payload)`

Logs cross-chain bridge events for monitoring and auditing.

## View Functions

### `getSupportedChains() → ChainInfo[]`

Returns array of all supported chains.

**Returns:**
```solidity
struct ChainInfo {
    uint32 chainId;
    string name;
    string rpcUrl;
    address gatewayAddress;
    address metaTxGateway;
    address tokenRegistryAddress;
    bool isActive;
    uint256 addedAt;
}
```

### `getSupportedTokens() → (string[] symbols, string[] names, uint8[] decimals)`

Returns arrays of supported token information.

### `getTokenContract(string memory symbol, uint32 chainId) → address`

Gets token contract address for specific chain.

### `isChainSupported(uint32 chainId) → bool`

Checks if chain is supported and active.

### `isTokenSupported(string memory symbol) → bool`

Checks if token is supported.

### `getDetailedChainsInfo() → (DetailedChainInfo[], BridgeHubInfo)`

Returns comprehensive chain and token information.

**Returns:**
```solidity
struct DetailedChainInfo {
    ChainInfo chainInfo;
    TokenDetail[] tokens;
}

struct BridgeHubInfo {
    address bridgeHubAddress;
    address gasCreditVaultAddress;
}
```

## Events

### `ChainAdded`
```solidity
event ChainAdded(uint32 indexed chainId, string name, address gatewayAddress);
```

### `TokenAdded`
```solidity
event TokenAdded(string indexed symbol, string name, uint8 decimals);
```

### `BridgeEventLogged`
```solidity
event BridgeEventLogged(
    bytes32 indexed eventId,
    uint32 indexed sourceChainId,
    uint32 indexed destinationChainId,
    string tokenSymbol,
    uint256 amount
);
```

## Usage Examples

### Query Supported Chains
```javascript
const bridgeHub = await ethers.getContractAt("BridgeHub", hubAddress);
const chains = await bridgeHub.getSupportedChains();
console.log("Supported chains:", chains);
```

### Check Token Support
```javascript
const isSupported = await bridgeHub.isTokenSupported("USDT");
const tokenAddress = await bridgeHub.getTokenContract("USDT", 998);
```

### Monitor Bridge Events
```javascript
bridgeHub.on("BridgeEventLogged", (eventId, sourceChain, destChain, token, amount) => {
    console.log(`Bridge event: ${token} ${amount} from ${sourceChain} to ${destChain}`);
});
```