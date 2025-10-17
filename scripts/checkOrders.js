/**
 * This file checks the orders placed on the DEX for USDT/USDC pair.
 */

const { ethers } = require("hardhat");

async function main() {
  // Get deployed contract addresses
  const USDT_ADDRESS = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
  const USDC_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
  const DEX_ADDRESS = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";

  // Get contract instance
  const Dex = await ethers.getContractAt("Dex", DEX_ADDRESS);

  console.log("\n=== Checking DEX Orders ===\n");

  // Get order lists for USDT/USDC pair
  console.log("Getting order lists for USDT/USDC...");
  const [buyOrderIds, sellOrderIds] = await Dex.getList(
    USDT_ADDRESS,
    USDC_ADDRESS
  );

  console.log(
    `\nBuy Order IDs: ${
      buyOrderIds.length > 0 ? buyOrderIds.toString() : "None"
    }`
  );
  console.log(
    `Sell Order IDs: ${
      sellOrderIds.length > 0 ? sellOrderIds.toString() : "None"
    }`
  );

  // Fetch details for each buy order
  if (buyOrderIds.length > 0) {
    console.log("\n--- Buy Orders ---");
    for (const id of buyOrderIds) {
      const order = await Dex.orders(id);
      console.log(`\nOrder ID: ${order.id}`);
      console.log(`  Trader: ${order.trader}`);
      console.log(`  Action: ${order.action === 0 ? "BUY" : "SELL"}`);
      console.log(`  Amount: ${ethers.formatUnits(order.amount, 6)} USDT`);
      console.log(`  Filled: ${ethers.formatUnits(order.filled, 6)} USDT`);
      console.log(
        `  Price: ${ethers.formatUnits(order.price, 6)} USDC per USDT`
      );
      console.log(`  Active: ${order.active}`);
      console.log(
        `  Timestamp: ${new Date(Number(order.ts) * 1000).toLocaleString()}`
      );
    }
  }

  // Fetch details for each sell order
  if (sellOrderIds.length > 0) {
    console.log("\n--- Sell Orders ---");
    for (const id of sellOrderIds) {
      const order = await Dex.orders(id);
      console.log(`\nOrder ID: ${order.id}`);
      console.log(`  Trader: ${order.trader}`);
      console.log(`  Action: ${order.action === 0 ? "BUY" : "SELL"}`);
      console.log(`  Amount: ${ethers.formatUnits(order.amount, 6)} USDT`);
      console.log(`  Filled: ${ethers.formatUnits(order.filled, 6)} USDT`);
      console.log(
        `  Price: ${ethers.formatUnits(order.price, 6)} USDC per USDT`
      );
      console.log(`  Active: ${order.active}`);
      console.log(
        `  Timestamp: ${new Date(Number(order.ts) * 1000).toLocaleString()}`
      );
    }
  }

  // Also check USDC/USDT pair (reverse)
  console.log("\n\nGetting order lists for USDC/USDT...");
  const [buyOrderIds2, sellOrderIds2] = await Dex.getList(
    USDC_ADDRESS,
    USDT_ADDRESS
  );

  console.log(
    `\nBuy Order IDs: ${
      buyOrderIds2.length > 0 ? buyOrderIds2.toString() : "None"
    }`
  );
  console.log(
    `Sell Order IDs: ${
      sellOrderIds2.length > 0 ? sellOrderIds2.toString() : "None"
    }`
  );

  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
