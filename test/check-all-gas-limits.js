const { ethers } = require("hardhat");
const config = require('../deployment-config.js');

async function checkGasLimit(networkName, rpcUrl) {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const block = await provider.getBlock("latest");
    // const gasPrice = await provider.getFeeData();
    
    return {
      network: networkName,
      gasLimit: block.gasLimit.toString(),
      // gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') + ' gwei' : 'N/A',
      // maxFeePerGas: gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') + ' gwei' : 'N/A'
    };
  } catch (error) {
    return {
      network: networkName,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔍 Checking gas limits for all supported chains...\n');
  
  const networks = config.getEnabledNetworks();
  const results = [];
  
  for (const networkName of networks) {
    console.log(`Checking ${networkName}...`);
    
    const networkConfig = config.getNetworkConfig(networkName);
    if (!networkConfig || !networkConfig.rpcKey) {
      results.push({
        network: networkName,
        error: 'No RPC URL configured'
      });
      continue;
    }
    
    const result = await checkGasLimit(networkName, networkConfig.rpcKey);
    results.push(result);
  }
  
  console.log('\n📊 Gas Limit Summary:');
  console.log('═'.repeat(80));
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.network}: ${result.error}`);
    } else {
      console.log(`✅ ${result.network}:`);
      console.log(`   Gas Limit: ${result.gasLimit}`);
      console.log(`   Gas Price: ${result.gasPrice}`);
      console.log(`   Max Fee: ${result.maxFeePerGas}`);
    }
    console.log('-'.repeat(40));
  });
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}