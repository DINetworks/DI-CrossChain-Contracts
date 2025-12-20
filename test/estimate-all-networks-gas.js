const { ethers } = require("hardhat");
const config = require('../deployment-config.js');

const { DEPLOYER, FEE_IN_BPS } = config;

async function estimateContractGas(contractName, constructorArgs, provider) {
  try {
    const contractCode = await ethers.getContractFactory(contractName);
    const deployTx = contractCode.getDeployTransaction(...constructorArgs);
    const gasEstimate = await provider.estimateGas(deployTx);
    
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

async function estimateNetworkGas(networkName, rpcUrl) {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const gasPrice = await provider.getFeeData();
    
    const contracts = [
      { name: "DIBridgedToken", args: [] },
      { name: "DIBridgedTokenRegistry", args: ["0x1234567890123456789012345678901234567890", DEPLOYER, "0x1234567890123456789012345678901234567890"] },
      { name: "DIGateway", args: ["0x1234567890123456789012345678901234567890", "0x1234567890123456789012345678901234567890", FEE_IN_BPS, DEPLOYER] },
      { name: "BridgeHub", args: [] }
    ];
    
    const results = [];
    let totalGas = BigInt(0);
    let totalCost = BigInt(0);
    
    for (const contract of contracts) {
      const result = await estimateContractGas(contract.name, contract.args, provider);
      results.push(result);
      
      if (result.success) {
        totalGas += BigInt(result.gasEstimate);
        if (gasPrice.gasPrice) {
          totalCost += BigInt(result.gasEstimate) * gasPrice.gasPrice;
        }
      }
    }
    
    return {
      network: networkName,
      gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') + ' gwei' : 'N/A',
      totalGas: totalGas.toString(),
      totalCost: totalCost > 0 ? ethers.formatEther(totalCost) + ' ETH' : 'N/A',
      contracts: results,
      success: true
    };
    
  } catch (error) {
    return {
      network: networkName,
      error: error.message,
      success: false
    };
  }
}

async function main() {
  console.log('🔍 Estimating gas costs for all supported chains...\n');
  
  const networks = config.getEnabledNetworks();
  const results = [];
  
  for (const networkName of networks) {
    console.log(`Estimating ${networkName}...`);
    
    const networkConfig = config.getNetworkConfig(networkName);
    if (!networkConfig || !networkConfig.rpcKey) {
      results.push({
        network: networkName,
        error: 'No RPC URL configured',
        success: false
      });
      continue;
    }
    
    const result = await estimateNetworkGas(networkName, networkConfig.rpcKey);
    results.push(result);
  }
  
  console.log('\n📊 Gas Cost Summary:');
  console.log('═'.repeat(80));
  
  results.forEach(result => {
    if (!result.success) {
      console.log(`❌ ${result.network}: ${result.error}`);
    } else {
      console.log(`✅ ${result.network}:`);
      console.log(`   Gas Price: ${result.gasPrice}`);
      console.log(`   Total Gas: ${result.totalGas}`);
      console.log(`   Total Cost: ${result.totalCost}`);
      
      result.contracts.forEach(contract => {
        if (contract.success) {
          console.log(`   ${contract.contract}: ${contract.gasEstimate} gas`);
        } else {
          console.log(`   ${contract.contract}: Error - ${contract.error}`);
        }
      });
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