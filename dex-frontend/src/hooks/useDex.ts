import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  DEX_CONTRACT_ADDRESS,
  DEX_ABI,
  ERC20_ABI,
  STABLECOIN_DECIMALS,
  PRICE_PRECISION,
  OrderType,
} from "@/constants";

export interface Order {
  id: bigint;
  trader: string;
  action: OrderType;
  base: string;
  quote: string;
  amount: bigint;
  filled: bigint;
  price: bigint;
  ts: bigint;
  active: boolean;
}

export interface StopLimitOrder {
  id: bigint;
  trader: string;
  action: OrderType;
  base: string;
  quote: string;
  amount: bigint;
  stopPrice: bigint;
  limitPrice: bigint;
  ts: bigint;
  active: boolean;
  triggered: boolean;
}

export interface OrderBookData {
  buyOrders: Order[];
  sellOrders: Order[];
}

/**
 * Custom hook for interacting with the DEX smart contract
 */
export function useDex(baseToken?: string, quoteToken?: string) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const [orderBook, setOrderBook] = useState<OrderBookData>({
    buyOrders: [],
    sellOrders: [],
  });
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Get order list IDs from the contract
  const { data: orderListData, refetch: refetchOrderList } = useReadContract({
    address: DEX_CONTRACT_ADDRESS,
    abi: DEX_ABI,
    functionName: "getList",
    args:
      baseToken && quoteToken
        ? [baseToken as `0x${string}`, quoteToken as `0x${string}`]
        : undefined,
    query: {
      enabled: !!baseToken && !!quoteToken,
      refetchInterval: 3000, // Refetch every 3 seconds
    },
  });

  // Fetch full order details when order IDs are available
  useEffect(() => {
    const fetchOrders = async () => {
      if (!orderListData || !baseToken || !quoteToken || !publicClient) {
        setOrderBook({ buyOrders: [], sellOrders: [] });
        return;
      }

      setIsLoadingOrders(true);
      try {
        const [buyOrderIds, sellOrderIds] = orderListData as [
          bigint[],
          bigint[]
        ];

        console.log(
          "Fetching orders - Buy IDs:",
          buyOrderIds,
          "Sell IDs:",
          sellOrderIds
        );

        // Fetch buy orders from contract
        const buyOrdersPromises = buyOrderIds.map(async (id) => {
          try {
            const orderData = (await publicClient.readContract({
              address: DEX_CONTRACT_ADDRESS,
              abi: DEX_ABI,
              functionName: "orders",
              args: [id],
            })) as any;

            // The contract returns a tuple matching the Order struct
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

            console.log("Fetched buy order:", order);
            return order.active ? order : null; // Only return active orders
          } catch (error) {
            console.error(`Error fetching buy order ${id}:`, error);
            return null;
          }
        });

        // Fetch sell orders from contract
        const sellOrdersPromises = sellOrderIds.map(async (id) => {
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

            console.log("Fetched sell order:", order);
            return order.active ? order : null; // Only return active orders
          } catch (error) {
            console.error(`Error fetching sell order ${id}:`, error);
            return null;
          }
        });

        const buyOrders = (await Promise.all(buyOrdersPromises)).filter(
          Boolean
        ) as Order[];
        const sellOrders = (await Promise.all(sellOrdersPromises)).filter(
          Boolean
        ) as Order[];

        console.log("Final order book - Buy:", buyOrders, "Sell:", sellOrders);
        setOrderBook({ buyOrders, sellOrders });
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrderBook({ buyOrders: [], sellOrders: [] });
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [orderListData, baseToken, quoteToken, publicClient]);

  // Get order details by ID
  const getOrderById = useCallback(
    async (orderId: bigint): Promise<Order | null> => {
      if (!publicClient) return null;
      try {
        const orderData = (await publicClient.readContract({
          address: DEX_CONTRACT_ADDRESS,
          abi: DEX_ABI,
          functionName: "orders",
          args: [orderId],
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
        console.error("getOrderById error", err);
        return null;
      }
    },
    [publicClient]
  );

  // Get order IDs for a given trading pair
  const getOrderIdsForPair = useCallback(
    async (
      base: string,
      quote: string
    ): Promise<{ buy: bigint[]; sell: bigint[] }> => {
      if (!publicClient) return { buy: [], sell: [] };
      try {
        const data = (await publicClient.readContract({
          address: DEX_CONTRACT_ADDRESS,
          abi: DEX_ABI,
          functionName: "getList",
          args: [base as `0x${string}`, quote as `0x${string}`],
        })) as [bigint[], bigint[]];

        return { buy: data[0], sell: data[1] };
      } catch (err) {
        console.error("getOrderIdsForPair error", err);
        return { buy: [], sell: [] };
      }
    },
    [publicClient]
  );

  /**
   * Place a limit order
   * @param action - BUY or SELL
   * @param baseAmount - Amount of base token (in token units, not wei)
   * @param price - Price in quote/base (will be converted to PRICE_PRECISION)
   */
  const placeLimitOrder = useCallback(
    async (action: OrderType, baseAmount: string, price: string) => {
      if (!baseToken || !quoteToken || !address) {
        throw new Error("Missing required parameters");
      }

      const baseAmountWei = parseUnits(baseAmount, STABLECOIN_DECIMALS);
      // Price needs to be converted to the PRICE_PRECISION format
      // If price is 1.05, it means 1 base = 1.05 quote, so price = 1.05 * PRICE_PRECISION
      const priceInPrecision = parseUnits(price, 6); // Since PRICE_PRECISION is 1e6

      writeContract({
        address: DEX_CONTRACT_ADDRESS,
        abi: DEX_ABI,
        functionName: "placeLimit",
        args: [
          action,
          baseToken as `0x${string}`,
          quoteToken as `0x${string}`,
          baseAmountWei,
          priceInPrecision,
        ],
      });
    },
    [baseToken, quoteToken, address, writeContract]
  );

  /**
   * Cancel an existing order
   * @param orderId - The ID of the order to cancel
   */
  const cancelOrder = useCallback(
    async (orderId: bigint) => {
      writeContract({
        address: DEX_CONTRACT_ADDRESS,
        abi: DEX_ABI,
        functionName: "cancel",
        args: [orderId],
      });
    },
    [writeContract]
  );

  /**
   * Take (execute) an existing limit order immediately - Take Order
   * @param orderId - The ID of the order to take
   * @param baseAmount - Amount to take (0 means take all remaining)
   */
  const takeOrder = useCallback(
    async (orderId: bigint, baseAmount: string) => {
      const amountWei =
        baseAmount === "0"
          ? BigInt(0)
          : parseUnits(baseAmount, STABLECOIN_DECIMALS);

      writeContract({
        address: DEX_CONTRACT_ADDRESS,
        abi: DEX_ABI,
        functionName: "takeOrder",
        args: [orderId, amountWei],
      });
    },
    [writeContract]
  );

  /**
   * Execute a market order - automatically takes the best price from the order book
   * @param action - BUY or SELL
   * @param baseAmount - Amount to trade
   */
  const executeMarketOrder = useCallback(
    async (action: OrderType, baseAmount: string) => {
      if (!baseToken || !quoteToken) {
        throw new Error("Missing token addresses");
      }

      // Get the best order from the order book
      let bestOrder: Order | null = null;

      if (action === OrderType.BUY) {
        // For BUY, take the lowest priced SELL order
        if (orderBook.sellOrders.length > 0) {
          bestOrder = orderBook.sellOrders[0]; // Already sorted by price (ascending)
        }
      } else {
        // For SELL, take the highest priced BUY order
        if (orderBook.buyOrders.length > 0) {
          bestOrder = orderBook.buyOrders[0]; // Already sorted by price (descending)
        }
      }

      if (!bestOrder) {
        throw new Error("No orders available in the order book");
      }

      // Execute takeOrder with the best order
      const amountWei = parseUnits(baseAmount, STABLECOIN_DECIMALS);
      writeContract({
        address: DEX_CONTRACT_ADDRESS,
        abi: DEX_ABI,
        functionName: "takeOrder",
        args: [bestOrder.id, amountWei],
      });
    },
    [baseToken, quoteToken, orderBook, writeContract]
  );

  /**
   * Place a stop-limit order
   * @param action - BUY or SELL
   * @param amount - Amount of base token
   * @param stopPrice - Price at which the order is triggered
   * @param limitPrice - Limit price after trigger
   */
  const placeStopLimit = useCallback(
    async (
      action: OrderType,
      amount: string,
      stopPrice: string,
      limitPrice: string
    ) => {
      if (!baseToken || !quoteToken || !address) {
        throw new Error("Missing required parameters");
      }

      const amountWei = parseUnits(amount, STABLECOIN_DECIMALS);
      const stopPriceInPrecision = parseUnits(stopPrice, 6);
      const limitPriceInPrecision = parseUnits(limitPrice, 6);

      writeContract({
        address: DEX_CONTRACT_ADDRESS,
        abi: DEX_ABI,
        functionName: "placeStopLimit",
        args: [
          action,
          baseToken as `0x${string}`,
          quoteToken as `0x${string}`,
          amountWei,
          stopPriceInPrecision,
          limitPriceInPrecision,
        ],
      });
    },
    [baseToken, quoteToken, address, writeContract]
  );

  /**
   * Cancel a stop-limit order
   * @param stopId - The ID of the stop order to cancel
   */
  const cancelStopLimit = useCallback(
    async (stopId: bigint) => {
      writeContract({
        address: DEX_CONTRACT_ADDRESS,
        abi: DEX_ABI,
        functionName: "cancelStop",
        args: [stopId],
      });
    },
    [writeContract]
  );

  /**
   * Get stop order details by ID
   */
  const getStopOrderById = useCallback(
    async (stopId: bigint): Promise<StopLimitOrder | null> => {
      if (!publicClient) return null;
      try {
        const stopData = (await publicClient.readContract({
          address: DEX_CONTRACT_ADDRESS,
          abi: DEX_ABI,
          functionName: "stopOrders",
          args: [stopId],
        })) as any;

        const stopOrder: StopLimitOrder = {
          id: stopData[0],
          trader: stopData[1],
          action: stopData[2],
          base: stopData[3],
          quote: stopData[4],
          amount: stopData[5],
          stopPrice: stopData[6],
          limitPrice: stopData[7],
          ts: stopData[8],
          active: stopData[9],
          triggered: stopData[10],
        };

        return stopOrder.active && !stopOrder.triggered ? stopOrder : null;
      } catch (err) {
        console.error("getStopOrderById error", err);
        return null;
      }
    },
    [publicClient]
  );

  const executeBatch = useCallback(
    async (orderIds: bigint[], amountInFirst: string) => {
      if (!orderIds.length) {
        throw new Error("orderIds cannot be empty");
      }
      const amountWei = parseUnits(amountInFirst, STABLECOIN_DECIMALS);

      writeContract({
        address: DEX_CONTRACT_ADDRESS,
        abi: DEX_ABI,
        functionName: "executeBatch",
        args: [orderIds, amountWei],
      });
    },
    [writeContract]
  );

  /**
   * Approve token spending for the DEX contract
   * @param tokenAddress - Address of the token to approve
   * @param amount - Amount to approve (in token units)
   */
  const approveToken = useCallback(
    async (tokenAddress: string, amount: string) => {
      const amountWei = parseUnits(amount, STABLECOIN_DECIMALS);

      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [DEX_CONTRACT_ADDRESS, amountWei],
      });
    },
    [writeContract]
  );

  /**
   * Check token allowance for base token
   */
  const { data: baseAllowanceData, refetch: refetchBaseAllowance } =
    useReadContract({
      address: baseToken as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: address && baseToken ? [address, DEX_CONTRACT_ADDRESS] : undefined,
      query: {
        enabled: !!address && !!baseToken,
      },
    });

  /**
   * Check token allowance for quote token
   */
  const { data: quoteAllowanceData, refetch: refetchQuoteAllowance } =
    useReadContract({
      address: quoteToken as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: address && quoteToken ? [address, DEX_CONTRACT_ADDRESS] : undefined,
      query: {
        enabled: !!address && !!quoteToken,
      },
    });

  /**
   * Get base token balance
   */
  const { data: baseBalanceData, refetch: refetchBaseBalance } =
    useReadContract({
      address: baseToken as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      query: {
        enabled: !!address && !!baseToken,
      },
    });

  /**
   * Get quote token balance
   */
  const { data: quoteBalanceData, refetch: refetchQuoteBalance } =
    useReadContract({
      address: quoteToken as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      query: {
        enabled: !!address && !!quoteToken,
      },
    });

  // Refetch order list when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetchOrderList();
      refetchBaseAllowance();
      refetchQuoteAllowance();
      refetchBaseBalance();
      refetchQuoteBalance();
    }
  }, [
    isConfirmed,
    refetchOrderList,
    refetchBaseAllowance,
    refetchQuoteAllowance,
    refetchBaseBalance,
    refetchQuoteBalance,
  ]);

  return {
    // Order book data
    orderBook,
    isLoadingOrders,

    // Actions
    placeLimitOrder,
    placeStopLimit,
    takeOrder,
    executeMarketOrder,
    cancelOrder,
    cancelStopLimit,
    approveToken,
    getOrderById,
    getStopOrderById,
    getOrderIdsForPair,
    executeBatch,

    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError,

    // Token data
    baseAllowance: baseAllowanceData,
    quoteAllowance: quoteAllowanceData,
    baseBalance: baseBalanceData,
    quoteBalance: quoteBalanceData,

    // Refetch functions
    refetchOrderList,
    refetchBaseAllowance,
    refetchQuoteAllowance,
    refetchBaseBalance,
    refetchQuoteBalance,
  };
}

/**
 * Helper function to format price from contract format to human-readable
 */
export function formatPrice(price: bigint): string {
  return formatUnits(price, 6); // PRICE_PRECISION is 1e6
}

/**
 * Helper function to format token amount
 */
export function formatTokenAmount(amount: bigint): string {
  return formatUnits(amount, STABLECOIN_DECIMALS);
}
