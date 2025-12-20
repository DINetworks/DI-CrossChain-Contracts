const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying DIGateway with integrated token management...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const config = {
        owner: process.env.OWNER_ADDRESS || deployer.address,
        feeInBps: process.env.FEE_IN_BPS || 30,
        feeReceiver: process.env.FEE_RECEIVER || deployer.address,
        tokenTemplate: process.env.TOKEN_TEMPLATE || ""
    };

    // Deploy DIBridgedToken template if not provided
    let tokenTemplate = config.tokenTemplate;
    if (!tokenTemplate) {
        console.log("Deploying DIBridgedToken template...");
        const TokenTemplate = await ethers.getContractFactory("DIBridgedToken");
        const template = await TokenTemplate.deploy();
        await template.deployed();
        tokenTemplate = template.address;
        console.log("DIBridgedToken template:", tokenTemplate);
    }

    // Deploy DIGateway
    const Gateway = await ethers.getContractFactory("DIGateway");
    const gateway = await Gateway.deploy(
        tokenTemplate,
        config.owner,
        config.feeInBps,
        config.feeReceiver
    );
    await gateway.deployed();
    
    console.log("DIGateway deployed to:", gateway.address);
    
    const registryAddress = await gateway.getBridgeTokenRegistry();
    console.log("DIBridgedTokenRegistry created at:", registryAddress);

    // Save deployment data
    const deploymentData = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            DIGateway: gateway.address,
            DIBridgedTokenRegistry: registryAddress,
            DIBridgedTokenTemplate: tokenTemplate
        },
        config: config
    };

    const fs = require('fs');
    const filename = `deployment-${hre.network.name}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
    console.log(`Deployment data saved to: ${filename}`);

    return {
        gateway: gateway.address,
        registry: registryAddress,
        template: tokenTemplate
    };
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { main };