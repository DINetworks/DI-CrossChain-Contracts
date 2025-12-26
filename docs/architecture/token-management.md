# Token Management

The DI-Contracts protocol manages tokens across multiple chains using a hub-and-spoke model with different handling for native vs bridged tokens.

## Token Types

### Native Tokens
Tokens that exist natively on their origin chain.

**Examples:**
- USDT on Ethereum
- USDC on Ethereum  
- XFI on CrossFi
- HYPE on HyperEVM

**Behavior:**
- **Source Chain**: Locked in TokenRegistry
- **Destination Chain**: Minted as bridged token
- **Return**: Burned on destination, unlocked on source

### Bridged Tokens
Tokens that are representations of native tokens from other chains.

**Examples:**
- USDT on HyperEVM (bridged from Ethereum)
- USDC on CrossFi (bridged from Ethereum)

**Behavior:**
- **Source Chain**: Burned from user balance
- **Destination Chain**: Minted to recipient
- **Native Chain**: Unlocked from reserves

## Token Registry

### Token Configuration

```javascript
// From deployment-config.js
TOKEN_CONTRACTS: {
  USDT: {
    name: "Tether USD",
    symbol: "USDT",
    defaultDecimals: 6,
    isStablecoin: true,
    chains: {
      [CHAIN_IDS.SEPOLIA]: {
        address: "0xA1d7f71cbBb361A77820279958BAC38fC3667c1a",
        decimals: 6
      },
      [CHAIN_IDS.HYPEREVM_TESTNET]: {
        address: "0x7f9722758a3e70210d78b107f9069cb12150e8a5",
        decimals: 6
      }
    }
  }
}
```

### Token Deployment

#### Automatic Deployment
```bash
# Deploy all configured tokens
npx hardhat deploy-tokens --network hyperevmTestnet

# Force redeploy existing tokens
npx hardhat deploy-tokens --network hyperevmTestnet --force
```

#### Manual Deployment
```bash
# Deploy specific token
npx hardhat deploy-token --network hyperevmTestnet --token USDT --force
```

### Token Operations

#### Lock/Unlock (Native Tokens)

```solidity
// Lock native tokens on source chain
function lockToken(string memory symbol, address from, uint256 amount) external {
    address tokenAddress = getTokenContract(symbol);
    IERC20(tokenAddress).safeTransferFrom(from, address(this), amount);
    emit TokenLocked(symbol, from, amount);
}

// Unlock native tokens on destination chain
function unlockToken(string memory symbol, address to, uint256 amount) external {
    address tokenAddress = getTokenContract(symbol);
    IERC20(tokenAddress).safeTransfer(to, amount);
    emit TokenUnlocked(symbol, to, amount);
}
```

#### Mint/Burn (Bridged Tokens)

```solidity
// Mint bridged tokens on destination chain
function mintToken(string memory symbol, address to, uint256 amount) external {
    address tokenAddress = deployedTokens[symbol];
    DIBridgedToken(tokenAddress).mint(to, amount);
    emit TokenMinted(symbol, to, amount);
}

// Burn bridged tokens on source chain
function burnToken(string memory symbol, address from, uint256 amount) external {
    address tokenAddress = deployedTokens[symbol];
    DIBridgedToken(tokenAddress).burnFrom(from, amount);
    emit TokenBurned(symbol, from, amount);
}
```

## Decimal Handling

### Cross-Chain Decimals

Different chains may use different decimal places for the same token:

```javascript
// USDC decimals by chain
USDC: {
  chains: {
    [SEPOLIA]: { decimals: 6 },      // 6 decimals
    [BSC]: { decimals: 18 },         // 18 decimals  
    [HYPEREVM]: { decimals: 6 }      // 6 decimals
  }
}
```

### Decimal Conversion

```solidity
function convertDecimals(
    uint256 amount,
    uint8 fromDecimals,
    uint8 toDecimals
) internal pure returns (uint256) {
    if (fromDecimals == toDecimals) {
        return amount;
    } else if (fromDecimals < toDecimals) {
        return amount * (10 ** (toDecimals - fromDecimals));
    } else {
        return amount / (10 ** (fromDecimals - toDecimals));
    }
}
```

## Fee Management

### Bridge Fees

```solidity
// Fee calculation (basis points)
uint256 public feeInBps = 30; // 0.3%

function calculateFee(uint256 amount) public view returns (uint256) {
    return (amount * feeInBps) / 10000;
}
```

### Fee Collection

```solidity
function _handleReleaseToken(
    address target,
    string memory symbol,
    uint256 amount,
    uint256 feeAmount
) internal {
    // Release tokens to user
    if (isDeployedToken) {
        mintToken(symbol, target, amount);
        // Collect fee
        if (feeAmount > 0) {
            mintToken(symbol, feeReceiver, feeAmount);
        }
    } else {
        unlockToken(symbol, target, amount);
        if (feeAmount > 0) {
            unlockToken(symbol, feeReceiver, feeAmount);
        }
    }
}
```

## Token Security

### Access Control

```solidity
// Only gateway can mint/burn
modifier onlyGateway() {
    require(msg.sender == gateway, "Only gateway");
    _;
}

// Only registry can deploy tokens
modifier onlyRegistry() {
    require(msg.sender == tokenRegistry, "Only registry");
    _;
}
```

### Supply Tracking

```solidity
// Track total supply across chains
mapping(string => uint256) public totalSupply;
mapping(string => mapping(uint32 => uint256)) public chainSupply;

function updateSupply(string memory symbol, uint32 chainId, uint256 amount, bool isIncrease) internal {
    if (isIncrease) {
        totalSupply[symbol] += amount;
        chainSupply[symbol][chainId] += amount;
    } else {
        totalSupply[symbol] -= amount;
        chainSupply[symbol][chainId] -= amount;
    }
}
```

## Supported Tokens

### Current Tokens

| Symbol | Name | Type | Origin Chain | Decimals |
|--------|------|------|--------------|----------|
| USDT | Tether USD | Stablecoin | Ethereum | 6 |
| USDC | USD Coin | Stablecoin | Ethereum | 6 |
| HYPE | HYPE | Native | HyperEVM | 18 |
| XFI | Wrapped XFI | Native | CrossFi | 18 |
| DUSD | DUSD | Stablecoin | HyperEVM | 18 |

### Adding New Tokens

1. **Update Configuration**: Add to `deployment-config.js`
2. **Deploy Contracts**: Run deployment scripts
3. **Register in Hub**: Add to BridgeHub registry
4. **Test Transfers**: Verify cross-chain functionality