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
  console.log(`Checking detailed chains info on ${networkName}...`);
  try {
    const bridgeHub = await ethers.getContractAt("BridgeHub", getContractAddress("hyperevmTestnet", 'bridgeHub'));
    const detailedChains = await bridgeHub.getDetailedChainsInfo();
    console.log("Detailed Chains Info:", JSON.stringify(convertBigIntToString(detailedChains), null, 2));
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