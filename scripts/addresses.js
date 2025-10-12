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

  return {
    MockUSDC: json["MockStablecoinsModule#MockUSDC"],
    MockUSDT: json["MockStablecoinsModule#MockUSDT"],
    Dex:      json["DexModule#Dex"],
  };
}

module.exports = getAddresses;
