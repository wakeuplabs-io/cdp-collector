import { Address, createPublicClient, http } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { DistributorService } from "./lib/services/distributor";
import { PinataIpfs } from "./lib/services/ipfs";
import { TokenService } from "./lib/services/token";
import { Network } from "./types/network";
import { Token } from "./types/token";

// chain

export const NETWORK = process.env.NEXT_PUBLIC_NETWORK as Network;
export const CHAIN_ID = NETWORK === "base" ? 8453n : 84532n;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string;
export const EXPLORER_BASE_URL = process.env
  .NEXT_PUBLIC_EXPLORER_BASE_URL as string;
export const TRADE_PERMIT2_ADDRESS =
  "0x000000000022D473030F116dDEE9F6B43aC78BA3";

// contracts

export const DISTRIBUTOR_ADDRESS = process.env
  .NEXT_PUBLIC_DISTRIBUTOR_ADDRESS as Address;
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as Address;
export const MULTICALL_ADDRESS = "0xca11bde05977b3631167028862be2a173976ca11"; // for base and base-sepolia

// coinbase

export const CDP_CREATE_ACCOUNT_TYPE = process.env
  .NEXT_PUBLIC_CDP_CREATE_ACCOUNT_TYPE as "evm-smart" | "evm-eoa";
export const CDP_PROJECT_ID = process.env.NEXT_PUBLIC_CDP_PROJECT_ID as string;
export const CDP_BASE_URL = "https://api.developer.coinbase.com";
export const CDP_ONRAMP_BASE_URL = process.env
  .NEXT_PUBLIC_CDP_ONRAMP_BASE_URL as string;
export const CDP_CLIENT_API_KEY = process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY as string;

// ipfs

export const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT as string;
export const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY as string;

// subgraph

export const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL as string;
export const SUBGRAPH_API_KEY = process.env
  .NEXT_PUBLIC_SUBGRAPH_API_KEY as string;

// tokens

export const NATIVE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const SUPPORTED_ASSETS_BY_CHAIN: Record<
  Network,
  { [key: string]: Token }
> = {
  base: {
    USDC: {
      decimals: 6,
      name: "USDC",
      symbol: "USDC",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      iconUrl:
        "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
    },
    ETH: {
      decimals: 18,
      name: "Ethereum",
      symbol: "ETH",
      address: NATIVE_ADDRESS,
      iconUrl:
        "https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",
    },
    // cbBTC: {
    //   decimals: 8,
    //   name: "Coinbase Wrapped Bitcoin",
    //   symbol: "cbBTC",
    //   address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    //   iconUrl:
    //     "https://dynamic-assets.coinbase.com/e785e0181f1a23a30d9476038d9be91e9f6c63959b538eabbc51a1abc8898940383291eede695c3b8dfaa1829a9b57f5a2d0a16b0523580346c6b8fab67af14b/asset_icons/b57ac673f06a4b0338a596817eb0a50ce16e2059f327dc117744449a47915cb2.png",
    // },
    // WETH: {
    //   decimals: 18,
    //   name: "Wrapped Ethereum",
    //   symbol: "WETH",
    //   address: "0x4200000000000000000000000000000000000006",
    //   iconUrl:
    //     "https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",
    // },
  },
  "base-sepolia": {
    USDC: {
      decimals: 6,
      name: "USDC",
      symbol: "USDC",
      address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      iconUrl:
        "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
    },
  },
};

export const SUPPORTED_ASSETS = SUPPORTED_ASSETS_BY_CHAIN[NETWORK];

// clients

export const bundlerClient = createBundlerClient({
  client: createPublicClient({
    transport: http(RPC_URL),
  }),
  transport: http(process.env.NEXT_PUBLIC_CDP_BUNDLER_URL as string),
});

export const publicClient = createPublicClient({
  transport: http(RPC_URL),
});

// services

export const ipfsService = new PinataIpfs(PINATA_JWT, PINATA_GATEWAY);

export const tokenService = new TokenService(RPC_URL);

export const distributorService = new DistributorService(
  DISTRIBUTOR_ADDRESS,
  USDC_ADDRESS,
  publicClient,
  ipfsService
);
