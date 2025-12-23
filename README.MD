
How to Deploy



npx hardhat run scripts/deploy-token-template.js --network hyperevmTestnet
npx hardhat run scripts/deploy-token-registry.js --network hyperevmTestnet
npx hardhat run scripts/deploy-gateway.js --network hyperevmTestnet
npx hardhat run scripts/setup-gateway-connection.js --network hyperevmTestnet
npx hardhat run scripts/deploy-metatx-gateway.js --network hyperevmTestnet
npx hardhat run scripts/setup-permissions.js --network hyperevmTestnet


clear address token list in json
--force --token USDT
npx hardhat deploy-token --network hyperevmTestnet --token USDT --force
npx hardhat deploy-tokens --network hyperevmTestnet
npx hardhat deploy-tokens --network hyperevmTestnet --force


npx hardhat run scripts/deploy-all-micro.js --network crossfiTestnet
npx hardhat run scripts/deploy-all-micro.js --network sepolia


npx hardhat run scripts/deploy-bridge-hub.js --network hyperevmTestnet
npx hardhat run scripts/deploy-gas-credit-vault.js --network hyperevmTestnet
npx hardhat run scripts/register-bridgehub.js --network hyperevmTestnet




replace abi

.env
	Hub Address, Chain ID
	
	
npx hardhat run scripts/check/getDetailedChainsInfo.js --network hyperevmTestnet