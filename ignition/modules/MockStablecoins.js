import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MockStablecoinsModule", (m) => {
  // Deploy Mock USDT (6 decimals like real USDT)
  const mockUSDT = m.contract(
    "MockStablecoin",
    ["Mock Tether USD", "USDT", 6],
    { id: "MockUSDT" }
  );

  // Deploy Mock USDC (6 decimals like real USDC)
  const mockUSDC = m.contract("MockStablecoin", ["Mock USD Coin", "USDC", 6], {
    id: "MockUSDC",
  });

  return { mockUSDT, mockUSDC };
});
