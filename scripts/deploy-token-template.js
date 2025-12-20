const { ethers } = require("hardhat");
const { saveContractAddress } = require('./utils/address-manager');

async function deployTokenTemplate(networkName) {
  console.log(`Deploying DIBridgedToken template on ${networkName}...`);
  
  const DIBridgedToken = await ethers.getContractFactory("DIBridgedToken");
  const tokenTemplate = await DIBridgedToken.deploy();
  await tokenTemplate.waitForDeployment();
  
  saveContractAddress(networkName, 'tokenTemplate', tokenTemplate.target);
  console.log('✅ DIBridgedToken Template:', tokenTemplate.target);
  
  return tokenTemplate.target;
}

async function main() {
  const networkName = hre.network.name;
  await deployTokenTemplate(networkName);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployTokenTemplate };