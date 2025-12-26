# Token Transfer Examples

This guide demonstrates how to transfer tokens across chains using DI-Contracts.

## Basic Token Transfer

### JavaScript/TypeScript Example

```javascript
const { ethers } = require("ethers");

// Contract ABI (simplified)
const gatewayABI = [
  "function sendToken(uint32 destinationChainId, address destinationAddress, string symbol, uint256 amount)",
  "function getBridgeFee() view returns (uint256)"
];

async function transferTokens() {
  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider("https://rpc.hyperliquid-testnet.xyz/evm");
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Gateway contract
  const gatewayAddress = "0x..."; // From addresses/hyperevmTestnet.json
  const gateway = new ethers.Contract(gatewayAddress, gatewayABI, signer);
  
  // Transfer parameters
  const destinationChainId = 4157; // CrossFi Testnet
  const destinationAddress = "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87";
  const tokenSymbol = "USDT";
  const amount = ethers.parseUnits("10", 6); // 10 USDT (6 decimals)
  
  try {
    // Execute transfer
    const tx = await gateway.sendToken(
      destinationChainId,
      destinationAddress,
      tokenSymbol,
      amount
    );
    
    console.log("Transaction hash:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transfer confirmed in block:", receipt.blockNumber);
    
  } catch (error) {
    console.error("Transfer failed:", error);
  }
}
```

### Solidity Example

```solidity
pragma solidity ^0.8.20;

import "./interfaces/IDIGateway.sol";

contract TokenBridge {
    IDIGateway public gateway;
    
    constructor(address _gateway) {
        gateway = IDIGateway(_gateway);
    }
    
    function bridgeTokens(
        uint32 destinationChainId,
        address recipient,
        string memory symbol,
        uint256 amount
    ) external {
        // Transfer tokens from user to this contract first
        // (assuming token approval was given)
        
        // Initiate cross-chain transfer
        gateway.sendToken(
            destinationChainId,
            recipient,
            symbol,
            amount
        );
    }
}
```

## Supported Tokens

### USDT Transfer
```javascript
// USDT has 6 decimals
const amount = ethers.parseUnits("100", 6); // 100 USDT
await gateway.sendToken(destinationChainId, recipient, "USDT", amount);
```

### USDC Transfer
```javascript
// USDC has 6 decimals
const amount = ethers.parseUnits("50", 6); // 50 USDC
await gateway.sendToken(destinationChainId, recipient, "USDC", amount);
```

### HYPE Transfer
```javascript
// HYPE has 18 decimals
const amount = ethers.parseEther("1000"); // 1000 HYPE
await gateway.sendToken(destinationChainId, recipient, "HYPE", amount);
```

## Chain IDs Reference

```javascript
const CHAIN_IDS = {
  HYPEREVM_TESTNET: 998,
  CROSSFI_TESTNET: 4157,
  SEPOLIA: 11155111,
  BSC: 56,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  AVALANCHE: 43114
};
```

## Fee Calculation

```javascript
async function calculateFee(amount) {
  const feeInBps = await gateway.getBridgeFee(); // e.g., 30 = 0.3%
  const fee = (amount * feeInBps) / 10000n;
  return fee;
}

// Example usage
const transferAmount = ethers.parseUnits("100", 6); // 100 USDT
const fee = await calculateFee(transferAmount);
console.log("Bridge fee:", ethers.formatUnits(fee, 6), "USDT");
```

## Error Handling

```javascript
async function safeTransfer() {
  try {
    const tx = await gateway.sendToken(
      destinationChainId,
      recipient,
      "USDT",
      amount
    );
    return await tx.wait();
  } catch (error) {
    if (error.message.includes("Token not supported")) {
      console.error("Token is not supported on this bridge");
    } else if (error.message.includes("Amount must be greater than zero")) {
      console.error("Invalid transfer amount");
    } else if (error.message.includes("Invalid address")) {
      console.error("Invalid recipient address");
    } else {
      console.error("Transfer failed:", error.message);
    }
    throw error;
  }
}
```

## Monitoring Transfer Status

```javascript
async function monitorTransfer(txHash) {
  const receipt = await provider.getTransactionReceipt(txHash);
  
  // Find CrossChainMessage event
  const gatewayInterface = new ethers.Interface(gatewayABI);
  
  for (const log of receipt.logs) {
    try {
      const parsed = gatewayInterface.parseLog(log);
      if (parsed.name === "CrossChainMessage") {
        console.log("Cross-chain message emitted:");
        console.log("Destination Chain:", parsed.args.destinationChainId);
        console.log("Recipient:", parsed.args.destinationAddress);
        console.log("Token:", parsed.args.symbol);
        console.log("Amount:", parsed.args.amount.toString());
      }
    } catch (e) {
      // Not a gateway event
    }
  }
}
```