// src/utils/batch.ts
import { PRICE_PRECISION } from "@/constants";
import { Order } from "@/hooks/useDex";

export interface BatchCandidate {
  orderIds: bigint[];  
  prices: bigint[];
  remains: bigint[];   
  pathTokens: string[]; // Can use this for UI display
  bottleneck: bigint;
}

export function computeBottleneckTS(
  prices: bigint[],
  remains: bigint[],
  precision: bigint = BigInt(PRICE_PRECISION)
): bigint {
  const n = prices.length;
  let bottleneck = BigInt("0xffffffffffffffffffffffffffffffff");
  let accumNum = BigInt(1);
  let accumDen = BigInt(1);

  for (let i = 0; i < n; i++) {
    // limit_i = remain_i * PREC^i / (p0*...*p_{i-1})
    const limit = (remains[i] * accumNum) / accumDen;
    if (limit < bottleneck) bottleneck = limit;
    // Update accumulators
    accumNum = accumNum * precision;
    accumDen = accumDen * prices[i];
  }

  return bottleneck;
}

// Find cycles from orders using DFS
export function findCyclesFromOrders(
  orders: Order[],
  maxLen = 7
): BatchCandidate[] {
  // First organize orders by their base token
  const byBase = new Map<string, Order[]>();
  for (const o of orders) {
    if (!o.active) continue;
    // Only consider sell orders
    if (o.action !== 1) continue; // 1 == SELL
    const list = byBase.get(o.base) ?? [];
    list.push(o);
    byBase.set(o.base, list);
  }
  const results: BatchCandidate[] = [];

  // Start DFS from each order
  for (const start of orders) {
    if (!start.active) continue;
    if (start.action !== 1) continue;
    const used = new Set<bigint>();
    used.add(start.id);
    const pathOrders: Order[] = [start];
    dfs(start, start.quote, used, pathOrders, byBase, results, maxLen);
  }
  return results;
}

function dfs(
  startOrder: Order,
  currentBase: string,
  used: Set<bigint>,
  pathOrders: Order[],
  byBase: Map<string, Order[]>,
  results: BatchCandidate[],
  maxLen: number
) {
  // Examine current path for cycle
  if (
    pathOrders.length >= 2 && 
    currentBase.toLowerCase() === startOrder.base.toLowerCase()
  ) {
    // Found a cycle
    const orderIds = pathOrders.map((o) => o.id);
    const prices = pathOrders.map((o) => o.price);
    const remains = pathOrders.map((o) => o.amount - o.filled);
    const pathTokens = pathOrders.map((o) => o.base);
    // Close the loop
    pathTokens.push(pathOrders[pathOrders.length - 1].quote);

    const bottleneck = computeBottleneckTS(prices, remains);

    results.push({orderIds, prices, remains, pathTokens, bottleneck});

    return;
  }

  if (pathOrders.length >= maxLen) return;

  const nextOrders = byBase.get(currentBase);
  if (!nextOrders || nextOrders.length === 0) return;

  for (const next of nextOrders) {
    if (!next.active) continue;
    if (next.action !== 1) continue;
    if (used.has(next.id)) continue; 

    used.add(next.id);
    pathOrders.push(next);

    dfs(startOrder, next.quote, used, pathOrders, byBase, results, maxLen);

    pathOrders.pop();
    used.delete(next.id);
  }
}
