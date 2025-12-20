const { ethers } = require("hardhat");
const { saveContractAddress } = require('./utils/address-manager');

async function deployBridgeHub(networkName) {
  console.log(`Deploying BridgeHub on ${networkName}...`);
  
  const BridgeHub = await ethers.getContractFactory("BridgeHub");
  const bridgeHub = await BridgeHub.deploy();
  await bridgeHub.waitForDeployment();
  
  saveContractAddress(networkName, 'bridgeHub', bridgeHub.target);
  console.log('✅ BridgeHub:', bridgeHub.target);
  
  return bridgeHub.target;
}

async function main() {
  const networkName = hre.network.name;
  await deployBridgeHub(networkName);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployBridgeHub };