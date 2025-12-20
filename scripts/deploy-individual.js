const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * Deploy individual contracts separately
 */

// Deploy only DIBridgedTokenRegistry
async function deployTokenRegistryOnly() {
    console.log("=== Deploying DIBridgedTokenRegistry Only ===");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const config = {
        owner: process.env.OWNER_ADDRESS || deployer.address,
        registryName: process.env.REGISTRY_NAME || "DI Bridged Token Registry",
        registrySymbol: process.env.REGISTRY_SYMBOL || "DIBTR"
    };

    const TokenRegistry = await ethers.getContractFactory("DIBridgedTokenRegistry");
    const tokenRegistry = await TokenRegistry.deploy(
        config.registryName,
        config.registrySymbol,
        config.owner
    );
    await tokenRegistry.deployed();
    
    console.log("DIBridgedTokenRegistry deployed to:", tokenRegistry.address);
    
    // Save to file
    const deploymentData = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        timestamp: new Date().toISOString(),
        contract: "DIBridgedTokenRegistry",
        address: tokenRegistry.address,
        deployer: deployer.address,
        config: config
    };

    const fs = require('fs');
    const filename = `deployment-token-registry-${hre.network.name}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
    console.log(`Deployment saved to: ${filename}`);

    return tokenRegistry.address;
}

// Deploy only DIGateway
async function deployGatewayOnly() {
    console.log("=== Deploying DIGateway Only ===");
    
    const tokenRegistryAddress = process.env.TOKEN_REGISTRY_ADDRESS;
    if (!tokenRegistryAddress) {
        throw new Error("TOKEN_REGISTRY_ADDRESS environment variable is required");
    }

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Using token registry at:", tokenRegistryAddress);

    const config = {
        owner: process.env.OWNER_ADDRESS || deployer.address,
        feeInBps: process.env.FEE_IN_BPS || 30,
        feeReceiver: process.env.FEE_RECEIVER || deployer.address,
        tokenRegistry: tokenRegistryAddress
    };

    // Deploy DIGateway with existing registry
    const Gateway = await ethers.getContractFactory("DIGateway");
    const gateway = await Gateway.deploy(
        tokenRegistryAddress,
        config.owner,
        config.feeInBps,
        config.feeReceiver
    );
    await gateway.deployed();
    
    console.log("DIGateway deployed to:", gateway.address);
    console.log("Using existing registry at:", tokenRegistryAddress);

    // Save to file
    const deploymentData = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        timestamp: new Date().toISOString(),
        contract: "DIGateway",
        address: gateway.address,
        tokenRegistryAddress: tokenRegistryAddress,
        deployer: deployer.address,
        config: config
    };

    const fs = require('fs');
    const filename = `deployment-gateway-${hre.network.name}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
    console.log(`Deployment saved to: ${filename}`);

    return gateway.address;
}

// Setup permissions (connect gateway to token registry)
async function setupPermissions() {
    console.log("=== Setting up Permissions ===");
    
    const tokenRegistryAddress = process.env.TOKEN_REGISTRY_ADDRESS;
    const gatewayAddress = process.env.GATEWAY_ADDRESS;
    
    if (!tokenRegistryAddress || !gatewayAddress) {
        throw new Error("TOKEN_REGISTRY_ADDRESS and GATEWAY_ADDRESS environment variables are required");
    }

    const [deployer] = await ethers.getSigners();
    console.log("Setting up with account:", deployer.address);
    console.log("Token Registry:", tokenRegistryAddress);
    console.log("Gateway:", gatewayAddress);

    const TokenRegistry = await ethers.getContractFactory("DIBridgedTokenRegistry");
    const tokenRegistry = TokenRegistry.attach(tokenRegistryAddress);

    const tx = await tokenRegistry.setGateway(gatewayAddress);
    await tx.wait();
    
    console.log("Gateway successfully set in token registry");
    console.log("Transaction hash:", tx.hash);
}

// Main function to handle command line arguments
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'registry':
            await deployTokenRegistryOnly();
            break;
        case 'gateway':
            await deployGatewayOnly();
            break;
        case 'setup':
            await setupPermissions();
            break;
        default:
            console.log("Usage:");
            console.log("  npm run deploy:individual registry  - Deploy only token registry");
            console.log("  npm run deploy:individual gateway   - Deploy gateway (requires TOKEN_REGISTRY_ADDRESS)");
            console.log("  npm run deploy:individual setup     - Setup permissions");
            console.log("");
            console.log("Environment variables:");
            console.log("  OWNER_ADDRESS         - Contract owner (default: deployer)");
            console.log("  FEE_IN_BPS           - Bridge fee in basis points (default: 30)");
            console.log("  FEE_RECEIVER         - Fee receiver address (default: deployer)");
            console.log("  TOKEN_REGISTRY_ADDRESS - Required for gateway deployment");
            console.log("  GATEWAY_ADDRESS      - Required for setup");
            break;
    }
}

module.exports = {
    deployTokenRegistryOnly,
    deployGatewayOnly,
    setupPermissions
};

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}