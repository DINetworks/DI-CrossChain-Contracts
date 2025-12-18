const dotenv = require('dotenv');
const { ethers } = require("hardhat");
const fs = require('fs');
const config = require('../deployment-config.js');

dotenv.config();

const { RELAYER } = config;

async function loadDeployments() {
  try {
    const deploymentsData = fs.readFileSync('deployments-all.json', 'utf8');
    return JSON.parse(deploymentsData);
  } catch (error) {
    console.error('❌ Could not load deployments-all.json');
    console.log('Please run deployment script first: npm run deploy:all');
    process.exit(1);
  }
}

async function configureBridgeHub(deployments) {
  console.log('\n🔧 Configuring Bridge Hub...');
  
  const bridgeHubInfo = config.getBridgeHubNetwork();
  if (!bridgeHubInfo) {
    console.error('❌ No bridge hub network found in config');
    return;
  }
  
  const bridgeHubAddress = deployments[bridgeHubInfo.networkName]?.bridgeHub;
  if (!bridgeHubAddress) {
    console.error(`❌ Bridge Hub address not found for ${bridgeHubInfo.networkName}`);
    return;
  }
  
  const [deployer] = await ethers.getSigners();
  const BridgeHub = await ethers.getContractFactory("BridgeHub");
  const bridgeHub = BridgeHub.attach(bridgeHubAddress);
  
  // Add supported chains
  for (const [networkName, deployment] of Object.entries(deployments)) {
    if (config.isBridgeHubNetwork(networkName)) continue;
    
    const chainConfig = config.getNetworkConfig(networkName);
    if (!chainConfig || !deployment[networkName]) continue;
    
    const contracts = deployment[networkName];
    
    try {
      // Add chain to Bridge Hub
      const tx = await bridgeHub.addChain(
        chainConfig.chainId,
        chainConfig.name,
        chainConfig.rpcKey,
        contracts.diGateway || '0x0000000000000000000000000000000000000000',
        contracts.gasCreditVault || '0x0000000000000000000000000000000000000000',
        contracts.metaTxGateway || '0x0000000000000000000000000000000000000000'
      );
      await tx.wait();
      
      console.log(`✅ Added ${chainConfig.name} (${chainConfig.chainId}) to Bridge Hub`);
      
    } catch (error) {
      console.error(`❌ Failed to add ${networkName} to Bridge Hub:`, error.message);
    }
  }
  
  // Add supported tokens
  const tokenSymbols = config.getAllTokenSymbols();
  for (const symbol of tokenSymbols) {
    try {
      const tx = await bridgeHub.addToken(symbol, symbol, 18); // Default decimals
      await tx.wait();
      console.log(`✅ Added token ${symbol} to Bridge Hub`);
    } catch (error) {
      console.error(`❌ Failed to add token ${symbol}:`, error.message);
    }
  }
  
  // Add token contract addresses
  const tokenContracts = config.getAllTokenContracts();
  for (const contract of tokenContracts) {
    try {
      const tx = await bridgeHub.addTokenContract(
        contract.symbol,
        contract.chainId,
        contract.address
      );
      await tx.wait();
      console.log(`✅ Added ${contract.symbol} contract on chain ${contract.chainId}: ${contract.address}`);
    } catch (error) {
      console.error(`❌ Failed to add ${contract.symbol} contract on chain ${contract.chainId}:`, error.message);
    }
  }
}

