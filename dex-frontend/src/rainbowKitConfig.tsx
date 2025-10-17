"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  anvil,
  zksync,
  sepolia,
} from "wagmi/chains";

console.log(
  "WalletConnect Project ID:",
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
);

export default getDefaultConfig({
  appName: "Haruhikage",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  chains: [mainnet, optimism, arbitrum, base, zksync, sepolia, anvil],
  ssr: false,
});
