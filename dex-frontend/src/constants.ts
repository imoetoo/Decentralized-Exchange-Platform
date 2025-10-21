// import deployments from "../../ignition/deployments/chain-31337/deployed_addresses.json";

// // Contract addresses from deployment
// export const DEX_CONTRACT_ADDRESS = deployments[
//   "DexModule#Dex"
// ] as `0x${string}`;

// // Mock stablecoin addresses from deployment (for localhost testing)
// export const USDT_ADDRESS = deployments[
//   "MockStablecoinsModule#MockUSDT"
// ] as `0x${string}`;
// export const USDC_ADDRESS = deployments[
//   "MockStablecoinsModule#MockUSDC"
// ] as `0x${string}`;

export const DEX_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
export const USDT_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
export const USDC_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

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
