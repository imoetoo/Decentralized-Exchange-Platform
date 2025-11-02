// scripts/testBatchExecution.js
const hre = require("hardhat");
const { ethers } = hre;
const getAddresses = require("./addresses");
const { parse } = require("path");

async function main() {
  const {
    Dex,
    MockUSDT,
    MockUSDC,
    MockDAI,
  } = getAddresses();

  const [deployer, alice, bob, carol] = await ethers.getSigners();

  const dex  = await ethers.getContractAt("Dex", Dex);
  const usdt = await ethers.getContractAt("Token", MockUSDT);
  const usdc = await ethers.getContractAt("Token", MockUSDC);
  const dai  = await ethers.getContractAt("Token", MockDAI);

  const dexAddr = dex.target ?? dex.address;

  console.log("== Addresses ==");
  console.log({ Dex: dexAddr, MockUSDT, MockUSDC, MockDAI });
  console.log("== Users ==");
  console.log({ alice: alice.address, bob: bob.address, carol: carol.address });

  // Approve DEX to spend tokens for each user involved in the batch
  // Bob:   SELL USDT -> USDC
  await (await usdt.connect(bob).approve(dexAddr, ethers.MaxUint256)).wait();
  // Carol: SELL USDC -> DAI
  await (await usdc.connect(carol).approve(dexAddr, ethers.MaxUint256)).wait();
  // Alice: SELL DAI  -> USDT
  await (await dai.connect(alice).approve(dexAddr, ethers.MaxUint256)).wait();

  // Precision 6 decimals for all stablecoins
  const p = (x) => ethers.parseUnits(x, 6);     // price helper
  const u6 = (x) => ethers.parseUnits(x, 6);    // amount helper

  // Construct the circular SELL orders:
  // 1) Bob:   SELL  USDT -> USDC  @ 1.02
  // 2) Carol: SELL  USDC -> DAI   @ 1.00
  // 3) Alice: SELL  DAI  -> USDT  @ 1.00
  
  // Here just for testing we place the orders sequentially and record their IDs to use the Batch execution function in the contract.
  const id1 = await dex.nextOrderId();               
  await (await dex.connect(bob).placeLimit(1, MockUSDT, MockUSDC, u6("500"), p("1.02"))).wait();

  const id2 = (await dex.nextOrderId());
  await (await dex.connect(carol).placeLimit(1, MockUSDC, MockDAI, u6("600"), p("1.00"))).wait();

  const id3 = (await dex.nextOrderId());
  await (await dex.connect(alice).placeLimit(1, MockDAI, MockUSDT, u6("700"), p("1.00"))).wait();

  const orderIds = [id1, id2, id3].map(n => n.toString());
  console.log("Placed SELL order ids (circular):", orderIds.join(" -> "));

  // Choose a reasonable amountInFirst to execute the batch, now just for testing (usually it should be decided off-chain by some mechanism)
  const amountInFirst = u6("600"); // 600 USDT

  // Print balances before execution
  const fmt = (x) => ethers.formatUnits(x, 6);
  const bal = async (token, who) => fmt(await token.balanceOf(who));
  console.log("\n== Balances BEFORE ==");
  console.log("Alice: USDT", await bal(usdt, alice.address), "USDC", await bal(usdc, alice.address), "DAI", await bal(dai, alice.address));
  console.log("Bob:   USDT", await bal(usdt, bob.address),   "USDC", await bal(usdc, bob.address),   "DAI", await bal(dai, bob.address));
  console.log("Carol: USDT", await bal(usdt, carol.address), "USDC", await bal(usdc, carol.address), "DAI", await bal(dai, carol.address));

  console.log("\nExecuting batch with amountInFirst =", fmt(amountInFirst), "USDT");
  const tx = await dex.executeBatch(orderIds, amountInFirst);
  const rc = await tx.wait();

  // Find and print BatchExecuted event
  const evt = rc.logs
    .map((l) => {
      try { return dex.interface.parseLog(l); } catch { return null; }
    })
    .filter(Boolean)
    .find((parsed) => parsed.name === "BatchExecuted");
  if (evt) {
    console.log("BatchExecuted:", {
      orderIds: evt.args.orderIds.map(x => x.toString()),
      amountInFirst: fmt(evt.args.amountInFirst),
    });
  } else {
    console.log("BatchExecuted event not found (still fine if tx succeeded).");
  }

  console.log("\n== Balances AFTER ==");
  console.log("Alice: USDT", await bal(usdt, alice.address), "USDC", await bal(usdc, alice.address), "DAI", await bal(dai, alice.address));
  console.log("Bob:   USDT", await bal(usdt, bob.address),   "USDC", await bal(usdc, bob.address),   "DAI", await bal(dai, bob.address));
  console.log("Carol: USDT", await bal(usdt, carol.address), "USDC", await bal(usdc, carol.address), "DAI", await bal(dai, carol.address));

  // Function to read and format order details
  const showOrder = async (id) => {
    const o = await dex.orders(id);
    return {
      id: id.toString(),
      trader: o.trader.toLowerCase() === alice.address.toLowerCase() ? "Alice"
            : o.trader.toLowerCase() === bob.address.toLowerCase()   ? "Bob"
            : o.trader.toLowerCase() === carol.address.toLowerCase() ? "Carol"
            : "Unknown",
      action: o.action === 0 ? "BUY" : "SELL",
      base: o.base,
      quote: o.quote,
      amount: fmt(o.amount),
      filled: fmt(o.filled),
      price: fmt(o.price),
      active: o.active,
    };
  };

  // Read and print order details after execution (Only the three involved orders)
  console.log("\n== Orders AFTER ==");
  console.table([
    await showOrder(id1),
    await showOrder(id2),
    await showOrder(id3),
  ]);

  // Print orderbook SELL ids for the three trading pairs involved
  const [buyIds, sellIds] = await dex.getList(MockUSDT, MockUSDC);
  const [, sell2] = await dex.getList(MockUSDC, MockDAI);
  const [, sell3] = await dex.getList(MockDAI, MockUSDT);
  console.log("\nOrderbook USDT/USDC SELL ids:", sellIds.map(x => x.toString()));
  console.log("Orderbook USDC/DAI SELL ids:", sell2.map(x => x.toString()));
  console.log("Orderbook DAI/USDT SELL ids:", sell3.map(x => x.toString()));

  console.log("\n Batch execution test completed.");
}

main().catch((e) => (console.error(e), process.exit(1)));
