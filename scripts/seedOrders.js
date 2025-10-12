const hre = require("hardhat");
const { ethers } = hre;
const getAddresses = require("./addresses");
const { exit } = require("process");

async function main() {
  const { MockUSDT, MockUSDC, Dex } = getAddresses();
  const [deployer, alice, bob] = await ethers.getSigners();

  // log the addresses and balances of USDT, USDC
  
  const usdt = await ethers.getContractAt("MockStablecoin", MockUSDT);
  const usdc = await ethers.getContractAt("MockStablecoin", MockUSDC);
  const dex  = await ethers.getContractAt("Dex", Dex);
  const dexAddr = dex.target ?? dex.address;
  
  console.log("User addresses:", { alice: alice.address, bob: bob.address });
  console.log("Deployed contracts:", { MockUSDT, MockUSDC, Dex });
  console.log("User balances:");
  console.log("Alice USDT:", ethers.formatUnits(await usdt.balanceOf(alice.address), 6));
  console.log("Bob   USDT:", ethers.formatUnits(await usdt.balanceOf(bob.address), 6));
  console.log("Alice USDC:", ethers.formatUnits(await usdc.balanceOf(alice.address), 6));
  console.log("Bob   USDC:", ethers.formatUnits(await usdc.balanceOf(bob.address), 6));
  
  // Approve the DEX to spend users' tokens
  await (await usdt.connect(alice).approve(dexAddr, ethers.MaxUint256)).wait();
  await (await usdc.connect(alice).approve(dexAddr, ethers.MaxUint256)).wait();
  await (await usdt.connect(bob).approve(dexAddr, ethers.MaxUint256)).wait();
  await (await usdc.connect(bob).approve(dexAddr, ethers.MaxUint256)).wait();
  
  const base  = MockUSDT; 
  const quote = MockUSDC;
  
  // 1) Bob sell 100 USDT @ 1.05 USDC
  await (await dex.connect(bob).placeLimit(1, base, quote, ethers.parseUnits("100", 6), ethers.parseUnits("1.05", 6))).wait();
  
  // 2) Alice buy 60 USDT @ 1.10 USDC (Should eat Bob's sell order at 1.05)
  await (await dex.connect(alice).placeLimit(0, base, quote, ethers.parseUnits("60", 6), ethers.parseUnits("1.10", 6))).wait();
  
  // 3) Alice buy 50 USDT @ 1.04 USDC (Should go to order book, no match)
  await (await dex.connect(alice).placeLimit(0, base, quote, ethers.parseUnits("50", 6), ethers.parseUnits("1.04", 6))).wait();

  // 4) Bob sell 30 USDT @ 1.02 (Should eat 1.04 buy order, match at 1.02)
  await (await dex.connect(bob).placeLimit(1, base, quote, ethers.parseUnits("30", 6), ethers.parseUnits("1.02", 6))).wait();
  
  // Check the order book
  const [buys, sells] = await dex.getList(base, quote);
  console.log("BUY book ids:", buys.map(x => x.toString()));
  console.log("SELL book ids:", sells.map(x => x.toString()));
  
  // Final balances
  console.log("Final User balances:");
  console.log("Alice USDT:", ethers.formatUnits(await usdt.balanceOf(alice.address), 6));
  console.log("Bob   USDT:", ethers.formatUnits(await usdt.balanceOf(bob.address), 6));
  console.log("Alice USDC:", ethers.formatUnits(await usdc.balanceOf(alice.address), 6));
  console.log("Bob   USDC:", ethers.formatUnits(await usdc.balanceOf(bob.address), 6));
}
main().catch((e) => (console.error(e), process.exit(1)));