async function configureGateways(deployments) {
  console.log('\n🔧 Configuring Gateways...');
  
  for (const [networkName, deployment] of Object.entries(deployments)) {
    if (config.isBridgeHubNetwork(networkName) || !deployment[networkName]) continue;
    
    const contracts = deployment[networkName];
    const chainConfig = config.getNetworkConfig(networkName);
    
    console.log(`\n📡 Configuring ${chainConfig.name}...`);
    
    try {
      const [deployer] = await ethers.getSigners();
      
      // Configure DIGateway
      if (contracts.diGateway) {
        const DIGateway = await ethers.getContractFactory("DIGateway");
        const gateway = DIGateway.attach(contracts.diGateway);
        
        // Add other chains as supported destinations
        for (const [otherNetwork, otherDeployment] of Object.entries(deployments)) {
          if (otherNetwork === networkName || config.isBridgeHubNetwork(otherNetwork) || !otherDeployment[otherNetwork]) continue;
          
          const otherChainConfig = config.getNetworkConfig(otherNetwork);
          const otherContracts = otherDeployment[otherNetwork];
          
          try {
            const tx = await gateway.addChain(
              otherChainConfig.chainId
            );
            await tx.wait();
            console.log(`  ✅ Added ${otherChainConfig.name} as supported destination`);
          } catch (error) {
            console.log(`  ⚠️  ${otherChainConfig.name} already configured or error:`, error.message);
          }
        }
      }
      
      // Configure token mappings
      if (contracts.tokens) {
        for (const [symbol, address] of Object.entries(contracts.tokens)) {
          console.log(`  ✅ Token ${symbol}: ${address}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to configure ${networkName}:`, error.message);
    }
  }
}

async function verifyConfiguration(deployments) {
  console.log('\n🔍 Verifying Configuration...');
  
  const summary = {
    chains: 0,
    tokens: 0,
    gateways: 0,
    errors: []
  };
  
  for (const [networkName, deployment] of Object.entries(deployments)) {
    if (!deployment[networkName]) continue;
    
    const contracts = deployment[networkName];
    const chainConfig = config.getNetworkConfig(networkName);
    
    try {
      summary.chains++;
      
      if (contracts.diGateway) summary.gateways++;
      if (contracts.tokens) {
        summary.tokens += Object.keys(contracts.tokens).length;
      }
      
      console.log(`✅ ${chainConfig.name}: Gateway=${!!contracts.diGateway}, Tokens=${Object.keys(contracts.tokens || {}).length}`);
      
    } catch (error) {
      summary.errors.push(`${networkName}: ${error.message}`);
      console.error(`❌ ${networkName}:`, error.message);
    }
  }
  
  console.log('\n📊 Configuration Summary:');
  console.log(`- Chains configured: ${summary.chains}`);
  console.log(`- Gateways deployed: ${summary.gateways}`);
  console.log(`- Tokens deployed: ${summary.tokens}`);
  console.log(`- Errors: ${summary.errors.length}`);
  
  if (summary.errors.length > 0) {
    console.log('\n❌ Errors found:');
    summary.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  return summary;
}

async function main() {
  console.log('🔧 Starting state configuration...');
  
  const deployments = await loadDeployments();
  const currentNetwork = hre.network.name;
  const bridgeHubInfo = config.getBridgeHubNetwork();
  
  if (!bridgeHubInfo) {
    console.error('❌ No bridge hub network found in config');
    process.exit(1);
  }
  
  // Always configure Bridge Hub (run on bridge hub network)
  if (currentNetwork === bridgeHubInfo.networkName) {
    console.log(`✅ Running on bridge hub network: ${bridgeHubInfo.config.name}`);
    await configureBridgeHub(deployments);
  } else {
    console.log(`⚠️  Current network: ${currentNetwork}`);
    console.log(`⚠️  Bridge hub network: ${bridgeHubInfo.networkName}`);
    console.log(`⚠️  Please run: npx hardhat run scripts/configure-states.js --network ${bridgeHubInfo.networkName}`);
    process.exit(1);
  }
  
  // Configure gateways on current network (only if it's bridge hub)
  await configureGateways(deployments);
  
  // Verify configuration
  const summary = await verifyConfiguration(deployments);
  
  // Save configuration summary
  fs.writeFileSync('configuration-summary.json', JSON.stringify(summary, null, 2));
  
  console.log('\n✅ State configuration completed!');
  console.log('📄 Summary saved to configuration-summary.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Configuration failed:', error);
    process.exit(1);
  });