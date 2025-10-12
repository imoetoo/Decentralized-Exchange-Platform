const fs = require("fs");
const path = require("path");

function getLatestDeploymentDir() {
  const base = path.join(__dirname, "..", "ignition", "deployments");
  if (!fs.existsSync(base)) throw new Error("No ignition/deployments found");
  const dirs = fs.readdirSync(base).filter((d) => d.startsWith("chain-"));
  if (dirs.length === 0) throw new Error("No chain-* deployment folders");
  const pick = dirs
    .map((d) => ({ name: d, mtime: fs.statSync(path.join(base, d)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0];
  return path.join(base, pick.name);
}

function getAddresses() {
  const dir = getLatestDeploymentDir();
  const f = path.join(dir, "deployed_addresses.json");
  if (!fs.existsSync(f)) throw new Error("deployed_addresses.json not found");
  const json = JSON.parse(fs.readFileSync(f, "utf8"));

  // The returned object keys must match the IDs used in the deployment scripts
  // (e.g., "MockUSDT", "MockUSDC", "Dex") -- Dex will be developed later, now it's just a placeholder
  return {
    MockUSDT: json.MockUSDT,
    MockUSDC: json.MockUSDC,
    Dex: json.Dex,
  };
}

module.exports = { getAddresses };
