import {
  Pool,
  PoolMember,
  PoolStatus,
  PoolSummary,
  UserSummary,
} from "@/types/distributor";
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
import { erc20Abi } from "../abis/erc20";

type CreatePoolParams = {
  title: string;
  description: string;
  image?: File;
  members: {
    id: string;
    proportion: number;
  }[];
};

export class DistributorService {
  constructor(
    private readonly distributorAddress: Address,
    private readonly usdcAddress: Address,
    private readonly publicClient: PublicClient
  ) {}

  generateInvitation(): { code: `0x${string}`; hash: `0x${string}` } {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const code = ("0x" +
      Array.from(array)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")) as `0x${string}`;
    return {
      code,
      hash: keccak256(toBytes(code)),
    };
  }

  async prepareCreatePool({
    title,
    description,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    image, 
    members,
  }: CreatePoolParams): Promise<{
    calls: TxParameters[];
    members: { code: string; id: string; proportion: number }[];
  }> {
    const invitations = members.map(() => {
      return this.generateInvitation();
    });
    const percentages = members.map((member) =>
      BigInt(Math.floor(member.proportion * 100))
    );

    const imageCfi = ""; // TODO: upload image to IPFS and get the CFI

    return {
      calls: [
        {
          to: this.distributorAddress,
          data: encodeFunctionData({
            abi: distributorAbi,
            functionName: "createPool",
            args: [
              title,
              description,
              imageCfi,
              invitations.map((invitation) => invitation.hash),
              percentages,
            ],
          }),
          value: 0n,
        },
      ],
      members: members.map((member, index) => ({
        ...member,
        code: invitations[index].code,
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

    return BigInt((decoded.args as { poolId: bigint }).poolId);
  }

  async prepareJoinPool(
    poolId: bigint,
    invitationCode: string
  ): Promise<TxParameters[]> {
    if (!invitationCode) {
      throw new Error("Invitation code is required");
    }

    // Convert string to bytes32 format if it's not already hex
    const codeAsBytes32 = invitationCode.startsWith("0x")
      ? (invitationCode as `0x${string}`)
      : (`0x${invitationCode}` as `0x${string}`);

    return [
      {
        to: this.distributorAddress,
        data: encodeFunctionData({
          abi: distributorAbi,
          functionName: "joinPool",
          args: [poolId, codeAsBytes32],
        }),
        value: 0n,
      },
    ];
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

  async getPoolMembers(
    poolId: bigint,
    offset: number,
    limit: number
  ): Promise<PoolMember[]> {
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

  async getUserPools(
    address: Address,
    offset: number,
    limit: number
  ): Promise<Pool[]> {
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
    };
  }

  async prepareDonate(poolId: bigint, amount: bigint): Promise<TxParameters[]> {
    return [
      {
        to: this.usdcAddress,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [this.distributorAddress, amount],
        }),
        value: 0n,
      },
      {
        to: this.distributorAddress,
        data: encodeFunctionData({
          abi: distributorAbi,
          functionName: "donate",
          args: [poolId, amount],
        }),
        value: 0n,
      },
    ];
  }
}
