const dotenv = require('dotenv');
const { ethers, upgrades } = require("hardhat");
const config = require('../deployment-config.js');

dotenv.config();

const { DEPLOYER, RELAYER, FEE_IN_BPS, ZERO_ADDRESS } = config;

async function deployBridgeInfrastructure(networkName) {
  console.log(`\n=== Deploying Bridge Infrastructure on ${networkName} ===`);
  
  const networkConfig = config.getNetworkConfig(networkName);
  if (!networkConfig) {
    throw new Error(`Network ${networkName} not found in config`);
  }
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network:", networkConfig.name, `(${networkConfig.chainId})`);

  const results = {};

  try {
    // 1. Deploy DIBridgedToken template
    const DIBridgedToken = await ethers.getContractFactory("DIBridgedToken");
    const tokenTemplate = await DIBridgedToken.deploy();
    await tokenTemplate.waitForDeployment();
    results.tokenTemplate = tokenTemplate.target;
    console.log('✅ DIBridgedToken Template:', tokenTemplate.target);

    // 2. Deploy DIBridgedTokenRegistry
    const TokenRegistry = await ethers.getContractFactory("DIBridgedTokenRegistry");
    const tokenFactory = await TokenRegistry.deploy(
      tokenTemplate.target,
      DEPLOYER,
      deployer.address
    );
    await tokenFactory.waitForDeployment();
    results.tokenRegistry = tokenFactory.target;
    console.log('✅ DIBridgedTokenRegistry:', tokenFactory.target);

    // 3. Deploy DIGateway
    const DIGateway = await ethers.getContractFactory("DIGateway");
    const gateway = await DIGateway.deploy(
      tokenFactory.target,
      deployer.address,
      FEE_IN_BPS,
      DEPLOYER
    );
    await gateway.waitForDeployment();
    results.diGateway = gateway.target;
    console.log('✅ DIGateway:', gateway.target);

    // 4. Update TokenFactory gateway
    await tokenFactory.setGateway(gateway.target);
    console.log('✅ TokenFactory gateway updated');

    // 5. Deploy MetaTxGateway
    const MetaTxGateway = await ethers.getContractFactory("MetaTxGateway");
    const metaTxGateway = await upgrades.deployProxy(MetaTxGateway, [], {
      initializer: "initialize",
      kind: "uups"
    });
    await metaTxGateway.waitForDeployment();
    results.metaTxGateway = metaTxGateway.target;
    console.log('✅ MetaTxGateway:', metaTxGateway.target);

    // 6. Deploy GasCreditVault
    const GasCreditVault = await ethers.getContractFactory("GasCreditVault");
    const creditVault = await upgrades.deployProxy(GasCreditVault, [], {
      initializer: "initialize",
      kind: "uups"
    });
    await creditVault.waitForDeployment();
    results.gasCreditVault = creditVault.target;
    console.log('✅ GasCreditVault:', creditVault.target);

    // 7. Setup permissions
    await gateway.addRelayer(RELAYER);
    await metaTxGateway.setRelayerAuthorization(RELAYER, true);
    await creditVault.addWhitelistedRelayer(RELAYER);
    console.log('✅ Relayer permissions set');

    // 8. Deploy bridge tokens if configured
    const tokens = config.getNetworkTokens(networkName);
    if (tokens && tokens.length > 0) {
      results.tokens = {};
      for (const token of tokens) {
        if (!token.address) {
          // Deploy new bridged token
          const deployTx = await gateway.deployToken(
            token.name,
            token.symbol,
            token.decimals,
            networkConfig.chainId,
            token.originSymbol
          );
          await deployTx.wait();
          
          const tokenAddress = await tokenFactory.getToken(networkConfig.chainId, token.originSymbol);
          results.tokens[token.originSymbol] = tokenAddress;
          console.log(`✅ Deployed ${token.symbol}:`, tokenAddress);
        } else {
          // Add existing token to gateway
          const addTx = await gateway.addToken(
            token.symbol,
            token.address,
            token.name,
            token.decimals,
            false
          );
          await addTx.wait();
          
          results.tokens[token.originSymbol] = token.address;
          console.log(`✅ Added existing ${token.symbol}:`, token.address);
        }
      }

      // 9. Whitelist tokens in credit vault
      for (const token of tokens) {
        const tokenAddress = results.tokens[token.originSymbol];
        if (tokenAddress) {
          await creditVault.whitelistToken(tokenAddress, ZERO_ADDRESS, true);
          console.log(`✅ Whitelisted ${token.symbol} in credit vault`);
        }
      }
    }

    return results;

  } catch (error) {
    console.error(`❌ Deployment failed on ${networkName}:`, error.message);
    throw error;
  }
}

async function deployBridgeHub() {
  console.log(`\n=== Deploying Bridge Hub ===`);
  
  const [deployer] = await ethers.getSigners();
  
  try {
    const BridgeHub = await ethers.getContractFactory("BridgeHub");
    const bridgeHub = await BridgeHub.deploy();
    await bridgeHub.waitForDeployment();
    
    console.log('✅ BridgeHub deployed:', bridgeHub.target);
    return bridgeHub.target;
    
  } catch (error) {
    console.error(`❌ BridgeHub deployment failed:`, error.message);
    throw error;
  }
}

async function main() {
  const networkName = hre.network.name;
  const deploymentResults = {};
  
  const networkConfig = config.getNetworkConfig(networkName);
  if (!networkConfig) {
    console.error(`❌ Network ${networkName} not found in deployment config`);
    process.exit(1);
  }
  
  if (!networkConfig.enabled) {
    console.error(`❌ Network ${networkName} is disabled in config`);
    process.exit(1);
  }

  // Deploy bridge infrastructure on all networks
  deploymentResults[networkName] = await deployBridgeInfrastructure(networkName);
  
  // Additionally deploy BridgeHub only on HyperEVM
  if (config.isBridgeHubNetwork(networkName)) {
    deploymentResults.bridgeHub = await deployBridgeHub();
  }

  // Save deployment results
  const fs = require('fs');
  const deploymentFile = `deployments-${networkName}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResults, null, 2));
  
  console.log(`\n✅ Deployment completed for ${networkName}`);
  console.log(`📄 Results saved to ${deploymentFile}`);
}

// Deploy to all networks script
async function deployToAllNetworks() {
  console.log('🚀 Starting deployment to all supported networks...');
  
  const allResults = {};
  
  for (const network of NETWORKS) {
    try {
      console.log(`\n📡 Switching to ${network}...`);
      
      // This would need to be run separately for each network
      // hre.changeNetwork(network); // This doesn't exist in Hardhat
      
      console.log(`⚠️  Please run: npx hardhat run scripts/deploy-all-chains.js --network ${network}`);
      
    } catch (error) {
      console.error(`❌ Failed to deploy on ${network}:`, error.message);
      allResults[network] = { error: error.message };
    }
  }
  
  // Save combined results
  const fs = require('fs');
  fs.writeFileSync('deployments-all.json', JSON.stringify(allResults, null, 2));
}

// Check if this is being run directly or imported
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  deployBridgeInfrastructure,
  deployBridgeHub,
  NETWORKS: config.getEnabledNetworks()
};