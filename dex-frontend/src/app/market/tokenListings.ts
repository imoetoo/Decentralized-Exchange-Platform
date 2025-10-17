// Trading pairs data - represents different token pairs that can be traded on the DEX
export const tradingPairs = [
  {
    title: "USDT/USDC",
    provider: "Trade USDT against USDC",
    baseToken: "USDT",
    quoteToken: "USDC",
  },
  {
    title: "USDC/USDT",
    provider: "Trade USDC against USDT",
    baseToken: "USDC",
    quoteToken: "USDT",
  },
];

// Backward compatibility export
export const tokenListings = tradingPairs;
