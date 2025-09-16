import { bundlerClient, distributorService, NETWORK } from "@/config";
import { Donation, Pool, PoolMember } from "@/types/distributor";
import {
  useCurrentUser,
  useEvmAddress,
  useSendUserOperation,
} from "@coinbase/cdp-hooks";
import { useState } from "react";
import useSWR from "swr";

export const useCreatePool = () => {
  const { currentUser } = useCurrentUser();
  const { sendUserOperation } = useSendUserOperation();
  const [isLoading, setIsLoading] = useState(false);

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
      const smartAccount = currentUser?.evmSmartAccounts?.[0];
      if (!smartAccount) {
        throw new Error("No smart account found");
      }

      const { calls, members } = await distributorService.prepareCreatePool(
        pool
      );

      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: NETWORK,
        calls,
        useCdpPaymaster: true, // Use the free CDP paymaster to cover the gas fees
      });
      const userOp = await bundlerClient.waitForUserOperationReceipt({
        hash: result.userOperationHash,
      });

      const poolId = await distributorService.recoverPoolId(userOp.logs);

      return { poolId, hash: result.userOperationHash, members };
    } finally {
      setIsLoading(false);
    }
  };

  return { createPool, isLoading };
};

export const useJoinPool = () => {
  const { currentUser } = useCurrentUser();
  const { sendUserOperation } = useSendUserOperation();
  const [isLoading, setIsLoading] = useState(false);

  const joinPool = async (
    poolId: string,
    invitationCode: string
  ): Promise<{ hash: string }> => {
    try {
      setIsLoading(true);
      const smartAccount = currentUser?.evmSmartAccounts?.[0];
      if (!smartAccount) {
        throw new Error("No smart account found");
      }

      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: NETWORK,
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
  poolId: string
): { pool: Pool | undefined; isLoading: boolean } => {
  const { data, isLoading } = useSWR(`/api/distributor/${poolId}`, {
    fetcher: () => distributorService.getPool(BigInt(poolId)),
  });

  return { pool: data, isLoading };
};

export const usePoolSummary = (poolId: string) => {
  const { data, isLoading } = useSWR(`/api/distributor/${poolId}/summary`, {
    fetcher: () => distributorService.getPoolSummary(BigInt(poolId)),
  });

  return { poolSummary: data, isLoading };
};

export function usePoolMembers(poolId: string): {
  members: PoolMember[];
  isLoading: boolean;
} {
  const { data, isLoading } = useSWR(`/api/distributor/${poolId}/members`, {
    fetcher: () => distributorService.getPoolMembers(BigInt(poolId), 0, 100), // TODO: implement pagination
  });

  return { members: data, isLoading };
}

export function useUserPools(): { userPools: Pool[]; isLoading: boolean } {
  const { evmAddress } = useEvmAddress();
  const { data, isLoading } = useSWR(`/api/distributor/${evmAddress}/pools`, {
    fetcher: () => {
      if (!evmAddress) return [];

      return distributorService.getUserPools(
        evmAddress as `0x${string}`,
        0,
        100 // TODO: implement pagination
      );
    },
  });

  return { userPools: data, isLoading };
}

export const useMakeDonation = () => {
  const { currentUser } = useCurrentUser();
  const { sendUserOperation } = useSendUserOperation();
  const [isLoading, setIsLoading] = useState(false);

  const makeDonation = async (poolId: string, amount: string) => {
    try {
      setIsLoading(true);
      const smartAccount = currentUser?.evmSmartAccounts?.[0];
      if (!smartAccount) {
        throw new Error("No smart account found");
      }

      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: NETWORK,
        calls: await distributorService.prepareDonate(
          BigInt(poolId),
          BigInt(amount)
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

  return { makeDonation, isLoading };
};

export const useDonations = (
  poolId: string
): { donations: Donation[] | undefined; isLoading: boolean } => {
  // const { data, isLoading } = useSWR(`/api/distributor/${poolId}/donations`, {
  //   fetcher: () => distributorService.getDonations(BigInt(poolId)),
  // });

  return { donations: [], isLoading: false };
};
