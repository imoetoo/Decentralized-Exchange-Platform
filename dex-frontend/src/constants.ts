import deployments from "./deployments.json";

// Contract addresses from deployment
export const DEX_CONTRACT_ADDRESS = deployments[
  "DexModule#Dex"
] as `0x${string}`;

// Mock token addresses from deployment (for localhost testing)
export const USDT_ADDRESS = deployments[
  "TokensModule#MockUSDT"
] as `0x${string}`;
export const USDC_ADDRESS = deployments[
  "TokensModule#MockUSDC"
] as `0x${string}`;
export const DAI_ADDRESS = deployments["TokensModule#MockDAI"] as `0x${string}`;
export const EIGEN_ADDRESS = deployments[
  "TokensModule#MockEIGEN"
] as `0x${string}`;
export const PEPE_ADDRESS = deployments[
  "TokensModule#MockPEPE"
] as `0x${string}`;
export const WBTC_ADDRESS = deployments[
  "TokensModule#MockWBTC"
] as `0x${string}`;
export const WETH_ADDRESS = deployments[
  "TokensModule#MockWETH"
] as `0x${string}`;

// Token decimals
export const STABLECOIN_DECIMALS = 6; // USDT and USDC typically use 6 decimals
export const PRICE_PRECISION = 1e6; // Price precision constant from Dex.sol

// Order types enum - matching Dex.sol
export enum OrderType {
  BUY = 0,
  SELL = 1,
}

// Future order types for future proofing
export enum OrderKind {
  LIMIT = "LIMIT",
  MARKET = "MARKET", // Not implemented yet
  STOP_LOSS = "STOP_LOSS", // Not implemented yet
  STOP_LIMIT = "STOP_LIMIT", // Not implemented yet
}

// DEX contract ABI
export const DEX_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }],
    name: "cancel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "base", type: "address" },
      { internalType: "address", name: "quote", type: "address" },
    ],
    name: "getList",
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "orders",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address", name: "trader", type: "address" },
      { internalType: "enum Dex.actionType", name: "action", type: "uint8" },
      { internalType: "address", name: "base", type: "address" },
      { internalType: "address", name: "quote", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "filled", type: "uint256" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint256", name: "ts", type: "uint256" },
      { internalType: "bool", name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "enum Dex.actionType", name: "action", type: "uint8" },
      { internalType: "address", name: "base", type: "address" },
      { internalType: "address", name: "quote", type: "address" },
      { internalType: "uint256", name: "baseAmount", type: "uint256" },
      { internalType: "uint256", name: "price", type: "uint256" },
    ],
    name: "placeLimit",
    outputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256[]", name: "orderIds", type: "uint256[]" },
      { internalType: "uint256", name: "amountInFirst", type: "uint256" },
    ],
    name: "executeBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      {
        indexed: false,
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        indexed: false,
        internalType: "enum Dex.actionType",
        name: "action",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "address",
        name: "base",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "quote",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "NewOrder",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
    ],
    name: "OrderCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
    ],
    name: "OrderClosed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "takerId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "makerId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "baseAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "quoteAmount",
        type: "uint256",
      },
    ],
    name: "OrderFilled",
    type: "event",
  },
] as const;

// ERC20 ABI for token approvals and balances
export const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
