// const hre = require("hardhat");

// async function main() {
//   console.log("Minting tokens to existing deployed contracts...");

//   // Use the addresses from ignition deployment
//   const usdcAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
//   const usdtAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

//   // Get contract instances
//   const MockStablecoin = await hre.ethers.getContractFactory("MockStablecoin");
//   const mockUSDT = MockStablecoin.attach(usdtAddress);
//   const mockUSDC = MockStablecoin.attach(usdcAddress);

//   // Test account address
//   const testAccount = "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a";
//   const amount = hre.ethers.parseUnits("100000", 6); // 100k tokens

//   console.log(`Minting 100,000 tokens to ${testAccount}...`);

//   await mockUSDT.mint(testAccount, amount);
//   await mockUSDC.mint(testAccount, amount);

//   console.log("✅ Minting complete!");

//   // Verify balances with error handling
//   console.log("Checking balances...");

//   try {
//     // Check if contracts exist at the addresses
//     const usdtCode = await hre.ethers.provider.getCode(usdtAddress);
//     const usdcCode = await hre.ethers.provider.getCode(usdcAddress);

//     console.log(`USDT contract code length: ${usdtCode.length}`);
//     console.log(`USDC contract code length: ${usdcCode.length}`);

//     if (usdtCode === "0x" || usdcCode === "0x") {
//       console.error("❌ One or both contracts are not deployed at the specified addresses!");
//       return;
//     }

//     const usdtBalance = await mockUSDT.balanceOf(testAccount);
//     const usdcBalance = await mockUSDC.balanceOf(testAccount);

//     console.log("\n💰 Token balances for test account:");
//     console.log(`USDT: ${hre.ethers.formatUnits(usdtBalance, 6)}`);
//     console.log(`USDC: ${hre.ethers.formatUnits(usdcBalance, 6)}`);
//   } catch (error) {
//     console.error("❌ Error checking balances:", error.message);
//     return;
//   }

//   console.log("\n📍 Contract addresses (already in constants.ts):");
//   console.log(`USDT: ${usdtAddress}`);
//   console.log(`USDC: ${usdcAddress}`);
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

// ***Use your own generated addresses from `npm run node` accounts; Both in mintTokensToAccount.js and seedOrders.js***
// const hre = require("hardhat");
// const { ethers } = hre;
// const getAddresses = require("./addresses");

// async function main() {
//   const { MockUSDT, MockUSDC } = getAddresses();
//   console.log("Using addresses:", { MockUSDT, MockUSDC });
//   const [deployer, alice, bob] = await ethers.getSigners();

//   const usdt = await ethers.getContractAt("MockStablecoin", MockUSDT);
//   const usdc = await ethers.getContractAt("MockStablecoin", MockUSDC);

//   const amt = ethers.parseUnits("100000", 6);

//   await (await usdt.mint(alice.address, amt)).wait();
//   await (await usdc.mint(alice.address, amt)).wait();
//   await (await usdt.mint(bob.address, amt)).wait();
//   await (await usdc.mint(bob.address, amt)).wait();

//   console.log("Minted to:", { alice: alice.address, bob: bob.address });

//   // Check individual balances
//   console.log("\n💰 Checking individual balances...");
//   const aliceUSDT = await usdt.checkBalance(alice.address);
//   const aliceUSDC = await usdc.checkBalance(alice.address);
//   const bobUSDT = await usdt.checkBalance(bob.address);
//   const bobUSDC = await usdc.checkBalance(bob.address);

//   console.log(`Alice USDT: ${ethers.formatUnits(aliceUSDT, 6)}`);
//   console.log(`Alice USDC: ${ethers.formatUnits(aliceUSDC, 6)}`);
//   console.log(`Bob USDT: ${ethers.formatUnits(bobUSDT, 6)}`);
//   console.log(`Bob USDC: ${ethers.formatUnits(bobUSDC, 6)}`);

//   // Check multiple balances at once
//   console.log("\n📊 Checking multiple balances at once...");
//   const usdtBalances = await usdt.checkBalances([alice.address, bob.address]);
//   const usdcBalances = await usdc.checkBalances([alice.address, bob.address]);

//   console.log(
//     "USDT balances:",
//     usdtBalances.map((b) => ethers.formatUnits(b, 6))
//   );
//   console.log(
//     "USDC balances:",
//     usdcBalances.map((b) => ethers.formatUnits(b, 6))
//   );
// }
// main().catch((e) => (console.error(e), process.exit(1)));

// scripts/mint_tokens_to_account.js
const hre = require("hardhat");
const { ethers } = hre;
const getAddresses = require("./addresses");

async function main() {
  const addresses = getAddresses();
  const [deployer, alice, bob, carol] = await ethers.getSigners();

  // Only deployed token
  const symbols = ["USDT", "USDC", "DAI", "BUSD", "TUSD", "USDP", "FDUSD"]
    .filter((s) => `Mock${s}` in addresses);

  if (symbols.length === 0) {
    throw new Error("No mock tokens found in addresses()");
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
    const token = await ethers.getContractAt("MockStablecoin", addr);

    // Three test people
    await (await token.mint(alice.address, mintPerAccount)).wait();
    await (await token.mint(bob.address,   mintPerAccount)).wait();
    await (await token.mint(carol.address, mintPerAccount)).wait();

    // Check balance
    const balances = await token.checkBalances([ alice.address, bob.address, carol.address,]);
    console.log(`${sym} balances:`, balances.map((b) => ethers.formatUnits(b, 6)));
  }

  console.log("✅ Minting done.");
}

main().catch((e) => (console.error(e), process.exit(1)));
