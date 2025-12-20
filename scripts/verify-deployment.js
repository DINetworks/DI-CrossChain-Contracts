const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * Verify deployed contracts functionality
 */
async function verifyDeployment() {
    console.log("=== Verifying DIGateway Deployment ===");
    
    const gatewayAddress = process.env.GATEWAY_ADDRESS;
    
    if (!gatewayAddress) {
        throw new Error("GATEWAY_ADDRESS environment variable is required");
    }

    const [deployer] = await ethers.getSigners();
    console.log("Verifying with account:", deployer.address);
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId);

    // Get contract instances
    const Gateway = await ethers.getContractFactory("DIGateway");
    const gateway = Gateway.attach(gatewayAddress);
    
    // Get registry address from gateway
    const tokenRegistryAddress = await gateway.getBridgeTokenRegistry();
    console.log("Token Registry Address:", tokenRegistryAddress);
    
    const TokenRegistry = await ethers.getContractFactory("DIBridgedTokenRegistry");
    const tokenRegistry = TokenRegistry.attach(tokenRegistryAddress);

    console.log("\n=== Token Registry Verification ===");
    try {
        const registryOwner = await tokenRegistry.owner();
        const registryGateway = await tokenRegistry.gateway();
        console.log("✓ Token Registry Owner:", registryOwner);
        console.log("✓ Token Registry Gateway:", registryGateway);
        
        if (registryGateway.toLowerCase() === gatewayAddress.toLowerCase()) {
            console.log("✓ Gateway correctly set in token registry");
        } else {
            console.log("✗ Gateway not set in token registry");
        }
    } catch (error) {
        console.log("✗ Token Registry verification failed:", error.message);
    }

    console.log("\n=== Gateway Verification ===");
    try {
        const gatewayOwner = await gateway.owner();
        const bridgeFee = await gateway.getBridgeFee();
        const feeReceiver = await gateway.feeReceiver();
        const tokenRegistryAddr = await gateway.getBridgeTokenRegistry();
        
        console.log("✓ Gateway Owner:", gatewayOwner);
        console.log("✓ Bridge Fee (BPS):", bridgeFee.toString());
        console.log("✓ Fee Receiver:", feeReceiver);
        console.log("✓ Token Registry Address:", tokenRegistryAddr);
        
        if (tokenRegistryAddr.toLowerCase() === tokenRegistryAddress.toLowerCase()) {
            console.log("✓ Token registry correctly linked");
        } else {
            console.log("✗ Token registry not correctly linked");
        }
    } catch (error) {
        console.log("✗ Gateway verification failed:", error.message);
    }

    console.log("\n=== Supported Chains Verification ===");
    try {
        const chains = [1, 56, 137, 999]; // ETH, BSC, Polygon, HyperEVM
        for (const chainId of chains) {
            const isSupported = await gateway.supportedChains(chainId);
            console.log(`Chain ${chainId}:`, isSupported ? "✓ Supported" : "✗ Not supported");
        }
    } catch (error) {
        console.log("✗ Chain verification failed:", error.message);
    }

    console.log("\n=== Contract Sizes ===");
    try {
        const tokenRegistryCode = await ethers.provider.getCode(tokenRegistryAddress);
        const gatewayCode = await ethers.provider.getCode(gatewayAddress);
        
        console.log("Token Registry bytecode size:", tokenRegistryCode.length / 2 - 1, "bytes");
        console.log("Gateway bytecode size:", gatewayCode.length / 2 - 1, "bytes");
    } catch (error) {
        console.log("✗ Size verification failed:", error.message);
    }

    console.log("\n=== Verification Complete ===");
}

async function main() {
    await verifyDeployment();
}

module.exports = { verifyDeployment };

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}