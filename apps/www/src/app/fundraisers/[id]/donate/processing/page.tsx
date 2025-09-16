"use client";

import { SUPPORTED_ASSETS } from "@/config";
import { useMakeDonation } from "@/hooks/distributor";
import { shortenAddress } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";

// http://localhost:3000/fundraisers/3/donate/processing?txHash=0x4894b74dcd28b1d37ff62677919add03ba9a067b6eecaa8d7c228197c5156f29&amount=1&token=0x295E9B95C563F1ed0F10eD8dB24f2f58f043d959
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const queryParameters = useSearchParams();
  const txHash = queryParameters.get("txHash");
  const amount = queryParameters.get("amount");
  const tokenAddress = queryParameters.get("token");

  const { makeDonation } = useMakeDonation();

  const token = SUPPORTED_ASSETS.find((t) => t.address === tokenAddress);

  useEffect(() => {
    // TODO: check if we need to swap, otherwise donate directly
    if (!token || !tokenAddress || !amount || !id) return;

    if (token.symbol !== "USDC") {
      // TODO: swap to USDC
    }

    makeDonation(id, amount).then(({ hash }) => {
      router.push(`/fundraisers/${id}/donate/success?txHash=${hash}`);
    }); 
  }, [id, tokenAddress, amount, token, router, makeDonation]);


  return (
    <div className="py-10 px-6 min-h-[200px] flex flex-col gap-4 items-center justify-center text-center">
      <Loader2 className="w-10 h-10 animate-spin" />
      <span className="text-sm text-muted-foreground">
        Processing transaction {shortenAddress(txHash ?? "")} for {amount} {token?.symbol}.
        <br />
        Don't close this page...
      </span>
    </div>
  );
}
