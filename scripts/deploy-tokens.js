const { ethers } = require("hardhat");
const hre = require("hardhat");
const fs = require('fs');
const config = require('../deployment-config.js');
const { saveContractAddress, getContractAddress, saveTokenData, addTokenToFile } = require('./utils/address-manager');

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
  const deployedTokens = [];

  const tokenRegistryContract = await ethers.getContractAt("DIBridgedTokenRegistry", getContractAddress(networkName, 'tokenRegistry'));
  const creditVaultContract = await ethers.getContractAt("GasCreditVault", getContractAddress(networkName, 'gasCreditVault'));
  
  for (const token of tokens) {
    try {
      let tokenAddress;
      let isBridged;
      
      if (!token.address) {
        const deployTx = await tokenRegistryContract.deploy(
          token.name,
          token.symbol,
          token.decimals,
          networkConfig.chainId,
          token.originSymbol
        );
        await deployTx.wait();
        
        tokenAddress = await tokenRegistryContract.getToken(networkConfig.chainId, token.originSymbol);
        isBridged = true;
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
        
        tokenAddress = token.address;
        isBridged = false;
        console.log(`✅ Added existing ${token.symbol}:`, tokenAddress);
      }
      
      results[token.originSymbol] = tokenAddress;

      // Add token to file immediately
      const tokenInfo = {
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        address: tokenAddress,
        isBridged: isBridged,
        originSymbol: token.originSymbol
      };
      addTokenToFile(networkName, tokenInfo);
      
      // Save token info for BridgeHub registration
      deployedTokens.push(tokenInfo);
      
      await creditVaultContract.whitelistToken(tokenAddress, ZERO_ADDRESS, true);
      console.log(`✅ Whitelisted ${token.symbol} in credit vault`);
    } catch (error) {
      console.error(`❌ Error processing token ${token.symbol}:`, error.message);
    }
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