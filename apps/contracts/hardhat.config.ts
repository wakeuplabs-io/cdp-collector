import "@nomicfoundation/hardhat-toolbox-viem";
import type { HardhatUserConfig } from "hardhat/config";
import { configByNetwork } from "./config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  paths: {
    sources: "./src",
  },
  networks: {
    "base-mainnet": {
      url: configByNetwork["base-mainnet"].rpcUrl,
      accounts: [configByNetwork["base-mainnet"].privateKey],
    },
    "base-sepolia": {
      url: configByNetwork["base-sepolia"].rpcUrl,
      accounts: [configByNetwork["base-sepolia"].privateKey],
    },
  },
  etherscan: {
    apiKey: {
      "base-mainnet": configByNetwork["base-mainnet"].etherscanApiKey,
      "base-sepolia": configByNetwork["base-sepolia"].etherscanApiKey,
    },
    customChains: [
      {
        network: "base-mainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/",
        },
      },
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org/",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
