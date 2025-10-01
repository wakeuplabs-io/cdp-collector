import {
  bundlerClient,
  DISTRIBUTOR_ADDRESS,
  distributorService,
  NETWORK,
} from "@/config";
import { CdpService, CdpSqlQueryEventResult } from "@/lib/services/cdp";
import { Donation, Pool, PoolMember } from "@/types/distributor";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { useState } from "react";
import useSWR, { mutate } from "swr";

export const useCreatePool = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { evmAddress } = useEvmAddress();

  const createPool = async (pool: {
    title: string;
    description: string;
    image?: File;
    members: {
      id: string;
      proportion: number;
    }[];
  }): Promise<{
    hash: string;
    poolId: bigint;
    members: { code: string; id: string; proportion: number }[];
  }> => {
    try {
      setIsLoading(true);

      const { calls, members } =
        await distributorService.prepareCreatePool(pool);
      const result = await CdpService.sendUserOperation({
        calls,
        useCdpPaymaster: true, // Use the free CDP paymaster to cover the gas fees
      });
      const userOp = await bundlerClient.waitForUserOperationReceipt({
        hash: result.userOperationHash,
      });

      const poolId = await distributorService.recoverPoolId(userOp.logs);

      await mutate(`/api/distributor/${evmAddress}`);

      return { poolId, hash: result.userOperationHash, members };
    } finally {
      setIsLoading(false);
    }
  };

  return { createPool, isLoading };
};

export const useJoinPool = () => {
  const [isLoading, setIsLoading] = useState(false);

  const joinPool = async (
    poolId: bigint,
    invitationCode: string
  ): Promise<{ hash: string }> => {
    try {
      setIsLoading(true);

      const result = await CdpService.sendUserOperation({
        calls: await distributorService.prepareJoinPool(
          BigInt(poolId),
          invitationCode
        ),
        useCdpPaymaster: true, // Use the free CDP paymaster to cover the gas fees
      });

      await bundlerClient.waitForUserOperationReceipt({
        hash: result.userOperationHash,
      });

      return { hash: result.userOperationHash };
    } finally {
      setIsLoading(false);
    }
  };

  return { joinPool, isLoading };
};

export const useDeactivatePool = () => {
  const [isLoading, setIsLoading] = useState(false);

  const deactivatePool = async (poolId: bigint): Promise<{ hash: string }> => {
    try {
      setIsLoading(true);

      // send user operation
      const result = await CdpService.sendUserOperation({
        calls: await distributorService.prepareDeactivatePool(poolId),
      });
      await bundlerClient.waitForUserOperationReceipt({
        hash: result.userOperationHash,
      });

      // invalidate queries
      await mutate(`/api/distributor/${poolId}`);

      return { hash: result.userOperationHash };
    } finally {
      setIsLoading(false);
    }
  };

  return { deactivatePool, isLoading };
};

export const useUserSummary = () => {
  const { evmAddress } = useEvmAddress();

  const { data, isLoading } = useSWR(`/api/distributor/${evmAddress}/summary`, {
    fetcher: async () => {
      if (!evmAddress) return 0;
      return await distributorService.getUserSummary(evmAddress);
    },
  });

  return { userSummary: data, isLoading: isLoading };
};

export const useUserPoolsCount = () => {
  const { evmAddress } = useEvmAddress();

  const { data, isLoading } = useSWR(`/api/distributor/${evmAddress}`, {
    fetcher: async () => {
      if (!evmAddress) return 0;
      return await distributorService.getUserPoolsCount(evmAddress);
    },
  });

  return { userPoolsCount: data ?? 0, isLoading };
};

export const usePool = (
  poolId: bigint
): { pool: Pool | undefined; isLoading: boolean } => {
  const { data, isLoading } = useSWR(`/api/distributor/${poolId}`, {
    fetcher: () => distributorService.getPool(BigInt(poolId)),
  });

  return { pool: data, isLoading };
};

export const usePoolSummary = (poolId: bigint) => {
  const { data, isLoading } = useSWR(`/api/distributor/${poolId}/summary`, {
    fetcher: () => distributorService.getPoolSummary(BigInt(poolId)),
  });

  return { poolSummary: data, isLoading };
};

export function usePoolMembers(poolId: bigint): {
  members: PoolMember[];
  isLoading: boolean;
} {
  // TODO: implement pagination
  const { data, isLoading } = useSWR(`/api/distributor/${poolId}/members`, {
    fetcher: () => distributorService.getPoolMembers(BigInt(poolId), 0, 100),
  });

  return { members: data, isLoading };
}

export function useUserPools(): { userPools: Pool[]; isLoading: boolean } {
  const { evmAddress } = useEvmAddress();

  // TODO: implement pagination
  const { data, isLoading } = useSWR(`/api/distributor/${evmAddress}/pools`, {
    fetcher: () => {
      if (!evmAddress) return [];
      return distributorService.getUserPools(evmAddress, 0, 100);
    },
  });

  return { userPools: data, isLoading };
}

export const useMakeDonation = () => {
  const [isLoading, setIsLoading] = useState(false);

  const makeDonation = async (poolId: bigint, amount: bigint) => {
    try {
      setIsLoading(true);

      const result = await CdpService.sendUserOperation({
        calls: await distributorService.prepareDonate(poolId, amount),
        useCdpPaymaster: true, // Use the free CDP paymaster to cover the gas fees
      });

      await bundlerClient.waitForUserOperationReceipt({
        hash: result.userOperationHash,
      });

      return { hash: result.userOperationHash };
    } finally {
      setIsLoading(false);
    }
  };

  return { makeDonation, isLoading };
};

export const useDonations = (
  poolId: bigint
): {
  donations: Donation[] | undefined;
  isLoading: boolean;
} => {
  // TODO: implement pagination
  const { data, isLoading } = useSWR(`/api/distributor/${poolId}/donations`, {
    fetcher: async () => {
      // TODO: cors workaround
      const res = await fetch("/api/events", {
        method: "POST",
        body: JSON.stringify({ sql: `SELECT * FROM ${NETWORK.replace("-", "_")}.events WHERE event_signature = 'DonationMade(uint256,address,uint256)' AND parameters['poolId']::String = '${poolId}' AND address = lower('${DISTRIBUTOR_ADDRESS}') LIMIT 100;` }),
      });
      const data = await res.json();

      // const res = await CdpService.sqlQueryEvents(
      //   `SELECT * FROM ${NETWORK.replace("-", "_")}.events WHERE event_signature = 'DonationMade(uint256,address,uint256)' AND parameters['poolId']::String = '${poolId}' AND address = lower('${DISTRIBUTOR_ADDRESS}') LIMIT 100;`
      // );

      return data.map((donation: CdpSqlQueryEventResult) => ({
        poolId: BigInt(donation.parameters.poolId),
        donor: donation.parameters.donor,
        amount: BigInt(donation.parameters.amount),
        transactionHash: donation.transaction_hash,
        createdAt: new Date(donation.block_timestamp),
      }));
    },
  });

  return { donations: data, isLoading };
};

// 6505326e83d4c9852c2b65ed66a0bf83
