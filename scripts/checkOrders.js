/**
 * This file checks the orders placed on the DEX for USDT/USDC pair.
 */

// const { ethers } = require("hardhat");

// async function main() {
//   // Get deployed contract addresses
//   const USDT_ADDRESS = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
//   const USDC_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
//   const DEX_ADDRESS = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";

//   // Get contract instance
//   const Dex = await ethers.getContractAt("Dex", DEX_ADDRESS);

//   console.log("\n=== Checking DEX Orders ===\n");

//   // Get order lists for USDT/USDC pair
//   console.log("Getting order lists for USDT/USDC...");
//   const [buyOrderIds, sellOrderIds] = await Dex.getList(
//     USDT_ADDRESS,
//     USDC_ADDRESS
//   );

//   console.log(
//     `\nBuy Order IDs: ${
//       buyOrderIds.length > 0 ? buyOrderIds.toString() : "None"
//     }`
//   );
//   console.log(
//     `Sell Order IDs: ${
//       sellOrderIds.length > 0 ? sellOrderIds.toString() : "None"
//     }`
//   );

//   // Fetch details for each buy order
//   if (buyOrderIds.length > 0) {
//     console.log("\n--- Buy Orders ---");
//     for (const id of buyOrderIds) {
//       const order = await Dex.orders(id);
//       console.log(`\nOrder ID: ${order.id}`);
//       console.log(`  Trader: ${order.trader}`);
//       console.log(`  Action: ${order.action === 0 ? "BUY" : "SELL"}`);
//       console.log(`  Amount: ${ethers.formatUnits(order.amount, 6)} USDT`);
//       console.log(`  Filled: ${ethers.formatUnits(order.filled, 6)} USDT`);
//       console.log(
//         `  Price: ${ethers.formatUnits(order.price, 6)} USDC per USDT`
//       );
//       console.log(`  Active: ${order.active}`);
//       console.log(
//         `  Timestamp: ${new Date(Number(order.ts) * 1000).toLocaleString()}`
//       );
//     }
//   }

//   // Fetch details for each sell order
//   if (sellOrderIds.length > 0) {
//     console.log("\n--- Sell Orders ---");
//     for (const id of sellOrderIds) {
//       const order = await Dex.orders(id);
//       console.log(`\nOrder ID: ${order.id}`);
//       console.log(`  Trader: ${order.trader}`);
//       console.log(`  Action: ${order.action === 0 ? "BUY" : "SELL"}`);
//       console.log(`  Amount: ${ethers.formatUnits(order.amount, 6)} USDT`);
//       console.log(`  Filled: ${ethers.formatUnits(order.filled, 6)} USDT`);
//       console.log(
//         `  Price: ${ethers.formatUnits(order.price, 6)} USDC per USDT`
//       );
//       console.log(`  Active: ${order.active}`);
//       console.log(
//         `  Timestamp: ${new Date(Number(order.ts) * 1000).toLocaleString()}`
//       );
//     }
//   }

//   // Also check USDC/USDT pair (reverse)
//   console.log("\n\nGetting order lists for USDC/USDT...");
//   const [buyOrderIds2, sellOrderIds2] = await Dex.getList(
//     USDC_ADDRESS,
//     USDT_ADDRESS
//   );

//   console.log(
//     `\nBuy Order IDs: ${
//       buyOrderIds2.length > 0 ? buyOrderIds2.toString() : "None"
//     }`
//   );
//   console.log(
//     `Sell Order IDs: ${
//       sellOrderIds2.length > 0 ? sellOrderIds2.toString() : "None"
//     }`
//   );

//   console.log("\n");
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

const hre = require("hardhat");
const { ethers } = hre;
const getAddresses = require("./addresses");

