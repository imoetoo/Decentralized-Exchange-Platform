const { ethers } = require("hardhat");
const fs = require('fs');

async function testSolverLogic() {
    console.log("Testing Batch Solver Logic...");
    
    // Load deployment addresses
    const deploymentsPath = './ignition/deployments/chain-31337/deployed_addresses.json';
    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
    
    const dexAddress = deployments['DexModule#Dex'];
    
    // Create token address to symbol mapping
    const tokenMap = {};
    for (const [key, address] of Object.entries(deployments)) {
        if (key.startsWith('TokensModule#Mock')) {
            const symbol = key.replace('TokensModule#Mock', '');
            tokenMap[address.toLowerCase()] = symbol;
        }
    }
    
    // Get contract instance
    const Dex = await ethers.getContractFactory("Dex");
    const dex = Dex.attach(dexAddress);
    
    console.log("Checking current orders...");
    
    // Get some orders to analyze
    const orderCount = await dex.nextOrderId();
    console.log(`Total orders created: ${orderCount}`);
    
    const activeOrders = [];
    
    // Check first 20 orders for active SELL orders
    const maxOrderId = Math.min(21, Number(orderCount));
    console.log(`Checking orders 1 to ${maxOrderId - 1}...`);
    
    for (let i = 1; i < maxOrderId; i++) {
        try {
            const order = await dex.orders(i);
            console.log(`Order ${i}: Active=${order.active}, Action=${Number(order.action)} (${Number(order.action) === 0 ? 'BUY' : 'SELL'})`);
            
            if (order.active && Number(order.action) === 1) { // SELL orders (1 = SELL, 0 = BUY)
                activeOrders.push({
                    id: i,
                    trader: order.trader,
                    base: order.base.toLowerCase(),
                    quote: order.quote.toLowerCase(),
                    amount: order.amount,
                    filled: order.filled,
                    price: order.price,
                    remaining: order.amount - order.filled
                });
                console.log(`  Added SELL order ${i} to analysis`);
            } else if (order.active && Number(order.action) === 0) {
                console.log(`  Skipping BUY order ${i}`);
            } else if (!order.active) {
                console.log(`  Order ${i} is inactive`);
            }
        } catch (error) {
            console.log(`  Warning: Order ${i} doesn't exist`);
        }
    }
    
    console.log(`\nFound ${activeOrders.length} active SELL orders:`);
    
    activeOrders.forEach(order => {
        const baseSymbol = tokenMap[order.base] || order.base.slice(0,8) + '...';
        const quoteSymbol = tokenMap[order.quote] || order.quote.slice(0,8) + '...';
        
        console.log(`Order ${order.id}: ${baseSymbol} → ${quoteSymbol}`);
        console.log(`  Trader: ${order.trader.slice(0,8)}...`);
        console.log(`  Amount: ${ethers.formatUnits(order.amount, 6)} (${ethers.formatUnits(order.remaining, 6)} remaining)`);
        console.log(`  Price: ${ethers.formatUnits(order.price, 6)}`);
        console.log("");
    });
    
    // Simple cycle detection
    console.log("Looking for potential cycles...");
    
    const cycles = findSimpleCycles(activeOrders, 3); // Look for 3-order cycles
    
    if (cycles.length > 0) {
    console.log(`\nFound ${cycles.length} unique cycle(s):`);
        
        cycles.forEach((cycle, index) => {
            console.log(`\nCycle ${index + 1}:`);
            
            // Validate and show the cycle path
            let isValid = true;
                for (let i = 0; i < cycle.length; i++) {
                const currentOrder = cycle[i];
                const nextOrder = cycle[(i + 1) % cycle.length];
                
                const baseSymbol = tokenMap[currentOrder.base] || currentOrder.base.slice(0,8) + '...';
                const quoteSymbol = tokenMap[currentOrder.quote] || currentOrder.quote.slice(0,8) + '...';
                
                console.log(`  ${i + 1}. Order ${currentOrder.id}: ${baseSymbol} → ${quoteSymbol}`);
                console.log(`     Price: ${ethers.formatUnits(currentOrder.price, 6)}, Remaining: ${ethers.formatUnits(currentOrder.remaining, 6)}`);
                
                // Check if current order's quote matches next order's base
                if (currentOrder.quote.toLowerCase() !== nextOrder.base.toLowerCase()) {
                    console.log(`     ERROR: Quote token doesn't match next order's base!`);
                    isValid = false;
                }
            }
            
                if (isValid) {
                // Quick profitability check
                const profitability = calculateSimpleProfitability(cycle);
                console.log(`     Estimated profit ratio: ${profitability.toFixed(6)} (${profitability > 1 ? 'PROFITABLE' : 'NOT PROFITABLE'})`);
                
                // Show the actual token flow
                const tokenFlow = cycle.map(o => tokenMap[o.base] || o.base.slice(-4)).join(' → ');
                const firstToken = tokenMap[cycle[0].base] || cycle[0].base.slice(-4);
                console.log(`     Token flow: ${tokenFlow} → ${firstToken}`);
            } else {
                console.log(`     Invalid cycle detected!`);
            }
        });
    } else {
        console.log("No cycles found with current orders");
        
        // Show what tokens we have
        const baseTokens = [...new Set(activeOrders.map(o => o.base))];
        const quoteTokens = [...new Set(activeOrders.map(o => o.quote))];
        
        console.log(`\nAvailable base tokens: ${baseTokens.length}`);
        console.log(`Available quote tokens: ${quoteTokens.length}`);
        
        console.log("\nTo create cycles, you need orders like:");
        console.log("   Order A: TokenX → TokenY");
        console.log("   Order B: TokenY → TokenZ"); 
        console.log("   Order C: TokenZ → TokenX");
    }
}

