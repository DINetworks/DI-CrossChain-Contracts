
How to Deploy



npx hardhat run scripts/deploy-token-template.js --network etherlinkShadownet
npx hardhat run scripts/deploy-token-registry.js --network etherlinkShadownet
npx hardhat run scripts/deploy-gateway.js --network etherlinkShadownet
npx hardhat run scripts/setup-gateway-connection.js --network etherlinkShadownet
npx hardhat run scripts/deploy-metatx-gateway.js --network etherlinkShadownet
npx hardhat run scripts/setup-permissions.js --network etherlinkShadownet


npx hardhat run scripts/deploy-token-template.js --network sepolia
npx hardhat run scripts/deploy-token-registry.js --network sepolia
npx hardhat run scripts/deploy-gateway.js --network sepolia
npx hardhat run scripts/setup-gateway-connection.js --network sepolia
npx hardhat run scripts/deploy-metatx-gateway.js --network sepolia
npx hardhat run scripts/setup-permissions.js --network sepolia

clear address token list in json
--force --token USDT
npx hardhat deploy-token --network etherlinkShadownet --token USDT --force
npx hardhat deploy-tokens --network etherlinkShadownet
npx hardhat deploy-tokens --network etherlinkShadownet --force


npx hardhat run scripts/deploy-all-micro.js --network crossfiTestnet
npx hardhat run scripts/deploy-all-micro.js --network sepolia


npx hardhat run scripts/deploy-bridge-hub.js --network etherlinkShadownet
npx hardhat run scripts/deploy-gas-credit-vault.js --network etherlinkShadownet
npx hardhat run scripts/register-bridgehub.js --network etherlinkShadownet




replace abi

.env
	Hub Address, Chain ID
	
	
npx hardhat run scripts/check/getDetailedChainsInfo.js --network etherlinkShadownet