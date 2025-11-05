import { FaArrowRight, FaExchangeAlt } from "react-icons/fa";
import { TradingPath, PathStep, formatPrice } from "@/utils/pathfinding";

interface PathVisualizerProps {
  path: TradingPath;
  inputAmount: string;
  fromSymbol: string;
  toSymbol: string;
}

export default function PathVisualizer({
  path,
  inputAmount,
  fromSymbol,
  toSymbol,
}: PathVisualizerProps) {
  return (
    <div className="space-y-4">
      {/* Visual Path Flow */}
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Trading Path</h3>
          <span className="text-sm text-gray-400">
            {path.path.length} step{path.path.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Path Steps */}
        <div className="space-y-3">
          {path.path.map((step, index) => (
            <div key={index}>
              {/* Step Card */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <span className="text-blue-400">{step.fromSymbol}</span>
                      <FaArrowRight className="text-gray-500 text-sm" />
                      <span className="text-green-400">{step.toSymbol}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-gray-900 text-gray-300 font-medium">
                      {step.direction === "buy" ? "BUY" : "SELL"}
                    </span>
                  </div>
                </div>

                {/* Step Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Exchange Rate</span>
                    <div className="font-mono font-medium mt-1">
                      {formatPrice(step.price)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Expected Output</span>
                    <div className="font-mono font-medium mt-1 text-green-400">
                      {parseFloat(step.expectedOutput).toFixed(6)}{" "}
                      {step.toSymbol}
                    </div>
                  </div>
                </div>

                {/* Direction Explanation */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    {step.direction === "buy" ? (
                      <>
                        Buy{" "}
                        <span className="text-blue-400">{step.toSymbol}</span>{" "}
                        with{" "}
                        <span className="text-blue-400">{step.fromSymbol}</span>
                      </>
                    ) : (
                      <>
                        Sell{" "}
                        <span className="text-blue-400">{step.fromSymbol}</span>{" "}
                        for{" "}
                        <span className="text-blue-400">{step.toSymbol}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Connector Arrow */}
              {index < path.path.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-gray-700"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Bar */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaExchangeAlt className="text-blue-400" />
              <span className="text-sm text-gray-400">Total Exchange</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">
                {inputAmount} {fromSymbol}
              </div>
              <FaArrowRight className="inline-block text-xs text-gray-600 mx-2" />
              <div className="text-lg font-bold text-green-400">
                {parseFloat(path.expectedOutput).toFixed(6)} {toSymbol}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Number of Hops</div>
          <div className="text-2xl font-bold">{path.path.length}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Effective Rate</div>
          <div className="text-2xl font-bold">{path.totalCost.toFixed(2)}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Route Efficiency</div>
          <div className="text-2xl font-bold text-green-400">
            {path.path.length === 1
              ? "Direct"
              : path.path.length === 2
              ? "Good"
              : "Fair"}
          </div>
        </div>
      </div>
    </div>
  );
}
