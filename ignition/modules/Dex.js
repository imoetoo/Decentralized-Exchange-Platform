import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DexModule", (m) => {
  const feeAccount = m.getAccount(0);
  const feePercent = m.getParameter("feePercent", 0); // 30 = 0.30%

  const dex = m.contract("Dex", [feeAccount, feePercent], { id: "Dex" });

  return { dex };
});
