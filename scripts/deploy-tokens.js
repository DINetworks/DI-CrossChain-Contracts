const { ethers } = require("hardhat");
const config = require('../deployment-config.js');
const { saveContractAddress, getContractAddress } = require('./utils/address-manager');

const { ZERO_ADDRESS } = config;

async function deployTokens(networkName) {
  console.log(`Deploying tokens on ${networkName}...`);
  
  const networkConfig = config.getNetworkConfig(networkName);
  const tokens = config.getNetworkTokens(networkName);
  
  if (!tokens || tokens.length === 0) {
    console.log('No tokens configured for this network');
    return {};
  }
  
  const results = {};

  const tokenRegistryContract = await ethers.getContractAt("DIBridgedTokenRegistry", getContractAddress(networkName, 'tokenRegistry'));
  const creditVaultContract = await ethers.getContractAt("GasCreditVault", getContractAddress(networkName, 'gasCreditVault'));
  
  for (const token of tokens) {
    if (!token.address) {
      const deployTx = await tokenRegistryContract.deployToken(
        token.name,
        token.symbol,
        token.decimals,
        networkConfig.chainId,
        token.originSymbol
      );
      await deployTx.wait();
      
      const tokenAddress = await tokenRegistryContract.getToken(networkConfig.chainId, token.originSymbol);
      results[token.originSymbol] = tokenAddress;
      saveContractAddress(networkName, `token_${token.originSymbol}`, tokenAddress);
      console.log(`✅ Deployed ${token.symbol}:`, tokenAddress);
    } else {
      const addTx = await tokenRegistryContract.addToken(
        token.symbol,
        token.address,
        token.name,
        token.decimals,
        false
      );
      await addTx.wait();
      
      results[token.originSymbol] = token.address;
      saveContractAddress(networkName, `token_${token.originSymbol}`, token.address);
      console.log(`✅ Added existing ${token.symbol}:`, token.address);
    }
    
    await creditVaultContract.whitelistToken(results[token.originSymbol], ZERO_ADDRESS, true);
    console.log(`✅ Whitelisted ${token.symbol} in credit vault`);
  }
  
  return results;
}

async function main() {
  const networkName = hre.network.name;
  await deployTokens(networkName);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployTokens };