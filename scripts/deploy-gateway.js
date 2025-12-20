const { ethers } = require("hardhat");
const config = require('../deployment-config.js');
const { saveContractAddress, getContractAddress } = require('./utils/address-manager');

const { DEPLOYER, FEE_IN_BPS } = config;

async function deployGateway(networkName) {
  console.log(`Deploying DIGateway on ${networkName}...`);
  
  const [deployer] = await ethers.getSigners();
  
  const block = await ethers.provider.getBlock("latest");
  console.log("Current block gas limit:", block.gasLimit.toString());
  
  const DIGateway = await ethers.getContractFactory("DIGateway");
  const gateway = await DIGateway.deploy(
    getContractAddress(networkName, 'tokenRegistry'),
    deployer.address,
    FEE_IN_BPS,
    DEPLOYER
  );
  await gateway.waitForDeployment();
  
  saveContractAddress(networkName, 'diGateway', gateway.target);
  console.log('✅ DIGateway:', gateway.target);
  
  return gateway.target;
}

async function main() {
  const networkName = hre.network.name;
  await deployGateway(networkName);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployGateway };