/*
Utility module to automatically reads and retrieves the addresses of the specified deployed smart contracts from Hardhat Ignition's deployment files.

Note that you have to manually add new contracts to the TODO list below when they are deployed via Ignition.
*/
const fs = require("fs");
const path = require("path");

function getLatestDeploymentDir() {
  const base = path.join(__dirname, "..", "ignition", "deployments");
  const dirs = fs.readdirSync(base)
    .filter((d) => d.startsWith("chain-"))
    .map((d) => ({ name: d, mtime: fs.statSync(path.join(base, d)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (dirs.length === 0) throw new Error("No chain-* deployment folders");
  return path.join(base, dirs[0].name);
}

function getAddresses() {
  const dir = getLatestDeploymentDir();
  const f = path.join(dir, "deployed_addresses.json");
  const json = JSON.parse(fs.readFileSync(f, "utf8"));

  const out = {};

  // Contract Address
  if (json["DexModule#Dex"]) {
    out.Dex = json["DexModule#Dex"];
  }

  // Collect all coint address
  const PREFIX = "MockStablecoinsModule#Mock";
  for (const [k, v] of Object.entries(json)) {
    if (k.startsWith(PREFIX)) {
      const symbol = k.slice(PREFIX.length); // e.g. "USDT"
      out[`Mock${symbol}`] = v;              // e.g. out.MockUSDT = "0x..."
    }
  }

  if (!out.Dex && Object.keys(out).length === 0) {
    throw new Error("No known contracts found in deployed_addresses.json");
  }

  return out;
}

module.exports = getAddresses;
