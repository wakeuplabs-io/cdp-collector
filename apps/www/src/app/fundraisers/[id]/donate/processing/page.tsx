"use client";

import { SUPPORTED_ASSETS, tokenService, USDC } from "@/config";
import { useMakeDonation } from "@/hooks/distributor";
import { useSwap } from "@/hooks/swap";
import { shortenAddress } from "@/lib/utils";
import { Token } from "@/types/token";
import { useCurrentUser } from "@coinbase/cdp-hooks";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Address, formatUnits } from "viem";

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

  const token = SUPPORTED_ASSETS.find((t) => t.address === tokenAddress);

  useEffect(() => {
    async function swapAndDonate(
      evmAddress: Address,
      poolId: bigint,
      token: Token,
      amount: bigint
    ) {
      try {
        // check if we need to swap, otherwise donate directly
        let donationAmount = amount;

        if (token.symbol !== "USDC") {
          const balanceBefore = await tokenService.getBalance(
            USDC.address,
            evmAddress
          );
          await swap({ from: token, to: USDC, amount });
          const balanceAfter = await tokenService.getBalance(
            USDC.address,
            evmAddress
          );
          donationAmount = balanceAfter - balanceBefore;
        }

        const { hash } = await makeDonation(poolId, donationAmount);
        router.push(`/fundraisers/${poolId}/donate/success?txHash=${hash}`);
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong", {
          description:
            "You can withdraw the funds from your account and try again",
        });
      }
    }

    if (currentUser && token && !isExecuting.current) {
      isExecuting.current = true;
      swapAndDonate(
        currentUser?.evmSmartAccounts?.[0] as Address,
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

