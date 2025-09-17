// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DistributorModule = buildModule("DistributorModule", (m) => {
  const usdc: any = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // mainnet
  // const usdc: any = "0xa44e1a19B9334d7FfF8AF0D0783041a83aEb5a49"; // sepolia
  
  const distributor = m.contract("Distributor", [usdc], {});

  return { usdc, distributor };
});

export default DistributorModule;
