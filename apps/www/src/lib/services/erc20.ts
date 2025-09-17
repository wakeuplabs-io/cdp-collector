import { erc20Abi } from "@/lib/abis/erc20";
import { TxParameters } from "@/types/tx";
import {
  Address,
  createPublicClient,
  encodeFunctionData,
  http,
  PublicClient,
} from "viem";

export class Erc20Service {
  private readonly publicClient: PublicClient;

  constructor(private readonly rpcUrl: string) {
    this.publicClient = createPublicClient({
      transport: http(this.rpcUrl),
    });
  }

  async getBalance(token: Address, address: `0x${string}`): Promise<bigint> {
    const balance = await this.publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    });

    return BigInt(balance);
  }

  async getAllowance(token: Address, owner: `0x${string}`, spender: `0x${string}`): Promise<bigint> {
    const allowance = await this.publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner, spender],
    });

    return BigInt(allowance);
  }

  async prepareApprove(
    amount: bigint,
    token: Address,
    to: `0x${string}`
  ): Promise<TxParameters[]> {
    return [
      {
        to: token,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [to, amount],
        }),
        value: 0n,
      },
    ];
  }

  async prepareTransfer(
    token: Address,
    amount: bigint,
    to: `0x${string}`
  ): Promise<TxParameters[]> {
    return [
      {
        to: token,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [to, amount],
        }),
        value: 0n,
      },
    ];
  }

  async prepareMint(
    token: Address,
    amount: bigint,
    to: `0x${string}`
  ): Promise<TxParameters[]> {
    return [
      {
        to: token,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "mint",
          args: [to, amount],
        }),
        value: 0n,
      },
    ];
  }
}