function findSimpleCycles(orders, maxLength) {
    const cycles = [];
    const seenCycles = new Set(); // To track unique cycles
    
    // Try all combinations to find cycles
    function findCyclesRecursive(currentPath, remainingOrders, startToken) {
        if (currentPath.length >= 2 && currentPath.length <= maxLength) {
            // Check if we can close the cycle
            const lastOrder = currentPath[currentPath.length - 1];
            if (lastOrder.quote.toLowerCase() === startToken.toLowerCase()) {
                // Create a normalized representation of the cycle to detect duplicates
                const cycleIds = currentPath.map(o => o.id);
                const normalizedCycle = normalizeCycle(cycleIds);
                
                if (!seenCycles.has(normalizedCycle)) {
                    seenCycles.add(normalizedCycle);
                    cycles.push([...currentPath]);
                }
                return; // Don't continue building longer cycles from this one
            }
        }
        
        if (currentPath.length >= maxLength) {
            return;
        }
        
        const lastToken = currentPath.length > 0 ? 
            currentPath[currentPath.length - 1].quote : 
            startToken;
        
        for (let i = 0; i < remainingOrders.length; i++) {
            const order = remainingOrders[i];
            
            // Check if this order can continue the path
            if (order.base.toLowerCase() === lastToken.toLowerCase()) {
                const newPath = [...currentPath, order];
                const newRemaining = remainingOrders.filter((_, idx) => idx !== i);
                
                findCyclesRecursive(newPath, newRemaining, startToken);
            }
        }
    }
    
    // Only try starting with the lowest ID token to avoid duplicates
    const uniqueTokens = [...new Set(orders.map(o => o.base))];
    
    for (const startToken of uniqueTokens) {
        findCyclesRecursive([], orders, startToken);
    }
    
    return cycles;
}

// Normalize cycle to detect duplicates (e.g., [1,2,3] and [2,3,1] are the same)
function normalizeCycle(cycleIds) {
    // Find the smallest ID and rotate the array to start with it
    const minId = Math.min(...cycleIds);
    const minIndex = cycleIds.indexOf(minId);
    const normalized = [...cycleIds.slice(minIndex), ...cycleIds.slice(0, minIndex)];
    return normalized.join(',');
}

function calculateSimpleProfitability(cycle) {
    // Simple calculation: multiply all price ratios
    let ratio = 1.0;
    const PRICE_PRECISION = 1000000;
    
    for (const order of cycle) {
        const price = Number(order.price) / PRICE_PRECISION;
        ratio *= price;
    }
    
    return ratio;
}

async function main() {
    await testSolverLogic();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });