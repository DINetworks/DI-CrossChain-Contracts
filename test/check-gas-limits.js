const { ethers } = require("hardhat");
const config = require('../deployment-config.js');

async function checkGasLimit(networkName, provider = null) {
  try {
    const currentProvider = provider || ethers.provider;
    const block = await currentProvider.getBlock("latest");
    const gasPrice = await currentProvider.getFeeData();
    
    return {
      network: networkName,
      gasLimit: block.gasLimit.toString(),
      gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') + ' gwei' : 'N/A',
      maxFeePerGas: gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') + ' gwei' : 'N/A'
    };
  } catch (error) {
    return {
      network: networkName,
      error: error.message
    };
  }
}



async function main() {
  const networkName = hre.network.name;
  const result = await checkGasLimit(networkName);
  
  console.log(`\n📊 Gas Info for ${networkName}:`);
  console.log('═'.repeat(50));
  
  if (result.error) {
    console.log(`❌ Error: ${result.error}`);
  } else {
    console.log(`Gas Limit: ${result.gasLimit}`);
    console.log(`Gas Price: ${result.gasPrice}`);
    console.log(`Max Fee: ${result.maxFeePerGas}`);
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

module.exports = { checkGasLimit };