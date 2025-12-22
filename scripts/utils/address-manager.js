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

function saveTokenData(networkName, tokenData) {
  const addressesDir = path.join(__dirname, '../../addresses');
  if (!fs.existsSync(addressesDir)) {
    fs.mkdirSync(addressesDir, { recursive: true });
  }
  
  const filePath = path.join(addressesDir, `${networkName}.json`);
  let data = {};
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  
  data.tokenData = tokenData;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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

function addTokenToFile(networkName, tokenInfo) {
  const addressesDir = path.join(__dirname, '../../addresses');
  if (!fs.existsSync(addressesDir)) {
    fs.mkdirSync(addressesDir, { recursive: true });
  }
  
  const filePath = path.join(addressesDir, `${networkName}.json`);
  let data = {};
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  
  if (!data.tokenData) {
    data.tokenData = {
      network: networkName,
      tokens: []
    };
  }
  
  // Add or update token
  const existingIndex = data.tokenData.tokens.findIndex(t => t.symbol === tokenInfo.symbol);
  if (existingIndex >= 0) {
    data.tokenData.tokens[existingIndex] = tokenInfo;
  } else {
    data.tokenData.tokens.push(tokenInfo);
  }
  
  data.tokenData.timestamp = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getAllNetworkTokenData() {
  const addressesDir = path.join(__dirname, '../../addresses');
  const networkFiles = fs.readdirSync(addressesDir).filter(file => file.endsWith('.json'));
  const allNetworkData = [];
  
  for (const file of networkFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(addressesDir, file), 'utf8'));
      if (data.tokenData) {
        allNetworkData.push(data.tokenData);
      }
    } catch (error) {
      console.log(`Error reading ${file}:`, error.message);
    }
  }
  
  return allNetworkData;
}

function getNetworkTokenData(networkName) {
  const filePath = path.join(__dirname, '../../addresses', `${networkName}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.tokenData || null;
  } catch (error) {
    console.log(`Error reading ${networkName}.json:`, error.message);
    return null;
  }
}

module.exports = {
  saveContractAddress,
  saveTokenData,
  addTokenToFile,
  getAllNetworkTokenData,
  getNetworkTokenData,
  getContractAddress
};