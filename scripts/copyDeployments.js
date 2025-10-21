/*
This contract copies the deployment addresses from the ignition deployments
to the dex-frontend/src/deployments.json file for easy access by the frontend.
*/
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../ignition/deployments/chain-31337/deployed_addresses.json');
const destPath = path.join(__dirname, '../dex-frontend/src/deployments.json');

try {
  // Read the deployment addresses
  const deployments = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  
  // Write to frontend src directory
  fs.writeFileSync(destPath, JSON.stringify(deployments, null, 2));
  
  console.log('✅ Deployment addresses copied successfully to dex-frontend/src/deployments.json');
  console.log('Addresses:', deployments);
} catch (error) {
  console.error('❌ Error copying deployment addresses:', error.message);
  process.exit(1);
}
