const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../deployment-config.js');

const NETWORKS = config.getEnabledNetworks();

async function runDeployment(network) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Deploying to ${network}...`);
    
    const command = `npx hardhat run scripts/deploy-all-chains.js --network ${network}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error deploying to ${network}:`, error.message);
        resolve({ network, success: false, error: error.message });
        return;
      }
      
      if (stderr) {
        console.warn(`⚠️  Warning for ${network}:`, stderr);
      }
      
      console.log(`✅ ${network} deployment output:`, stdout);
      resolve({ network, success: true, output: stdout });
    });
  });
}

async function main() {
  console.log('🌐 Starting batch deployment to all networks...');
  
  const results = {};
  const deploymentSummary = [];
  
  // Deploy to each network sequentially
  for (const network of NETWORKS) {
    try {
      const result = await runDeployment(network);
      results[network] = result;
      deploymentSummary.push(result);
      
      // Small delay between deployments
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to deploy to ${network}:`, error.message);
      results[network] = { success: false, error: error.message };
    }
  }
  
  // Collect all deployment files
  const allDeployments = {};
  for (const network of NETWORKS) {
    const deploymentFile = `deployments-${network}.json`;
    if (fs.existsSync(deploymentFile)) {
      try {
        const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        allDeployments[network] = deployment;
      } catch (error) {
        console.warn(`⚠️  Could not read deployment file for ${network}`);
      }
    }
  }
  
  // Save combined results
  fs.writeFileSync('deployments-all.json', JSON.stringify(allDeployments, null, 2));
  fs.writeFileSync('deployment-summary.json', JSON.stringify(deploymentSummary, null, 2));
  
  // Print summary
  console.log('\n📊 Deployment Summary:');
  console.log('='.repeat(50));
  
  const successful = deploymentSummary.filter(r => r.success).length;
  const failed = deploymentSummary.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  deploymentSummary.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.network}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n📄 Files created:');
  console.log('- deployments-all.json (Combined deployment addresses)');
  console.log('- deployment-summary.json (Deployment status summary)');
  
  if (failed > 0) {
    console.log('\n⚠️  Some deployments failed. Check the logs above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All deployments completed successfully!');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Batch deployment failed:', error);
    process.exit(1);
  });