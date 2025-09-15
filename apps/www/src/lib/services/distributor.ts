  
import { Pool, PoolMember, PoolStatus, PoolSummary, UserSummary } from "@/types/distributor";
import { TxParameters } from "@/types/tx";
import {
  Address,
  decodeEventLog,
  encodeEventTopics,
  encodeFunctionData,
  keccak256,
  Log,
  PublicClient,
  toBytes,
} from "viem";
import { distributorAbi } from "../abis/distributor";

type CreatePoolParams = {
  title: string;
  description: string;
  image?: File;
  members: {
    email: string;
    proportion: number;
  }[];
};

export class DistributorService {
  private readonly publicClient: PublicClient;

  constructor(
    private readonly distributorAddress: Address,
    publicClient: PublicClient
  ) {
    this.publicClient = publicClient;
  }



  async prepareCreatePool({
    title,
    description,
    image,
    members,
  }: CreatePoolParams): Promise<{
    tx: TxParameters;
    members: { code: string; member: string; proportion: number }[];
  }> {
    const invitationCodes = members.map(() => {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return array.toString();
    });
    const invitationCodesHashes = invitationCodes.map((code) =>
      keccak256(toBytes(code))
    );
    const percentages = members.map((member) =>
      BigInt(Math.floor(member.proportion * 100))
    );

    const imageCfi = ""; // TODO: upload image to IPFS and get the CFI

    return {
      tx: {
        to: this.distributorAddress,
        data: encodeFunctionData({
          abi: distributorAbi,
          functionName: "createPool",
          args: [
            title,
            description,
            imageCfi,
            invitationCodesHashes,
            percentages,
          ],
        }),
        value: 0n,
      },
      members: members.map((member, index) => ({
        code: invitationCodes[index],
        member: member.email,
        proportion: member.proportion,
      })),
    };
  }

  async recoverPoolId(logs: Log[]) {
    // Find and decode the matching log
    const [poolCreatedTopic] = encodeEventTopics({
      abi: distributorAbi,
      eventName: "PoolCreated",
    });
    const log = logs.find((log) => log.topics[0] === poolCreatedTopic);
    if (!log) throw new Error("Log not found");

    const decoded = decodeEventLog({
      abi: distributorAbi,
      data: log.data,
      topics: log.topics,
    });

    return Number((decoded.args as any).poolId);
  }

  async getPoolSummary(poolId: bigint): Promise<PoolSummary> {
    const summary = await this.publicClient.readContract({
      address: this.distributorAddress,
      abi: distributorAbi,
      functionName: "getPoolSummary",
      args: [poolId],
    });

    return summary;
  }

  async getPoolMembers(poolId: bigint, offset: number, limit: number): Promise<PoolMember[]> {
    const members = await this.publicClient.readContract({
      address: this.distributorAddress,
      abi: distributorAbi,
      functionName: "getPoolMembers",
      args: [poolId, BigInt(offset), BigInt(limit)],
    });

    return members.map((member) => ({
      member: member.member as `0x${string}`,
      invitationCodeHash: member.invitationCodeHash as `0x${string}`,
      percentage: member.percentage,
    }));
  }

  async getUserSummary(address: Address): Promise<UserSummary> {
    const summary = await this.publicClient.readContract({
      address: this.distributorAddress,
      abi: distributorAbi,
      functionName: "getUserSummary",
      args: [address],
    });

    return summary;
  }

  async getUserPoolsCount(address: Address) {
    const count = await this.publicClient.readContract({
      address: this.distributorAddress,
      abi: distributorAbi,
      functionName: "getUserPoolsCount",
      args: [address],
    });

    return count;
  }

  async getUserPools(address: Address, offset: number, limit: number): Promise<Pool[]> {
    const pools = await this.publicClient.readContract({
      address: this.distributorAddress,
      abi: distributorAbi,
      functionName: "getUserPools",
      args: [address, BigInt(offset), BigInt(limit)],
    });

    return pools.map((pool) => ({
      ...pool,
      createdAt: new Date(Number(pool.createdAt)),
      status: pool.status as PoolStatus,
    }));
  }

  async getPool(poolId: bigint): Promise<Pool> {
    const pool = await this.publicClient.readContract({
      address: this.distributorAddress,
      abi: distributorAbi,
      functionName: "getPool",
      args: [poolId],
    });

    return {
      ...pool,
      createdAt: new Date(Number(pool.createdAt)),
      status: pool.status as PoolStatus,
    }
  }
}
