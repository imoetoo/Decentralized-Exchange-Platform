const hre = require("hardhat");
const { ethers } = hre;
const getAddresses = require("./addresses");

async function main() {
  const addresses = getAddresses();
  const [deployer, alice, bob, carol] = await ethers.getSigners();

  // Only deployed token
  const symbols = ["USDT", "USDC", "DAI", "PEPE", "WBTC", "WETH", "EIGEN"]
    .filter((s) => `Mock${s}` in addresses);

  if (symbols.length === 0) {
    throw new Error("No tokens found in addresses()");
  }

  console.log("Using addresses:", addresses);
  console.log("Minting to:", {
    alice: alice.address,
    bob: bob.address,
    carol: carol.address,
  });

  // Amount to mint to account
  const mintPerAccount = ethers.parseUnits("100000", 6); // 100k

  for (const sym of symbols) {
    const addr = addresses[`Mock${sym}`];
    const token = await ethers.getContractAt("Token", addr);

    // Three test people
    await (await token.mint(alice.address, mintPerAccount)).wait();
    await (await token.mint(bob.address,   mintPerAccount)).wait();
    await (await token.mint(carol.address, mintPerAccount)).wait();

    // Check balance
    const balances = await token.checkBalances([ alice.address, bob.address, carol.address,]);
    console.log(`${sym} balances:`, balances.map((b) => ethers.formatUnits(b, 6)));
  }

  console.log("Minting done.");
}

main().catch((e) => (console.error(e), process.exit(1)));
