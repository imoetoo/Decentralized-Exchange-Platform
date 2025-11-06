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

      // Determine which orders to use based on what we're spending
      // If we're spending the base token (fromToken == baseToken), we take BUY orders
      // If we're spending the quote token (fromToken == quoteToken), we take SELL orders
      const isSpendingBase =
        step.fromToken.toLowerCase() === baseToken.toLowerCase();
      const ordersToCheck = isSpendingBase
        ? Array.from(buyOrders) // Spend base, get quote
        : Array.from(sellOrders); // Spend quote, get base

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
      const orderTrader = orderDetails[1];
      const orderAction = orderDetails[2]; // 0 = BUY, 1 = SELL
      const orderBase = orderDetails[3];
      const orderQuote = orderDetails[4];
      const orderAmount = orderDetails[5];
      const orderFilled = orderDetails[6];
      const orderPrice = orderDetails[7];
      const orderActive = orderDetails[9];

      if (!orderActive) {
        throw new Error(`Order ${bestOrderId} is not active`);
      }

      // Calculate how much base token we need to take from the order
      const inputAmountWei = parseUnits(inputAmount, decimals);

      console.log("=== SWAP STEP CALCULATION DEBUG ===");
      console.log("Direction:", step.direction);
      console.log("From:", step.fromSymbol, "To:", step.toSymbol);
      console.log("Pair - Base:", baseToken, "Quote:", quoteToken);
      console.log("Input amount (string):", inputAmount);
      console.log("Input decimals:", decimals);
      console.log("Input amount (wei):", inputAmountWei.toString());
      console.log("Order ID:", bestOrderId.toString());
      console.log("Order action:", orderAction === BigInt(0) ? "BUY" : "SELL");
      console.log("Order base:", orderBase);
      console.log("Order quote:", orderQuote);
      console.log("Order price (from contract):", orderPrice.toString());
      console.log("Order amount:", orderAmount.toString());
      console.log("Order filled:", orderFilled.toString());
      console.log("Order remain:", (orderAmount - orderFilled).toString());

      // IMPORTANT: The order prices are stored with 6 decimals in the seeded data
      // Price represents: "quote token amount per base token amount"
      // For example: price = 255 means each 1 (in base units) of USDC costs 255 (in base units) of WETH
      // Which translates to: 0.000255 WETH per 1 USDC in decimal representation

      let baseAmount: bigint;
      let requiredQuoteAmount: bigint;

      // The calculation depends on which token we're spending
      if (isSpendingBase) {
        // We're spending base token, getting quote token
        // This means we're taking a BUY order (someone buying base with quote)
        // baseAmount = what we're giving (our input)
        // quoteAmount = what we're getting (calculated from price)
        console.log("Spending BASE token:");
        baseAmount = inputAmountWei;
        requiredQuoteAmount = (baseAmount * orderPrice) / BigInt(1000000);
        console.log("  baseAmount (spending):", baseAmount.toString());
        console.log(
          "  requiredQuoteAmount (receiving) = (baseAmount * orderPrice) / 1000000"
        );
        console.log(
          "  = (",
          baseAmount.toString(),
          "*",
          orderPrice.toString(),
          ") / 1000000"
        );
        console.log("  = ", requiredQuoteAmount.toString());
      } else {
        // We're spending quote token, getting base token
        // This means we're taking a SELL order (someone selling base for quote)
        // quoteAmount = what we're giving (our input)
        // baseAmount = what we're getting (calculated from price)
        console.log("Spending QUOTE token:");
        requiredQuoteAmount = inputAmountWei;
        baseAmount = (inputAmountWei * BigInt(1000000)) / orderPrice;
        console.log(
          "  requiredQuoteAmount (spending):",
          requiredQuoteAmount.toString()
        );
        console.log(
          "  baseAmount (receiving) = (quoteAmount * 1000000) / orderPrice"
        );
        console.log(
          "  = (",
          inputAmountWei.toString(),
          "* 1000000 ) /",
          orderPrice.toString()
        );
        console.log("  = ", baseAmount.toString());
      }
      console.log("Final baseAmount to take:", baseAmount.toString());
      console.log("=== END DEBUG ===");

      // Make sure the order has enough liquidity
      const available = BigInt(orderAmount) - BigInt(orderFilled);

      if (baseAmount === BigInt(0)) {
        throw new Error(
          `Calculated baseAmount is 0. This might mean the input amount is too small. ` +
            `Input: ${formatUnits(
              inputAmountWei,
              decimals
            )}, Price: ${formatUnits(orderPrice, 6)}`
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

      console.log("About to call takeOrder:");
      console.log("  Order ID:", bestOrderId.toString());
      console.log("  BaseAmount:", baseAmount.toString());
      console.log(
        "  This means we're taking",
        baseAmount.toString(),
        "base units from the order"
      );

      // The contract will expect us to transfer:
      // If order.action == SELL: we send quoteAmount of quoteToken, receive baseAmount of baseToken
      // If order.action == BUY: we send baseAmount of baseToken, receive quoteAmount of quoteToken
      if (orderAction === BigInt(1)) {
        // SELL order
        console.log(
          "  We need to send:",
          requiredQuoteAmount.toString(),
          "quote tokens"
        );
        console.log("  We will receive:", baseAmount.toString(), "base tokens");
      } else {
        // BUY order
        console.log("  We need to send:", baseAmount.toString(), "base tokens");
        console.log(
          "  We will receive:",
          requiredQuoteAmount.toString(),
          "quote tokens"
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

      // Calculate actual output amount based on what we receive
      let outputAmount: bigint;
      if (isSpendingBase) {
        // We spent base, we received quote
        outputAmount = requiredQuoteAmount;
      } else {
        // We spent quote, we received base
        outputAmount = baseAmount;
      }

      // Return the formatted output amount
      const formattedOutput = formatUnits(outputAmount, decimals);
      return formattedOutput;
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

          console.log(`Step ${i + 1} executed:`);
          console.log(`  Input: ${currentAmount} ${step.fromSymbol}`);
          console.log(`  Output: ${outputAmount} ${step.toSymbol}`);

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
