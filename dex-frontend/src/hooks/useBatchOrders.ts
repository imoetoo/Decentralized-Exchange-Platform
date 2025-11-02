// src/hooks/useBatchOrders.ts
import { useEffect, useState } from "react";
import {
  USDT_ADDRESS,
  USDC_ADDRESS,
  DAI_ADDRESS,
  EIGEN_ADDRESS,
  PEPE_ADDRESS,
  WBTC_ADDRESS,
  WETH_ADDRESS,
} from "@/constants";
import { useDex, Order } from "./useDex";
import {
  findCyclesFromOrders,
  BatchCandidate,
} from "@/utils/batch";

export function useBatchOrders() {
  const { getOrderIdsForPair, getOrderById } = useDex();
  const [loading, setLoading] = useState(false);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [candidates, setCandidates] = useState<BatchCandidate[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const TOKENS = [
        USDT_ADDRESS,
        USDC_ADDRESS,
        DAI_ADDRESS,
        EIGEN_ADDRESS,
        PEPE_ADDRESS,
        WBTC_ADDRESS,
        WETH_ADDRESS,
      ].filter(Boolean); 

      const collectedSellOrders: Order[] = [];

      for (const base of TOKENS) {
        for (const quote of TOKENS) {
          if (base === quote) continue;
          const { sell } = await getOrderIdsForPair(base, quote);

          for (const id of sell) {
            const o = await getOrderById(id);
            if (o && o.active && o.action === 1 && o.amount > o.filled) {
              collectedSellOrders.push(o);
            }
          }
        }
      }

      setSellOrders(collectedSellOrders);
      const chains = findCyclesFromOrders(collectedSellOrders, 7);
      setCandidates(chains);
      setLoading(false);
    };

    fetchAll();
  }, [getOrderIdsForPair, getOrderById]);

  return {
    loading,
    sellOrders,
    candidates,
  };
}
