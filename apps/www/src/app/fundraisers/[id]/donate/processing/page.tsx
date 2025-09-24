"use client";

import { SUPPORTED_ASSETS } from "@/config";
import { useMakeDonation } from "@/hooks/distributor";
import { useSwap } from "@/hooks/swap";
import { shortenAddress } from "@/lib/utils";
import { Token } from "@/types/token";
import { useCurrentUser } from "@coinbase/cdp-hooks";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { toast } from "sonner";
import { formatUnits } from "viem";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const poolId = BigInt(id);
  const queryParameters = useSearchParams();
  const txHash = queryParameters.get("txHash");
  const amount = BigInt(queryParameters.get("amount") ?? "0");
  const tokenAddress = queryParameters.get("token");
  const isExecuting = useRef(false);

  const { swap } = useSwap();
  const { makeDonation } = useMakeDonation();
  const { currentUser } = useCurrentUser();

  const token = Object.values(SUPPORTED_ASSETS).find((t) => t.address === tokenAddress);

  useEffect(() => {
    async function swapAndDonate(
      poolId: bigint,
      token: Token,
      amount: bigint
    ) {
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // check if we need to swap, otherwise donate directly
          let donationAmount = amount;

          if (token.symbol !== "USDC") {
            const { amount: swappedAmount } = await swap({ from: token, to: SUPPORTED_ASSETS.USDC, amount });
            donationAmount = swappedAmount;
          }

          const { hash } = await makeDonation(poolId, donationAmount);
          router.push(`/fundraisers/${poolId}/donate/success?txHash=${hash}`);
          return; // Success, exit the retry loop
        } catch (error) {
          console.error(`Attempt ${attempt} failed:`, error);
          
          if (attempt === maxRetries) {
            // Final attempt failed
            toast.error("Something went wrong", {
              description:
                "You can withdraw the funds from your account and try again",
            });
            return;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    if (currentUser && token && !isExecuting.current) {
      isExecuting.current = true;
      swapAndDonate(
        poolId,
        token,
        amount
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <div className="py-10 px-6 min-h-[200px] flex flex-col gap-4 items-center justify-center text-center">
      <Loader2 className="w-10 h-10 animate-spin" />
      <span className="text-sm text-muted-foreground">
        Processing transaction {txHash ? shortenAddress(txHash) : ""} for{" "}
        {formatUnits(amount, token?.decimals ?? 0)} {token?.symbol}.
        <br />
        Don&apos;t close this page...
      </span>
    </div>
  );
}

