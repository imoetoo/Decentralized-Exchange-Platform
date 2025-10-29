import { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { ERC20_ABI, STABLECOIN_DECIMALS } from "@/constants";
import deployments from "@/deployments.json";

export interface TokenBalance {
  symbol: string;
  address: string;
  balance: string;
  balanceRaw: bigint;
  decimals: number;
}

// Token configuration with names and addresses
const TOKENS = [
  { symbol: "USDT", address: deployments["TokensModule#MockUSDT"] },
  { symbol: "USDC", address: deployments["TokensModule#MockUSDC"] },
  { symbol: "DAI", address: deployments["TokensModule#MockDAI"] },
  { symbol: "WETH", address: deployments["TokensModule#MockWETH"] },
  { symbol: "WBTC", address: deployments["TokensModule#MockWBTC"] },
  { symbol: "EIGEN", address: deployments["TokensModule#MockEIGEN"] },
  { symbol: "PEPE", address: deployments["TokensModule#MockPEPE"] },
];

/**
 * Custom hook to fetch token balances for the connected wallet
 * Only returns tokens with non-zero balances
 */
export function useTokenBalances() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !publicClient) {
        setBalances([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const balancePromises = TOKENS.map(async (token) => {
          try {
            // Fetch balance
            const balance = (await publicClient.readContract({
              address: token.address as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [address],
            })) as bigint;

            // Fetch decimals (most tokens use 6, but let's be thorough)
            let decimals = STABLECOIN_DECIMALS;
            try {
              const tokenDecimals = (await publicClient.readContract({
                address: token.address as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "decimals",
              })) as number;
              decimals = tokenDecimals;
            } catch (e) {
              // If decimals call fails, use default
              console.warn(
                `Could not fetch decimals for ${token.symbol}, using default ${STABLECOIN_DECIMALS}`
              );
            }

            // Only return tokens with non-zero balance
            if (balance > BigInt(0)) {
              return {
                symbol: token.symbol,
                address: token.address,
                balance: formatUnits(balance, decimals),
                balanceRaw: balance,
                decimals,
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching balance for ${token.symbol}:`, error);
            return null;
          }
        });

        const results = await Promise.all(balancePromises);
        const nonZeroBalances = results.filter(
          (balance): balance is TokenBalance => balance !== null
        );

        // Sort by balance value (descending)
        nonZeroBalances.sort((a, b) => {
          const aValue = parseFloat(a.balance);
          const bValue = parseFloat(b.balance);
          return bValue - aValue;
        });

        setBalances(nonZeroBalances);
      } catch (err) {
        console.error("Error fetching token balances:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [address, publicClient]);

  return {
    balances,
    isLoading,
    error,
  };
}
