#!/usr/bin/env node

const { BatchSolver } = require('./batchSolver');

// Simple runner script for the batch solver
async function runSolver() {
    console.log("🤖 Starting Batch Execution Solver...");
    console.log("Press Ctrl+C to stop");
    
    try {
        // The main function in batchSolver.js will handle everything
        require('./batchSolver');
    } catch (error) {
        console.error("❌ Error running batch solver:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    runSolver();
}