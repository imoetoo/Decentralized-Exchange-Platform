import { useState, useCallback } from "react";
import {
  useAccount,
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
  OrderType,
} from "@/constants";
import { TradingPath, PathStep, AVAILABLE_PAIRS } from "@/utils/pathfinding";

interface SwapStep {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  action: OrderType;
}

interface OrderBookOrder {
  id: bigint;
  price: bigint;
  amount: bigint;
  filled: bigint;
  active: boolean;
}

export function useMultiHopSwap() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [currentStep, setCurrentStep] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  /**
   * Approve a token for spending by the DEX contract
   */
  const approveToken = useCallback(
    async (
      tokenAddress: string,
      amount: string,
      decimals: number = STABLECOIN_DECIMALS
    ) => {
      if (!address || !publicClient) {
        throw new Error("Wallet not connected");
      }

      const amountWei = parseUnits(amount, decimals);

      // Check current allowance
      const currentAllowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, DEX_CONTRACT_ADDRESS],
      });

      // Only approve if needed
      if (currentAllowance < amountWei) {
        const hash = await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [DEX_CONTRACT_ADDRESS, amountWei],
        });

        // Wait for approval transaction to confirm
        await publicClient.waitForTransactionReceipt({ hash });
      }
    },
    [address, publicClient, writeContractAsync]
  );

  /**
   * Find the best order for a given step and execute it
   */
  const executeSwapStep = useCallback(
    async (
      step: PathStep,
      inputAmount: string,
      decimals: number = STABLECOIN_DECIMALS
    ) => {
      if (!address || !publicClient) {
        throw new Error("Wallet not connected");
      }

      // Validate step data
      if (!step.fromToken || !step.toToken) {
        throw new Error(
          `Invalid step: missing token addresses. From: ${step.fromToken}, To: ${step.toToken}`
        );
      }

      // Find the trading pair for this step
      const pair = AVAILABLE_PAIRS.find(
        (p) =>
          (p.baseToken.toLowerCase() === step.fromToken.toLowerCase() &&
            p.quoteToken.toLowerCase() === step.toToken.toLowerCase()) ||
          (p.baseToken.toLowerCase() === step.toToken.toLowerCase() &&
            p.quoteToken.toLowerCase() === step.fromToken.toLowerCase())
      );

      if (!pair) {
        throw new Error(
          `No trading pair found for ${step.fromSymbol}/${step.toSymbol}`
        );
      }

      const baseToken = pair.baseToken as `0x${string}`;
      const quoteToken = pair.quoteToken as `0x${string}`;

      // Get the order book for this trading pair
      const [buyOrders, sellOrders] = (await publicClient.readContract({
        address: DEX_CONTRACT_ADDRESS as `0x${string}`,
        abi: DEX_ABI,
        functionName: "getList",
        args: [baseToken, quoteToken],
      })) as [readonly bigint[], readonly bigint[]];

      // Get the order details we need
      const ordersToCheck =
        step.direction === "buy"
          ? Array.from(sellOrders)
          : Array.from(buyOrders);

      if (ordersToCheck.length === 0) {
        throw new Error(
          `No ${step.direction} orders available for ${step.fromSymbol}/${step.toSymbol}`
        );
      }

      // Get details of the first (best) order
      const bestOrderId = ordersToCheck[0];

      const orderDetails = (await publicClient.readContract({
        address: DEX_CONTRACT_ADDRESS as `0x${string}`,
        abi: DEX_ABI,
        functionName: "orders",
        args: [bestOrderId],
      })) as any;

      // Order struct: [id, trader, action, base, quote, amount, filled, price, ts, active]
      const orderId = orderDetails[0];
      const orderAmount = orderDetails[5];
      const orderFilled = orderDetails[6];
      const orderPrice = orderDetails[7];
      const orderActive = orderDetails[9];

      if (!orderActive) {
        throw new Error(`Order ${bestOrderId} is not active`);
      }

      // Calculate how much base token we need to take from the order
      const inputAmountWei = parseUnits(inputAmount, decimals);

      // IMPORTANT: In the contract, PRICE_PRECISION is 10^18
      // But the seeded orders have prices in 6 decimals instead of 18 decimals
      // So we need to adjust our calculation accordingly
      const PRICE_PRECISION = BigInt("1000000000000000000"); // 10^18 (what contract expects)
      const ACTUAL_PRICE_DECIMALS = BigInt("1000000"); // 10^6 (what the seeded data has)

      // Scale the order price to proper PRICE_PRECISION
      const adjustedPrice =
        orderPrice * (PRICE_PRECISION / ACTUAL_PRICE_DECIMALS);

      let baseAmount: bigint;
      let requiredQuoteAmount: bigint;

      if (step.direction === "buy") {
        // We're buying base with quote (spending our quote tokens)
        // From contract: quoteAmount = (baseAmount * price) / PRICE_PRECISION
        // So: baseAmount = (quoteAmount * PRICE_PRECISION) / price
        const numerator = inputAmountWei * PRICE_PRECISION;
        baseAmount = numerator / adjustedPrice;
        requiredQuoteAmount = inputAmountWei;
      } else {
        // We're selling base for quote (spending our base tokens)
        baseAmount = inputAmountWei;
        requiredQuoteAmount = (baseAmount * adjustedPrice) / PRICE_PRECISION;
      }

      // Make sure the order has enough liquidity
      const available = BigInt(orderAmount) - BigInt(orderFilled);

      if (baseAmount === BigInt(0)) {
        throw new Error(
          `Calculated baseAmount is 0. This might mean the input amount is too small. ` +
            `Input: ${formatUnits(
              inputAmountWei,
              decimals
            )}, Price: ${formatUnits(adjustedPrice, 18)}`
        );
      }

      if (baseAmount > available) {
        throw new Error(
          `Insufficient liquidity: Order only has ${formatUnits(
            available,
            decimals
          )} ` + `but we need ${formatUnits(baseAmount, decimals)}`
        );
      }

      // Execute the order
      const hash = await writeContractAsync({
        address: DEX_CONTRACT_ADDRESS as `0x${string}`,
        abi: DEX_ABI,
        functionName: "takeOrder",
        args: [bestOrderId, baseAmount],
      });

      // Wait for transaction to confirm
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Calculate actual output amount
      // Remember: adjustedPrice = orderPrice * (10^18 / 10^6) for the calculation
      // But for the actual contract, orderPrice is the raw value in 6 decimals
      let outputAmount: bigint;
      if (step.direction === "buy") {
        // When buying, we spend quote and get base
        // The baseAmount is what we receive
        outputAmount = baseAmount;
      } else {
        // When selling, we spend base and get quote
        // quoteAmount = (baseAmount * price) / PRICE_PRECISION
        // But we need to use the ADJUSTED price since we're working in the proper scale
        outputAmount = (baseAmount * adjustedPrice) / PRICE_PRECISION;
      }

      return formatUnits(outputAmount, decimals);
    },
    [address, publicClient, writeContractAsync]
  );

  /**
   * Execute a full multi-hop swap path
   */
  const executeMultiHopSwap = useCallback(
    async (path: TradingPath, inputAmount: string) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      setIsExecuting(true);
      setExecutionError(null);
      setCurrentStep(0);
      setTransactionHash(null);

      try {
        // Step 1: Approve the first token
        const firstStep = path.path[0];
        const firstTokenAddress = firstStep.fromToken; // Always approve the token we're spending

        await approveToken(firstTokenAddress, inputAmount);

        // Step 2: Execute each swap in the path
        let currentAmount = inputAmount;

        for (let i = 0; i < path.path.length; i++) {
          setCurrentStep(i + 1);
          const step = path.path[i];

          // If not the first step, we need to approve the intermediate token
          if (i > 0) {
            const tokenToApprove = step.fromToken; // Approve the token we're spending in this step
            await approveToken(tokenToApprove, currentAmount);
          }

          // Execute the swap for this step
          const outputAmount = await executeSwapStep(step, currentAmount);

          // Update current amount for next step
          currentAmount = outputAmount;
        }

        setIsExecuting(false);
        return {
          success: true,
          outputAmount: currentAmount,
        };
      } catch (err) {
        console.error("Error executing multi-hop swap:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setExecutionError(errorMessage);
        setIsExecuting(false);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [address, approveToken, executeSwapStep]
  );

  return {
    executeMultiHopSwap,
    approveToken,
    isExecuting,
    currentStep,
    executionError,
    transactionHash,
  };
}

/**
 * Helper function to convert a trading path into batch execution orders
 * This is useful if you want to execute the entire path as a single batch transaction
 */
export function pathToBatchOrders(path: TradingPath): bigint[] {
  // This would need to map the path to actual order IDs from the order book
  // For now, return empty array as placeholder
  return [];
}

/**
 * Calculate the minimum output amount with slippage protection
 */
export function calculateMinOutput(
  expectedOutput: string,
  slippagePercent: number
): string {
  const expected = parseFloat(expectedOutput);
  const minOutput = expected * (1 - slippagePercent / 100);
  return minOutput.toFixed(6);
}
