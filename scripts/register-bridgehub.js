const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require('fs');
const config = require('../deployment-config.js');
const { getContractAddress, getAllNetworkTokenData } = require('./utils/address-manager');

async function registerTokensWithBridgeHub() {
    console.log("=== Registering Tokens with BridgeHub ===");
    
    const networkName = hre.network.name;
    const bridgeHubAddress = getContractAddress(networkName, 'bridgeHub');
    console.log(`Using saved BridgeHub address: ${bridgeHubAddress}`);

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const BridgeHub = await ethers.getContractFactory("BridgeHub");
    const bridgeHub = BridgeHub.attach(bridgeHubAddress);

    // Get all network token data from address-manager
    const allNetworkData = getAllNetworkTokenData();
    const processedTokens = new Set();

    for (const networkData of allNetworkData) {
        console.log(`\n--- Processing ${networkData.network} ---`);
        
        if (!networkData.tokens || !Array.isArray(networkData.tokens)) {
            console.log(`⚠ No tokens found for ${networkData.network}`);
            continue;
        }

        for (const token of networkData.tokens) {
            // Add token to BridgeHub (only once per symbol)
            if (!processedTokens.has(token.symbol)) {
                try {
                    await bridgeHub.addToken(token.symbol, token.name, token.decimals);
                    console.log(`✓ Added token ${token.symbol} to BridgeHub`);
                    processedTokens.add(token.symbol);
                } catch (error) {
                    console.log(`⚠ Token ${token.symbol} may already exist:`, error.message);
                    processedTokens.add(token.symbol);
                }
            }

            // Add token contract for this chain
            try {
                const chainId = config.getNetworkConfig(networkData.network)?.chainId;
                if (chainId) {
                    await bridgeHub.addTokenContract(
                        token.symbol, 
                        chainId, 
                        token.address,
                        token.originChainId || 0,
                        token.originSymbol || "",
                        token.isDeployed || false
                    );
                    console.log(`✓ Added ${token.symbol} contract for chain ${chainId}: ${token.address}`);
                }
            } catch (error) {
                console.log(`⚠ Failed to add contract for ${token.symbol}:`, error.message);
            }
        }
    }
}

async function registerChainsWithBridgeHub() {
    console.log("=== Registering Chains with BridgeHub ===");
    
    const networkName = hre.network.name;
    const bridgeHubAddress = getContractAddress(networkName, 'bridgeHub');
    console.log(`Using saved BridgeHub address: ${bridgeHubAddress}`);

    const BridgeHub = await ethers.getContractFactory("BridgeHub");
    const bridgeHub = BridgeHub.attach(bridgeHubAddress);

    // Get all network token data from address-manager
    const allNetworkData = getAllNetworkTokenData();

    for (const networkData of allNetworkData) {
        console.log(`\n--- Processing chain ${networkData.network} ---`);
        
        const networkConfig = config.getNetworkConfig(networkData.network);
        if (!networkConfig) {
            console.log(`⚠ Network config not found for ${networkData.network}`);
            continue;
        }

        try {
            const gatewayAddress = getContractAddress(networkData.network, 'diGateway') || "0x0000000000000000000000000000000000000000";
            const gasCreditVault = getContractAddress(networkData.network, 'gasCreditVault') || "0x0000000000000000000000000000000000000000";
            const metaTxGateway = getContractAddress(networkData.network, 'metaTxGateway') || "0x0000000000000000000000000000000000000000";
            
            await bridgeHub.addChain(
                networkConfig.chainId,
                networkConfig.name,
                networkConfig.rpcKey,
                gatewayAddress,
                gasCreditVault,
                metaTxGateway
            );
            console.log(`✓ Registered chain ${networkConfig.name} (${networkConfig.chainId})`);
        } catch (error) {
            console.log(`⚠ Chain ${networkConfig.name} may already exist:`, error.message);
        }
    }
}

async function main() {
    // Register chains and tokens with BridgeHub
    await registerChainsWithBridgeHub();
    await registerTokensWithBridgeHub();
}

module.exports = { registerTokensWithBridgeHub, registerChainsWithBridgeHub };

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}