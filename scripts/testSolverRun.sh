#!/bin/bash

echo "🚀 Starting optimized batch solver test..."

# Start the solver in the background
npm run solver &
SOLVER_PID=$!

echo "📋 Solver started with PID: $SOLVER_PID"
echo "⏰ Waiting 10 seconds to let it initialize..."
sleep 10

echo "🔄 Creating a new order to trigger cycle detection..."
npm run seed > /dev/null 2>&1

echo "⏰ Waiting 5 seconds for solver to detect new orders..."
sleep 5

echo "🛑 Stopping solver..."
kill $SOLVER_PID 2>/dev/null

echo "✅ Test complete!"
echo "💡 Check the solver output above to see if it detected cycles and executed batches."