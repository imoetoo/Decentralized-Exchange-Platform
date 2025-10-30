// Trading pairs data - represents different token pairs that can be traded on the DEX
export const tradingPairs = [
  {
    title: "USDC/USDT",
    provider: "Trade USDC against USDT",
    baseToken: "USDC",
    quoteToken: "USDT",
  },
  {
    title: "WETH/USDC",
    provider: "Trade WETH against USDC",
    baseToken: "WETH",
    quoteToken: "USDC",
  },
  {
    title: "WBTC/USDT",
    provider: "Trade WBTC against USDT",
    baseToken: "WBTC",
    quoteToken: "USDT",
  },
  {
    title: "EIGEN/USDC",
    provider: "Trade EIGEN against USDC",
    baseToken: "EIGEN",
    quoteToken: "USDC",
  },
  {
    title: "PEPE/USDT",
    provider: "Trade PEPE against USDT",
    baseToken: "PEPE",
    quoteToken: "USDT",
  },
  {
    title: "DAI/USDC",
    provider: "Trade DAI against USDC",
    baseToken: "DAI",
    quoteToken: "USDC",
  },
];

// Backward compatibility export
export const tokenListings = tradingPairs;
