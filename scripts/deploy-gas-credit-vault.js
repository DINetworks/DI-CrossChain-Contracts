const { ethers, upgrades } = require("hardhat");
const { saveContractAddress } = require('./utils/address-manager');

async function deployGasCreditVault(networkName) {
  console.log(`Deploying GasCreditVault on ${networkName}...`);
  
  const GasCreditVault = await ethers.getContractFactory("GasCreditVault");
  const creditVault = await upgrades.deployProxy(GasCreditVault, [], {
    initializer: "initialize",
    kind: "uups"
  });
  await creditVault.waitForDeployment();
  
  saveContractAddress(networkName, 'gasCreditVault', creditVault.target);
  console.log('✅ GasCreditVault:', creditVault.target);
  
  return creditVault.target;
}

async function main() {
  const networkName = hre.network.name;
  await deployGasCreditVault(networkName);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployGasCreditVault };