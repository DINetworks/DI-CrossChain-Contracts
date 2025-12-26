# Meta Transactions Examples

Learn how to implement gasless transactions using the MetaTxGateway.

## Basic Meta-Transaction Setup

### EIP-712 Signature Generation

```javascript
const { ethers } = require("ethers");

// Domain separator for EIP-712
const domain = {
    name: 'MetaTxGateway',
    version: '1',
    chainId: 998, // HyperEVM Testnet
    verifyingContract: metaTxGatewayAddress
};

// Type definitions
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

async function generateSignature(userSigner, params) {
    const signature = await userSigner._signTypedData(domain, types, params);
    return signature;
}
```

### Gasless Token Transfer

```javascript
async function gaslessTokenTransfer() {
    const metaTxGateway = await ethers.getContractAt("MetaTxGateway", metaTxGatewayAddress);
    
    // Get user's current nonce
    const nonce = await metaTxGateway.getNonce(userAddress);
    
    // Prepare transaction parameters
    const params = {
        destinationChainId: 4157, // CrossFi Testnet
        destinationAddress: "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87",
        symbol: "USDT",
        amount: ethers.parseUnits("10", 6), // 10 USDT
        user: userAddress,
        nonce: nonce,
        deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };
    
    // Generate signature (user signs this)
    const signature = await generateSignature(userSigner, params);
    
    // Relayer executes the transaction
    const tx = await metaTxGateway.connect(relayerSigner).sendTokenWithSignature(
        params,
        signature
    );
    
    console.log("Gasless transaction hash:", tx.hash);
    await tx.wait();
}
```

## Frontend Integration

### React Component Example

```jsx
import { useState } from 'react';
import { ethers } from 'ethers';

function GaslessTransfer({ userSigner, metaTxGatewayAddress }) {
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState('');
    
    const executeGaslessTransfer = async (recipient, amount, token) => {
        setLoading(true);
        
        try {
            const metaTxGateway = new ethers.Contract(
                metaTxGatewayAddress,
                metaTxGatewayABI,
                userSigner
            );
            
            const userAddress = await userSigner.getAddress();
            const nonce = await metaTxGateway.getNonce(userAddress);
            
            const params = {
                destinationChainId: 4157,
                destinationAddress: recipient,
                symbol: token,
                amount: ethers.parseUnits(amount, 6),
                user: userAddress,
                nonce: nonce,
                deadline: Math.floor(Date.now() / 1000) + 3600
            };
            
            // User signs the transaction
            const signature = await generateSignature(userSigner, params);
            
            // Send to relayer service
            const response = await fetch('/api/relay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ params, signature })
            });
            
            const result = await response.json();
            setTxHash(result.txHash);
            
        } catch (error) {
            console.error('Gasless transfer failed:', error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
            <button 
                onClick={() => executeGaslessTransfer(recipient, amount, token)}
                disabled={loading}
            >
                {loading ? 'Processing...' : 'Send Gasless Transaction'}
            </button>
            {txHash && <p>Transaction: {txHash}</p>}
        </div>
    );
}
```

## Relayer Service

### Express.js Relayer Backend

```javascript
const express = require('express');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());

// Relayer configuration
const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const relayerSigner = new ethers.Wallet(relayerPrivateKey, provider);

app.post('/api/relay', async (req, res) => {
    try {
        const { params, signature } = req.body;
        
        // Validate signature
        const isValid = await validateSignature(params, signature);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid signature' });
        }
        
        // Check if user has sufficient balance
        const hasBalance = await checkUserBalance(params.user, params.symbol, params.amount);
        if (!hasBalance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Execute meta-transaction
        const metaTxGateway = new ethers.Contract(
            metaTxGatewayAddress,
            metaTxGatewayABI,
            relayerSigner
        );
        
        const tx = await metaTxGateway.sendTokenWithSignature(params, signature);
        
        res.json({ 
            txHash: tx.hash,
            status: 'pending'
        });
        
        // Monitor transaction
        tx.wait().then(() => {
            console.log(`Meta-transaction confirmed: ${tx.hash}`);
        });
        
    } catch (error) {
        console.error('Relay error:', error);
        res.status(500).json({ error: 'Relay failed' });
    }
});

async function validateSignature(params, signature) {
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
    
    try {
        const recoveredAddress = ethers.verifyTypedData(domain, types, params, signature);
        return recoveredAddress.toLowerCase() === params.user.toLowerCase();
    } catch {
        return false;
    }
}
```

