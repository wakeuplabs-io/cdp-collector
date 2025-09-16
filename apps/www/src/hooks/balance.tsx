import { erc20Service } from "@/config";
import useSWR from "swr";
import { Address } from "viem";

export const useBalance = (address?: Address) => {
  return useSWR(`/api/balance/${address}`, {
    fetcher: async () => {
      if (!address) return BigInt(0);

      return await erc20Service.getBalance(address);
    },
    refreshInterval: 10000,
  });
};

export const useWithdraw = () => {
  return {
    isLoading: false,
  };
};
