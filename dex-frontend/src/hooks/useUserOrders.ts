import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useBlockNumber } from "wagmi";
import { DEX_CONTRACT_ADDRESS, DEX_ABI } from "@/constants";
import { Order } from "./useDex";

/**
 * Hook to fetch all orders for the connected user across all trading pairs
 */
export function useUserOrders() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!address || !publicClient) {
        setUserOrders([]);
        setTradeHistory([]);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch NewOrder events for this user
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

        // Fetch full order details for each order ID
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

        const allOrders = (await Promise.all(ordersPromises)).filter(
          Boolean
        ) as Order[];

        // Separate active and completed orders
        const activeOrders = allOrders.filter((order) => order.active);
        // Only show orders that were fully filled (not cancelled)
        const completedOrders = allOrders.filter(
          (order) => !order.active && order.filled === order.amount
        );

        // Sort by timestamp (newest first)
        activeOrders.sort((a, b) => Number(b.ts - a.ts));
        completedOrders.sort((a, b) => Number(b.ts - a.ts));

        setUserOrders(activeOrders);
        setTradeHistory(completedOrders);
      } catch (error) {
        console.error("Error fetching user orders:", error);
        setUserOrders([]);
        setTradeHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserOrders();
  }, [address, publicClient, blockNumber]); // Re-fetch when block number changes

  return {
    userOrders,
    tradeHistory,
    isLoading,
  };
}
