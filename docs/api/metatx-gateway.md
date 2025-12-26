# MetaTx Gateway API Reference

The MetaTxGateway enables gasless transactions through meta-transaction support.

## Meta-Transaction Functions

### `sendTokenWithSignature(SendTokenParams memory params, bytes memory signature)`

Executes gasless token transfer using user signature.

**Parameters:**
```solidity
struct SendTokenParams {
    uint32 destinationChainId;
    address destinationAddress;
    string symbol;
    uint256 amount;
    address user;
    uint256 nonce;
    uint256 deadline;
}
```

### `callContractWithSignature(CallContractParams memory params, bytes memory signature)`

Executes gasless contract call using user signature.

## Signature Verification

### EIP-712 Domain
```solidity
struct EIP712Domain {
    string name;
    string version;
    uint256 chainId;
    address verifyingContract;
}
```

### TypeHash Constants
```solidity
bytes32 public constant SEND_TOKEN_TYPEHASH = keccak256(
    "SendToken(uint32 destinationChainId,address destinationAddress,string symbol,uint256 amount,address user,uint256 nonce,uint256 deadline)"
);
```

## Nonce Management

### `getNonce(address user) → uint256`

Gets current nonce for user.

### `incrementNonce(address user)`

Increments user nonce (internal).

## Relay Fee Management

### `setRelayFee(uint256 _relayFee)`

Sets relay fee for meta-transactions.

### `getRelayFee() → uint256`

Gets current relay fee.

## Usage Example

### JavaScript Signature Generation
```javascript
const domain = {
    name: 'MetaTxGateway',
    version: '1',
    chainId: 998,
    verifyingContract: metaTxGatewayAddress
};

const types = {
    SendToken: [
        { name: 'destinationChainId', type: 'uint32' },
        { name: 'destinationAddress', type: 'address' },
        { name: 'symbol', type: 'string' },
        { name: 'amount', type: 'uint256' },
        { name: 'user', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ]
};

const value = {
    destinationChainId: 4157,
    destinationAddress: recipientAddress,
    symbol: 'USDT',
    amount: ethers.parseUnits('10', 6),
    user: userAddress,
    nonce: await metaTxGateway.getNonce(userAddress),
    deadline: Math.floor(Date.now() / 1000) + 3600
};

const signature = await signer._signTypedData(domain, types, value);
```