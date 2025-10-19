/*
Utility module to automatically reads and retrieves the addresses of the specified deployed smart contracts from Hardhat Ignition's deployment files.

Note that you have to manually add new contracts to the TODO list below when they are deployed via Ignition.
*/

const fs = require("fs");
const path = require("path");

function getLatestDeploymentDir() {
  const base = path.join(__dirname, "..", "ignition", "deployments");
  const dirs = fs.readdirSync(base).filter(d => d.startsWith("chain-"));
  if (dirs.length === 0) throw new Error("No chain-* deployment folders");
  return path.join(base, dirs[0]);
}

function getAddresses() {
  const dir = getLatestDeploymentDir();
  const f = path.join(dir, "deployed_addresses.json");
  const json = JSON.parse(fs.readFileSync(f, "utf8"));

  // TODO: add new contracts here as needed
  return {
    MockUSDC: json["MockStablecoinsModule#MockUSDC"],
    MockUSDT: json["MockStablecoinsModule#MockUSDT"],
    Dex:      json["DexModule#Dex"],
  };
}

module.exports = getAddresses;