async function main() {
  const addressesMap = getAddresses();
  if (!addressesMap.Dex) {
    throw new Error("Dex address not found in addresses()");
  }

  const Dex = await ethers.getContractAt("Dex", addressesMap.Dex);
  const erc20Abi = [
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
  ];

  // Collect all token addresses, here k for key and v for address
  const tokenEntries = Object.entries(addressesMap)
    .filter(([k]) => k.startsWith("Mock")) // "MockUSDT": "0x..."
    .map(([k, v]) => [v, k.replace("Mock", "")]); // [addr, "USDT"]

  if (tokenEntries.length === 0) {
    throw new Error("No mock tokens found in addresses()");
  }

  // Query each token's symbol/decimals
  const tokenMeta = {};
  for (const [addr, fallbackSym] of tokenEntries) {
    const t = await ethers.getContractAt(erc20Abi, addr);
    // Use on-chain symbol as the reference (expected to match fallbackSym)
    const [symbol, decimals] = await Promise.all([t.symbol(), t.decimals()]);
    tokenMeta[addr] = { symbol, decimals: Number(decimals) };
  }

  console.log("\n=== Checking DEX OrderBooks for all token pairs ===\n");

  // Construct all the order_pair keys
  const tokenAddrs = tokenEntries.map(([addr]) => addr);

  for (const base of tokenAddrs) {
    for (const quote of tokenAddrs) {
      if (base === quote) continue;

      const baseMeta = tokenMeta[base];
      const quoteMeta = tokenMeta[quote];

      // Retrieve the orders
      const [buyIds, sellIds] = await Dex.getList(base, quote);
      const hasAny = buyIds.length > 0 || sellIds.length > 0;
      if (!hasAny) continue;

      console.log(
        `\n===== Pair ${baseMeta.symbol}/${quoteMeta.symbol} =====`
      );

      // Print buy order
      if (buyIds.length > 0) {
        console.log("\n--- Buy Orders ---");
        for (const id of buyIds) {
          const o = await Dex.orders(id);
          const amt = ethers.formatUnits(o.amount, baseMeta.decimals);
          const fil = ethers.formatUnits(o.filled, baseMeta.decimals);
          const px = ethers.formatUnits(o.price, 6);
          const ts = new Date(Number(o.ts) * 1000).toLocaleString();

          console.log(`Order ID: ${o.id}`);
          console.log(`  Trader : ${o.trader}`);
          console.log(`  Action : ${o.action === 0 ? "BUY" : "SELL"}`);
          console.log(`  Amount : ${amt} ${baseMeta.symbol}`);
          console.log(`  Filled : ${fil} ${baseMeta.symbol}`);
          console.log(`  Price  : ${px} ${quoteMeta.symbol} per ${baseMeta.symbol}`);
          console.log(`  Active : ${o.active}`);
          console.log(`  Time   : ${ts}\n`);
        }
      } else {
        console.log("\n--- Buy Orders ---\nNone");
      }

      // Print sell order
      if (sellIds.length > 0) {
        console.log("\n--- Sell Orders ---");
        for (const id of sellIds) {
          const o = await Dex.orders(id);
          const amt = ethers.formatUnits(o.amount, baseMeta.decimals);
          const fil = ethers.formatUnits(o.filled, baseMeta.decimals);
          const px = ethers.formatUnits(o.price, 6);
          const ts = new Date(Number(o.ts) * 1000).toLocaleString();

          console.log(`Order ID: ${o.id}`);
          console.log(`  Trader : ${o.trader}`);
          console.log(`  Action : ${o.action === 0 ? "BUY" : "SELL"}`);
          console.log(`  Amount : ${amt} ${baseMeta.symbol}`);
          console.log(`  Filled : ${fil} ${baseMeta.symbol}`);
          console.log(`  Price  : ${px} ${quoteMeta.symbol} per ${baseMeta.symbol}`);
          console.log(`  Active : ${o.active}`);
          console.log(`  Time   : ${ts}\n`);
        }
      } else {
        console.log("\n--- Sell Orders ---\nNone");
      }
    }
  }

  console.log("\n✅ Done.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
