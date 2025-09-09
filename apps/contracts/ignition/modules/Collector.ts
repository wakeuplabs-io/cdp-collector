// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CollectorModule = buildModule("CollectorModule", (m) => {
  const lock = m.contract("Collector", [], {});

  return { lock };
});

export default CollectorModule;
