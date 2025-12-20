const { ethers } = require("hardhat");
const { getContractAddress } = require('./utils/address-manager');

async function setupGatewayConnection(networkName) {
  console.log(`Setting up gateway connection on ${networkName}...`);
  
  const tokenRegistryContract = await ethers.getContractAt("DIBridgedTokenRegistry", getContractAddress(networkName, 'tokenRegistry'));
  await tokenRegistryContract.setGateway(getContractAddress(networkName, 'diGateway'));
  console.log('✅ TokenFactory gateway updated');
}

async function main() {
  const networkName = hre.network.name;
  await setupGatewayConnection(networkName);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { setupGatewayConnection };