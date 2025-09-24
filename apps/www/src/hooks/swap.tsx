"use client";

import { CdpService } from "@/lib/services/cdp";
import { Token } from "@/types/token";
import { useState } from "react";

export const useSwap = () => {
  const [isLoading, setIsLoading] = useState(false);

  const swap = async (swap: {
    from: Token;
    to: Token;
    amount: bigint;
  }): Promise<{ hash: string, amount: bigint }> => {
    try {
      setIsLoading(true);

      return await CdpService.swap(swap.from, swap.to, swap.amount);
    } finally {
      setIsLoading(false);
    }
  };

  return { swap, isLoading };
};
