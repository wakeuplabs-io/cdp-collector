// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DistributorModule = buildModule("DistributorModule", (m) => {
  // Replace with USDC contract when deploying to mainnet
  const usdc = m.contract("USDC", [], {});
  
  const distributor = m.contract("Distributor", [usdc], {});

  return { usdc, distributor };
});

export default DistributorModule;
