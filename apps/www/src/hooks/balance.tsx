import {
  bundlerClient, SUPPORTED_ASSETS,
  tokenService
} from "@/config";
import { CdpService } from "@/lib/services/cdp";
import { TokenWithBalance } from "@/types/token";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { Address } from "viem";

export const useBalances = (
  address?: Address
): { balances: TokenWithBalance[]; isLoading: boolean } => {
  const emptyBalances = useMemo(
    () => SUPPORTED_ASSETS.map((token) => ({ ...token, balance: BigInt(0) })),
    []
  );

  const { data, isLoading } = useSWR(`/api/balance/${address}`, {
    fetcher: async () => {
      if (!address) return emptyBalances;

      const balances = await Promise.all(
        SUPPORTED_ASSETS.map(async (token) => ({
          ...token,
          balance: await tokenService.getBalance(token.address, address),
        }))
      );

      return balances;
    },
    refreshInterval: 10000,
  });

  return { balances: data ?? emptyBalances, isLoading };
};

export const useWithdraw = () => {
  const [isLoading, setIsLoading] = useState(false);

  const withdraw = async ({
    token,
    amount,
    to,
  }: {
    token: Address;
    amount: bigint;
    to: Address;
  }): Promise<{ hash: string }> => {
    try {
      setIsLoading(true);

      const result = await CdpService.sendUserOperation({
        calls: await tokenService.prepareTransfer(token, amount, to),
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

  return { withdraw, isLoading };
};
