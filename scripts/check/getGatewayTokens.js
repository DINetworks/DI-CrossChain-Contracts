const { ethers } = require("hardhat");
const { saveContractAddress, getContractAddress, saveTokenData, addTokenToFile } = require('../utils/address-manager');

// Helper function to convert BigInt to string for JSON serialization
function convertBigIntToString(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

async function main() {
  const networkName = hre.network.name;
  console.log(`Checking tokens on DIBridgedTokenRegistry on ${networkName}...`);
  try {
    const tokenRegistry = await ethers.getContractAt("DIBridgedTokenRegistry", getContractAddress(networkName, 'tokenRegistry'));
    
    // Get all registered tokens
    const registeredTokens = await tokenRegistry.getSupportedTokens();
    console.log("Registered Tokens:", JSON.stringify(convertBigIntToString(registeredTokens), null, 2));
  } catch (error) {
    console.error(`❌ Error on ${networkName}:`, error.message);
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