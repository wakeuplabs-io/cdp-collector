import { NATIVE_ADDRESS } from "@/config";
import { erc20Abi } from "@/lib/abis/erc20";
import { TxParameters } from "@/types/tx";
import {
  Address,
  createPublicClient,
  encodeFunctionData,
  http,
  maxUint256,
  PublicClient,
} from "viem";

export class TokenService {
  private readonly publicClient: PublicClient;

  constructor(private readonly rpcUrl: string) {
    this.publicClient = createPublicClient({
      transport: http(this.rpcUrl),
    });
  }

  async getBalance(token: Address, address: `0x${string}`): Promise<bigint> {
    if (token === NATIVE_ADDRESS) {
      return await this.publicClient.getBalance({ address });
    }

    const balance = await this.publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    });

    return BigInt(balance);
  }

  async getAllowance(
    token: Address,
    owner: `0x${string}`,
    spender: `0x${string}`
  ): Promise<bigint> {
    if (token === NATIVE_ADDRESS) {
      return maxUint256;
    }

    const allowance = await this.publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner, spender],
    });

    return BigInt(allowance);
  }

  async prepareApprove(
    token: Address,
    spender: Address,
    amount: bigint,
  ): Promise<TxParameters[]> {
    if (token === NATIVE_ADDRESS) {
      return [];
    }

    return [
      {
        to: token,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [spender, amount],
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
    if (token === NATIVE_ADDRESS) {
      return [
        {
          to,
          value: amount,
        },
      ];
    }

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
}
