"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  FaExchangeAlt,
  FaRoute,
  FaArrowRight,
  FaInfoCircle,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";
import { getAllTokens, getTokenInfo, hasDirectPair } from "@/utils/pathfinding";
import { usePathfinding } from "@/hooks/usePathfinding";
import { useMultiHopSwap } from "@/hooks/useMultiHopSwap";
import { OrderType } from "@/constants";
import PathVisualizer from "@/components/PathVisualizer";

export default function TokenSwapPage() {
  const { address, isConnected } = useAccount();

  // Token selection
  const [fromToken, setFromToken] = useState<string>("");
  const [toToken, setToToken] = useState<string>("");
  const [inputAmount, setInputAmount] = useState<string>("");

  // Success alert state
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [swapDetails, setSwapDetails] = useState<{
    inputAmount: string;
    outputAmount: string;
    fromSymbol: string;
    toSymbol: string;
  } | null>(null);

  // Get pathfinding data
  const {
    bestPath,
    allPaths,
    isCalculating,
    isLoadingSnapshots,
    error,
    calculatePath,
  } = usePathfinding(fromToken, toToken);

  // For executing swaps
  const {
    executeMultiHopSwap,
    isExecuting,
    currentStep,
    executionError,
    transactionHash,
  } = useMultiHopSwap();

  const tokens = getAllTokens();
  const availableToTokens = tokens.filter((t) => t.address !== fromToken);

  // Calculate path when inputs change
  useEffect(() => {
    if (fromToken && toToken && inputAmount && Number(inputAmount) > 0) {
      // Enable debug logging
      calculatePath(inputAmount, true);
    }
  }, [fromToken, toToken, inputAmount, calculatePath]);

  // Swap token positions
  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  // Execute the swap
  const handleExecuteSwap = async () => {
    if (!bestPath || !isConnected || !inputAmount) return;

    try {
      const result = await executeMultiHopSwap(bestPath, inputAmount);

      if (result && result.success) {
        // Store swap details for success banner
        setSwapDetails({
          inputAmount: inputAmount,
          outputAmount: result.outputAmount || "0",
          fromSymbol: getTokenInfo(fromToken)?.symbol || "",
          toSymbol: getTokenInfo(toToken)?.symbol || "",
        });
        setShowSuccessAlert(true);

        // Auto-hide after 20 seconds
        setTimeout(() => {
          setShowSuccessAlert(false);
        }, 20000);

        // Reset form
        setInputAmount("");
      } else {
        alert(`Swap failed: ${result?.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error in handleExecuteSwap:", err);
      alert(
        `Swap failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  };

  const directPairExists =
    fromToken && toToken ? hasDirectPair(fromToken, toToken) : false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <FaRoute className="text-blue-500" />
            Token Swap
          </h1>
          <p className="text-gray-400">
            Find the best route to swap tokens with optimal pricing across
            multiple trading pairs
          </p>
        </div>

        {/* Success Alert */}
        {showSuccessAlert && swapDetails && (
          <div className="mb-6 bg-green-900/20 border-2 border-green-500 rounded-xl p-4 relative">
            <button
              onClick={() => setShowSuccessAlert(false)}
              className="absolute top-4 right-4 text-green-400 hover:text-green-300"
            >
              <FaTimes />
            </button>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <FaCheckCircle className="text-3xl text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-400 mb-2">
                  Swap Successful!
                </h3>
                <div className="text-gray-200 space-y-1">
                  <p>
                    <span className="font-semibold">Swapped:</span>{" "}
                    {swapDetails.inputAmount} {swapDetails.fromSymbol}
                  </p>
                  <p>
                    <span className="font-semibold">Received:</span>{" "}
                    {swapDetails.outputAmount} {swapDetails.toSymbol}
                  </p>
                  <p className="text-sm text-green-300 mt-2">
                    The tokens have been added to your wallet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Swap Input Panel */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-6">Swap Details</h2>

            {/* From Token */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                From
              </label>
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select token</option>
                {tokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.0"
                min="0"
                step="0.000001"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center my-4">
              <button
                onClick={handleSwapTokens}
                disabled={!fromToken || !toToken}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaExchangeAlt className="text-xl" />
              </button>
            </div>

            {/* To Token */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                To
              </label>
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                disabled={!fromToken}
              >
                <option value="">Select token</option>
                {availableToTokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Expected Output */}
            {bestPath && (
              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Expected Output</span>
                  <span className="text-2xl font-bold text-green-400">
                    {bestPath.expectedOutput}{" "}
                    {getTokenInfo(toToken)?.symbol || ""}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Exchange Rate</span>
                  <span className="text-gray-300">
                    {bestPath.totalCost.toFixed(6)}
                  </span>
                </div>
              </div>
            )}

            {/* Warning if direct pair doesn't exist */}
            {fromToken && toToken && !directPairExists && (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <FaInfoCircle className="text-yellow-500 mt-1 flex-shrink-0" />
                  <div className="text-sm text-yellow-200">
                    No direct trading pair exists between these tokens. The
                    router will find the best multi-hop path.
                  </div>
                </div>
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleExecuteSwap}
              disabled={
                !isConnected || !bestPath || isExecuting || isCalculating
              }
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition-colors"
            >
              {!isConnected
                ? "Connect Wallet"
                : isExecuting
                ? `Executing Step ${currentStep}/${
                    bestPath?.path.length || 0
                  }...`
                : isCalculating
                ? "Calculating Route..."
                : !bestPath
                ? "Enter amount to see route"
                : "Execute Swap"}
            </button>

            {executionError && (
              <div className="mt-4 bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-200 text-sm">
                Error: {executionError}
              </div>
            )}

            {transactionHash && (
              <div className="mt-4 bg-green-900/20 border border-green-700 rounded-lg p-4 text-green-200 text-sm">
                Swap executed successfully!
                <br />
                <a
                  href={`https://etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  View on Etherscan
                </a>
              </div>
            )}
          </div>

          {/* Route Visualization Panel */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-6">Trading Route</h2>

            {isLoadingSnapshots && (
              <div className="text-center py-12 text-gray-400">
                Loading order book data...
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-200 text-sm">
                Error loading data: {error.message}
              </div>
            )}

            {!isLoadingSnapshots &&
              !error &&
              !bestPath &&
              fromToken &&
              toToken &&
              inputAmount && (
                <div className="text-center py-12 text-gray-400">
                  <FaRoute className="text-4xl mx-auto mb-4 opacity-50" />
                  <p>No route found between these tokens.</p>
                  <p className="text-sm mt-2">
                    Try a different token pair or check if there's liquidity
                    available.
                  </p>
                </div>
              )}

            {!fromToken || !toToken ? (
              <div className="text-center py-12 text-gray-400">
                <FaRoute className="text-4xl mx-auto mb-4 opacity-50" />
                <p>Select tokens to see the optimal trading route</p>
              </div>
            ) : bestPath ? (
              <PathVisualizer
                path={bestPath}
                inputAmount={inputAmount}
                fromSymbol={getTokenInfo(fromToken)?.symbol || ""}
                toSymbol={getTokenInfo(toToken)?.symbol || ""}
              />
            ) : null}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-blue-400 font-semibold mb-2">
                1. Pathfinding
              </div>
              <p className="text-gray-400">
                The router analyzes all available trading pairs and finds the
                optimal route using Dijkstra's algorithm to maximize your
                output.
              </p>
            </div>
            <div>
              <div className="text-blue-400 font-semibold mb-2">
                2. Price Discovery
              </div>
              <p className="text-gray-400">
                Each step uses the best available prices from the order book to
                ensure you get the most favorable exchange rate.
              </p>
            </div>
            <div>
              <div className="text-blue-400 font-semibold mb-2">
                3. Execution
              </div>
              <p className="text-gray-400">
                The swap is executed as a series of trades across multiple
                pairs, automatically handling all intermediate tokens.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
