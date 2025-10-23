const hre = require("hardhat");
const { ethers } = hre;
const getAddresses = require("./addresses");

async function main() {
  console.log("Checking token balances for all deployed mock tokens...\n");

  // Get deployed contract addresses
  const addressesMap = getAddresses();

  // Take all mock coin symbols
  const mockSymbols = Object.keys(addressesMap)
    .filter((k) => k.startsWith("Mock"))
    .map((k) => k.replace("Mock", "")); // ["USDT","USDC","DAI",...]

  if (mockSymbols.length === 0) {
    throw new Error("No mock tokens found in addresses()");
  }

  // Now we hardcode three accounts: Alice, Bob, Carol
  const [deployer, alice, bob, carol] = await ethers.getSigners();
  const who = [alice.address, bob.address, carol.address];

  console.log("Account Addresses:");
  console.log("==================");
  console.log(`Alice: ${alice.address}`);
  console.log(`Bob:   ${bob.address}`);
  console.log(`Carol: ${carol.address}\n`);

  const erc20Abi = [
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function checkBalances(address[] calldata) view returns (uint256[])",
  ];

  // All coins balances
  for (const sym of mockSymbols) {
    const tokenAddr = addressesMap[`Mock${sym}`];
    const token = await ethers.getContractAt(erc20Abi, tokenAddr);

    const [symbol, decimals] = await Promise.all([
      token.symbol(),
      token.decimals(),
    ]);

    const balances = await token.checkBalances(who);

    console.log(`${symbol} (${tokenAddr})`);
    console.log("----------------------------------------");
    console.log(`Alice: ${ethers.formatUnits(balances[0], decimals)}`);
    console.log(`Bob: ${ethers.formatUnits(balances[1], decimals)}`);
    console.log(`Carol: ${ethers.formatUnits(balances[2], decimals)}`);
    console.log("----------------------------------------");
    console.log(``)

    // const total = balances.reduce((acc, b) => acc + b, 0n);
    // console.log(`TOTAL          : ${ethers.formatUnits(total, decimals)} ${symbol}\n`);
  }

  // ETH Balances
  console.log("ETH Balances");
  console.log("----------------------------------------");
  const [aEth, bEth, cEth] = await Promise.all([
    ethers.provider.getBalance(alice.address),
    ethers.provider.getBalance(bob.address),
    ethers.provider.getBalance(carol.address),
  ]);
  console.log(`Alice: ${ethers.formatEther(aEth)} ETH`);
  console.log(`Bob: ${ethers.formatEther(bEth)} ETH`);
  console.log(`Carol: ${ethers.formatEther(cEth)} ETH`);
  console.log("----------------------------------------");

  console.log("\n✅ Balance check complete.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

