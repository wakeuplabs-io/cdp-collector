import useSWR from "swr";

export const useBalance = (address?: string) => {
  return useSWR(`/api/balance/${address}`, {
    fetcher: async (url: string) => {
      if (!address) return BigInt(0);
      
      // TODO: Implement balance fetching
      return BigInt(0);
    },
  });
};


export const useWithdraw = () => {
  return {
    isPending: false,
  }
};