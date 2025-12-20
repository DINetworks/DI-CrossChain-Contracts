const fs = require('fs');
const path = require('path');

function saveContractAddress(networkName, contractName, address) {
  const addressesDir = path.join(__dirname, '../../addresses');
  if (!fs.existsSync(addressesDir)) {
    fs.mkdirSync(addressesDir, { recursive: true });
  }
  
  const filePath = path.join(addressesDir, `${networkName}.json`);
  let addresses = {};
  if (fs.existsSync(filePath)) {
    addresses = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  
  addresses[contractName] = address;
  fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

function getContractAddress(networkName, contractName) {
  const filePath = path.join(__dirname, '../../addresses', `${networkName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No addresses file found for ${networkName}`);
  }
  
  const addresses = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!addresses[contractName]) {
    throw new Error(`Contract ${contractName} not found in ${networkName} addresses`);
  }
  
  return addresses[contractName];
}

module.exports = {
  saveContractAddress,
  getContractAddress
};