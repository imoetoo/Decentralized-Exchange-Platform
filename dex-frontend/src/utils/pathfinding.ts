/**
 * Pathfinding utilities for finding optimal trading routes in the DEX
 * Uses Dijkstra's algorithm to find the cheapest path between token pairs
 */

import { formatUnits, parseUnits } from "viem";
import {
  USDT_ADDRESS,
  USDC_ADDRESS,
  DAI_ADDRESS,
  EIGEN_ADDRESS,
  PEPE_ADDRESS,
  WBTC_ADDRESS,
  WETH_ADDRESS,
  PRICE_PRECISION,
  STABLECOIN_DECIMALS,
} from "@/constants";

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
}

export interface TradingPair {
  baseToken: string;
  quoteToken: string;
  baseSymbol: string;
  quoteSymbol: string;
}

export interface OrderBookSnapshot {
  pair: TradingPair;
  bestBuyPrice: bigint | null; // Best price for buying base with quote
  bestSellPrice: bigint | null; // Best price for selling base for quote
  buyLiquidity: bigint; // Available liquidity for buying
  sellLiquidity: bigint; // Available liquidity for selling
}

export interface PathStep {
  fromToken: string;
  toToken: string;
  fromSymbol: string;
  toSymbol: string;
  price: bigint; // Exchange rate
  direction: "buy" | "sell"; // Whether we're buying or selling the base token
  expectedOutput: string; // Expected output amount in human-readable format
  priceImpact: number; // Price impact percentage
}

export interface TradingPath {
  path: PathStep[];
  totalCost: number; // Total cost in terms of input token
  expectedOutput: string; // Final output amount
  priceImpact: number; // Total price impact
}

// Token registry with all available tokens
export const TOKEN_REGISTRY: Record<string, TokenInfo> = {
  [USDT_ADDRESS.toLowerCase()]: {
    address: USDT_ADDRESS,
    symbol: "USDT",
    name: "Tether USD",
  },
  [USDC_ADDRESS.toLowerCase()]: {
    address: USDC_ADDRESS,
    symbol: "USDC",
    name: "USD Coin",
  },
  [DAI_ADDRESS.toLowerCase()]: {
    address: DAI_ADDRESS,
    symbol: "DAI",
    name: "Dai Stablecoin",
  },
  [WETH_ADDRESS.toLowerCase()]: {
    address: WETH_ADDRESS,
    symbol: "WETH",
    name: "Wrapped Ether",
  },
  [WBTC_ADDRESS.toLowerCase()]: {
    address: WBTC_ADDRESS,
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
  },
  [EIGEN_ADDRESS.toLowerCase()]: {
    address: EIGEN_ADDRESS,
    symbol: "EIGEN",
    name: "Eigen Token",
  },
  [PEPE_ADDRESS.toLowerCase()]: {
    address: PEPE_ADDRESS,
    symbol: "PEPE",
    name: "Pepe Token",
  },
};

// Available trading pairs based on your tokenListings.ts
export const AVAILABLE_PAIRS: TradingPair[] = [
  {
    baseToken: USDC_ADDRESS,
    quoteToken: USDT_ADDRESS,
    baseSymbol: "USDC",
    quoteSymbol: "USDT",
  },
  {
    baseToken: USDT_ADDRESS,
    quoteToken: USDC_ADDRESS,
    baseSymbol: "USDT",
    quoteSymbol: "USDC",
  },
  {
    baseToken: WETH_ADDRESS,
    quoteToken: USDC_ADDRESS,
    baseSymbol: "WETH",
    quoteSymbol: "USDC",
  },
  {
    baseToken: USDC_ADDRESS,
    quoteToken: WETH_ADDRESS,
    baseSymbol: "USDC",
    quoteSymbol: "WETH",
  },
  {
    baseToken: WBTC_ADDRESS,
    quoteToken: USDT_ADDRESS,
    baseSymbol: "WBTC",
    quoteSymbol: "USDT",
  },
  {
    baseToken: USDT_ADDRESS,
    quoteToken: WBTC_ADDRESS,
    baseSymbol: "USDT",
    quoteSymbol: "WBTC",
  },
  {
    baseToken: EIGEN_ADDRESS,
    quoteToken: USDC_ADDRESS,
    baseSymbol: "EIGEN",
    quoteSymbol: "USDC",
  },
  {
    baseToken: USDC_ADDRESS,
    quoteToken: EIGEN_ADDRESS,
    baseSymbol: "USDC",
    quoteSymbol: "EIGEN",
  },
  {
    baseToken: PEPE_ADDRESS,
    quoteToken: USDT_ADDRESS,
    baseSymbol: "PEPE",
    quoteSymbol: "USDT",
  },
  {
    baseToken: USDT_ADDRESS,
    quoteToken: PEPE_ADDRESS,
    baseSymbol: "USDT",
    quoteSymbol: "PEPE",
  },
  {
    baseToken: DAI_ADDRESS,
    quoteToken: USDC_ADDRESS,
    baseSymbol: "DAI",
    quoteSymbol: "USDC",
  },
  {
    baseToken: USDC_ADDRESS,
    quoteToken: DAI_ADDRESS,
    baseSymbol: "USDC",
    quoteSymbol: "DAI",
  },
];

/**
 * Get token info by address
 */
export function getTokenInfo(address: string): TokenInfo | null {
  return TOKEN_REGISTRY[address.toLowerCase()] || null;
}

/**
 * Get all unique tokens from available pairs
 */
export function getAllTokens(): TokenInfo[] {
  const tokenSet = new Set<string>();
  AVAILABLE_PAIRS.forEach((pair) => {
    tokenSet.add(pair.baseToken.toLowerCase());
    tokenSet.add(pair.quoteToken.toLowerCase());
  });

  return Array.from(tokenSet)
    .map((addr) => TOKEN_REGISTRY[addr])
    .filter(Boolean);
}

/**
 * Build adjacency list for the token graph
 */
function buildTokenGraph(
  orderBooks: OrderBookSnapshot[],
  debug: boolean = false
): Map<
  string,
  Map<string, { price: bigint; liquidity: bigint; direction: "buy" | "sell" }[]>
> {
  const graph = new Map<
    string,
    Map<
      string,
      { price: bigint; liquidity: bigint; direction: "buy" | "sell" }[]
    >
  >();

  // Initialize graph with all tokens
  getAllTokens().forEach((token) => {
    graph.set(token.address.toLowerCase(), new Map());
  });

  // Add edges based on order books
  orderBooks.forEach((orderBook) => {
    const { pair, bestBuyPrice, bestSellPrice, buyLiquidity, sellLiquidity } =
      orderBook;
    const base = pair.baseToken.toLowerCase();
    const quote = pair.quoteToken.toLowerCase();

    // BUY orders in the order book = someone wants to BUY base with quote
    // This means: if we have base tokens, we can SELL to them and get quote
    // Edge: base -> quote (we sell base for quote at the buy order price)
    if (bestBuyPrice && buyLiquidity > BigInt(0)) {
      const baseEdges = graph.get(base) || new Map();
      const existingEdges = baseEdges.get(quote) || [];

      // Add this sell edge
      existingEdges.push({
        price: bestBuyPrice,
        liquidity: buyLiquidity,
        direction: "sell",
      });

      baseEdges.set(quote, existingEdges);
      graph.set(base, baseEdges);
    }

    // SELL orders in the order book = someone wants to SELL base for quote
    // This means: if we have quote tokens, we can BUY base from them
    // Edge: quote -> base (we buy base with quote at the sell order price)
    if (bestSellPrice && sellLiquidity > BigInt(0)) {
      const quoteEdges = graph.get(quote) || new Map();
      const existingEdges = quoteEdges.get(base) || [];

      // Add this buy edge
      existingEdges.push({
        price: bestSellPrice,
        liquidity: sellLiquidity,
        direction: "buy",
      });

      quoteEdges.set(base, existingEdges);
      graph.set(quote, quoteEdges);
    }
  });

  return graph;
}

/**
 * Calculate output amount for a given input amount and price
 */
function calculateOutput(
  inputAmount: bigint,
  price: bigint,
  direction: "buy" | "sell"
): bigint {
  if (direction === "buy") {
    // Buying base with quote: we spend quote, we get base
    // If price = 1.0005 (1.0005 USDT per USDC)
    // To get 1 USDC, we need 1.0005 USDT
    // So: output_base = input_quote / price
    return (inputAmount * BigInt(PRICE_PRECISION)) / price;
  } else {
    // Selling base for quote: we spend base, we get quote
    // If price = 1.0005 (1.0005 USDT per USDC)
    // If we sell 1 USDC, we get 1.0005 USDT
    // So: output_quote = input_base * price
    return (inputAmount * price) / BigInt(PRICE_PRECISION);
  }
}

/**
 * Find the cheapest path between two tokens using Dijkstra's algorithm
 * Modified to maximize output amount instead of minimizing cost
 */
export function findBestPath(
  fromToken: string,
  toToken: string,
  inputAmount: string,
  orderBooks: OrderBookSnapshot[],
  debug: boolean = false
): TradingPath | null {
  const from = fromToken.toLowerCase();
  const to = toToken.toLowerCase();

  if (from === to) {
    return null;
  }

  const graph = buildTokenGraph(orderBooks, debug);
  const inputAmountWei = parseUnits(inputAmount, STABLECOIN_DECIMALS);

  // Track the maximum output we can get to each token
  const maxOutput = new Map<string, bigint>();
  const previous = new Map<string, { token: string; edge: any } | null>();
  const visited = new Set<string>();

  // Initialize
  getAllTokens().forEach((token) => {
    maxOutput.set(token.address.toLowerCase(), BigInt(0));
    previous.set(token.address.toLowerCase(), null);
  });
  maxOutput.set(from, inputAmountWei);

  // Priority queue (simple implementation)
  const queue: { token: string; output: bigint }[] = [
    { token: from, output: inputAmountWei },
  ];

  while (queue.length > 0) {
    // Get node with maximum output
    queue.sort((a, b) => (a.output > b.output ? -1 : 1));
    const current = queue.shift()!;

    if (visited.has(current.token)) {
      continue;
    }
    visited.add(current.token);

    if (current.token === to) {
      break; // Found the destination
    }

    const currentOutput = maxOutput.get(current.token)!;
    const neighbors = graph.get(current.token);

    if (!neighbors) {
      continue;
    }

    neighbors.forEach((edgeList, neighbor) => {
      if (visited.has(neighbor)) {
        return;
      }

      const neighborInfo = getTokenInfo(neighbor);

      // Try each edge (buy and sell directions)
      edgeList.forEach((edge) => {
        // Calculate output from this hop first
        const nextOutput = calculateOutput(
          currentOutput,
          edge.price,
          edge.direction
        );

        // Check liquidity properly based on direction
        // For "buy" direction: we're buying the output token, so check if nextOutput <= liquidity
        // For "sell" direction: we're selling the input token, so check if currentOutput <= liquidity
        let hasEnoughLiquidity = false;
        if (edge.direction === "buy") {
          // We're buying the neighbor token, check if the amount we want to buy is available
          hasEnoughLiquidity = nextOutput <= edge.liquidity;
        } else {
          // We're selling our current token, check if there's enough buy liquidity
          hasEnoughLiquidity = currentOutput <= edge.liquidity;
        }

        if (!hasEnoughLiquidity) {
          return; // Skip if not enough liquidity
        }

        const currentMaxOutput = maxOutput.get(neighbor)!;

        // If we found a better path to this neighbor
        if (nextOutput > currentMaxOutput) {
          maxOutput.set(neighbor, nextOutput);
          previous.set(neighbor, { token: current.token, edge });
          queue.push({ token: neighbor, output: nextOutput });
        }
      });
    });
  }

  // Reconstruct path
  if (!previous.get(to)) {
    return null; // No path found
  }

  const path: PathStep[] = [];
  let current = to;
  let accumulatedOutput = maxOutput.get(to)!;

  while (current !== from) {
    const prev = previous.get(current);
    if (!prev) {
      return null;
    }

    const fromTokenInfo = getTokenInfo(prev.token);
    const toTokenInfo = getTokenInfo(current);

    if (!fromTokenInfo || !toTokenInfo) {
      return null;
    }

    path.unshift({
      fromToken: prev.token,
      toToken: current,
      fromSymbol: fromTokenInfo.symbol,
      toSymbol: toTokenInfo.symbol,
      price: prev.edge.price,
      direction: prev.edge.direction,
      expectedOutput: formatUnits(accumulatedOutput, STABLECOIN_DECIMALS),
      priceImpact: 0, // Calculate later if needed
    });

    current = prev.token;
  }

  const finalOutput = maxOutput.get(to)!;
  const totalCost =
    Number(formatUnits(inputAmountWei, STABLECOIN_DECIMALS)) /
    Number(formatUnits(finalOutput, STABLECOIN_DECIMALS));

  return {
    path,
    totalCost,
    expectedOutput: formatUnits(finalOutput, STABLECOIN_DECIMALS),
    priceImpact: 0, // Can be calculated based on expected vs actual rates
  };
}

/**
 * Find multiple paths and return the best one
 */
export function findAllPaths(
  fromToken: string,
  toToken: string,
  inputAmount: string,
  orderBooks: OrderBookSnapshot[],
  maxPaths: number = 3
): TradingPath[] {
  const paths: TradingPath[] = [];

  // For now, just return the single best path
  // In the future, you could implement k-shortest paths algorithm
  const bestPath = findBestPath(fromToken, toToken, inputAmount, orderBooks);

  if (bestPath) {
    paths.push(bestPath);
  }

  return paths;
}

/**
 * Check if direct trading pair exists
 */
export function hasDirectPair(token1: string, token2: string): boolean {
  const t1 = token1.toLowerCase();
  const t2 = token2.toLowerCase();

  return AVAILABLE_PAIRS.some(
    (pair) =>
      (pair.baseToken.toLowerCase() === t1 &&
        pair.quoteToken.toLowerCase() === t2) ||
      (pair.baseToken.toLowerCase() === t2 &&
        pair.quoteToken.toLowerCase() === t1)
  );
}

/**
 * Format price for display
 */
export function formatPrice(price: bigint): string {
  return formatUnits(price, 6); // PRICE_PRECISION is 1e6
}
