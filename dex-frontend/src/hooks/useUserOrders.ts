import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useBlockNumber } from "wagmi";
import { DEX_CONTRACT_ADDRESS, DEX_ABI, OrderKind } from "@/constants";
import { Order, StopLimitOrder } from "./useDex";

/**
 * Hook to fetch all orders for the connected user across all trading pairs
 */
export function useUserOrders() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [stopLimitOrders, setStopLimitOrders] = useState<StopLimitOrder[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Manual refresh function
  const refresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!address || !publicClient) {
        setUserOrders([]);
        setStopLimitOrders([]);
        setTradeHistory([]);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch NewOrder events for regular limit orders
        const logs = await publicClient.getLogs({
          address: DEX_CONTRACT_ADDRESS,
          event: {
            type: "event",
            name: "NewOrder",
            inputs: [
              { type: "uint256", name: "id", indexed: false },
              { type: "address", name: "trader", indexed: false },
              { type: "uint8", name: "action", indexed: false },
              { type: "address", name: "base", indexed: false },
              { type: "address", name: "quote", indexed: false },
              { type: "uint256", name: "amount", indexed: false },
              { type: "uint256", name: "price", indexed: false },
            ],
          },
          fromBlock: BigInt(0),
          toBlock: "latest",
        });

        // Filter logs for current user and fetch full order details
        const userOrderIds = logs
          .filter((log: any) => {
            const trader = log.args.trader as string;
            return trader.toLowerCase() === address.toLowerCase();
          })
          .map((log: any) => log.args.id as bigint);

        // Filter stop orders for current user
        // Since trader is indexed in StopLimitPlaced, we can filter directly in the query
        const stopLogsFiltered = await publicClient.getLogs({
          address: DEX_CONTRACT_ADDRESS,
          event: {
            type: "event",
            name: "StopLimitPlaced",
            inputs: [
              { type: "uint256", name: "id", indexed: true },
              { type: "address", name: "trader", indexed: true },
              { type: "uint8", name: "action", indexed: false },
              { type: "address", name: "base", indexed: false },
              { type: "address", name: "quote", indexed: false },
              { type: "uint256", name: "amount", indexed: false },
              { type: "uint256", name: "stopPrice", indexed: false },
              { type: "uint256", name: "limitPrice", indexed: false },
            ],
          },
          args: {
            trader: address as `0x${string}`,
          },
          fromBlock: BigInt(0),
          toBlock: "latest",
        });

        const userStopOrderIds = stopLogsFiltered.map(
          (log: any) => log.args.id as bigint
        );

        // Fetch full order details for each regular order ID
        const ordersPromises = userOrderIds.map(async (id) => {
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
              orderKind: OrderKind.LIMIT, // All NewOrder events are limit orders
            };

            return order;
          } catch (error) {
            console.error(`Error fetching order ${id}:`, error);
            return null;
          }
        });

        // Fetch full details for each stop limit order ID
        const stopOrdersPromises = userStopOrderIds.map(async (id) => {
          try {
            const stopOrderData = (await publicClient.readContract({
              address: DEX_CONTRACT_ADDRESS,
              abi: DEX_ABI,
              functionName: "stopOrders",
              args: [id],
            })) as any;

            const stopOrder: StopLimitOrder = {
              id: stopOrderData[0],
              trader: stopOrderData[1],
              action: stopOrderData[2],
              base: stopOrderData[3],
              quote: stopOrderData[4],
              amount: stopOrderData[5],
              stopPrice: stopOrderData[6],
              limitPrice: stopOrderData[7],
              ts: stopOrderData[8],
              active: stopOrderData[9],
              triggered: stopOrderData[10],
            };

            return stopOrder;
          } catch (error) {
            console.error(`Error fetching stop order ${id}:`, error);
            return null;
          }
        });

        const allOrders = (await Promise.all(ordersPromises)).filter(
          Boolean
        ) as Order[];

        const allStopOrders = (await Promise.all(stopOrdersPromises)).filter(
          Boolean
        ) as StopLimitOrder[];

        console.log(`Fetched ${allOrders.length} total orders, ${allStopOrders.length} stop orders`);

        // Separate active regular orders first (these always work)
        // Active means: order is active AND not fully filled
        const activeOrders = allOrders.filter(
          (order) => order.active && order.filled < order.amount
        );
        const activeStopOrders = allStopOrders.filter(
          (order) => order.active && !order.triggered
        );

        console.log(`Active orders: ${activeOrders.length}, Active stop orders: ${activeStopOrders.length}`);

        // Try to fetch trade history, but don't let it break the entire component
        let completedOrders: Order[] = [];

        try {
          // Fetch OrderFilled events to get accurate trade history
          const filledLogs = await publicClient.getLogs({
            address: DEX_CONTRACT_ADDRESS,
            event: {
              type: "event",
              name: "OrderFilled",
              inputs: [
                { type: "uint256", name: "takerId", indexed: false },
                { type: "uint256", name: "makerId", indexed: false },
                { type: "uint256", name: "baseAmount", indexed: false },
                { type: "uint256", name: "quoteAmount", indexed: false },
              ],
            },
            fromBlock: BigInt(0),
            toBlock: "latest",
          });

          // Collect order IDs where user was the maker (their order got taken)
          const userMakerOrderIds = new Set<bigint>();
          // Collect order IDs where user placed a limit order that matched immediately (taker)
          const userTakerOrderIds = new Set<bigint>();
          // Collect OrderFilled events where user used takeOrder directly (takerId = 0)
          const potentialDirectTakerTrades: Array<{
            makerId: bigint;
            baseAmount: bigint;
            quoteAmount: bigint;
            txHash: string;
          }> = [];

          filledLogs.forEach((log: any) => {
            const makerId = log.args.makerId as bigint;
            const takerId = log.args.takerId as bigint;
            const baseAmount = log.args.baseAmount as bigint;
            const quoteAmount = log.args.quoteAmount as bigint;

            // If user created the maker order (their order got taken)
            if (userOrderIds.includes(makerId)) {
              userMakerOrderIds.add(makerId);
            }

            // If user created a limit order that matched immediately (taker)
            if (takerId !== BigInt(0) && userOrderIds.includes(takerId)) {
              userTakerOrderIds.add(takerId);
            }

            // If takerId is 0, it means someone used takeOrder directly
            if (takerId === BigInt(0) && log.transactionHash) {
              potentialDirectTakerTrades.push({
                makerId,
                baseAmount,
                quoteAmount,
                txHash: log.transactionHash,
              });
            }
          });

          // Check which direct taker trades belong to the current user
          const userDirectTakerTrades: Array<{
            makerId: bigint;
            baseAmount: bigint;
            quoteAmount: bigint;
            txHash: string;
            blockNumber: bigint;
          }> = [];

          for (const trade of potentialDirectTakerTrades) {
            try {
              const tx = await publicClient.getTransaction({
                hash: trade.txHash as `0x${string}`,
              });

              if (tx && tx.from.toLowerCase() === address.toLowerCase()) {
                userDirectTakerTrades.push({
                  ...trade,
                  blockNumber: tx.blockNumber!,
                });
              }
            } catch (error) {
              console.error(
                `Error fetching transaction ${trade.txHash}:`,
                error
              );
            }
          }

          // Fetch details for maker orders that were filled
          const makerTradePromises = Array.from(userMakerOrderIds).map(
            async (id) => {
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
                  orderKind: OrderKind.LIMIT, // Maker orders are always limit orders
                };

                return order;
              } catch (error) {
                console.error(`Error fetching maker trade order ${id}:`, error);
                return null;
              }
            }
          );

          // Fetch details for limit orders that matched immediately (acted as takers)
          const limitTakerPromises = Array.from(userTakerOrderIds).map(
            async (id) => {
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
                  orderKind: OrderKind.LIMIT, // These are limit orders that matched immediately
                };

                return order;
              } catch (error) {
                console.error(`Error fetching limit taker order ${id}:`, error);
                return null;
              }
            }
          );

          // Fetch details for direct taker trades (user used takeOrder/marketOrder)
          const directTakerTradePromises = userDirectTakerTrades.map(
            async (trade, index) => {
              try {
                const makerOrderData = (await publicClient.readContract({
                  address: DEX_CONTRACT_ADDRESS,
                  abi: DEX_ABI,
                  functionName: "orders",
                  args: [trade.makerId],
                })) as any;

                // Get block to find timestamp
                const block = await publicClient.getBlock({
                  blockNumber: trade.blockNumber,
                });

                // Create a synthetic order representing the taker's perspective
                // Use a unique negative ID for each taker order to avoid React key conflicts
                const takerOrder: Order = {
                  id: BigInt(-1 - index), // Unique negative ID
                  trader: address as string,
                  action: makerOrderData[2] === 0 ? 1 : 0, // Opposite of maker's action
                  base: makerOrderData[3],
                  quote: makerOrderData[4],
                  amount: trade.baseAmount,
                  filled: trade.baseAmount,
                  price:
                    (trade.quoteAmount * BigInt(1000000)) / trade.baseAmount, // Calculate effective price
                  ts: block.timestamp,
                  active: false,
                  orderKind: OrderKind.TAKE_ORDER, // Taker orders (both Take Order and Market Order use takeOrder)
                };

                return takerOrder;
              } catch (error) {
                console.error(`Error creating taker trade record:`, error);
                return null;
              }
            }
          );

          const makerTrades = (await Promise.all(makerTradePromises)).filter(
            Boolean
          ) as Order[];

          const limitTakerTrades = (
            await Promise.all(limitTakerPromises)
          ).filter(Boolean) as Order[];

          const directTakerTrades = (
            await Promise.all(directTakerTradePromises)
          ).filter(Boolean) as Order[];

          // Combine all trades: maker trades, limit orders that matched immediately, and direct taker trades
          const allTrades = [
            ...makerTrades,
            ...limitTakerTrades,
            ...directTakerTrades,
          ];

          // Trade history: all trades (maker and taker) that have been filled
          completedOrders = allTrades.filter(
            (order) => order.filled > BigInt(0)
          );

          console.log(
            `Trade history: ${completedOrders.length} completed trades (${makerTrades.length} maker, ${limitTakerTrades.length} limit taker, ${directTakerTrades.length} direct taker)`
          );
        } catch (tradeError) {
          console.error("Error fetching trade history:", tradeError);
          // Continue with empty trade history if there's an error
        }

        // Sort by timestamp (newest first) - create new arrays to avoid mutation
        const sortedActiveOrders = [...activeOrders].sort((a, b) =>
          Number(b.ts - a.ts)
        );
        const sortedCompletedOrders = [...completedOrders].sort((a, b) =>
          Number(b.ts - a.ts)
        );
        const sortedActiveStopOrders = [...activeStopOrders].sort((a, b) =>
          Number(b.ts - a.ts)
        );

        setUserOrders(sortedActiveOrders);
        setStopLimitOrders(sortedActiveStopOrders);
        setTradeHistory(sortedCompletedOrders);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching user orders:", error);
        setUserOrders([]);
        setStopLimitOrders([]);
        setTradeHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserOrders();
  }, [address, publicClient, blockNumber, refreshTrigger]); // Re-fetch when block number changes or manual refresh

  return {
    userOrders,
    stopLimitOrders,
    tradeHistory,
    isLoading,
    refresh,
    lastUpdated,
  };
}
