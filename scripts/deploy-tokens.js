const { ethers } = require("hardhat");
const hre = require("hardhat");
const fs = require('fs');
const config = require('../deployment-config.js');
const { saveContractAddress, getContractAddress, saveTokenData, addTokenToFile } = require('./utils/address-manager');

const { ZERO_ADDRESS } = config;

async function deployTokens(networkName, force = false, tokenSymbol = null) {
  console.log(`Deploying tokens on ${networkName}... (force: ${force})`);
  
  let tokens = config.getNetworkTokens(networkName);
  
  if (!tokens || tokens.length === 0) {
    console.log('No tokens configured for this network');
    return {};
  }
  
  // Filter to specific token if requested
  if (tokenSymbol) {
    tokens = tokens.filter(token => token.symbol === tokenSymbol);
    if (tokens.length === 0) {
      console.log(`❌ Token ${tokenSymbol} not found in configuration`);
      return {};
    }
  }
  
  const networkConfig = config.getNetworkConfig(networkName);
  
  const results = {};
  const deployedTokens = [];

  const tokenRegistryContract = await ethers.getContractAt("DIBridgedTokenRegistry", getContractAddress(networkName, 'tokenRegistry'));
  const creditVaultContract = await ethers.getContractAt("GasCreditVault", getContractAddress(networkName, 'gasCreditVault'));
  
  for (const token of tokens) {
    try {
      let tokenAddress;
      let isDeployed;
      
      if (!token.address) {
        const deployTx = await tokenRegistryContract.deploy(
          ZERO_ADDRESS,
          token.name,
          token.symbol,
          token.decimals,
          networkConfig.chainId,
          token.originSymbol,
          true,
          force
        );
        await deployTx.wait();
        
        tokenAddress = await tokenRegistryContract.getTokenAddress(token.symbol);
        isDeployed = true;
        console.log(`✅ Deployed ${token.symbol}:`, tokenAddress);
      } else {
        const addTx = await tokenRegistryContract.deploy(
          token.address,
          token.name,
          token.symbol,
          token.decimals,
          0,
          "",
          false,
          force
        );
        await addTx.wait();
        
        tokenAddress = token.address;
        isDeployed = false;
        console.log(`✅ Added existing ${token.symbol}:`, tokenAddress);
      }
      
      results[token.originSymbol] = tokenAddress;

      // Add token to file immediately
      const tokenInfo = {
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        address: tokenAddress,
        isDeployed: isDeployed,
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

module.exports = { deployTokens };