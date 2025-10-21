// /** 
// This script checks the balances of Alice and Bob for USDT, USDC, and ETH.

// Note that it assumes that Alice and Bob's addresses are the second and third accounts provided by Hardhat's local node.
// Whereas the first account is typically used as the deployer account.
// */
// const hre = require("hardhat");
// const { ethers } = hre;
// const getAddresses = require("./addresses");

// async function main() {
//   console.log("Checking token balances for Alice and Bob...\n");

//   // Get deployed contract addresses
//   const addresses = getAddresses();
//   const USDT_ADDRESS = addresses.MockUSDT;
//   const USDC_ADDRESS = addresses.MockUSDC;

//   // Get Alice and Bob's accounts from Hardhat
//   const [deployer, alice, bob] = await ethers.getSigners();

//   console.log("Account Addresses:");
//   console.log("==================");
//   console.log(`Alice: ${alice.address}`);
//   console.log(`Bob:   ${bob.address}\n`);

//   // Get contract instances
//   const MockUSDT = await ethers.getContractAt("MockStablecoin", USDT_ADDRESS);
//   const MockUSDC = await ethers.getContractAt("MockStablecoin", USDC_ADDRESS);

//   // Get token symbols and decimals
//   const usdtSymbol = await MockUSDT.symbol();
//   const usdcSymbol = await MockUSDC.symbol();
//   const usdtDecimals = await MockUSDT.decimals();
//   const usdcDecimals = await MockUSDC.decimals();

//   // Get Alice's balances
//   const aliceUSDT = await MockUSDT.balanceOf(alice.address);
//   const aliceUSDC = await MockUSDC.balanceOf(alice.address);
//   const aliceETH = await ethers.provider.getBalance(alice.address);

//   // Get Bob's balances
//   const bobUSDT = await MockUSDT.balanceOf(bob.address);
//   const bobUSDC = await MockUSDC.balanceOf(bob.address);
//   const bobETH = await ethers.provider.getBalance(bob.address);

//   // Format balances
//   const formatToken = (balance, decimals) => {
//     return ethers.formatUnits(balance, decimals);
//   };

//   console.log("Alice's Balances:");
//   console.log("=================");
//   console.log(`${usdtSymbol}: ${formatToken(aliceUSDT, usdtDecimals)}`);
//   console.log(`${usdcSymbol}: ${formatToken(aliceUSDC, usdcDecimals)}`);
//   console.log(`ETH:   ${ethers.formatEther(aliceETH)}\n`);

//   console.log("Bob's Balances:");
//   console.log("===============");
//   console.log(`${usdtSymbol}: ${formatToken(bobUSDT, usdtDecimals)}`);
//   console.log(`${usdcSymbol}: ${formatToken(bobUSDC, usdcDecimals)}`);
//   console.log(`ETH:   ${ethers.formatEther(bobETH)}\n`);

//   // Summary table
//   console.log("Summary Table:");
//   console.log("==============");
//   console.log("Account | USDT       | USDC       | ETH");
//   console.log("--------|------------|------------|-------------");
//   console.log(
//     `Alice   | ${formatToken(aliceUSDT, usdtDecimals).padEnd(10)} | ${formatToken(
//       aliceUSDC,
//       usdcDecimals
//     ).padEnd(10)} | ${ethers.formatEther(aliceETH).substring(0, 10)}`
//   );
//   console.log(
//     `Bob     | ${formatToken(bobUSDT, usdtDecimals).padEnd(10)} | ${formatToken(
//       bobUSDC,
//       usdcDecimals
//     ).padEnd(10)} | ${ethers.formatEther(bobETH).substring(0, 10)}`
//   );

//   // Total balances
//   const totalUSDT = aliceUSDT + bobUSDT;
//   const totalUSDC = aliceUSDC + bobUSDC;
  
//   console.log("\nTotal Token Supply:");
//   console.log("===================");
//   console.log(`Total ${usdtSymbol}: ${formatToken(totalUSDT, usdtDecimals)}`);
//   console.log(`Total ${usdcSymbol}: ${formatToken(totalUSDC, usdcDecimals)}`);
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

// scripts/checkBalances.js
const hre = require("hardhat");
const { ethers } = hre;
const getAddresses = require("./addresses");

async function main() {
  console.log("Checking token balances for all deployed mock coins...\n");

  // 所有已部署合约地址
  const addressesMap = getAddresses();

  // 取出所有 Mock 代币（形如 MockUSDT、MockUSDC、MockDAI...）
  const mockSymbols = Object.keys(addressesMap)
    .filter((k) => k.startsWith("Mock"))
    .map((k) => k.replace("Mock", "")); // ["USDT","USDC","DAI",...]

  if (mockSymbols.length === 0) {
    throw new Error("No mock tokens found in addresses()");
  }

  // 获取账户（默认使用 Alice/Bob/Carol）
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

  // 逐个代币输出余额
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

  // ETH 余额（可选）
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

