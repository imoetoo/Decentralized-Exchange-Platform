# Batch Execution Solver

An off-chain solver bot that finds and executes profitable circular arbitrage opportunities in the DEX.

## How It Works

The solver continuously monitors the order book for circular SELL order paths and executes profitable batches automatically.

### Example Cycle
```
Order 1: USDC → USDT (sell USDC for USDT)
Order 2: USDT → ETH  (sell USDT for ETH) 
Order 3: ETH → USDC  (sell ETH for USDC)
```

If the combined price ratio > 1.0 (after fees and gas), the solver executes the batch.

## Features

- 🔄 **Cycle Detection**: Finds circular paths of SELL orders up to 7 tokens long
- 💰 **Profitability Analysis**: Calculates expected profit vs gas costs
- ⚡ **Real-time Monitoring**: Listens to order events for immediate opportunities
- 🛡️ **Gas Protection**: Skips execution when gas prices are too high
- 🎯 **Smart Rewards**: Batch executor receives a portion of the first token as reward

## Usage

### 1. Test the Logic
```bash
npm run test-solver
```

### 2. Run the Solver
```bash
npm run solver
```

### 3. Monitor Output
The solver will:
- Load existing orders
- Set up event listeners
- Scan for cycles every 30 seconds
- Execute profitable batches automatically

## Configuration

Edit `batchSolver.js` to adjust:

- `minProfitThreshold`: Minimum profit required (default: 0.001 USDC)
- `maxGasPrice`: Maximum gas price for execution (default: 50 gwei)
- `batchExecutorRewardPercent`: Reward percentage from contract (0.5%)

## Requirements

1. **Running DEX**: Local hardhat node with deployed contracts
2. **Funded Account**: Solver needs ETH for gas fees
3. **Active Orders**: SELL orders forming potential cycles

## How Rewards Work

When the solver executes a batch:
1. It gets rewarded with `batchExecutorRewardPercent` of the first token in the cycle
2. This comes from the locked tokens already in the contract
3. Default reward is 0.5% of the first token amount

## Example Output

```
🤖 Starting Batch Solver...
Loaded 5 tokens
Loaded 12 orders across 8 pairs
Setting up event listeners...

✅ Found profitable cycle:
  Orders: [15, 23, 31]
  Expected Profit: 0.0123 USDC
  Optimal Amount: 100.0 USDC

🚀 Batch execution submitted: 0x1234...
✅ Batch executed successfully in block 1234567
💰 Reward received: 0.5 USDC
```

## Troubleshooting

### "No cycles found"
- Check if you have SELL orders that form circular paths
- Run `npm run seed` to create test orders
- Verify orders are active with `npm run checkOrder`

### "Gas price too high"
- Increase `maxGasPrice` in the solver config
- Wait for lower gas prices
- Check network congestion

### "Not profitable"
- Lower `minProfitThreshold` for testing
- Check if prices create arbitrage opportunities
- Ensure orders have sufficient remaining amounts

## Development

The solver is modular and can be extended:

- `findCycles()`: Improve cycle detection algorithms
- `calculateProfitability()`: Add better price feed integration  
- `executeBatch()`: Add transaction retry logic
- `convertToUSD()`: Integrate real price oracles

## Security Notes

- The solver only executes existing orders, it cannot drain funds
- Gas estimation prevents overspending on failed transactions
- Event listening ensures real-time opportunity detection
- All batch executions are transparent on-chain