const dotenv = require('dotenv');
const { ethers } = require("hardhat");

dotenv.config()

const DEPLOYER = '0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3';
const FEE_IN_BPS = 30; // 0.3% fee
const FEE_RECEIVER = DEPLOYER; // Fee receiver address

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1. Deploy DIBridgedToken template
  const DIBridgedToken = await ethers.getContractFactory("DIBridgedToken");
  const tokenTemplate = await DIBridgedToken.deploy();
  await tokenTemplate.waitForDeployment();
  console.log('DIBridgedToken Template:', tokenTemplate.target);

  // 2. Deploy DIBridgedTokenRegistry
  const TokenRegistry = await ethers.getContractFactory("DIBridgedTokenRegistry");
  const tokenFactory = await TokenRegistry.deploy(
    tokenTemplate.target,
    DEPLOYER, // gateway (will be updated after DIGateway deployment)
    deployer.address // owner
  );
  await tokenFactory.waitForDeployment();
  console.log('DIBridgedTokenRegistry:', tokenFactory.target);

  // 3. Deploy DIGateway
  const DIGateway = await ethers.getContractFactory("DIGateway");
  const gateway = await DIGateway.deploy(
    tokenFactory.target,
    deployer.address,
    FEE_IN_BPS,
    FEE_RECEIVER
  );
  await gateway.waitForDeployment();
  console.log('DIGateway:', gateway.target);
  console.log('Bridge Fee:', FEE_IN_BPS, 'bps');
  console.log('Fee Receiver:', FEE_RECEIVER);

  // 4. Update TokenFactory gateway
  const updateGatewayTx = await tokenFactory.setGateway(gateway.target);
  await updateGatewayTx.wait();
  console.log('TokenFactory gateway updated');

  // 5. Deploy BridgeMonitor
  const BridgeMonitor = await ethers.getContractFactory("BridgeMonitor");
  const monitor = await BridgeMonitor.deploy(
    gateway.target,
    deployer.address
  );
  await monitor.waitForDeployment();
  console.log('BridgeMonitor:', monitor.target);

  // 6. Add deployer as relayer for testing
  const addRelayerTx = await gateway.addRelayer(DEPLOYER);
  await addRelayerTx.wait();
  console.log('Relayer added');

  // 7. Deploy GMPExample
  const GMPExample = await ethers.getContractFactory("GMPExample");
  const gmpExample = await GMPExample.deploy(gateway.target);
  await gmpExample.waitForDeployment();
  console.log('GMPExample:', gmpExample.target);

  console.log("\n=== Bridge Infrastructure Deployed ===");
  console.log("DIBridgedToken Template:", tokenTemplate.target);
  console.log("DIBridgedTokenRegistry:", tokenFactory.target);
  console.log("DIGateway:", gateway.target);
  console.log("BridgeMonitor:", monitor.target);
  console.log("GMPExample:", gmpExample.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });