const { ethers } = require("hardhat");
const fs = require('fs');

class BatchSolver {
    constructor(dexContract, provider, wallet) {
        this.dex = dexContract;
        this.provider = provider;
        this.wallet = wallet;
        this.tokens = new Map(); // tokenAddress -> tokenInfo
        this.orders = new Map(); // orderId -> orderInfo
        this.orderBooks = new Map(); // pairKey -> {buyOrders, sellOrders}
        this.minProfitThreshold = ethers.parseUnits("0.001", 6); // Minimum profit in USDC units
        this.maxGasPrice = ethers.parseUnits("50", "gwei");
        this.lastCheckHash = null; // Cache to avoid redundant checks
    }

    async initialize() {
        console.log("Initializing Batch Solver...");
        
        // Load token information
        await this.loadTokens();
        
        // Load existing orders
        await this.loadOrders();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log("Batch Solver initialized successfully");
    }

    async loadTokens() {
        // Load from deployments file
        try {
            const deploymentsPath = './ignition/deployments/chain-31337/deployed_addresses.json';
            const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
            
            // Extract token addresses from deployment file
            for (const [key, address] of Object.entries(deployments)) {
                if (key.startsWith('TokensModule#Mock')) {
                    const symbol = key.replace('TokensModule#Mock', '');
                    this.tokens.set(address.toLowerCase(), {
                        name: symbol,
                        address: address,
                        decimals: 6 // Assuming all tokens have 6 decimals
                    });
                }
            }
            console.log(`Loaded ${this.tokens.size} tokens:`, Array.from(this.tokens.values()).map(t => t.name).join(', '));
        } catch (error) {
            console.error("Error loading tokens:", error);
        }
    }

    async loadOrders() {
        console.log("Loading existing orders...");
        
        // Get the next order ID to know how many orders exist
        const nextOrderId = await this.dex.nextOrderId();
        const maxOrderId = Number(nextOrderId);
        
        console.log(`Scanning orders 1 to ${maxOrderId - 1}...`);
        
        // Load orders directly by ID (more efficient than scanning all pairs)
        for (let i = 1; i < maxOrderId; i++) {
            try {
                const order = await this.dex.orders(i);
                if (order.active && Number(order.action) === 1) { // Only SELL orders
                    await this.loadOrderDetails(i);
                }
            } catch (error) {
                // Order might not exist, continue
            }
        }
        
        console.log(`Loaded ${this.orders.size} active SELL orders`);
    }

    async loadOrderDetails(orderId) {
        try {
            const order = await this.dex.orders(orderId);
            if (order.active) {
                this.orders.set(orderId, {
                    id: orderId,
                    trader: order.trader,
                    action: Number(order.action), // Convert BigInt to number: 0 = BUY, 1 = SELL
                    base: order.base.toLowerCase(),
                    quote: order.quote.toLowerCase(),
                    amount: order.amount,
                    filled: order.filled,
                    price: order.price,
                    active: order.active
                });
            }
        } catch (error) {
            console.error(`Error loading order ${orderId}:`, error.message);
        }
    }

    setupEventListeners() {
        console.log("Setting up event listeners...");
        
        // Listen for new orders
        this.dex.on("NewOrder", async (id, trader, action, base, quote, amount, price) => {
            console.log(`📋 New order detected: ${id}`);
            await this.loadOrderDetails(Number(id));
            
            // Only check if it's a SELL order (batch execution only works with SELL orders)
            if (Number(action) === 1) {
                console.log("🔄 New SELL order - checking for batch opportunities...");
                setTimeout(() => this.checkForBatchOpportunities(), 1000); // Small delay to avoid rapid calls
            }
        });
        
        // Listen for order fills/closures
        this.dex.on("OrderClosed", (orderId) => {
            console.log(`Order closed: ${orderId}`);
            this.orders.delete(Number(orderId));
        });
        
        // Listen for order cancellations
        this.dex.on("OrderCancelled", (orderId) => {
            console.log(`Order cancelled: ${orderId}`);
            this.orders.delete(Number(orderId));
        });
    }

    getPairKey(base, quote) {
        return `${base.toLowerCase()}-${quote.toLowerCase()}`;
    }

    async checkForBatchOpportunities() {
        // Get all active SELL orders
        const sellOrders = Array.from(this.orders.values()).filter(
            order => order.action === 1 && order.active // 1 = SELL
        );
        
        if (sellOrders.length < 2) {
            console.log("Not enough sell orders for batch execution");
            return;
        }
        
        // Create a simple hash of current order state to avoid redundant checks
        const currentHash = sellOrders.map(o => `${o.id}-${o.filled}`).join(',');
        if (currentHash === this.lastCheckHash) {
            console.log("📄 No changes since last check, skipping...");
            return;
        }
        this.lastCheckHash = currentHash;
        
        console.log(`🔍 Checking ${sellOrders.length} SELL orders for batch opportunities...`);
        
        // Try to find cycles of different lengths
        for (let cycleLength = 2; cycleLength <= Math.min(7, sellOrders.length); cycleLength++) {
            const cycles = this.findCycles(sellOrders, cycleLength);
            
            for (const cycle of cycles) {
                const profitability = await this.calculateProfitability(cycle);
                
                if (profitability.profitable) {
                    console.log(`Found profitable cycle:`, {
                        orders: cycle.map(o => o.id),
                        expectedProfit: ethers.formatUnits(profitability.profit, 6),
                        optimalAmount: ethers.formatUnits(profitability.optimalAmount, 6)
                    });
                    
                    await this.executeBatch(cycle, profitability.optimalAmount);
                    return; // Execute one batch at a time
                }
            }
        }
        
        console.log("No profitable cycles found");
    }

    findCycles(sellOrders, targetLength) {
        const cycles = [];
        
        // Try all combinations of orders to find circular paths
        const findCyclesRecursive = (currentPath, remainingOrders, startToken) => {
            if (currentPath.length === targetLength) {
                // Check if we can close the cycle
                const lastOrder = currentPath[currentPath.length - 1];
                if (lastOrder.quote === startToken) {
                    cycles.push([...currentPath]);
                }
                return;
            }
            
            const lastToken = currentPath.length > 0 ? 
                currentPath[currentPath.length - 1].quote : 
                startToken;
            
            for (let i = 0; i < remainingOrders.length; i++) {
                const order = remainingOrders[i];
                
                // Check if this order can continue the path
                if (order.base === lastToken) {
                    const newPath = [...currentPath, order];
                    const newRemaining = remainingOrders.filter((_, idx) => idx !== i);
                    
                    findCyclesRecursive(newPath, newRemaining, startToken);
                }
            }
        };
        
        // Try starting with each token
        const uniqueTokens = [...new Set(sellOrders.map(o => o.base))];
        
        for (const startToken of uniqueTokens) {
            findCyclesRecursive([], sellOrders, startToken);
        }
        
        return cycles;
    }

    async calculateProfitability(cycle) {
        try {
            // Get prices and remaining amounts
            const prices = cycle.map(order => order.price);
            const remains = cycle.map(order => order.amount - order.filled);
            
            // Calculate bottleneck (maximum amount we can process)
            const bottleneck = this.computeBottleneck(prices, remains);
            
            if (bottleneck === 0n) {
                return { profitable: false, profit: 0n, optimalAmount: 0n };
            }
            
            // Calculate the final amount after going through the cycle
            let currentAmount = bottleneck;
            const PRICE_PRECISION = 1000000n; // 1e6
            
            for (const price of prices) {
                currentAmount = (currentAmount * BigInt(price)) / PRICE_PRECISION;
            }
            
            // Profit = final amount - initial amount
            const profit = currentAmount - bottleneck;
            
            // Check if profitable after considering gas costs
            const estimatedGasCost = await this.estimateGasCost();
            const profitInUSD = this.convertToUSD(profit, cycle[0].base);
            const gasCostInUSD = await this.getGasCostInUSD(estimatedGasCost);
            
            const netProfit = profitInUSD - gasCostInUSD;
            const profitable = netProfit > Number(ethers.formatUnits(this.minProfitThreshold, 6));
            
            return {
                profitable,
                profit: profit,
                optimalAmount: bottleneck,
                netProfitUSD: netProfit,
                gasCostUSD: gasCostInUSD
            };
            
        } catch (error) {
            console.error("Error calculating profitability:", error);
            return { profitable: false, profit: 0n, optimalAmount: 0n };
        }
    }

    computeBottleneck(prices, remains) {
        const PRICE_PRECISION = 1000000n; // 1e6
        let bottleneck = ethers.MaxUint256;
        let accumNum = 1n;
        let accumDen = 1n;
        
        for (let i = 0; i < prices.length; i++) {
            const limit = (BigInt(remains[i]) * accumNum) / accumDen;
            if (limit < bottleneck) {
                bottleneck = limit;
            }
            
            accumNum = accumNum * PRICE_PRECISION;
            accumDen = accumDen * BigInt(prices[i]);
        }
        
        return bottleneck === ethers.MaxUint256 ? 0n : bottleneck;
    }

    convertToUSD(amount, tokenAddress) {
        // Simplified: assume all tokens are worth ~$1 (adjust for real price feeds)
        return Number(ethers.formatUnits(amount, 6));
    }

    async estimateGasCost() {
        // Estimate gas for batch execution (rough estimate)
        return 300000n; // ~300k gas for batch execution
    }

    async getGasCostInUSD(gasAmount) {
        const gasPrice = await this.provider.getFeeData();
        const gasCostWei = gasAmount * gasPrice.gasPrice;
        const gasCostEth = ethers.formatEther(gasCostWei);
        
        // Simplified: assume 1 ETH = $2000 (use real price feed in production)
        return parseFloat(gasCostEth) * 2000;
    }

    async executeBatch(cycle, amountInFirst) {
        try {
            console.log("Executing batch...");
            
            const orderIds = cycle.map(order => order.id);
            
            // Estimate gas
            const gasEstimate = await this.dex.executeBatch.estimateGas(orderIds, amountInFirst);
            const gasPrice = await this.provider.getFeeData();
            
            if (gasPrice.gasPrice > this.maxGasPrice) {
                console.log("Gas price too high, skipping execution");
                return;
            }
            
            // Execute the batch
            const tx = await this.dex.executeBatch(orderIds, amountInFirst, {
                gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
                gasPrice: gasPrice.gasPrice
            });
            
            console.log(`Batch execution submitted: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`Batch executed successfully in block ${receipt.blockNumber}`);
            
            // Update our local state
            for (const order of cycle) {
                await this.loadOrderDetails(order.id);
            }
            
        } catch (error) {
            console.error("Error executing batch:", error.message);
        }
    }

    async start() {
        console.log("Starting Batch Solver...");
        
        // Initial scan for opportunities
        await this.checkForBatchOpportunities();
        
        // Set up less frequent periodic scanning (every 2 minutes when no events)
        this.scanInterval = setInterval(async () => {
            try {
                console.log("⏰ Periodic scan...");
                await this.checkForBatchOpportunities();
            } catch (error) {
                console.error("Error in periodic scan:", error);
            }
        }, 120000); // 2 minutes instead of 30 seconds
        
        console.log("Batch Solver is running... (will scan every 2 minutes or on new orders)");
    }

    stop() {
        console.log("Stopping Batch Solver...");
        this.dex.removeAllListeners();
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }
    }
}

async function main() {
    // Load deployment addresses
    const deploymentsPath = './ignition/deployments/chain-31337/deployed_addresses.json';
    
    if (!fs.existsSync(deploymentsPath)) {
        throw new Error(`Deployment file not found: ${deploymentsPath}`);
    }
    
    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
    const dexAddress = deployments['DexModule#Dex'];
    
    if (!dexAddress) {
        throw new Error('Dex contract address not found in deployments');
    }
    
    console.log(`Using Dex contract at: ${dexAddress}`);
    
    // Get contract instance
    const Dex = await ethers.getContractFactory("Dex");
    const dex = Dex.attach(dexAddress);
    
    // Get provider and wallet
    const [wallet] = await ethers.getSigners();
    const provider = ethers.provider;
    
    console.log(`Solver wallet: ${wallet.address}`);
    
    // Create and initialize solver
    const solver = new BatchSolver(dex, provider, wallet);
    await solver.initialize();
    
    // Start the solver
    await solver.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('Received SIGINT, shutting down gracefully...');
        solver.stop();
        process.exit(0);
    });
}

// Run the solver if this script is executed directly
if (require.main === module) {
    main()
        .then(() => console.log("Batch Solver started"))
        .catch((error) => {
            console.error("Error starting Batch Solver:", error);
            process.exit(1);
        });
}

module.exports = { BatchSolver };