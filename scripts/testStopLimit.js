// scripts/testStopLimit.js
const hre = require("hardhat");
const { ethers } = hre;
const getAddresses = require("./addresses");

async function main() {
  const {
    Dex,
    MockUSDT,
    MockUSDC,
  } = getAddresses();

  const [deployer, alice, bob, carol] = await ethers.getSigners();

  const dex  = await ethers.getContractAt("Dex", Dex);
  const usdt = await ethers.getContractAt("Token", MockUSDT);
  const usdc = await ethers.getContractAt("Token", MockUSDC);

  const dexAddr = dex.target ?? dex.address;

  console.log("== Addresses ==");
  console.log({ Dex: dexAddr, MockUSDT, MockUSDC });
  console.log("== Users ==");
  console.log({ alice: alice.address, bob: bob.address, carol: carol.address });

  const u6  = (x) => ethers.parseUnits(x, 6);
  const fmt = (x) => ethers.formatUnits(x, 6);

  // Approve DEX to spend tokens for each user involved
  await (await usdt.connect(carol).approve(dexAddr, ethers.MaxUint256)).wait();
  await (await usdt.connect(bob).approve(dexAddr, ethers.MaxUint256)).wait();
  await (await usdc.connect(alice).approve(dexAddr, ethers.MaxUint256)).wait();

  const bal = async (token, who) => fmt(await token.balanceOf(who));
  console.log("\n== Balances BEFORE ==");
  console.log("Alice:", "USDT", await bal(usdt, alice.address), "USDC", await bal(usdc, alice.address));
  console.log("Bob:  ", "USDT", await bal(usdt, bob.address),   "USDC", await bal(usdc, bob.address));
  console.log("Carol:", "USDT", await bal(usdt, carol.address), "USDC", await bal(usdc, carol.address));

  // Carol places a normal SELL to give us a low trade price: SELL 50 USDT -> USDC @ 0.98 | Action_Type = 1 (SELL)
  const carolSellTx = await dex
    .connect(carol)
    .placeLimit(
      1,
      MockUSDT,        // base
      MockUSDC,        // quote
      u6("50"),        // amount in base
      u6("0.98")       // price in quote/base
    );
  await carolSellTx.wait();
  console.log("\nCarol placed SELL USDT->USDC @ 0.98, amount=50");

  // Bob: stop SELL USDT -> USDC - amount: 100 - stopPrice: 0.99 - limitPrice: 0.985
  // When the last tradePrice <= 0.99, Bob's stop is triggered and becomes a normal SELL 100 USDT -> USDC @0.985
  const stopId = await dex.nextStopOrderId();
  const bobStopTx = await dex
    .connect(bob)
    .placeStopLimit(
      1,             // SELL
      MockUSDT,
      MockUSDC,
      u6("100"),
      u6("0.99"),
      u6("0.985")
    );
  await bobStopTx.wait();
  console.log("Bob placed STOP-LIMIT SELL id =", stopId.toString());


  // Alice: BUY 150 USDT -> USDC @ 1.00
  // (1) Alice will first take Carol's SELL 50 @0.98
  // (2) Then the tradePrice becomes 0.98 which is <= Bob's stopPrice 0.99, so Bob's stop is triggered
  // (3) Bob's stop becomes a normal SELL 100 @0.985
  // (4) Alice still has 100 to buy at 1.00, which can take Bob's 0.985
  const aliceBuyTx = await dex
    .connect(alice)
    .placeLimit(
      0,         
      MockUSDT,
      MockUSDC,
      u6("150"),
      u6("1.00")
    );
  const aliceRc = await aliceBuyTx.wait();
  console.log("Alice placed BUY USDT->USDC @1.00, amount=150");

  // Parse events from Alice's transaction receipt to find StopLimitTriggered
  const parsedLogs = aliceRc.logs
    .map((l) => {
      try { return dex.interface.parseLog(l); } catch { return null; }
    })
    .filter(Boolean);

  const triggeredEvt = parsedLogs.find((e) => e.name === "StopLimitTriggered");
  if (triggeredEvt) {
    console.log("\nStopLimitTriggered event:");
    console.log({
      stopId: triggeredEvt.args.id.toString(),
      newOrderId: triggeredEvt.args.newOrderId.toString(),
    });
  } else {
    console.log("\n[WARN] StopLimitTriggered event not found (check price logic)");
  }

  console.log("\n== Balances AFTER ==");
  console.log("Alice:", "USDT", await bal(usdt, alice.address), "USDC", await bal(usdc, alice.address));
  console.log("Bob:  ", "USDT", await bal(usdt, bob.address),   "USDC", await bal(usdc, bob.address));
  console.log("Carol:", "USDT", await bal(usdt, carol.address), "USDC", await bal(usdc, carol.address));

  const so = await dex.stopOrders(stopId);
  console.log("\n== Stop order state ==");
  console.log({
    id: so.id.toString(),
    trader: so.trader,
    action: so.action === 0 ? "BUY" : "SELL",
    base: so.base,
    quote: so.quote,
    amount: fmt(so.amount),
    stopPrice: fmt(so.stopPrice),
    limitPrice: fmt(so.limitPrice),
    active: so.active,
    triggered: so.triggered,
  });

  // The triggered stop order id = current nextOrderId - 1 => Check the real order that was created by the trigger
  const nextOrderId = await dex.nextOrderId();
  const triggeredOrderId = nextOrderId - 1n;
  const realOrder = await dex.orders(triggeredOrderId);
  console.log("\n== Triggered real order ==");
  console.log({
    id: triggeredOrderId.toString(),
    trader: realOrder.trader,
    action: realOrder.action === 0 ? "BUY" : "SELL",
    amount: fmt(realOrder.amount),
    filled: fmt(realOrder.filled),
    price: fmt(realOrder.price),
    active: realOrder.active,
  });

  const [buyIds, sellIds] = await dex.getList(MockUSDT, MockUSDC);
  console.log("\nOrderbook USDT/USDC BUY ids:", buyIds.map(x => x.toString()));
  console.log("Orderbook USDT/USDC SELL ids:", sellIds.map(x => x.toString()));

  console.log("\nStop-limit test finished.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
