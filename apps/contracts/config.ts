import "dotenv/config";
import {
    Chain,
    createPublicClient,
    createWalletClient,
    http,
    PublicClient,
    WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

export type Network = "base-mainnet" | "base-sepolia";

export const configByNetwork: Record<
  Network,
  {
    chain: Chain;
    rpcUrl: string;
    privateKey: `0x${string}`;
    distributor: `0x${string}`;
    usdc: `0x${string}`;
    blockscoutApiKey: string;
  }
> = {
  "base-mainnet": {
    chain: base,
    rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    privateKey: process.env.BASE_PRIVATE_KEY as `0x${string}`,
    distributor: process.env.BASE_DISTRIBUTOR_ADDRESS as `0x${string}`,
    usdc: process.env.BASE_USDC_ADDRESS as `0x${string}`,
    blockscoutApiKey: process.env.BASE_BLOCKSCOUT_API_KEY as string,
  },
  "base-sepolia": {
    chain: baseSepolia,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    privateKey: process.env.BASE_SEPOLIA_PRIVATE_KEY as `0x${string}`,
    distributor: process.env.BASE_SEPOLIA_DISTRIBUTOR_ADDRESS as `0x${string}`,
    usdc: process.env.BASE_SEPOLIA_USDC_ADDRESS as `0x${string}`,
    blockscoutApiKey: process.env.BASE_SEPOLIA_BLOCKSCOUT_API_KEY as string,
  },
};

export const publicClientByNetwork: Record<Network, PublicClient> = {
  "base-mainnet": createPublicClient({
    chain: base,
    transport: http(),
  }) as any,
  "base-sepolia": createPublicClient({
    chain: baseSepolia,
    transport: http(),
  }) as any,
};

export const walletClientByNetwork: Record<Network, WalletClient> = {
  "base-mainnet": createWalletClient({
    chain: base,
    transport: http(),
    account: privateKeyToAccount(configByNetwork["base-mainnet"].privateKey),
  }),
  "base-sepolia": createWalletClient({
    chain: baseSepolia,
    transport: http(),
    account: privateKeyToAccount(configByNetwork["base-sepolia"].privateKey),
  }),
};
