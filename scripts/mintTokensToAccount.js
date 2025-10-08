const hre = require("hardhat");

async function main() {
  console.log("Minting tokens to existing deployed contracts...");

  // Use the addresses from ignition deployment
  const usdtAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const usdcAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  // Get contract instances
  const MockStablecoin = await hre.ethers.getContractFactory("MockStablecoin");
  const mockUSDT = MockStablecoin.attach(usdtAddress);
  const mockUSDC = MockStablecoin.attach(usdcAddress);

  // Test account address
  const testAccount = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const amount = hre.ethers.parseUnits("100000", 6); // 100k tokens

  console.log(`Minting 100,000 tokens to ${testAccount}...`);

  await mockUSDT.mint(testAccount, amount);
  await mockUSDC.mint(testAccount, amount);

  console.log("✅ Minting complete!");

  // Verify balances with error handling
  console.log("Checking balances...");
  
  try {
    // Check if contracts exist at the addresses
    const usdtCode = await hre.ethers.provider.getCode(usdtAddress);
    const usdcCode = await hre.ethers.provider.getCode(usdcAddress);
    
    console.log(`USDT contract code length: ${usdtCode.length}`);
    console.log(`USDC contract code length: ${usdcCode.length}`);
    
    if (usdtCode === "0x" || usdcCode === "0x") {
      console.error("❌ One or both contracts are not deployed at the specified addresses!");
      return;
    }
    
    const usdtBalance = await mockUSDT.balanceOf(testAccount);
    const usdcBalance = await mockUSDC.balanceOf(testAccount);

    console.log("\n💰 Token balances for test account:");
    console.log(`USDT: ${hre.ethers.formatUnits(usdtBalance, 6)}`);
    console.log(`USDC: ${hre.ethers.formatUnits(usdcBalance, 6)}`);
  } catch (error) {
    console.error("❌ Error checking balances:", error.message);
    return;
  }

  console.log("\n📍 Contract addresses (already in constants.ts):");
  console.log(`USDT: ${usdtAddress}`);
  console.log(`USDC: ${usdcAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
