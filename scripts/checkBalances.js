/** 
This script checks the balances of Alice and Bob for USDT, USDC, and ETH.

Note that it assumes that Alice and Bob's addresses are the second and third accounts provided by Hardhat's local node.
Whereas the first account is typically used as the deployer account.
*/
const hre = require("hardhat");
const { ethers } = hre;
const getAddresses = require("./addresses");

async function main() {
  console.log("Checking token balances for Alice and Bob...\n");

  // Get deployed contract addresses
  const addresses = getAddresses();
  const USDT_ADDRESS = addresses.MockUSDT;
  const USDC_ADDRESS = addresses.MockUSDC;

  // Get Alice and Bob's accounts from Hardhat
  const [deployer, alice, bob] = await ethers.getSigners();

  console.log("Account Addresses:");
  console.log("==================");
  console.log(`Alice: ${alice.address}`);
  console.log(`Bob:   ${bob.address}\n`);

  // Get contract instances
  const MockUSDT = await ethers.getContractAt("MockStablecoin", USDT_ADDRESS);
  const MockUSDC = await ethers.getContractAt("MockStablecoin", USDC_ADDRESS);

  // Get token symbols and decimals
  const usdtSymbol = await MockUSDT.symbol();
  const usdcSymbol = await MockUSDC.symbol();
  const usdtDecimals = await MockUSDT.decimals();
  const usdcDecimals = await MockUSDC.decimals();

  // Get Alice's balances
  const aliceUSDT = await MockUSDT.balanceOf(alice.address);
  const aliceUSDC = await MockUSDC.balanceOf(alice.address);
  const aliceETH = await ethers.provider.getBalance(alice.address);

  // Get Bob's balances
  const bobUSDT = await MockUSDT.balanceOf(bob.address);
  const bobUSDC = await MockUSDC.balanceOf(bob.address);
  const bobETH = await ethers.provider.getBalance(bob.address);

  // Format balances
  const formatToken = (balance, decimals) => {
    return ethers.formatUnits(balance, decimals);
  };

  console.log("Alice's Balances:");
  console.log("=================");
  console.log(`${usdtSymbol}: ${formatToken(aliceUSDT, usdtDecimals)}`);
  console.log(`${usdcSymbol}: ${formatToken(aliceUSDC, usdcDecimals)}`);
  console.log(`ETH:   ${ethers.formatEther(aliceETH)}\n`);

  console.log("Bob's Balances:");
  console.log("===============");
  console.log(`${usdtSymbol}: ${formatToken(bobUSDT, usdtDecimals)}`);
  console.log(`${usdcSymbol}: ${formatToken(bobUSDC, usdcDecimals)}`);
  console.log(`ETH:   ${ethers.formatEther(bobETH)}\n`);

  // Summary table
  console.log("Summary Table:");
  console.log("==============");
  console.log("Account | USDT       | USDC       | ETH");
  console.log("--------|------------|------------|-------------");
  console.log(
    `Alice   | ${formatToken(aliceUSDT, usdtDecimals).padEnd(10)} | ${formatToken(
      aliceUSDC,
      usdcDecimals
    ).padEnd(10)} | ${ethers.formatEther(aliceETH).substring(0, 10)}`
  );
  console.log(
    `Bob     | ${formatToken(bobUSDT, usdtDecimals).padEnd(10)} | ${formatToken(
      bobUSDC,
      usdcDecimals
    ).padEnd(10)} | ${ethers.formatEther(bobETH).substring(0, 10)}`
  );

  // Total balances
  const totalUSDT = aliceUSDT + bobUSDT;
  const totalUSDC = aliceUSDC + bobUSDC;
  
  console.log("\nTotal Token Supply:");
  console.log("===================");
  console.log(`Total ${usdtSymbol}: ${formatToken(totalUSDT, usdtDecimals)}`);
  console.log(`Total ${usdcSymbol}: ${formatToken(totalUSDC, usdcDecimals)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
