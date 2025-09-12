// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DistributorModule = buildModule("DistributorModule", (m) => {
  const lock = m.contract("Distributor", [], {});

  return { lock };
});

export default DistributorModule;
