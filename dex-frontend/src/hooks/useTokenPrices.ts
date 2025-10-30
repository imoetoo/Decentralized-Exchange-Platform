import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import {
  DEX_CONTRACT_ADDRESS,
  DEX_ABI,
  USDC_ADDRESS,
  USDT_ADDRESS,
  STABLECOIN_DECIMALS,
} from "@/constants";

interface TokenPrice {
  address: string;
  symbol: string;
  priceInUSD: number;
}

/**
 * Custom hook to fetch token prices from the DEX order book
 * Price is determined by the highest bid (buy order) price
 */
export function useTokenPrices(tokens: { address: string; symbol: string }[]) {
  const publicClient = usePublicClient();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      if (!publicClient || tokens.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const priceMap: Record<string, number> = {};

        // USDC and USDT are our base currencies ($1 each)
        priceMap[USDC_ADDRESS.toLowerCase()] = 1;
        priceMap[USDT_ADDRESS.toLowerCase()] = 1;

        // Fetch prices for each token
        for (const token of tokens) {
          // Skip if it's USDC or USDT
          if (
            token.address.toLowerCase() === USDC_ADDRESS.toLowerCase() ||
            token.address.toLowerCase() === USDT_ADDRESS.toLowerCase()
          ) {
            continue;
          }

          try {
            let priceFound = false;

            // Try TOKEN/USDC pair first
            try {
              const orderListData = await publicClient.readContract({
                address: DEX_CONTRACT_ADDRESS,
                abi: DEX_ABI,
                functionName: "getList",
                args: [token.address as `0x${string}`, USDC_ADDRESS],
              });

              const [buyOrderIds] = orderListData as [bigint[], bigint[]];

              if (buyOrderIds.length > 0) {
                const orderData = await publicClient.readContract({
                  address: DEX_CONTRACT_ADDRESS,
                  abi: DEX_ABI,
                  functionName: "orders",
                  args: [buyOrderIds[0]],
                });

                const order = orderData as any;
                const isActive = order[9] as boolean;

                if (isActive) {
                  const price = order[7] as bigint;
                  const priceInUSD = parseFloat(formatUnits(price, 6));
                  console.log(`Price for ${token.symbol}/USDC: ${priceInUSD}`);
                  priceMap[token.address.toLowerCase()] = priceInUSD;
                  priceFound = true;
                }
              }
            } catch (err) {
              console.log(`No ${token.symbol}/USDC orders`);
            }

            // If not found, try TOKEN/USDT pair
            if (!priceFound) {
              try {
                const orderListData = await publicClient.readContract({
                  address: DEX_CONTRACT_ADDRESS,
                  abi: DEX_ABI,
                  functionName: "getList",
                  args: [token.address as `0x${string}`, USDT_ADDRESS],
                });

                const [buyOrderIds] = orderListData as [bigint[], bigint[]];

                if (buyOrderIds.length > 0) {
                  const orderData = await publicClient.readContract({
                    address: DEX_CONTRACT_ADDRESS,
                    abi: DEX_ABI,
                    functionName: "orders",
                    args: [buyOrderIds[0]],
                  });

                  const order = orderData as any;
                  const isActive = order[9] as boolean;

                  if (isActive) {
                    const price = order[7] as bigint;
                    const priceInUSD = parseFloat(formatUnits(price, 6));
                    console.log(
                      `Price for ${token.symbol}/USDT: ${priceInUSD}`
                    );
                    priceMap[token.address.toLowerCase()] = priceInUSD;
                    priceFound = true;
                  }
                }
              } catch (err) {
                console.log(`No ${token.symbol}/USDT orders`);
              }
            }

            // If still not found, try inverse pairs (USDC/TOKEN or USDT/TOKEN)
            if (!priceFound) {
              // Try USDC/TOKEN
              try {
                const orderListData = await publicClient.readContract({
                  address: DEX_CONTRACT_ADDRESS,
                  abi: DEX_ABI,
                  functionName: "getList",
                  args: [USDC_ADDRESS, token.address as `0x${string}`],
                });

                const [buyOrderIds] = orderListData as [bigint[], bigint[]];

                if (buyOrderIds.length > 0) {
                  const orderData = await publicClient.readContract({
                    address: DEX_CONTRACT_ADDRESS,
                    abi: DEX_ABI,
                    functionName: "orders",
                    args: [buyOrderIds[0]],
                  });

                  const order = orderData as any;
                  const isActive = order[9] as boolean;

                  if (isActive) {
                    const price = order[7] as bigint;
                    const inversePrice = parseFloat(formatUnits(price, 6));
                    // Invert the price: if 1 USDC = 0.00082 WBTC, then 1 WBTC = 1/0.00082
                    const priceInUSD = 1 / inversePrice;
                    console.log(
                      `Price for USDC/${token.symbol}: ${inversePrice}, inverted: ${priceInUSD}`
                    );
                    priceMap[token.address.toLowerCase()] = priceInUSD;
                    priceFound = true;
                  }
                }
              } catch (err) {
                console.log(`No USDC/${token.symbol} orders`);
              }
            }

            // Try USDT/TOKEN if still not found
            if (!priceFound) {
              try {
                const orderListData = await publicClient.readContract({
                  address: DEX_CONTRACT_ADDRESS,
                  abi: DEX_ABI,
                  functionName: "getList",
                  args: [USDT_ADDRESS, token.address as `0x${string}`],
                });

                const [buyOrderIds] = orderListData as [bigint[], bigint[]];

                if (buyOrderIds.length > 0) {
                  const orderData = await publicClient.readContract({
                    address: DEX_CONTRACT_ADDRESS,
                    abi: DEX_ABI,
                    functionName: "orders",
                    args: [buyOrderIds[0]],
                  });

                  const order = orderData as any;
                  const isActive = order[9] as boolean;

                  if (isActive) {
                    const price = order[7] as bigint;
                    const inversePrice = parseFloat(formatUnits(price, 6));
                    const priceInUSD = 1 / inversePrice;
                    console.log(
                      `Price for USDT/${token.symbol}: ${inversePrice}, inverted: ${priceInUSD}`
                    );
                    priceMap[token.address.toLowerCase()] = priceInUSD;
                    priceFound = true;
                  }
                }
              } catch (err) {
                console.log(`No USDT/${token.symbol} orders`);
              }
            }

            if (!priceFound) {
              console.log(`No price found for ${token.symbol}`);
              priceMap[token.address.toLowerCase()] = 0;
            }
          } catch (err) {
            console.error(`Error fetching price for ${token.symbol}:`, err);
            priceMap[token.address.toLowerCase()] = 0;
          }
        }

        setPrices(priceMap);
      } catch (err) {
        console.error("Error fetching token prices:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();

    // Refetch prices every 10 seconds
    const interval = setInterval(fetchPrices, 10000);

    return () => clearInterval(interval);
  }, [publicClient, tokens]);

  return { prices, isLoading, error };
}
