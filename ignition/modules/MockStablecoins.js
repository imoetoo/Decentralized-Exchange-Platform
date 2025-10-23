import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MockStablecoinsModule", (m) => {
  const specs = [
    { name: "Mock Tether USD",   symbol: "USDT" },
    { name: "Mock USD Coin",     symbol: "USDC" },
    { name: "Mock DAI",          symbol: "DAI"  },
    { name: "Mock PEPE",  symbol: "PEPE" },
    { name: "Mock Wrapped Bitcoin",      symbol: "WBTC" },
    { name: "Mock Wrapped Ethereum",   symbol: "WETH" },
    { name: "Mock EIGEN", symbol: "EIGEN" },
  ];

  const deployed = {};
  for (const s of specs) {
    const id = `Mock${s.symbol}`;
    deployed[s.symbol] = m.contract(
      "MockStablecoin",
      [s.name, s.symbol, 6],
      { id }
    );
  }

  return deployed; // { USDT, USDC, DAI, PEPE, WBTC, WETH, EIGEN, ... }
});