## Gasless Contract Calls

### Contract Call Meta-Transaction

```javascript
// Type definition for contract calls
const contractCallTypes = {
    CallContract: [
        { name: 'destinationChainId', type: 'uint32' },
        { name: 'destinationContractAddress', type: 'address' },
        { name: 'payload', type: 'bytes' },
        { name: 'user', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ]
};

async function gaslessContractCall() {
    const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "uint256"],
        ["Hello Cross-Chain!", 42]
    );
    
    const params = {
        destinationChainId: 4157,
        destinationContractAddress: targetContractAddress,
        payload: payload,
        user: userAddress,
        nonce: await metaTxGateway.getNonce(userAddress),
        deadline: Math.floor(Date.now() / 1000) + 3600
    };
    
    const signature = await userSigner._signTypedData(
        domain,
        contractCallTypes,
        params
    );
    
    // Relayer executes
    await metaTxGateway.connect(relayerSigner).callContractWithSignature(
        params,
        signature
    );
}
```

## Fee Management

### Dynamic Fee Calculation

```javascript
async function calculateRelayFee(params) {
    const metaTxGateway = await ethers.getContractAt("MetaTxGateway", metaTxGatewayAddress);
    
    // Base relay fee
    const baseFee = await metaTxGateway.getRelayFee();
    
    // Gas estimation
    const gasEstimate = await metaTxGateway.estimateGas.sendTokenWithSignature(
        params,
        "0x" // dummy signature for estimation
    );
    
    const gasPrice = await provider.getGasPrice();
    const gasCost = gasEstimate * gasPrice;
    
    // Total fee = base fee + gas cost + relayer margin
    const relayerMargin = gasCost * 10n / 100n; // 10% margin
    const totalFee = baseFee + gasCost + relayerMargin;
    
    return {
        baseFee: ethers.formatEther(baseFee),
        gasCost: ethers.formatEther(gasCost),
        totalFee: ethers.formatEther(totalFee)
    };
}
```

### Fee Payment Options

```javascript
// Option 1: Deduct fee from transfer amount
async function transferWithFeeDeduction(amount, token) {
    const fee = await calculateRelayFee(params);
    const netAmount = amount - fee.totalFee;
    
    const params = {
        // ... other params
        amount: netAmount
    };
}

// Option 2: Separate fee payment
async function payRelayFee(feeAmount) {
    const feeToken = "USDT"; // Fee paid in USDT
    
    await tokenContract.approve(metaTxGatewayAddress, feeAmount);
    await metaTxGateway.payRelayFee(feeToken, feeAmount);
}
```

## Security Considerations

### Nonce Management

```javascript
class NonceManager {
    constructor(metaTxGateway) {
        this.gateway = metaTxGateway;
        this.pendingNonces = new Map();
    }
    
    async getNextNonce(userAddress) {
        const currentNonce = await this.gateway.getNonce(userAddress);
        const pendingCount = this.pendingNonces.get(userAddress) || 0;
        
        this.pendingNonces.set(userAddress, pendingCount + 1);
        
        return currentNonce + pendingCount;
    }
    
    onTransactionConfirmed(userAddress) {
        const pending = this.pendingNonces.get(userAddress) || 0;
        if (pending > 0) {
            this.pendingNonces.set(userAddress, pending - 1);
        }
    }
}
```

### Signature Validation

```javascript
function validateParams(params) {
    // Check deadline
    if (params.deadline < Math.floor(Date.now() / 1000)) {
        throw new Error('Transaction expired');
    }
    
    // Validate addresses
    if (!ethers.isAddress(params.user) || !ethers.isAddress(params.destinationAddress)) {
        throw new Error('Invalid address');
    }
    
    // Check amount bounds
    if (params.amount <= 0 || params.amount > ethers.parseEther('1000000')) {
        throw new Error('Invalid amount');
    }
    
    return true;
}
```