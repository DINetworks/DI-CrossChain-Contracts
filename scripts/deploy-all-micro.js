const config = require('../deployment-config.js');
const { deployTokenTemplate } = require('./deploy-token-template');
const { deployTokenRegistry } = require('./deploy-token-registry');
const { deployGateway } = require('./deploy-gateway');
const { deployMetaTxGateway } = require('./deploy-metatx-gateway');
const { deployGasCreditVault } = require('./deploy-gas-credit-vault');
const { deployBridgeHub } = require('./deploy-bridge-hub');
const { setupGatewayConnection } = require('./setup-gateway-connection');
const { setupPermissions } = require('./setup-permissions');
const { deployTokens } = require('./deploy-tokens');

async function main() {
  const networkName = hre.network.name;
  
  const networkConfig = config.getNetworkConfig(networkName);
  if (!networkConfig) {
    console.error(`❌ Network ${networkName} not found in deployment config`);
    process.exit(1);
  }
  
  if (!networkConfig.enabled) {
    console.error(`❌ Network ${networkName} is disabled in config`);
    process.exit(1);
  }

  console.log(`\n=== Deploying Bridge Infrastructure on ${networkName} ===`);
  
  try {
    await deployTokenTemplate(networkName);
    await deployTokenRegistry(networkName);
    await deployGateway(networkName);
    await setupGatewayConnection(networkName);
    await deployMetaTxGateway(networkName);
    await deployGasCreditVault(networkName);
    await setupPermissions(networkName);
    await deployTokens(networkName);
    
    if (config.isBridgeHubNetwork(networkName)) {
      await deployBridgeHub(networkName);
    }
    
    console.log(`\n✅ Deployment completed for ${networkName}`);
    
  } catch (error) {
    console.error(`❌ Deployment failed on ${networkName}:`, error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}