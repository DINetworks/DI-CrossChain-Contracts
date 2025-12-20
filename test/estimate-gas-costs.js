const { ethers } = require("hardhat");
const config = require('../deployment-config.js');

const { DEPLOYER, FEE_IN_BPS } = config;

async function estimateContractGas(contractName, constructorArgs = []) {
  try {
    const ContractFactory = await ethers.getContractFactory(contractName);
    const deployTx = await ContractFactory.getDeployTransaction(...constructorArgs);
    const gasEstimate = await ethers.provider.estimateGas(deployTx);
    
    return {
      contract: contractName,
      gasEstimate: gasEstimate.toString(),
      success: true
    };
  } catch (error) {
    return {
      contract: contractName,
      error: error.message,
      success: false
    };
  }
}

async function estimateAllContracts(networkName) {
  console.log(`\n🔍 Estimating gas costs for ${networkName}...`);
  
  const [deployer] = await ethers.getSigners();
  const gasPrice = await ethers.provider.getFeeData();
  
  console.log(`Gas Price: ${gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') + ' gwei' : 'N/A'}`);
  console.log('═'.repeat(60));
  
  const contracts = [
    {
      name: "DIBridgedToken",
      args: []
    },
    {
      name: "DIBridgedTokenRegistry", 
      args: ["0x1234567890123456789012345678901234567890", DEPLOYER, deployer.address]
    },
    {
      name: "DIGateway",
      args: ["0x1234567890123456789012345678901234567890", deployer.address, FEE_IN_BPS, DEPLOYER]
    },
    {
      name: "BridgeHub",
      args: []
    }
  ];
  
  const results = [];
  
  for (const contract of contracts) {
    console.log(`Estimating ${contract.name}...`);
    const result = await estimateContractGas(contract.name, contract.args);
    results.push(result);
    
    if (result.success) {
      const gasCost = BigInt(result.gasEstimate);
      const ethCost = gasPrice.gasPrice ? (gasCost * gasPrice.gasPrice) : BigInt(0);
      
      console.log(`✅ ${contract.name}:`);
      console.log(`   Gas: ${result.gasEstimate}`);
      console.log(`   Cost: ${ethCost > 0 ? ethers.formatEther(ethCost) + ' ETH' : 'N/A'}`);
    } else {
      console.log(`❌ ${contract.name}: ${result.error}`);
    }
    console.log('-'.repeat(40));
  }
  
  return results;
}

async function main() {
  const networkName = hre.network.name;
  await estimateAllContracts(networkName);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { estimateContractGas, estimateAllContracts };