const hre = require("hardhat");
const { ethers } = hre;
const getAddresses = require("./addresses");
const BigNumber = require("bignumber.js");

// Configure BigNumber for high precision
BigNumber.config({ DECIMAL_PLACES: 50, ROUNDING_MODE: BigNumber.ROUND_DOWN });

/**
 * Seed Order Book Script
 *
 * This script populates the DEX with realistic order books for all trading pairs.
 * It uses 5 test accounts and creates non-intersecting buy/sell orders to maintain
 * liquidity without immediate execution.
 *
 * Market Prices (approximate as of Oct 2025):
 * - WETH: ~$4,000 USDC
 * - WBTC: ~$120,000 USDC
 * - EIGEN: ~$1.08 USDC
 * - PEPE: ~$0.000007022 USDC (expressed as $7.02 per 1M PEPE)
 * - DAI: ~$1.00 USDC
 * - USDC: ~$1.00 USDT
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
    USDT: parseUnits("50000000"), // 50M USDT
    USDC: parseUnits("50000000"), // 50M USDC
    DAI: parseUnits("10000000"), // 10M DAI
    WETH: parseUnits("1000"), // 1000 WETH
    WBTC: parseUnits("50"), // 50 WBTC
    EIGEN: parseUnits("500000"), // 500k EIGEN
    PEPE: parseUnits("100000000000"), // 100B PEPE
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
      await (
        await token.connect(trader).approve(dexAddr, ethers.MaxUint256)
      ).wait();
    }
  }
  console.log("✅ Approvals complete\n");

  // Step 3: Create orders for all trading pairs
  console.log("📊 Creating order books...\n");

  // Helper function to place orders
  async function placeOrder(trader, action, base, quote, amount, price, label) {
    try {
      const tx = await dex
        .connect(trader)
        .placeLimit(action, base, quote, amount, price);
      const receipt = await tx.wait();

      // Check if order was created
      const orderId = receipt.logs
        .filter(
          (log) =>
            log.topics[0] === dex.interface.getEvent("NewOrder").topicHash
        )
        .map((log) => dex.interface.parseLog(log).args.id)[0];

      // Check if order still exists and is active
      if (orderId) {
        const order = await dex.orders(orderId);
        if (order.active) {
          console.log(`  ${label} [ID: ${orderId}]`);
        } else {
          console.log(`  ⚠️  ${label} [ID: ${orderId}, MATCHED & FILLED]`);
        }
      } else {
        console.log(`  ${label}`);
      }
    } catch (error) {
      console.error(`  ❌ FAILED: ${label}`);
      console.error(`     Error: ${error.message}`);
      console.error(`     Reason: ${error.reason || "N/A"}`);
      console.error(
        `     Amount: ${amount.toString()}, Price: ${price.toString()}`
      );
      if (error.data) {
        console.error(`     Data: ${error.data}`);
      }
    }
  } // Helper function to convert any decimal value to BigInt with 6 decimals precision
  function parseSmallUnits(value, decimals = 6) {
    const bn = new BigNumber(value);
    const multiplier = new BigNumber(10).pow(decimals);
    const result = bn.multipliedBy(multiplier);
    return BigInt(result.toFixed(0));
  }

  // Helper function for all parseUnits - uses BigNumber for precision
  function parseUnits(value, decimals = 6) {
    return parseSmallUnits(value, decimals);
  }

  // ========== WETH/USDC Pair (Mid price: ~4000 USDC) ==========
  console.log("🔷 WETH/USDC Order Book");
  const wethAddr = addresses.MockWETH;
  const usdcAddr = addresses.MockUSDC;

  // Buy orders (below market)
  await placeOrder(
    traders[0],
    0,
    wethAddr,
    usdcAddr,
    parseUnits("1"),
    parseUnits("3920"),
    "BUY 1 WETH @ 3920"
  );
  await placeOrder(
    traders[1],
    0,
    wethAddr,
    usdcAddr,
    parseUnits("2"),
    parseUnits("3900"),
    "BUY 2 WETH @ 3900"
  );
  await placeOrder(
    traders[2],
    0,
    wethAddr,
    usdcAddr,
    parseUnits("1.5"),
    parseUnits("3880"),
    "BUY 1.5 WETH @ 3880"
  );
  await placeOrder(
    traders[3],
    0,
    wethAddr,
    usdcAddr,
    parseUnits("3"),
    parseUnits("3860"),
    "BUY 3 WETH @ 3860"
  );
  await placeOrder(
    traders[4],
    0,
    wethAddr,
    usdcAddr,
    parseUnits("2"),
    parseUnits("3840"),
    "BUY 2 WETH @ 3840"
  );

  // Sell orders (above market)
  await placeOrder(
    traders[0],
    1,
    wethAddr,
    usdcAddr,
    parseUnits("1"),
    parseUnits("4080"),
    "SELL 1 WETH @ 4080"
  );
  await placeOrder(
    traders[1],
    1,
    wethAddr,
    usdcAddr,
    parseUnits("2"),
    parseUnits("4100"),
    "SELL 2 WETH @ 4100"
  );
  await placeOrder(
    traders[2],
    1,
    wethAddr,
    usdcAddr,
    parseUnits("1.5"),
    parseUnits("4120"),
    "SELL 1.5 WETH @ 4120"
  );
  await placeOrder(
    traders[3],
    1,
    wethAddr,
    usdcAddr,
    parseUnits("3"),
    parseUnits("4140"),
    "SELL 3 WETH @ 4140"
  );
  await placeOrder(
    traders[4],
    1,
    wethAddr,
    usdcAddr,
    parseUnits("2"),
    parseUnits("4160"),
    "SELL 2 WETH @ 4160"
  );
  console.log();

  // ========== WBTC/USDT Pair (Mid price: ~120000 USDT) ==========
  console.log("🟡 WBTC/USDT Order Book");
  const wbtcAddr = addresses.MockWBTC;
  const usdtAddr = addresses.MockUSDT;

  // Buy orders (below market)
  await placeOrder(
    traders[0],
    0,
    wbtcAddr,
    usdtAddr,
    parseUnits("0.1", 6),
    parseUnits("118800", 6),
    "BUY 0.1 WBTC @ 118800"
  );
  await placeOrder(
    traders[1],
    0,
    wbtcAddr,
    usdtAddr,
    parseUnits("0.15", 6),
    parseUnits("118500", 6),
    "BUY 0.15 WBTC @ 118500"
  );
  await placeOrder(
    traders[2],
    0,
    wbtcAddr,
    usdtAddr,
    parseUnits("0.2", 6),
    parseUnits("118200", 6),
    "BUY 0.2 WBTC @ 118200"
  );
  await placeOrder(
    traders[3],
    0,
    wbtcAddr,
    usdtAddr,
    parseUnits("0.25", 6),
    parseUnits("117900", 6),
    "BUY 0.25 WBTC @ 117900"
  );
  await placeOrder(
    traders[4],
    0,
    wbtcAddr,
    usdtAddr,
    parseUnits("0.3", 6),
    parseUnits("117600", 6),
    "BUY 0.3 WBTC @ 117600"
  );

  // Sell orders (above market)
  await placeOrder(
    traders[0],
    1,
    wbtcAddr,
    usdtAddr,
    parseUnits("0.1", 6),
    parseUnits("121200", 6),
    "SELL 0.1 WBTC @ 121200"
  );
  await placeOrder(
    traders[1],
    1,
    wbtcAddr,
    usdtAddr,
    parseUnits("0.15", 6),
    parseUnits("121500", 6),
    "SELL 0.15 WBTC @ 121500"
  );
  await placeOrder(
    traders[2],
    1,
    wbtcAddr,
    usdtAddr,
    parseUnits("0.2", 6),
    parseUnits("121800", 6),
    "SELL 0.2 WBTC @ 121800"
  );
  await placeOrder(
    traders[3],
    1,
    wbtcAddr,
    usdtAddr,
    parseUnits("0.25", 6),
    parseUnits("122100", 6),
    "SELL 0.25 WBTC @ 122100"
  );
  await placeOrder(
    traders[4],
    1,
    wbtcAddr,
    usdtAddr,
    parseUnits("0.3", 6),
    parseUnits("122400", 6),
    "SELL 0.3 WBTC @ 122400"
  );
  console.log();

  // ========== EIGEN/USDC Pair (Mid price: ~1.08 USDC) ==========
  console.log("🟣 EIGEN/USDC Order Book");
  const eigenAddr = addresses.MockEIGEN;

  // Buy orders (below market)
  await placeOrder(
    traders[0],
    0,
    eigenAddr,
    usdcAddr,
    parseUnits("500", 6),
    parseUnits("1.064", 6),
    "BUY 500 EIGEN @ 1.064"
  );
  await placeOrder(
    traders[1],
    0,
    eigenAddr,
    usdcAddr,
    parseUnits("1000", 6),
    parseUnits("1.056", 6),
    "BUY 1000 EIGEN @ 1.056"
  );
  await placeOrder(
    traders[2],
    0,
    eigenAddr,
    usdcAddr,
    parseUnits("750", 6),
    parseUnits("1.048", 6),
    "BUY 750 EIGEN @ 1.048"
  );
  await placeOrder(
    traders[3],
    0,
    eigenAddr,
    usdcAddr,
    parseUnits("1500", 6),
    parseUnits("1.040", 6),
    "BUY 1500 EIGEN @ 1.040"
  );
  await placeOrder(
    traders[4],
    0,
    eigenAddr,
    usdcAddr,
    parseUnits("1200", 6),
    parseUnits("1.032", 6),
    "BUY 1200 EIGEN @ 1.032"
  );

  // Sell orders (above market)
  await placeOrder(
    traders[0],
    1,
    eigenAddr,
    usdcAddr,
    parseUnits("500", 6),
    parseUnits("1.096", 6),
    "SELL 500 EIGEN @ 1.096"
  );
  await placeOrder(
    traders[1],
    1,
    eigenAddr,
    usdcAddr,
    parseUnits("1000", 6),
    parseUnits("1.104", 6),
    "SELL 1000 EIGEN @ 1.104"
  );
  await placeOrder(
    traders[2],
    1,
    eigenAddr,
    usdcAddr,
    parseUnits("750", 6),
    parseUnits("1.112", 6),
    "SELL 750 EIGEN @ 1.112"
  );
  await placeOrder(
    traders[3],
    1,
    eigenAddr,
    usdcAddr,
    parseUnits("1500", 6),
    parseUnits("1.120", 6),
    "SELL 1500 EIGEN @ 1.120"
  );
  await placeOrder(
    traders[4],
    1,
    eigenAddr,
    usdcAddr,
    parseUnits("1200", 6),
    parseUnits("1.128", 6),
    "SELL 1200 EIGEN @ 1.128"
  );
  console.log();

  // ========== PEPE/USDT Pair (Mid price: ~0.000007022 USDT per PEPE) ==========
  console.log("🐸 PEPE/USDT Order Book");
  const pepeAddr = addresses.MockPEPE;

  // Buy orders (below market) - Using actual PEPE amounts with small decimals
  // Price: ~0.0000069 USDT per PEPE (buying PEPE with USDT)
  await placeOrder(
    traders[0],
    0,
    pepeAddr,
    usdtAddr,
    parseUnits("100", 6),
    parseSmallUnits("0.0000069"),
    "BUY 100 PEPE @ 0.0000069 USDT"
  );
  await placeOrder(
    traders[1],
    0,
    pepeAddr,
    usdtAddr,
    parseUnits("200", 6),
    parseSmallUnits("0.0000068"),
    "BUY 200 PEPE @ 0.0000068 USDT"
  );
  await placeOrder(
    traders[2],
    0,
    pepeAddr,
    usdtAddr,
    parseUnits("150", 6),
    parseSmallUnits("0.0000067"),
    "BUY 150 PEPE @ 0.0000067 USDT"
  );
  await placeOrder(
    traders[3],
    0,
    pepeAddr,
    usdtAddr,
    parseUnits("300", 6),
    parseSmallUnits("0.0000066"),
    "BUY 300 PEPE @ 0.0000066 USDT"
  );
  await placeOrder(
    traders[4],
    0,
    pepeAddr,
    usdtAddr,
    parseUnits("250", 6),
    parseSmallUnits("0.0000065"),
    "BUY 250 PEPE @ 0.0000065 USDT"
  );

  // Sell orders (above market)
  await placeOrder(
    traders[0],
    1,
    pepeAddr,
    usdtAddr,
    parseUnits("100", 6),
    parseSmallUnits("0.0000071"),
    "SELL 100 PEPE @ 0.0000071 USDT"
  );
  await placeOrder(
    traders[1],
    1,
    pepeAddr,
    usdtAddr,
    parseUnits("200", 6),
    parseSmallUnits("0.0000072"),
    "SELL 200 PEPE @ 0.0000072 USDT"
  );
  await placeOrder(
    traders[2],
    1,
    pepeAddr,
    usdtAddr,
    parseUnits("150", 6),
    parseSmallUnits("0.0000073"),
    "SELL 150 PEPE @ 0.0000073 USDT"
  );
  await placeOrder(
    traders[3],
    1,
    pepeAddr,
    usdtAddr,
    parseUnits("300", 6),
    parseSmallUnits("0.0000074"),
    "SELL 300 PEPE @ 0.0000074 USDT"
  );
  await placeOrder(
    traders[4],
    1,
    pepeAddr,
    usdtAddr,
    parseUnits("250", 6),
    parseSmallUnits("0.0000075"),
    "SELL 250 PEPE @ 0.0000075 USDT"
  );
  console.log();

  // ========== DAI/USDC Pair (Mid price: ~1.0 USDC) ==========
  console.log("💚 DAI/USDC Order Book");
  const daiAddr = addresses.MockDAI;

  // Buy orders (below market)
  await placeOrder(
    traders[0],
    0,
    daiAddr,
    usdcAddr,
    parseUnits("1000", 6),
    parseUnits("0.998", 6),
    "BUY 1000 DAI @ 0.998"
  );
  await placeOrder(
    traders[1],
    0,
    daiAddr,
    usdcAddr,
    parseUnits("2000", 6),
    parseUnits("0.997", 6),
    "BUY 2000 DAI @ 0.997"
  );
  await placeOrder(
    traders[2],
    0,
    daiAddr,
    usdcAddr,
    parseUnits("1500", 6),
    parseUnits("0.996", 6),
    "BUY 1500 DAI @ 0.996"
  );
  await placeOrder(
    traders[3],
    0,
    daiAddr,
    usdcAddr,
    parseUnits("3000", 6),
    parseUnits("0.995", 6),
    "BUY 3000 DAI @ 0.995"
  );
  await placeOrder(
    traders[4],
    0,
    daiAddr,
    usdcAddr,
    parseUnits("2500", 6),
    parseUnits("0.994", 6),
    "BUY 2500 DAI @ 0.994"
  );

  // Sell orders (above market)
  await placeOrder(
    traders[0],
    1,
    daiAddr,
    usdcAddr,
    parseUnits("1000", 6),
    parseUnits("1.002", 6),
    "SELL 1000 DAI @ 1.002"
  );
  await placeOrder(
    traders[1],
    1,
    daiAddr,
    usdcAddr,
    parseUnits("2000", 6),
    parseUnits("1.003", 6),
    "SELL 2000 DAI @ 1.003"
  );
  await placeOrder(
    traders[2],
    1,
    daiAddr,
    usdcAddr,
    parseUnits("1500", 6),
    parseUnits("1.004", 6),
    "SELL 1500 DAI @ 1.004"
  );
  await placeOrder(
    traders[3],
    1,
    daiAddr,
    usdcAddr,
    parseUnits("3000", 6),
    parseUnits("1.005", 6),
    "SELL 3000 DAI @ 1.005"
  );
  await placeOrder(
    traders[4],
    1,
    daiAddr,
    usdcAddr,
    parseUnits("2500", 6),
    parseUnits("1.006", 6),
    "SELL 2500 DAI @ 1.006"
  );
  console.log();

  // ========== USDC/USDT Pair (Reverse - Mid price: ~1.0 USDT) ==========
  console.log("💵 USDC/USDT Order Book");

  // Buy orders (below market)
  await placeOrder(
    traders[0],
    0,
    usdcAddr,
    usdtAddr,
    parseUnits("1000", 6),
    parseUnits("0.9995", 6),
    "BUY 1000 USDC @ 0.9995"
  );
  await placeOrder(
    traders[1],
    0,
    usdcAddr,
    usdtAddr,
    parseUnits("2000", 6),
    parseUnits("0.9990", 6),
    "BUY 2000 USDC @ 0.9990"
  );
  await placeOrder(
    traders[2],
    0,
    usdcAddr,
    usdtAddr,
    parseUnits("1500", 6),
    parseUnits("0.9985", 6),
    "BUY 1500 USDC @ 0.9985"
  );
  await placeOrder(
    traders[3],
    0,
    usdcAddr,
    usdtAddr,
    parseUnits("3000", 6),
    parseUnits("0.9980", 6),
    "BUY 3000 USDC @ 0.9980"
  );
  await placeOrder(
    traders[4],
    0,
    usdcAddr,
    usdtAddr,
    parseUnits("2500", 6),
    parseUnits("0.9975", 6),
    "BUY 2500 USDC @ 0.9975"
  );

  // Sell orders (above market)
  await placeOrder(
    traders[0],
    1,
    usdcAddr,
    usdtAddr,
    parseUnits("1000", 6),
    parseUnits("1.0005", 6),
    "SELL 1000 USDC @ 1.0005"
  );
  await placeOrder(
    traders[1],
    1,
    usdcAddr,
    usdtAddr,
    parseUnits("2000", 6),
    parseUnits("1.0010", 6),
    "SELL 2000 USDC @ 1.0010"
  );
  await placeOrder(
    traders[2],
    1,
    usdcAddr,
    usdtAddr,
    parseUnits("1500", 6),
    parseUnits("1.0015", 6),
    "SELL 1500 USDC @ 1.0015"
  );
  await placeOrder(
    traders[3],
    1,
    usdcAddr,
    usdtAddr,
    parseUnits("3000", 6),
    parseUnits("1.0020", 6),
    "SELL 3000 USDC @ 1.0020"
  );
  await placeOrder(
    traders[4],
    1,
    usdcAddr,
    usdtAddr,
    parseUnits("2500", 6),
    parseUnits("1.0025", 6),
    "SELL 2500 USDC @ 1.0025"
  );
  console.log();

  // ========== USDT/USDC Pair (Reverse - Mid price: ~1.0 USDC) ==========
  console.log("💵 USDT/USDC Order Book");

  // Buy orders (below market)
  await placeOrder(
    traders[0],
    0,
    usdtAddr,
    usdcAddr,
    parseUnits("1000", 6),
    parseUnits("0.9995", 6),
    "BUY 1000 USDT @ 0.9995"
  );
  await placeOrder(
    traders[1],
    0,
    usdtAddr,
    usdcAddr,
    parseUnits("2000", 6),
    parseUnits("0.9990", 6),
    "BUY 2000 USDT @ 0.9990"
  );
  await placeOrder(
    traders[2],
    0,
    usdtAddr,
    usdcAddr,
    parseUnits("1500", 6),
    parseUnits("0.9985", 6),
    "BUY 1500 USDT @ 0.9985"
  );
  await placeOrder(
    traders[3],
    0,
    usdtAddr,
    usdcAddr,
    parseUnits("3000", 6),
    parseUnits("0.9980", 6),
    "BUY 3000 USDT @ 0.9980"
  );
  await placeOrder(
    traders[4],
    0,
    usdtAddr,
    usdcAddr,
    parseUnits("2500", 6),
    parseUnits("0.9975", 6),
    "BUY 2500 USDT @ 0.9975"
  );

  // Sell orders (above market)
  await placeOrder(
    traders[0],
    1,
    usdtAddr,
    usdcAddr,
    parseUnits("1000", 6),
    parseUnits("1.0005", 6),
    "SELL 1000 USDT @ 1.0005"
  );
  await placeOrder(
    traders[1],
    1,
    usdtAddr,
    usdcAddr,
    parseUnits("2000", 6),
    parseUnits("1.0010", 6),
    "SELL 2000 USDT @ 1.0010"
  );
  await placeOrder(
    traders[2],
    1,
    usdtAddr,
    usdcAddr,
    parseUnits("1500", 6),
    parseUnits("1.0015", 6),
    "SELL 1500 USDT @ 1.0015"
  );
  await placeOrder(
    traders[3],
    1,
    usdtAddr,
    usdcAddr,
    parseUnits("3000", 6),
    parseUnits("1.0020", 6),
    "SELL 3000 USDT @ 1.0020"
  );
  await placeOrder(
    traders[4],
    1,
    usdtAddr,
    usdcAddr,
    parseUnits("2500", 6),
    parseUnits("1.0025", 6),
    "SELL 2500 USDT @ 1.0025"
  );
  console.log();

  // ========== USDC/WETH Pair (Reverse - Mid price: ~0.00025 WETH per USDC) ==========
  console.log("🔷 USDC/WETH Order Book (Reverse)");

  // Buy orders (buying USDC with WETH, below market = lower price)
  await placeOrder(
    traders[0],
    0,
    usdcAddr,
    wethAddr,
    parseUnits("4000", 6),
    parseUnits("0.000245", 6),
    "BUY 4000 USDC @ 0.000245 WETH each"
  );
  await placeOrder(
    traders[1],
    0,
    usdcAddr,
    wethAddr,
    parseUnits("8000", 6),
    parseUnits("0.000244", 6),
    "BUY 8000 USDC @ 0.000244 WETH each"
  );
  await placeOrder(
    traders[2],
    0,
    usdcAddr,
    wethAddr,
    parseUnits("6000", 6),
    parseUnits("0.000243", 6),
    "BUY 6000 USDC @ 0.000243 WETH each"
  );
  await placeOrder(
    traders[3],
    0,
    usdcAddr,
    wethAddr,
    parseUnits("10000", 6),
    parseUnits("0.000242", 6),
    "BUY 10000 USDC @ 0.000242 WETH each"
  );
  await placeOrder(
    traders[4],
    0,
    usdcAddr,
    wethAddr,
    parseUnits("7000", 6),
    parseUnits("0.000241", 6),
    "BUY 7000 USDC @ 0.000241 WETH each"
  );

  // Sell orders (selling USDC for WETH, above market = higher price)
  await placeOrder(
    traders[0],
    1,
    usdcAddr,
    wethAddr,
    parseUnits("4000", 6),
    parseUnits("0.000255", 6),
    "SELL 4000 USDC @ 0.000255 WETH each"
  );
  await placeOrder(
    traders[1],
    1,
    usdcAddr,
    wethAddr,
    parseUnits("8000", 6),
    parseUnits("0.000256", 6),
    "SELL 8000 USDC @ 0.000256 WETH each"
  );
  await placeOrder(
    traders[2],
    1,
    usdcAddr,
    wethAddr,
    parseUnits("6000", 6),
    parseUnits("0.000257", 6),
    "SELL 6000 USDC @ 0.000257 WETH each"
  );
  await placeOrder(
    traders[3],
    1,
    usdcAddr,
    wethAddr,
    parseUnits("10000", 6),
    parseUnits("0.000258", 6),
    "SELL 10000 USDC @ 0.000258 WETH each"
  );
  await placeOrder(
    traders[4],
    1,
    usdcAddr,
    wethAddr,
    parseUnits("7000", 6),
    parseUnits("0.000259", 6),
    "SELL 7000 USDC @ 0.000259 WETH each"
  );
  console.log();

  // ========== USDT/WBTC Pair (Reverse - Mid price: ~0.00000833 WBTC per USDT) ==========
  console.log("🟡 USDT/WBTC Order Book (Reverse)");

  // Buy orders (buying USDT with WBTC - want to pay LESS WBTC per USDT)
  // These should be BELOW the mid price - lower is better for buyers
  await placeOrder(
    traders[0],
    0,
    usdtAddr,
    wbtcAddr,
    parseUnits("12000", 6),
    parseSmallUnits("0.000008240",8), // Highest buy bid (closest to mid)
    "BUY 12000 USDT @ 0.000008240 WBTC each"
  );
  await placeOrder(
    traders[1],
    0,
    usdtAddr,
    wbtcAddr,
    parseUnits("18000", 6),
    parseSmallUnits("0.000008220",8),
    "BUY 18000 USDT @ 0.000008220 WBTC each"
  );
  await placeOrder(
    traders[2],
    0,
    usdtAddr,
    wbtcAddr,
    parseUnits("15000", 6),
    parseSmallUnits("0.000008200",8),
    "BUY 15000 USDT @ 0.000008200 WBTC each"
  );
  await placeOrder(
    traders[3],
    0,
    usdtAddr,
    wbtcAddr,
    parseUnits("25000", 6),
    parseSmallUnits("0.000008180",8),
    "BUY 25000 USDT @ 0.000008180 WBTC each"
  );
  await placeOrder(
    traders[4],
    0,
    usdtAddr,
    wbtcAddr,
    parseUnits("20000", 6),
    parseSmallUnits("0.000008160",8),
    "BUY 20000 USDT @ 0.000008160 WBTC each"
  );

  // Sell orders (selling USDT for WBTC - want MORE WBTC per USDT)
  // These should be ABOVE the mid price - higher is better for sellers
  await placeOrder(
    traders[0],
    1,
    usdtAddr,
    wbtcAddr,
    parseUnits("12000", 6),
    parseSmallUnits("0.000008420",8), // Lowest sell ask (closest to mid)
    "SELL 12000 USDT @ 0.000008420 WBTC each"
  );
  await placeOrder(
    traders[1],
    1,
    usdtAddr,
    wbtcAddr,
    parseUnits("18000", 6),
    parseSmallUnits("0.000008440",8),
    "SELL 18000 USDT @ 0.000008440 WBTC each"
  );
  await placeOrder(
    traders[2],
    1,
    usdtAddr,
    wbtcAddr,
    parseUnits("15000", 6),
    parseSmallUnits("0.000008460",8),
    "SELL 15000 USDT @ 0.000008460 WBTC each"
  );
  await placeOrder(
    traders[3],
    1,
    usdtAddr,
    wbtcAddr,
    parseUnits("25000", 6),
    parseSmallUnits("0.000008480",8),
    "SELL 25000 USDT @ 0.000008480 WBTC each"
  );
  await placeOrder(
    traders[4],
    1,
    usdtAddr,
    wbtcAddr,
    parseUnits("20000", 6),
    parseSmallUnits("0.000008500",8),
    "SELL 20000 USDT @ 0.000008500 WBTC each"
  );
  console.log();

  // ========== USDC/EIGEN Pair (Reverse - Mid price: ~0.926 EIGEN per USDC) ==========
  console.log("🟣 USDC/EIGEN Order Book (Reverse)");

  // Buy orders (buying USDC with EIGEN, below market = lower price)
  await placeOrder(
    traders[0],
    0,
    usdcAddr,
    eigenAddr,
    parseUnits("500", 6),
    parseUnits("0.913", 6),
    "BUY 500 USDC @ 0.913 EIGEN each"
  );
  await placeOrder(
    traders[1],
    0,
    usdcAddr,
    eigenAddr,
    parseUnits("1000", 6),
    parseUnits("0.906", 6),
    "BUY 1000 USDC @ 0.906 EIGEN each"
  );
  await placeOrder(
    traders[2],
    0,
    usdcAddr,
    eigenAddr,
    parseUnits("750", 6),
    parseUnits("0.899", 6),
    "BUY 750 USDC @ 0.899 EIGEN each"
  );
  await placeOrder(
    traders[3],
    0,
    usdcAddr,
    eigenAddr,
    parseUnits("1500", 6),
    parseUnits("0.893", 6),
    "BUY 1500 USDC @ 0.893 EIGEN each"
  );
  await placeOrder(
    traders[4],
    0,
    usdcAddr,
    eigenAddr,
    parseUnits("1200", 6),
    parseUnits("0.887", 6),
    "BUY 1200 USDC @ 0.887 EIGEN each"
  );

  // Sell orders (selling USDC for EIGEN, above market = higher price)
  await placeOrder(
    traders[0],
    1,
    usdcAddr,
    eigenAddr,
    parseUnits("500", 6),
    parseUnits("0.941", 6),
    "SELL 500 USDC @ 0.941 EIGEN each"
  );
  await placeOrder(
    traders[1],
    1,
    usdcAddr,
    eigenAddr,
    parseUnits("1000", 6),
    parseUnits("0.952", 6),
    "SELL 1000 USDC @ 0.952 EIGEN each"
  );
  await placeOrder(
    traders[2],
    1,
    usdcAddr,
    eigenAddr,
    parseUnits("750", 6),
    parseUnits("0.962", 6),
    "SELL 750 USDC @ 0.962 EIGEN each"
  );
  await placeOrder(
    traders[3],
    1,
    usdcAddr,
    eigenAddr,
    parseUnits("1500", 6),
    parseUnits("0.968", 6),
    "SELL 1500 USDC @ 0.968 EIGEN each"
  );
  await placeOrder(
    traders[4],
    1,
    usdcAddr,
    eigenAddr,
    parseUnits("1200", 6),
    parseUnits("0.971", 6),
    "SELL 1200 USDC @ 0.971 EIGEN each"
  );
  console.log();

  // ========== USDT/PEPE Pair (Reverse - Mid price: ~142450 PEPE per USDT) ==========
  console.log("🐸 USDT/PEPE Order Book (Reverse)");

  // Buy orders (buying USDT with PEPE, below market = lower price)
  // Price expressed as PEPE per 1 USDT
  await placeOrder(
    traders[0],
    0,
    usdtAddr,
    pepeAddr,
    parseUnits("3500", 6),
    parseUnits("139700", 6),
    "BUY 3500 USDT @ 139700 PEPE each"
  );
  await placeOrder(
    traders[1],
    0,
    usdtAddr,
    pepeAddr,
    parseUnits("5000", 6),
    parseUnits("137000", 6),
    "BUY 5000 USDT @ 137000 PEPE each"
  );
  await placeOrder(
    traders[2],
    0,
    usdtAddr,
    pepeAddr,
    parseUnits("4000", 6),
    parseUnits("134400", 6),
    "BUY 4000 USDT @ 134400 PEPE each"
  );
  await placeOrder(
    traders[3],
    0,
    usdtAddr,
    pepeAddr,
    parseUnits("7000", 6),
    parseUnits("131900", 6),
    "BUY 7000 USDT @ 131900 PEPE each"
  );
  await placeOrder(
    traders[4],
    0,
    usdtAddr,
    pepeAddr,
    parseUnits("5500", 6),
    parseUnits("129600", 6),
    "BUY 5500 USDT @ 129600 PEPE each"
  );

  // Sell orders (selling USDT for PEPE, above market = higher price)
  await placeOrder(
    traders[0],
    1,
    usdtAddr,
    pepeAddr,
    parseUnits("3500", 6),
    parseUnits("145200", 6),
    "SELL 3500 USDT @ 145200 PEPE each"
  );
  await placeOrder(
    traders[1],
    1,
    usdtAddr,
    pepeAddr,
    parseUnits("5000", 6),
    parseUnits("148500", 6),
    "SELL 5000 USDT @ 148500 PEPE each"
  );
  await placeOrder(
    traders[2],
    1,
    usdtAddr,
    pepeAddr,
    parseUnits("4000", 6),
    parseUnits("151500", 6),
    "SELL 4000 USDT @ 151500 PEPE each"
  );
  await placeOrder(
    traders[3],
    1,
    usdtAddr,
    pepeAddr,
    parseUnits("7000", 6),
    parseUnits("154800", 6),
    "SELL 7000 USDT @ 154800 PEPE each"
  );
  await placeOrder(
    traders[4],
    1,
    usdtAddr,
    pepeAddr,
    parseUnits("5500", 6),
    parseUnits("158200", 6),
    "SELL 5500 USDT @ 158200 PEPE each"
  );
  console.log();

  // ========== USDC/DAI Pair (Reverse - Mid price: ~1.0 DAI per USDC) ==========
  console.log("💚 USDC/DAI Order Book (Reverse)");

  // Buy orders (buying USDC with DAI, below market = lower price)
  await placeOrder(
    traders[0],
    0,
    usdcAddr,
    daiAddr,
    parseUnits("1000", 6),
    parseUnits("0.998", 6),
    "BUY 1000 USDC @ 0.998 DAI each"
  );
  await placeOrder(
    traders[1],
    0,
    usdcAddr,
    daiAddr,
    parseUnits("2000", 6),
    parseUnits("0.997", 6),
    "BUY 2000 USDC @ 0.997 DAI each"
  );
  await placeOrder(
    traders[2],
    0,
    usdcAddr,
    daiAddr,
    parseUnits("1500", 6),
    parseUnits("0.996", 6),
    "BUY 1500 USDC @ 0.996 DAI each"
  );
  await placeOrder(
    traders[3],
    0,
    usdcAddr,
    daiAddr,
    parseUnits("3000", 6),
    parseUnits("0.995", 6),
    "BUY 3000 USDC @ 0.995 DAI each"
  );
  await placeOrder(
    traders[4],
    0,
    usdcAddr,
    daiAddr,
    parseUnits("2500", 6),
    parseUnits("0.994", 6),
    "BUY 2500 USDC @ 0.994 DAI each"
  );

  // Sell orders (selling USDC for DAI, above market = higher price)
  await placeOrder(
    traders[0],
    1,
    usdcAddr,
    daiAddr,
    parseUnits("1000", 6),
    parseUnits("1.002", 6),
    "SELL 1000 USDC @ 1.002 DAI each"
  );
  await placeOrder(
    traders[1],
    1,
    usdcAddr,
    daiAddr,
    parseUnits("2000", 6),
    parseUnits("1.003", 6),
    "SELL 2000 USDC @ 1.003 DAI each"
  );
  await placeOrder(
    traders[2],
    1,
    usdcAddr,
    daiAddr,
    parseUnits("1500", 6),
    parseUnits("1.004", 6),
    "SELL 1500 USDC @ 1.004 DAI each"
  );
  await placeOrder(
    traders[3],
    1,
    usdcAddr,
    daiAddr,
    parseUnits("3000", 6),
    parseUnits("1.005", 6),
    "SELL 3000 USDC @ 1.005 DAI each"
  );
  await placeOrder(
    traders[4],
    1,
    usdcAddr,
    daiAddr,
    parseUnits("2500", 6),
    parseUnits("1.006", 6),
    "SELL 2500 USDC @ 1.006 DAI each"
  );
  console.log();

  // Summary
  console.log("✅ Order book seeding complete!");
  console.log("\n📊 Summary:");
  console.log(
    "  - 12 trading pairs populated (6 base pairs + 6 reverse pairs)"
  );
  console.log("\n✅ Order Book Seeding Complete!");
  console.log("  - Total: 120 orders created");
  console.log("  - All orders non-intersecting (no immediate fills)");
  console.log("  - Realistic market spreads maintained");
  console.log("\n🎯 Trading pairs ready:");
  console.log("  Base pairs:");
  console.log("    - WETH/USDC (~$4,000)");
  console.log("    - WBTC/USDT (~$120,000)");
  console.log("    - EIGEN/USDC (~$1.08)");
  console.log("    - PEPE/USDT (~$0.000007022 or ~$7.02 per 1M)");
  console.log("    - DAI/USDC (~$1.00)");
  console.log("    - USDC/USDT (~$1.00)");
  console.log("  Reverse pairs:");
  console.log("    - USDC/WETH");
  console.log("    - USDT/WBTC");
  console.log("    - USDC/EIGEN");
  console.log("    - USDT/PEPE");
  console.log("    - USDC/DAI");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
