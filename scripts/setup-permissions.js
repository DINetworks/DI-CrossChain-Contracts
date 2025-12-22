const { ethers } = require("hardhat");
const config = require('../deployment-config.js');
const { getContractAddress } = require('./utils/address-manager');

const { RELAYER } = config;

async function setupPermissions(networkName) {
  console.log(`Setting up permissions on ${networkName}...`);
  
  const gatewayContract = await ethers.getContractAt("DIGateway", getContractAddress(networkName, 'diGateway'));
  const metaTxGatewayContract = await ethers.getContractAt("MetaTxGateway", getContractAddress(networkName, 'metaTxGateway'));
  
  await gatewayContract.addRelayer(RELAYER);
  await metaTxGatewayContract.setRelayerAuthorization(RELAYER, true);

  console.log('✅ Relayer permissions set');
}

async function main() {
  const networkName = hre.network.name;
  await setupPermissions(networkName);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { setupPermissions };