import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useBlockNumber } from "wagmi";
import { DEX_CONTRACT_ADDRESS, DEX_ABI } from "@/constants";
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

        // Get unique order IDs that were involved in trades (either as maker or taker)
        const tradeOrderIds = new Set<bigint>();
        filledLogs.forEach((log: any) => {
          const makerId = log.args.makerId as bigint;
          const takerId = log.args.takerId as bigint;
          tradeOrderIds.add(makerId);
          tradeOrderIds.add(takerId);
        });

        // Filter to only include user's orders that were filled
        const userTradeOrderIds = userOrderIds.filter((id) =>
          tradeOrderIds.has(id)
        );

        // Fetch details for filled orders
        const tradeOrdersPromises = userTradeOrderIds.map(async (id) => {
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

            return order;
          } catch (error) {
            console.error(`Error fetching trade order ${id}:`, error);
            return null;
          }
        });

        const tradeOrders = (await Promise.all(tradeOrdersPromises)).filter(
          Boolean
        ) as Order[];

        // Separate active and completed regular orders
        const activeOrders = allOrders.filter((order) => order.active);

        // Trade history: orders that have been filled (partially or fully)
        const completedOrders = tradeOrders.filter(
          (order) => order.filled > BigInt(0)
        );

        // Filter active stop orders (not triggered, not cancelled)
        const activeStopOrders = allStopOrders.filter(
          (order) => order.active && !order.triggered
        );

        // Sort by timestamp (newest first)
        activeOrders.sort((a, b) => Number(b.ts - a.ts));
        completedOrders.sort((a, b) => Number(b.ts - a.ts));
        activeStopOrders.sort((a, b) => Number(b.ts - a.ts));

        setUserOrders(activeOrders);
        setStopLimitOrders(activeStopOrders);
        setTradeHistory(completedOrders);
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
  }, [address, publicClient, blockNumber]); // Re-fetch when block number changes

  return {
    userOrders,
    stopLimitOrders,
    tradeHistory,
    isLoading,
  };
}
