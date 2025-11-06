const hre = require("hardhat");
const { ethers } = hre;
const getAddresses = require("./addresses");

async function main() {
  // Get all deployed contract addresses
  const addresses = getAddresses();
  const { MockUSDT, MockUSDC, MockWETH, MockDAI, Dex } = addresses;
  
  const [deployer, alice, bob, charlie] = await ethers.getSigners();

  console.log("🌱 Seeding orders with profitable cycles...");
  console.log("User addresses:", { 
    alice: alice.address, 
    bob: bob.address, 
    charlie: charlie.address 
  });

  // Get contract instances
  const usdt = await ethers.getContractAt("Token", MockUSDT);
  const usdc = await ethers.getContractAt("Token", MockUSDC);
  const weth = await ethers.getContractAt("Token", MockWETH);
  const dai = await ethers.getContractAt("Token", MockDAI);
  const dex = await ethers.getContractAt("Dex", Dex);
  const dexAddr = dex.target ?? dex.address;
  
  console.log("Deployed contracts:", { MockUSDT, MockUSDC, MockWETH, MockDAI, Dex });

  // Check balances before
  console.log("\nInitial balances:");
  console.log("Alice USDT:", ethers.formatUnits(await usdt.balanceOf(alice.address), 6));
  console.log("Alice USDC:", ethers.formatUnits(await usdc.balanceOf(alice.address), 6));
  console.log("Bob   WETH:", ethers.formatUnits(await weth.balanceOf(bob.address), 6));
  console.log("Charlie DAI:", ethers.formatUnits(await dai.balanceOf(charlie.address), 6));
  
  // Approve DEX to spend all tokens for all users
  console.log("\nApproving token transfers...");
  const tokens = [usdt, usdc, weth, dai];
  const users = [alice, bob, charlie];
  
  for (const user of users) {
    for (const token of tokens) {
      await (await token.connect(user).approve(dexAddr, ethers.MaxUint256)).wait();
    }
  }
  console.log("All approvals complete");

  console.log("\n🔄 Creating profitable cycle orders...");
  
  // CYCLE 1: USDC → USDT → WETH → USDC (3-token cycle)
  // Prices set to create ~2% arbitrage opportunity
  console.log("\n📍 Cycle 1: USDC → USDT → WETH → USDC");
  
  // Order 1: Alice sells 1000 USDC for USDT at rate 0.98 (USDC is slightly cheaper)
  await (await dex.connect(alice).placeLimit(
    1, // SELL
    MockUSDC, // base
    MockUSDT, // quote  
    ethers.parseUnits("1000", 6), // amount
    ethers.parseUnits("0.98", 6)  // price: 1 USDC = 0.98 USDT
  )).wait();
  console.log("  Order 1: Alice sells USDC → USDT @ 0.98");
  
  // Order 2: Bob sells 980 USDT for WETH at rate 0.0005 (USDT/WETH rate)
  await (await dex.connect(bob).placeLimit(
    1, // SELL
    MockUSDT, // base
    MockWETH, // quote
    ethers.parseUnits("980", 6), // amount
    ethers.parseUnits("0.0005", 6) // price: 1 USDT = 0.0005 WETH
  )).wait();
  console.log("  Order 2: Bob sells USDT → WETH @ 0.0005");
  
  // Order 3: Charlie sells 0.49 WETH for USDC at rate 2100 (WETH is expensive)
  await (await dex.connect(charlie).placeLimit(
    1, // SELL  
    MockWETH, // base
    MockUSDC, // quote
    ethers.parseUnits("0.49", 6), // amount
    ethers.parseUnits("2100", 6) // price: 1 WETH = 2100 USDC
  )).wait();
  console.log("  Order 3: Charlie sells WETH → USDC @ 2100");

  console.log("\nCycle 1 Profitability Check:");
  console.log("  Start: 1000 USDC");
  console.log("  → 1000 * 0.98 = 980 USDT");  
  console.log("  → 980 * 0.0005 = 0.49 WETH");
  console.log("  → 0.49 * 2100 = 1029 USDC");
  console.log("  💎 Expected profit: 29 USDC (~2.9%)");

  // CYCLE 2: USDT → DAI → USDC → USDT (3-token cycle)
  console.log("\n📍 Cycle 2: USDT → DAI → USDC → USDT");
  
  // Order 4: Alice sells 500 USDT for DAI at rate 1.01
  await (await dex.connect(alice).placeLimit(
    1, // SELL
    MockUSDT, // base
    MockDAI,  // quote
    ethers.parseUnits("500", 6), // amount  
    ethers.parseUnits("1.01", 6) // price: 1 USDT = 1.01 DAI
  )).wait();
  console.log("  Order 4: Alice sells USDT → DAI @ 1.01");
  
  // Order 5: Bob sells 505 DAI for USDC at rate 0.99
  await (await dex.connect(bob).placeLimit(
    1, // SELL
    MockDAI,  // base
    MockUSDC, // quote
    ethers.parseUnits("505", 6), // amount
    ethers.parseUnits("0.99", 6) // price: 1 DAI = 0.99 USDC
  )).wait();
  console.log("  Order 5: Bob sells DAI → USDC @ 0.99");
  
  // Order 6: Charlie sells 499.95 USDC for USDT at rate 1.005
  await (await dex.connect(charlie).placeLimit(
    1, // SELL
    MockUSDC, // base  
    MockUSDT, // quote
    ethers.parseUnits("499.95", 6), // amount
    ethers.parseUnits("1.005", 6)   // price: 1 USDC = 1.005 USDT
  )).wait();
  console.log("  Order 6: Charlie sells USDC → USDT @ 1.005");

  console.log("\nCycle 2 Profitability Check:");
  console.log("  Start: 500 USDT");
  console.log("  → 500 * 1.01 = 505 DAI");
  console.log("  → 505 * 0.99 = 499.95 USDC");  
  console.log("  → 499.95 * 1.005 = 502.45 USDT");
  console.log("  💎 Expected profit: 2.45 USDT (~0.49%)");

  // Add some non-cycle orders for realistic order book
  console.log("\n📚 Adding additional order book depth...");
  
  // Some random SELL orders that don't form cycles
  await (await dex.connect(alice).placeLimit(1, MockUSDC, MockWETH, ethers.parseUnits("100", 6), ethers.parseUnits("0.00048", 6))).wait();
  await (await dex.connect(bob).placeLimit(1, MockWETH, MockUSDT, ethers.parseUnits("0.1", 6), ethers.parseUnits("2050", 6))).wait();
  
  // Check final order books
  console.log("\n📋 Final Order Books:");
  
  const pairs = [
    [MockUSDC, MockUSDT, "USDC/USDT"],
    [MockUSDT, MockWETH, "USDT/WETH"], 
    [MockWETH, MockUSDC, "WETH/USDC"],
    [MockUSDT, MockDAI, "USDT/DAI"],
    [MockDAI, MockUSDC, "DAI/USDC"],
    [MockUSDC, MockUSDT, "USDC/USDT"]
  ];
  
  for (const [base, quote, name] of pairs) {
    try {
      const [buys, sells] = await dex.getList(base, quote);
      if (sells.length > 0) {
        console.log(`  ${name}: ${sells.length} SELL orders [${sells.map(x => x.toString()).join(', ')}]`);
      }
    } catch (e) {
      // Pair might not exist
    }
  }

  console.log("\nCycles Created:");
  console.log("  Cycle 1: Orders [1, 2, 3] - USDC → USDT → WETH → USDC");
  console.log("  Cycle 2: Orders [4, 5, 6] - USDT → DAI → USDC → USDT");
  console.log("\n🤖 Ready for batch solver execution!");
  console.log("   Run: npm run test-solver");
  console.log("   Then: npm run solver");
}
main().catch((e) => (console.error(e), process.exit(1)));
