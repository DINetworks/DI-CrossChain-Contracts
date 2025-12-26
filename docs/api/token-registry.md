# Token Registry API Reference

The DIBridgedTokenRegistry manages token deployments and operations on each chain.

## Core Functions

### Token Deployment

#### `deployToken(string memory symbol, string memory name, uint8 decimals, uint32 originChainId, string memory originSymbol)`

Deploys a new bridged token contract.

**Parameters:**
- `symbol`: Token symbol
- `name`: Token name  
- `decimals`: Decimal places
- `originChainId`: Chain where token is native
- `originSymbol`: Original token symbol

### Token Operations

#### `lockToken(string memory symbol, address from, uint256 amount)`

Locks native tokens for cross-chain transfer.

#### `unlockToken(string memory symbol, address to, uint256 amount)`

Unlocks native tokens on destination chain.

#### `mintToken(string memory symbol, address to, uint256 amount)`

Mints bridged tokens to recipient.

#### `burnToken(string memory symbol, address from, uint256 amount)`

Burns bridged tokens from user balance.

## View Functions

### `isTokenSupported(string memory symbol) → bool`

Checks if token is supported.

### `isTokenDeployed(string memory symbol) → bool`

Checks if token is deployed as bridged token.

### `getTokenContract(string memory symbol) → address`

Gets token contract address.

### `getDeployedTokens() → string[]`

Returns array of deployed token symbols.

## Events

### `TokenDeployed`
```solidity
event TokenDeployed(
    string indexed symbol,
    address indexed tokenAddress,
    string name,
    uint8 decimals
);
```

### `TokenLocked`
```solidity
event TokenLocked(
    string indexed symbol,
    address indexed from,
    uint256 amount
);
```

### `TokenMinted`
```solidity
event TokenMinted(
    string indexed symbol,
    address indexed to,
    uint256 amount
);
```