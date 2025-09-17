"use client";

import { SUPPORTED_ASSETS, USDC } from "@/config";
import { useMakeDonation } from "@/hooks/distributor";
import { useSwap } from "@/hooks/swap";
import { shortenAddress } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const poolId = BigInt(id);
  const queryParameters = useSearchParams();
  const txHash = queryParameters.get("txHash");
  const amount = queryParameters.get("amount");
  const tokenAddress = queryParameters.get("token");

  const { swap } = useSwap();
  const { makeDonation } = useMakeDonation();

  const token = SUPPORTED_ASSETS.find((t) => t.address === tokenAddress);

  useEffect(() => {
    async function swapAndDonate() {
      if (!token || !tokenAddress || !amount || !poolId) return;

      try {
        // check if we need to swap, otherwise donate directly
        if (token.symbol !== "USDC") {
          await swap({
            from: token,
            to: USDC,
            amount: BigInt(amount),
          });
        }

        const { hash } = await makeDonation(poolId, amount);
        router.push(`/fundraisers/${poolId}/donate/success?txHash=${hash}`);
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong", {
          description:
            "You can withdraw the funds from your account and try again",
        });
      }
    }

    swapAndDonate();
  }, [poolId, tokenAddress, amount, token, router, makeDonation, swap]);

  return (
    <div className="py-10 px-6 min-h-[200px] flex flex-col gap-4 items-center justify-center text-center">
      <Loader2 className="w-10 h-10 animate-spin" />
      <span className="text-sm text-muted-foreground">
        Processing transaction {shortenAddress(txHash ?? "")} for {amount}{" "}
        {token?.symbol}.
        <br />
        Don&apos;t close this page...
      </span>
    </div>
  );
}
