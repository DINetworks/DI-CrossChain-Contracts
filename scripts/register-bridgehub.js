const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require('fs');
const config = require('../deployment-config.js');
const { getContractAddress, getAllNetworkTokenData, getNetworkTokenData } = require('./utils/address-manager');
const { RELAYER } = config;

async function whitelistTokensInGasCreditVault() {
    console.log("=== Whitelisting Tokens in GasCreditVault ===");
    
    const networkName = hre.network.name;
    const bridgeHubInfo = config.getBridgeHubNetwork();
    
    if (!bridgeHubInfo || bridgeHubInfo.networkName !== networkName) {
        console.log(`⚠ Skipping token whitelisting - not running on BridgeHub network (${bridgeHubInfo?.networkName})`);
        return;
    }
    
    const gasCreditVaultAddress = getContractAddress(networkName, 'gasCreditVault');
    if (!gasCreditVaultAddress) {
        console.log(`⚠ GasCreditVault not found for ${networkName}`);
        return;
    }
    
    console.log(`Using GasCreditVault address: ${gasCreditVaultAddress}`);

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const GasCreditVault = await ethers.getContractFactory("GasCreditVault");
    const gasCreditVault = GasCreditVault.attach(gasCreditVaultAddress);

    // Get tokens from BridgeHub network using address-manager
    const bridgeHubTokenData = getNetworkTokenData(bridgeHubInfo.networkName);
    if (!bridgeHubTokenData || !bridgeHubTokenData.tokens) {
        console.log(`⚠ No token data found for BridgeHub network: ${bridgeHubInfo.networkName}`);
        return;
    }
    
    const bridgeHubTokens = bridgeHubTokenData.tokens;
    console.log(`\n--- Processing ${bridgeHubTokens.length} tokens from BridgeHub network ---`);

    for (const token of bridgeHubTokens) {
        // Skip tokens without valid addresses
        if (!token.address || token.address === "0x0000000000000000000000000000000000000000") {
            console.log(`⚠ Skipping ${token.symbol} - no valid address`);
            continue;
        }

        try {
            // Check if token is already whitelisted
            const isWhitelisted = await gasCreditVault.isTokenWhitelisted(token.address);
            if (isWhitelisted) {
                console.log(`✓ Token ${token.symbol} already whitelisted`);
                continue;
            }

            // Whitelist token in GasCreditVault
            const priceFeed = token.priceFeed || "0x0000000000000000000000000000000000000000";
            const isStablecoin = token.isStablecoin || false;
            
            await gasCreditVault.whitelistToken(
                token.address,
                priceFeed,
                isStablecoin
            );
            
            console.log(`✓ Whitelisted ${token.symbol} in GasCreditVault`);
            console.log(`  Address: ${token.address}`);
            console.log(`  Price Feed: ${priceFeed}`);
            console.log(`  Is Stablecoin: ${isStablecoin}`);
        } catch (error) {
            console.log(`⚠ Failed to whitelist ${token.symbol}:`, error.message);
        }
    }

    // Add relayer to whitelist
    try {
        const isRelayerWhitelisted = await gasCreditVault.isRelayerWhitelisted(config.RELAYER);
        if (!isRelayerWhitelisted) {
            await gasCreditVault.addWhitelistedRelayer(config.RELAYER);
            console.log(`✓ Added relayer to whitelist: ${config.RELAYER}`);
        } else {
            console.log(`✓ Relayer already whitelisted: ${config.RELAYER}`);
        }
    } catch (error) {
        console.log(`⚠ Failed to whitelist relayer:`, error.message);
    }
}

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
            const metaTxGateway = getContractAddress(networkData.network, 'metaTxGateway') || "0x0000000000000000000000000000000000000000";
            const tokenRegistryAddress = getContractAddress(networkData.network, 'tokenRegistry') || "0x00000000000000000000000000000000000000";
            
            await bridgeHub.addChain(
                networkConfig.chainId,
                networkConfig.name,
                networkConfig.rpcKey,
                gatewayAddress,
                metaTxGateway,
                tokenRegistryAddress
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
    
    // Set GasCreditVault address for BridgeHub
    await setGasCreditVaultAddress();
    
    // Whitelist tokens in GasCreditVault (only on BridgeHub chain)
    await whitelistTokensInGasCreditVault();
}

async function setGasCreditVaultAddress() {
    console.log("=== Setting GasCreditVault Address in BridgeHub ===");
    
    const networkName = hre.network.name;
    const bridgeHubInfo = config.getBridgeHubNetwork();
    
    if (!bridgeHubInfo || bridgeHubInfo.networkName !== networkName) {
        console.log(`⚠ Skipping GasCreditVault address setting - not running on BridgeHub network`);
        return;
    }
    
    const bridgeHubAddress = getContractAddress(networkName, 'bridgeHub');
    const gasCreditVaultAddress = getContractAddress(networkName, 'gasCreditVault');
    
    if (!gasCreditVaultAddress) {
        console.log(`⚠ GasCreditVault address not found for ${networkName}`);
        return;
    }
    
    const [deployer] = await ethers.getSigners();
    const BridgeHub = await ethers.getContractFactory("BridgeHub");
    const bridgeHub = BridgeHub.attach(bridgeHubAddress);
    
    try {
        await bridgeHub.setGasCreditVault(gasCreditVaultAddress);
        console.log(`✓ Set GasCreditVault address: ${gasCreditVaultAddress}`);
    } catch (error) {
        console.log(`⚠ Failed to set GasCreditVault address:`, error.message);
    }
}

module.exports = { registerTokensWithBridgeHub, registerChainsWithBridgeHub, whitelistTokensInGasCreditVault, setGasCreditVaultAddress };

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}