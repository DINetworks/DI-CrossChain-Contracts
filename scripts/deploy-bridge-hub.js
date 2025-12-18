const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Bridge Hub to HyperEVM...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy Bridge Hub
  const BridgeHub = await ethers.getContractFactory("BridgeHub");
  const bridgeHub = await BridgeHub.deploy();
  await bridgeHub.waitForDeployment();

  const bridgeHubAddress = await bridgeHub.getAddress();
  console.log("✅ Bridge Hub deployed to:", bridgeHubAddress);

  // Initialize with supported chains
  console.log("🔧 Initializing Bridge Hub with supported chains...");

  const chains = [
    {
      chainId: 999,
      name: "HyperEVM",
      rpcUrl: "https://rpc.hyperliquid.xyz/evm",
      gatewayAddress: "0x0000000000000000000000000000000000000000",
      gasCreditVault: "0x0000000000000000000000000000000000000000",
      metaTxGateway: "0x0000000000000000000000000000000000000000"
    },
    {
      chainId: 4157,
      name: "CrossFi Testnet", 
      rpcUrl: "https://rpc.testnet.ms",
      gatewayAddress: "0x0000000000000000000000000000000000000000",
      gasCreditVault: "0x0000000000000000000000000000000000000000",
      metaTxGateway: "0x0000000000000000000000000000000000000000"
    },
    {
      chainId: 56,
      name: "BSC Mainnet",
      rpcUrl: "https://bsc-dataseed.binance.org/",
      gatewayAddress: "0x0000000000000000000000000000000000000000",
      gasCreditVault: "0x0000000000000000000000000000000000000000",
      metaTxGateway: "0x0000000000000000000000000000000000000000"
    }
  ];

  for (const chain of chains) {
    try {
      await bridgeHub.addChain(
        chain.chainId,
        chain.name,
        chain.rpcUrl,
        chain.gatewayAddress,
        chain.gasCreditVault,
        chain.metaTxGateway
      );
      console.log(`✅ Added chain: ${chain.name} (${chain.chainId})`);
    } catch (error) {
      console.error(`❌ Failed to add chain ${chain.name}:`, error.message);
    }
  }

  // Add supported tokens
  console.log("🪙 Adding supported tokens...");

  const tokens = [
    {
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6
    },
    {
      symbol: "USDC", 
      name: "USD Coin",
      decimals: 6
    },
    {
      symbol: "WETH",
      name: "Wrapped Ethereum",
      decimals: 18
    },
    {
      symbol: "WBNB",
      name: "Wrapped BNB",
      decimals: 18
    }
  ];

  for (const token of tokens) {
    try {
      await bridgeHub.addToken(
        token.symbol,
        token.name,
        token.decimals
      );
      console.log(`✅ Added token: ${token.symbol}`);
    } catch (error) {
      console.error(`❌ Failed to add token ${token.symbol}:`, error.message);
    }
  }

  console.log("\n📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log(`Bridge Hub Address: ${bridgeHubAddress}`);
  console.log(`Network: HyperEVM (Chain ID: 999)`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Gas Used: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} HYPE`);
  
  console.log("\n🔧 Next Steps:");
  console.log("1. Update gateway addresses in Bridge Hub after deploying gateways");
  console.log("2. Add token contract addresses for each chain");
  console.log("3. Update relayer configuration with Bridge Hub address");
  console.log("4. Whitelist relayers on all chains");

  // Save deployment info
  const deploymentInfo = {
    network: "hyperevm",
    chainId: 999,
    bridgeHub: bridgeHubAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    supportedChains: chains.map(c => ({ chainId: c.chainId, name: c.name })),
    supportedTokens: tokens.map(t => ({ symbol: t.symbol, name: t.name }))
  };

  console.log("\n💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });