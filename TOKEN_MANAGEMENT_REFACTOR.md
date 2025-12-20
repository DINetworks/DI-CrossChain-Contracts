# Token Management Refactoring Summary

## Changes Made

### 1. DIBridgedTokenRegistry Updates
- **Added token management functions**: `addToken()`, `removeToken()`, `mintToken()`, `burnToken()`, `lockToken()`, `unlockToken()`
- **Added token storage**: `supportedTokens` mapping and `tokenList` array
- **Added view functions**: `getSupportedTokens()`, `isTokenSupported()`, `getTokenAddress()`, `getTokenBySymbol()`
- **Updated TokenInfo struct**: Added `isBridged` field
- **Added events**: `TokenAdded`, `TokenRemoved`

### 2. DIGateway Updates
- **Removed token storage**: Removed `supportedTokens` mapping and `tokenList` array
- **Updated constructor**: Now takes `tokenTemplate` address and creates registry internally
- **Updated token operations**: All token operations now delegate to registry
- **Added registry getter**: `getBridgeTokenRegistry()` function
- **Updated modifiers**: `supportedToken` now checks registry
- **Simplified admin functions**: Token management delegates to registry

### 3. Token Operation Flow
**Before:**
```
DIGateway -> Direct token operations (mint/burn/lock/unlock)
```

**After:**
```
DIGateway -> DIBridgedTokenRegistry -> Token operations
```

### 4. Deployment Changes
**Before:**
```
1. Deploy DIBridgedTokenRegistry
2. Deploy DIGateway with registry address
3. Set gateway in registry
```

**After:**
```
1. Deploy DIBridgedToken template
2. Deploy DIGateway with template address (creates registry internally)
```

## Benefits

1. **Centralized Token Management**: All token operations are now managed by the registry
2. **Simplified Deployment**: Single deployment step instead of three
3. **Better Separation of Concerns**: Gateway focuses on bridging logic, registry handles tokens
4. **Easier Maintenance**: Token management code is centralized
5. **Reduced Contract Size**: DIGateway is smaller without token management code

## Updated Functions

### DIBridgedTokenRegistry
- `addToken(symbol, address, name, decimals, isBridged)` - Add supported token
- `removeToken(symbol)` - Remove supported token
- `mintToken(token, to, amount)` - Mint bridged tokens (gateway only)
- `burnToken(token, from, amount)` - Burn bridged tokens (gateway only)
- `lockToken(token, from, amount)` - Lock native tokens (gateway only)
- `unlockToken(token, to, amount)` - Unlock native tokens (gateway only)
- `getSupportedTokens()` - Get all supported tokens
- `isTokenSupported(symbol)` - Check if token is supported
- `getTokenAddress(symbol)` - Get token contract address

### DIGateway
- `getBridgeTokenRegistry()` - Get registry contract address
- `_getTokenInfo(symbol)` - Internal helper to get token info from registry
- Updated `deployToken()`, `addToken()`, `removeToken()` to delegate to registry
- Updated `getSupportedTokens()`, `isTokenSupported()`, `getTokenAddress()` to delegate to registry

## Migration Guide

### For Existing Deployments
1. Deploy new DIGateway with template address
2. Migrate token configurations using `addToken()` calls
3. Update relayer code to use new contract addresses

### For New Deployments
1. Use `deploy-gateway-updated.js` script
2. Set environment variables:
   - `OWNER_ADDRESS` - Contract owner
   - `FEE_IN_BPS` - Bridge fee in basis points
   - `FEE_RECEIVER` - Fee receiver address
   - `TOKEN_TEMPLATE` - (optional) DIBridgedToken template address

### Environment Variables
```bash
export OWNER_ADDRESS="0x..."
export FEE_IN_BPS="30"
export FEE_RECEIVER="0x..."
npx hardhat run scripts/deploy-gateway-updated.js --network <network>
```

## Verification
Use the updated verification script:
```bash
export GATEWAY_ADDRESS="0x..."
npx hardhat run scripts/verify-deployment.js --network <network>
```

The script will automatically discover the registry address from the gateway and verify both contracts.