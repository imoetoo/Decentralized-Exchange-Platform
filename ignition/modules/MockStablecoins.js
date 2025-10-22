import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MockStablecoinsModule", (m) => {
  const specs = [
    { name: "Mock Tether USD",   symbol: "USDT" },
    { name: "Mock USD Coin",     symbol: "USDC" },
    { name: "Mock DAI",          symbol: "DAI"  },
    { name: "Mock Binance USD",  symbol: "BUSD" },
    { name: "Mock TrueUSD",      symbol: "TUSD" },
    { name: "Mock Wrapped Bitcoin",   symbol: "WBTC" },
    { name: "Mock Wrapped Ether", symbol: "WETH" },
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

  return deployed; // { USDT, USDC, DAI, BUSD, TUSD, USDP, FDUSD, ... }
});