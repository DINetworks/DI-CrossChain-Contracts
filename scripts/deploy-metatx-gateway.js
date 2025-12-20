const { ethers, upgrades } = require("hardhat");
const { saveContractAddress } = require('./utils/address-manager');

async function deployMetaTxGateway(networkName) {
  console.log(`Deploying MetaTxGateway on ${networkName}...`);
  
  const MetaTxGateway = await ethers.getContractFactory("MetaTxGateway");
  const metaTxGateway = await upgrades.deployProxy(MetaTxGateway, [], {
    initializer: "initialize",
    kind: "uups"
  });
  await metaTxGateway.waitForDeployment();
  
  saveContractAddress(networkName, 'metaTxGateway', metaTxGateway.target);
  console.log('✅ MetaTxGateway:', metaTxGateway.target);
  
  return metaTxGateway.target;
}

async function main() {
  const networkName = hre.network.name;
  await deployMetaTxGateway(networkName);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployMetaTxGateway };