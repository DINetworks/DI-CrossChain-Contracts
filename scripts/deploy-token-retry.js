const dotenv = require('dotenv');
const { ethers } = require("hardhat");
const tokenConfig = require('../token-config');

dotenv.config()

// Update these addresses after running deploy-bridge.js
const GATEWAY_ADDRESS = "0x19aC2B530F55E25c8e8E142B1Dfc1a81E7DE36a1"; // Replace with actual DIGateway address
const FACTORY_ADDRESS = "0xB75b34766f2D0c3C471FA614fe104A12A3873E37"; // Replace with actual TokenFactory address

tokens = [
  {
    name: "XUSD",
    symbol: "XUSD",
    decimals: 18,
    originSymbol: "XUSD",
    address: "0x8BD5Fe9286B039cc38d9B63865a8E87736382CCF"
  },
  {
    name: "WXFI",
    symbol: "WXFI",
    decimals: 18,
    originSymbol: "XFI",
    address: "0xC537D12bd626B135B251cCa43283EFF69eC109c4"
  }
];

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = hre.network.name;
  
  console.log("Deployer:", deployer.address);
  console.log("Network:", networkName);

  if (!tokens) {
    console.error(`No token configuration found for network: ${networkName}`);
    process.exit(1);
  }

  const gateway = await ethers.getContractAt("DIGateway", GATEWAY_ADDRESS);
  const factory = await ethers.getContractAt("DIBridgedTokenRegistry", FACTORY_ADDRESS);

  console.log(`\n=== Processing Bridge Tokens for ${networkName} ===`);
  
  for (const token of tokens) {
    try {
      let tokenAddress;
      if (token.address) {
        // Remove Token already deployed, retry to add to gateway
        tokenAddress = token.address;

        console.log(`Removing existing token ${token.name} (${token.symbol}): ${tokenAddress} from DIGateway`);

        const removeTx = await gateway.removeToken(
          token.symbol
        );
        await removeTx.wait();

        console.log(`Adding existing token ${token.name} (${token.symbol}): ${tokenAddress} to DIGateway`);
        
        const addTx = await gateway.addToken(
          token.symbol,
          tokenAddress,
          token.name,
          token.decimals,
          false
        );
        await addTx.wait();
      }
    } catch (error) {
      console.error(`Failed to process ${token.name}:`, error.message);
    }
  }

  console.log("\n=== Bridge Token Processing Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });