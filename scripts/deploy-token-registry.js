const { ethers } = require("hardhat");
const config = require('../deployment-config.js');
const { saveContractAddress, getContractAddress } = require('./utils/address-manager');

async function deployTokenRegistry(networkName) {
  console.log(`Deploying DIBridgedTokenRegistry on ${networkName}...`);
  
  const [deployer] = await ethers.getSigners();
  
  const TokenRegistry = await ethers.getContractFactory("DIBridgedTokenRegistry");
  const tokenRegistry = await TokenRegistry.deploy(
    deployer.address,
    getContractAddress(networkName, 'tokenTemplate'),
  );
  await tokenRegistry.waitForDeployment();
  
  saveContractAddress(networkName, 'tokenRegistry', tokenRegistry.target);
  console.log('✅ DIBridgedTokenRegistry:', tokenRegistry.target);
  
  return tokenRegistry.target;
}

async function main() {
  const networkName = hre.network.name;
  await deployTokenRegistry(networkName);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployTokenRegistry };