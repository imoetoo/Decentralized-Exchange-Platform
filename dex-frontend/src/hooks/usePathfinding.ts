import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { DEX_CONTRACT_ADDRESS, DEX_ABI, OrderType } from "@/constants";
import {
  AVAILABLE_PAIRS,
  OrderBookSnapshot,
  TradingPath,
  findBestPath,
  findAllPaths,
} from "@/utils/pathfinding";
import { Order } from "./useDex";

/**
 * Hook to fetch order book snapshots for all trading pairs
 */
export function useOrderBookSnapshots() {
  const publicClient = usePublicClient();
  const [snapshots, setSnapshots] = useState<OrderBookSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSnapshots = useCallback(async () => {
    if (!publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const snapshotPromises = AVAILABLE_PAIRS.map(async (pair) => {
        try {
          // Get order IDs for this pair
          const orderListData = (await publicClient.readContract({
            address: DEX_CONTRACT_ADDRESS,
            abi: DEX_ABI,
            functionName: "getList",
            args: [
              pair.baseToken as `0x${string}`,
              pair.quoteToken as `0x${string}`,
            ],
          })) as [bigint[], bigint[]];

          const [buyOrderIds, sellOrderIds] = orderListData;

          // Fetch buy orders
          const buyOrders = await Promise.all(
            buyOrderIds.map(async (id) => {
              try {
                const orderData = (await publicClient.readContract({
                  address: DEX_CONTRACT_ADDRESS,
                  abi: DEX_ABI,
                  functionName: "orders",
                  args: [id],
                })) as any;

                const order: Order = {
                  id: orderData[0],
                  trader: orderData[1],
                  action: orderData[2],
                  base: orderData[3],
                  quote: orderData[4],
                  amount: orderData[5],
                  filled: orderData[6],
                  price: orderData[7],
                  ts: orderData[8],
                  active: orderData[9],
                };

                return order.active ? order : null;
              } catch (err) {
                console.error(`Error fetching buy order ${id}:`, err);
                return null;
              }
            })
          );

          // Fetch sell orders
          const sellOrders = await Promise.all(
            sellOrderIds.map(async (id) => {
              try {
                const orderData = (await publicClient.readContract({
                  address: DEX_CONTRACT_ADDRESS,
                  abi: DEX_ABI,
                  functionName: "orders",
                  args: [id],
                })) as any;

                const order: Order = {
                  id: orderData[0],
                  trader: orderData[1],
                  action: orderData[2],
                  base: orderData[3],
                  quote: orderData[4],
                  amount: orderData[5],
                  filled: orderData[6],
                  price: orderData[7],
                  ts: orderData[8],
                  active: orderData[9],
                };

                return order.active ? order : null;
              } catch (err) {
                console.error(`Error fetching sell order ${id}:`, err);
                return null;
              }
            })
          );

          // Filter out null orders
          const validBuyOrders = buyOrders.filter(
            (o): o is Order => o !== null
          );
          const validSellOrders = sellOrders.filter(
            (o): o is Order => o !== null
          );

          // Calculate best prices and liquidity
          let bestBuyPrice: bigint | null = null;
          let buyLiquidity = BigInt(0);

          if (validBuyOrders.length > 0) {
            // For BUY orders, the best price is the highest (best for sellers)
            bestBuyPrice = validBuyOrders[0].price;
            buyLiquidity = validBuyOrders.reduce(
              (sum, order) => sum + (order.amount - order.filled),
              BigInt(0)
            );
          }

          let bestSellPrice: bigint | null = null;
          let sellLiquidity = BigInt(0);

          if (validSellOrders.length > 0) {
            // For SELL orders, the best price is the lowest (best for buyers)
            bestSellPrice = validSellOrders[0].price;
            sellLiquidity = validSellOrders.reduce(
              (sum, order) => sum + (order.amount - order.filled),
              BigInt(0)
            );
          }

          const snapshot: OrderBookSnapshot = {
            pair,
            bestBuyPrice,
            bestSellPrice,
            buyLiquidity,
            sellLiquidity,
          };

          return snapshot;
        } catch (err) {
          console.error(
            `Error fetching orders for pair ${pair.baseSymbol}/${pair.quoteSymbol}:`,
            err
          );
          return null;
        }
      });

      const results = await Promise.all(snapshotPromises);
      const validSnapshots = results.filter(
        (s): s is OrderBookSnapshot => s !== null
      );

      setSnapshots(validSnapshots);
    } catch (err) {
      console.error("Error fetching order book snapshots:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch snapshots")
      );
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  // Fetch on mount and periodically
  useEffect(() => {
    fetchSnapshots();

    // Refetch every 5 seconds
    const interval = setInterval(fetchSnapshots, 5000);

    return () => clearInterval(interval);
  }, [fetchSnapshots]);

  return {
    snapshots,
    isLoading,
    error,
    refetch: fetchSnapshots,
  };
}

/**
 * Hook to find and manage trading paths
 */
export function usePathfinding(fromToken?: string, toToken?: string) {
  const {
    snapshots,
    isLoading: isLoadingSnapshots,
    error,
    refetch,
  } = useOrderBookSnapshots();
  const [bestPath, setBestPath] = useState<TradingPath | null>(null);
  const [allPaths, setAllPaths] = useState<TradingPath[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  /**
   * Calculate the best path for a given input amount
   */
  const calculatePath = useCallback(
    (inputAmount: string, debug: boolean = false) => {
      if (!fromToken || !toToken || !inputAmount || Number(inputAmount) <= 0) {
        setBestPath(null);
        setAllPaths([]);
        return;
      }

      setIsCalculating(true);

      try {
        // Find best path
        const path = findBestPath(
          fromToken,
          toToken,
          inputAmount,
          snapshots,
          debug
        );
        setBestPath(path);

        // Find alternative paths
        const paths = findAllPaths(
          fromToken,
          toToken,
          inputAmount,
          snapshots,
          3
        );
        setAllPaths(paths);
      } catch (err) {
        console.error("Error calculating path:", err);
        setBestPath(null);
        setAllPaths([]);
      } finally {
        setIsCalculating(false);
      }
    },
    [fromToken, toToken, snapshots]
  );

  return {
    bestPath,
    allPaths,
    isCalculating,
    isLoadingSnapshots,
    error,
    calculatePath,
    refetchSnapshots: refetch,
  };
}
