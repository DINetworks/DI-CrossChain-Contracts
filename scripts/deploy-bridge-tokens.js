const dotenv = require('dotenv');
const { ethers } = require("hardhat");
const tokenConfig = require('../token-config');

dotenv.config()

// Update these addresses after running deploy-bridge.js
const GATEWAY_ADDRESS = "0x91b30bB5c8476f899E10B8C54F5d96bbaC978028"; // Replace with actual DIGateway address
const FACTORY_ADDRESS = "0x8134d8e374B9C51B538Eb63A0b868D1880426a82"; // Replace with actual TokenFactory address

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;
  
  console.log("Deployer:", deployer.address);
  console.log("Network:", networkName);

  const tokens = tokenConfig[networkName];
  if (!tokens) {
    console.error(`No token configuration found for network: ${networkName}`);
    process.exit(1);
  }

  const gateway = await ethers.getContractAt("DIGateway", GATEWAY_ADDRESS);
  const factory = await ethers.getContractAt("DIBridgedTokenRegistry", FACTORY_ADDRESS);

  console.log(`\n=== Processing Bridge Tokens for ${networkName} ===`);
  
  for (const token of tokens) {
    try {
      let tokenAddress;
      
      if (token.address) {
        // Token already exists, just add to gateway
        tokenAddress = token.address;
        console.log(`Adding existing token ${token.name} (${token.symbol}): ${tokenAddress}`);
        
        const addTx = await gateway.addToken(
          token.symbol,
          tokenAddress,
          token.logoURI || "",
          token.priceFeed || ethers.ZeroAddress,
          token.priceKey || "",
          token.useDIAOracle || false
        );
        await addTx.wait();
      } else {
        // Deploy new token
        console.log(`Deploying new token ${token.name} (${token.symbol})...`);
        
        const deployTx = await gateway.deployToken(
          token.name,
          token.symbol,
          token.decimals,
          token.originChainId,
          token.originSymbol
        );
        await deployTx.wait();
        
        // Get deployed token address
        tokenAddress = await factory.getToken(token.originChainId, token.originSymbol);

        console.log(`Deployed ${token.name} (${token.symbol}): ${tokenAddress}`);
      }
    } catch (error) {
      console.error(`Failed to process ${token.name}:`, error.message);
    }
  }

  console.log("\n=== Bridge Token Processing Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });