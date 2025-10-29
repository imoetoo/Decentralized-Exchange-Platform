const hre = require("hardhat");
const { ethers } = hre;
const getAddresses = require("./addresses");

/**
 * Seed Order Book Script
 * 
 * This script populates the DEX with realistic order books for all trading pairs.
 * It uses 5 test accounts and creates non-intersecting buy/sell orders to maintain
 * liquidity without immediate execution.
 * 
 * Market Prices (approximate as of Oct 2025):
 * - WETH: ~$3,900 USDC
 * - WBTC: ~$100,500 USDC
 * - EIGEN: ~$5.25 USDC
 * - PEPE: ~$0.000007022 USDC
 * - DAI: ~$1.00 USDC
 * - USDT: ~$1.00 USDC/USDC
 */

async function main() {
  const addresses = getAddresses();
  
  // Get test accounts - using accounts 15-19 from Hardhat
  const signers = await ethers.getSigners();
  const traders = [
    signers[15], // 0xcd3B766CCDd6AE721141F452C550Ca635964ce71
    signers[16], // 0x2546BcD3c84621e976D8185a91A922aE77ECEc30
    signers[17], // 0xbDA5747bFD65F08deb54cb465eB87D40e51B197E
    signers[18], // 0xdD2FD4581271e230360230F9337D5c0430Bf44C0
    signers[19], // 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199
  ];

  console.log("🚀 Starting Order Book Seeding...\n");
  console.log("Traders:");
  traders.forEach((t, i) => console.log(`  [${i}] ${t.address}`));
  console.log();

  // Get contract instances
  const dex = await ethers.getContractAt("Dex", addresses.Dex);
  const dexAddr = dex.target ?? dex.address;

  const tokens = {
    USDT: await ethers.getContractAt("Token", addresses.MockUSDT),
    USDC: await ethers.getContractAt("Token", addresses.MockUSDC),
    DAI: await ethers.getContractAt("Token", addresses.MockDAI),
    WETH: await ethers.getContractAt("Token", addresses.MockWETH),
    WBTC: await ethers.getContractAt("Token", addresses.MockWBTC),
    EIGEN: await ethers.getContractAt("Token", addresses.MockEIGEN),
    PEPE: await ethers.getContractAt("Token", addresses.MockPEPE),
  };

    // Step 1: Mint tokens to all traders
  console.log("💰 Minting tokens to traders...");
  const mintAmounts = {
    USDT: ethers.parseUnits("50000000", 6),  // 50M USDT (increased for all orders)
    USDC: ethers.parseUnits("50000000", 6),  // 50M USDC
    DAI: ethers.parseUnits("10000000", 6),   // 10M DAI
    WETH: ethers.parseUnits("1000", 6),      // 1000 WETH
    WBTC: ethers.parseUnits("50", 6),        // 50 WBTC
    EIGEN: ethers.parseUnits("500000", 6),   // 500k EIGEN
    PEPE: ethers.parseUnits("100000000000", 6), // 100B PEPE
  };

  for (const trader of traders) {
    for (const [symbol, token] of Object.entries(tokens)) {
      await (await token.mint(trader.address, mintAmounts[symbol])).wait();
    }
  }
  console.log("✅ Tokens minted\n");

  // Step 2: Approve DEX for all traders
  console.log("🔓 Approving DEX for all traders...");
  for (const trader of traders) {
    for (const token of Object.values(tokens)) {
      await (await token.connect(trader).approve(dexAddr, ethers.MaxUint256)).wait();
    }
  }
  console.log("✅ Approvals complete\n");

  // Step 3: Create orders for all trading pairs
  console.log("📊 Creating order books...\n");

  // Helper function to place orders
  async function placeOrder(trader, action, base, quote, amount, price, label) {
    const tx = await dex.connect(trader).placeLimit(
      action, // 0 = BUY, 1 = SELL
      base,
      quote,
      amount,
      price
    );
    await tx.wait();
    console.log(`  ${label}`);
  }

  // ========== WETH/USDC Pair (Mid price: ~3900 USDC) ==========
  console.log("🔷 WETH/USDC Order Book");
  const wethAddr = addresses.MockWETH;
  const usdcAddr = addresses.MockUSDC;
  
  // Buy orders (below market)
  await placeOrder(traders[0], 0, wethAddr, usdcAddr, ethers.parseUnits("1", 6), ethers.parseUnits("3825", 6), "BUY 1 WETH @ 3825");
  await placeOrder(traders[1], 0, wethAddr, usdcAddr, ethers.parseUnits("2", 6), ethers.parseUnits("3810", 6), "BUY 2 WETH @ 3810");
  await placeOrder(traders[2], 0, wethAddr, usdcAddr, ethers.parseUnits("1.5", 6), ethers.parseUnits("3795", 6), "BUY 1.5 WETH @ 3795");
  await placeOrder(traders[3], 0, wethAddr, usdcAddr, ethers.parseUnits("3", 6), ethers.parseUnits("3780", 6), "BUY 3 WETH @ 3780");
  await placeOrder(traders[4], 0, wethAddr, usdcAddr, ethers.parseUnits("2", 6), ethers.parseUnits("3765", 6), "BUY 2 WETH @ 3765");

  // Sell orders (above market)
  await placeOrder(traders[0], 1, wethAddr, usdcAddr, ethers.parseUnits("1", 6), ethers.parseUnits("3975", 6), "SELL 1 WETH @ 3975");
  await placeOrder(traders[1], 1, wethAddr, usdcAddr, ethers.parseUnits("2", 6), ethers.parseUnits("3990", 6), "SELL 2 WETH @ 3990");
  await placeOrder(traders[2], 1, wethAddr, usdcAddr, ethers.parseUnits("1.5", 6), ethers.parseUnits("4005", 6), "SELL 1.5 WETH @ 4005");
  await placeOrder(traders[3], 1, wethAddr, usdcAddr, ethers.parseUnits("3", 6), ethers.parseUnits("4020", 6), "SELL 3 WETH @ 4020");
  await placeOrder(traders[4], 1, wethAddr, usdcAddr, ethers.parseUnits("2", 6), ethers.parseUnits("4035", 6), "SELL 2 WETH @ 4035");
  console.log();

  // ========== WBTC/USDT Pair (Mid price: ~100500 USDT) ==========
  console.log("🟡 WBTC/USDT Order Book");
  const wbtcAddr = addresses.MockWBTC;
  const usdtAddr = addresses.MockUSDT;
  
  // Buy orders (below market)
  await placeOrder(traders[0], 0, wbtcAddr, usdtAddr, ethers.parseUnits("0.1", 6), ethers.parseUnits("99750", 6), "BUY 0.1 WBTC @ 99750");
  await placeOrder(traders[1], 0, wbtcAddr, usdtAddr, ethers.parseUnits("0.15", 6), ethers.parseUnits("99600", 6), "BUY 0.15 WBTC @ 99600");
  await placeOrder(traders[2], 0, wbtcAddr, usdtAddr, ethers.parseUnits("0.2", 6), ethers.parseUnits("99450", 6), "BUY 0.2 WBTC @ 99450");
  await placeOrder(traders[3], 0, wbtcAddr, usdtAddr, ethers.parseUnits("0.25", 6), ethers.parseUnits("99300", 6), "BUY 0.25 WBTC @ 99300");
  await placeOrder(traders[4], 0, wbtcAddr, usdtAddr, ethers.parseUnits("0.3", 6), ethers.parseUnits("99150", 6), "BUY 0.3 WBTC @ 99150");

  // Sell orders (above market)
  await placeOrder(traders[0], 1, wbtcAddr, usdtAddr, ethers.parseUnits("0.1", 6), ethers.parseUnits("101250", 6), "SELL 0.1 WBTC @ 101250");
  await placeOrder(traders[1], 1, wbtcAddr, usdtAddr, ethers.parseUnits("0.15", 6), ethers.parseUnits("101400", 6), "SELL 0.15 WBTC @ 101400");
  await placeOrder(traders[2], 1, wbtcAddr, usdtAddr, ethers.parseUnits("0.2", 6), ethers.parseUnits("101550", 6), "SELL 0.2 WBTC @ 101550");
  await placeOrder(traders[3], 1, wbtcAddr, usdtAddr, ethers.parseUnits("0.25", 6), ethers.parseUnits("101700", 6), "SELL 0.25 WBTC @ 101700");
  await placeOrder(traders[4], 1, wbtcAddr, usdtAddr, ethers.parseUnits("0.3", 6), ethers.parseUnits("101850", 6), "SELL 0.3 WBTC @ 101850");
  console.log();

  // ========== EIGEN/USDC Pair (Mid price: ~5.25 USDC) ==========
  console.log("🟣 EIGEN/USDC Order Book");
  const eigenAddr = addresses.MockEIGEN;
  
  // Buy orders (below market)
  await placeOrder(traders[0], 0, eigenAddr, usdcAddr, ethers.parseUnits("100", 6), ethers.parseUnits("5.175", 6), "BUY 100 EIGEN @ 5.175");
  await placeOrder(traders[1], 0, eigenAddr, usdcAddr, ethers.parseUnits("200", 6), ethers.parseUnits("5.10", 6), "BUY 200 EIGEN @ 5.10");
  await placeOrder(traders[2], 0, eigenAddr, usdcAddr, ethers.parseUnits("150", 6), ethers.parseUnits("5.025", 6), "BUY 150 EIGEN @ 5.025");
  await placeOrder(traders[3], 0, eigenAddr, usdcAddr, ethers.parseUnits("300", 6), ethers.parseUnits("4.95", 6), "BUY 300 EIGEN @ 4.95");
  await placeOrder(traders[4], 0, eigenAddr, usdcAddr, ethers.parseUnits("250", 6), ethers.parseUnits("4.875", 6), "BUY 250 EIGEN @ 4.875");

  // Sell orders (above market)
  await placeOrder(traders[0], 1, eigenAddr, usdcAddr, ethers.parseUnits("100", 6), ethers.parseUnits("5.325", 6), "SELL 100 EIGEN @ 5.325");
  await placeOrder(traders[1], 1, eigenAddr, usdcAddr, ethers.parseUnits("200", 6), ethers.parseUnits("5.40", 6), "SELL 200 EIGEN @ 5.40");
  await placeOrder(traders[2], 1, eigenAddr, usdcAddr, ethers.parseUnits("150", 6), ethers.parseUnits("5.475", 6), "SELL 150 EIGEN @ 5.475");
  await placeOrder(traders[3], 1, eigenAddr, usdcAddr, ethers.parseUnits("300", 6), ethers.parseUnits("5.55", 6), "SELL 300 EIGEN @ 5.55");
  await placeOrder(traders[4], 1, eigenAddr, usdcAddr, ethers.parseUnits("250", 6), ethers.parseUnits("5.625", 6), "SELL 250 EIGEN @ 5.625");
  console.log();

  // ========== PEPE/USDT Pair (Mid price: ~0.000007022 USDT per PEPE = ~7.022 USDT per 1M PEPE) ==========
  console.log("🐸 PEPE/USDT Order Book");
  const pepeAddr = addresses.MockPEPE;
  
  // Buy orders (below market) - Smaller amounts to avoid running out of USDT
  // Note: PEPE has 6 decimals, price expressed as USDT per 1M PEPE
  await placeOrder(traders[0], 0, pepeAddr, usdtAddr, ethers.parseUnits("500000", 6), ethers.parseUnits("6.88", 6), "BUY 500K PEPE @ 6.88 (per 1M)");
  await placeOrder(traders[1], 0, pepeAddr, usdtAddr, ethers.parseUnits("750000", 6), ethers.parseUnits("6.74", 6), "BUY 750K PEPE @ 6.74 (per 1M)");
  await placeOrder(traders[2], 0, pepeAddr, usdtAddr, ethers.parseUnits("600000", 6), ethers.parseUnits("6.60", 6), "BUY 600K PEPE @ 6.60 (per 1M)");
  await placeOrder(traders[3], 0, pepeAddr, usdtAddr, ethers.parseUnits("1000000", 6), ethers.parseUnits("6.46", 6), "BUY 1M PEPE @ 6.46 (per 1M)");
  await placeOrder(traders[4], 0, pepeAddr, usdtAddr, ethers.parseUnits("800000", 6), ethers.parseUnits("6.32", 6), "BUY 800K PEPE @ 6.32 (per 1M)");

  // Sell orders (above market)
  await placeOrder(traders[0], 1, pepeAddr, usdtAddr, ethers.parseUnits("500000", 6), ethers.parseUnits("7.16", 6), "SELL 500K PEPE @ 7.16 (per 1M)");
  await placeOrder(traders[1], 1, pepeAddr, usdtAddr, ethers.parseUnits("750000", 6), ethers.parseUnits("7.30", 6), "SELL 750K PEPE @ 7.30 (per 1M)");
  await placeOrder(traders[2], 1, pepeAddr, usdtAddr, ethers.parseUnits("600000", 6), ethers.parseUnits("7.44", 6), "SELL 600K PEPE @ 7.44 (per 1M)");
  await placeOrder(traders[3], 1, pepeAddr, usdtAddr, ethers.parseUnits("1000000", 6), ethers.parseUnits("7.58", 6), "SELL 1M PEPE @ 7.58 (per 1M)");
  await placeOrder(traders[4], 1, pepeAddr, usdtAddr, ethers.parseUnits("800000", 6), ethers.parseUnits("7.72", 6), "SELL 800K PEPE @ 7.72 (per 1M)");
  console.log();

  // ========== DAI/USDC Pair (Mid price: ~1.0 USDC) ==========
  console.log("💚 DAI/USDC Order Book");
  const daiAddr = addresses.MockDAI;
  
  // Buy orders (below market)
  await placeOrder(traders[0], 0, daiAddr, usdcAddr, ethers.parseUnits("1000", 6), ethers.parseUnits("0.998", 6), "BUY 1000 DAI @ 0.998");
  await placeOrder(traders[1], 0, daiAddr, usdcAddr, ethers.parseUnits("2000", 6), ethers.parseUnits("0.997", 6), "BUY 2000 DAI @ 0.997");
  await placeOrder(traders[2], 0, daiAddr, usdcAddr, ethers.parseUnits("1500", 6), ethers.parseUnits("0.996", 6), "BUY 1500 DAI @ 0.996");
  await placeOrder(traders[3], 0, daiAddr, usdcAddr, ethers.parseUnits("3000", 6), ethers.parseUnits("0.995", 6), "BUY 3000 DAI @ 0.995");
  await placeOrder(traders[4], 0, daiAddr, usdcAddr, ethers.parseUnits("2500", 6), ethers.parseUnits("0.994", 6), "BUY 2500 DAI @ 0.994");

  // Sell orders (above market)
  await placeOrder(traders[0], 1, daiAddr, usdcAddr, ethers.parseUnits("1000", 6), ethers.parseUnits("1.002", 6), "SELL 1000 DAI @ 1.002");
  await placeOrder(traders[1], 1, daiAddr, usdcAddr, ethers.parseUnits("2000", 6), ethers.parseUnits("1.003", 6), "SELL 2000 DAI @ 1.003");
  await placeOrder(traders[2], 1, daiAddr, usdcAddr, ethers.parseUnits("1500", 6), ethers.parseUnits("1.004", 6), "SELL 1500 DAI @ 1.004");
  await placeOrder(traders[3], 1, daiAddr, usdcAddr, ethers.parseUnits("3000", 6), ethers.parseUnits("1.005", 6), "SELL 3000 DAI @ 1.005");
  await placeOrder(traders[4], 1, daiAddr, usdcAddr, ethers.parseUnits("2500", 6), ethers.parseUnits("1.006", 6), "SELL 2500 DAI @ 1.006");
  console.log();

  // ========== USDT/USDC Pair (Mid price: ~1.0 USDC) ==========
  console.log("💲 USDT/USDC Order Book");
  
  // Buy orders (below market)
  await placeOrder(traders[0], 0, usdtAddr, usdcAddr, ethers.parseUnits("1000", 6), ethers.parseUnits("0.9995", 6), "BUY 1000 USDT @ 0.9995");
  await placeOrder(traders[1], 0, usdtAddr, usdcAddr, ethers.parseUnits("2000", 6), ethers.parseUnits("0.9990", 6), "BUY 2000 USDT @ 0.9990");
  await placeOrder(traders[2], 0, usdtAddr, usdcAddr, ethers.parseUnits("1500", 6), ethers.parseUnits("0.9985", 6), "BUY 1500 USDT @ 0.9985");
  await placeOrder(traders[3], 0, usdtAddr, usdcAddr, ethers.parseUnits("3000", 6), ethers.parseUnits("0.9980", 6), "BUY 3000 USDT @ 0.9980");
  await placeOrder(traders[4], 0, usdtAddr, usdcAddr, ethers.parseUnits("2500", 6), ethers.parseUnits("0.9975", 6), "BUY 2500 USDT @ 0.9975");

  // Sell orders (above market)
  await placeOrder(traders[0], 1, usdtAddr, usdcAddr, ethers.parseUnits("1000", 6), ethers.parseUnits("1.0005", 6), "SELL 1000 USDT @ 1.0005");
  await placeOrder(traders[1], 1, usdtAddr, usdcAddr, ethers.parseUnits("2000", 6), ethers.parseUnits("1.0010", 6), "SELL 2000 USDT @ 1.0010");
  await placeOrder(traders[2], 1, usdtAddr, usdcAddr, ethers.parseUnits("1500", 6), ethers.parseUnits("1.0015", 6), "SELL 1500 USDT @ 1.0015");
  await placeOrder(traders[3], 1, usdtAddr, usdcAddr, ethers.parseUnits("3000", 6), ethers.parseUnits("1.0020", 6), "SELL 3000 USDT @ 1.0020");
  await placeOrder(traders[4], 1, usdtAddr, usdcAddr, ethers.parseUnits("2500", 6), ethers.parseUnits("1.0025", 6), "SELL 2500 USDT @ 1.0025");
  console.log();

  // ========== USDC/USDT Pair (Reverse - Mid price: ~1.0 USDT) ==========
  console.log("💵 USDC/USDT Order Book");
  
  // Buy orders (below market)
  await placeOrder(traders[0], 0, usdcAddr, usdtAddr, ethers.parseUnits("1000", 6), ethers.parseUnits("0.9995", 6), "BUY 1000 USDC @ 0.9995");
  await placeOrder(traders[1], 0, usdcAddr, usdtAddr, ethers.parseUnits("2000", 6), ethers.parseUnits("0.9990", 6), "BUY 2000 USDC @ 0.9990");
  await placeOrder(traders[2], 0, usdcAddr, usdtAddr, ethers.parseUnits("1500", 6), ethers.parseUnits("0.9985", 6), "BUY 1500 USDC @ 0.9985");
  await placeOrder(traders[3], 0, usdcAddr, usdtAddr, ethers.parseUnits("3000", 6), ethers.parseUnits("0.9980", 6), "BUY 3000 USDC @ 0.9980");
  await placeOrder(traders[4], 0, usdcAddr, usdtAddr, ethers.parseUnits("2500", 6), ethers.parseUnits("0.9975", 6), "BUY 2500 USDC @ 0.9975");

  // Sell orders (above market)
  await placeOrder(traders[0], 1, usdcAddr, usdtAddr, ethers.parseUnits("1000", 6), ethers.parseUnits("1.0005", 6), "SELL 1000 USDC @ 1.0005");
  await placeOrder(traders[1], 1, usdcAddr, usdtAddr, ethers.parseUnits("2000", 6), ethers.parseUnits("1.0010", 6), "SELL 2000 USDC @ 1.0010");
  await placeOrder(traders[2], 1, usdcAddr, usdtAddr, ethers.parseUnits("1500", 6), ethers.parseUnits("1.0015", 6), "SELL 1500 USDC @ 1.0015");
  await placeOrder(traders[3], 1, usdcAddr, usdtAddr, ethers.parseUnits("3000", 6), ethers.parseUnits("1.0020", 6), "SELL 3000 USDC @ 1.0020");
  await placeOrder(traders[4], 1, usdcAddr, usdtAddr, ethers.parseUnits("2500", 6), ethers.parseUnits("1.0025", 6), "SELL 2500 USDC @ 1.0025");
  console.log();

  // Summary
  console.log("✅ Order book seeding complete!");
  console.log("\n📊 Summary:");
  console.log("  - 7 trading pairs populated");
  console.log("  - 10 orders per pair (5 buy + 5 sell)");
  console.log("  - Total: 70 orders created");
  console.log("  - All orders non-intersecting (no immediate fills)");
  console.log("  - Realistic market spreads maintained");
  console.log("\n🎯 Trading pairs ready:");
  console.log("  - WETH/USDC (~$3,900)");
  console.log("  - WBTC/USDT (~$100,500)");
  console.log("  - EIGEN/USDC (~$5.25)");
  console.log("  - PEPE/USDT (~$0.000007022 or ~$7.02 per 1M)");
  console.log("  - DAI/USDC (~$1.00)");
  console.log("  - USDT/USDC (~$1.00)");
  console.log("  - USDC/USDT (~$1.00)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
