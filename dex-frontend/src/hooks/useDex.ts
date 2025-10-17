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
   * Get token balance
   */
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!baseToken,
    },
  });

  // Refetch order list when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetchOrderList();
      refetchBaseAllowance();
      refetchQuoteAllowance();
      refetchBalance();
    }
  }, [
    isConfirmed,
    refetchOrderList,
    refetchBaseAllowance,
    refetchQuoteAllowance,
    refetchBalance,
  ]);

  return {
    // Order book data
    orderBook,
    isLoadingOrders,

    // Actions
    placeLimitOrder,
    cancelOrder,
    approveToken,

    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError,

    // Token data
    baseAllowance: baseAllowanceData,
    quoteAllowance: quoteAllowanceData,
    balance: balanceData,

    // Refetch functions
    refetchOrderList,
    refetchBaseAllowance,
    refetchQuoteAllowance,
    refetchBalance,
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
