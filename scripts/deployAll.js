/*
Make sure local hardhat node is running before executing this script.

This file automates the full deployment process:
1. Cleans old artifacts, cache, and deployment files.
2. Compiles the smart contracts.
3. Deploys Mock Tokens using Hardhat Ignition.
4. Deploys the DEX contract using Hardhat Ignition.
5. Copies deployment addresses to the frontend directory.

NOTE: Your current data might be lost since this script deletes old deployment files.
*/
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ANSI color codes for better output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  red: "\x1b[31m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function cleanDirectories() {
  log("\n🧹 Cleaning old deployment files...", colors.yellow);

  const dirsToClean = [
    path.join(__dirname, "../artifacts"),
    path.join(__dirname, "../cache"),
    path.join(__dirname, "../ignition/deployments"),
  ];

  dirsToClean.forEach((dir) => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      log(`  ✓ Deleted ${path.basename(dir)}`, colors.green);
    }
  });
}

function runCommand(command, description) {
  log(`\n${description}...`, colors.blue);
  try {
    execSync(command, { stdio: "inherit", cwd: path.join(__dirname, "..") });
    log(`  ✓ ${description} completed`, colors.green);
    return true;
  } catch (error) {
    log(`  ✗ ${description} failed`, colors.red);
    return false;
  }
}

async function main() {
  log("\n" + "=".repeat(50), colors.bright);
  log("🚀 Starting Full Deployment Process", colors.bright);
  log("=".repeat(50) + "\n", colors.bright);

  // Step 1: Clean old files
  cleanDirectories();

  // Step 2: Compile contracts
  if (!runCommand("npx hardhat compile", "📦 Compiling contracts")) {
    process.exit(1);
  }

  // Step 3: Deploy Mock Tokens
  if (
    !runCommand(
      "npx hardhat ignition deploy ./ignition/modules/Token.js --network localhost",
      "💰 Deploying Mock Tokens"
    )
  ) {
    process.exit(1);
  }

  // Step 4: Deploy DEX
  if (
    !runCommand(
      "npx hardhat ignition deploy ./ignition/modules/Dex.js --network localhost",
      "🏦 Deploying DEX Contract"
    )
  ) {
    process.exit(1);
  }

  // Step 5: Copy deployments to frontend
  if (
    !runCommand(
      "node scripts/copyDeployments.js",
      "📋 Copying deployments to frontend"
    )
  ) {
    process.exit(1);
  }

  log("\n" + "=".repeat(50), colors.bright);
  log("✅ Deployment Complete!", colors.green + colors.bright);
  log("=".repeat(50) + "\n", colors.bright);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
