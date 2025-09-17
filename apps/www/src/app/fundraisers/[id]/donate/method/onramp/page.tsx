"use client";

import { SUPPORTED_ASSETS } from "@/config";
import { useIncomingTransactions } from "@/hooks/incoming-transactions";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { evmAddress } = useEvmAddress();
  const queryParameters = useSearchParams();
  const startBlock = queryParameters.get("startBlock");


  useIncomingTransactions(evmAddress!, SUPPORTED_ASSETS, BigInt(startBlock ?? 0), (tx) => {
    // Received transaction, let's make donation
    router.push(`/fundraisers/${id}/donate/processing?txHash=${tx.txHash}&amount=${tx.amount}&token=${tx.token}`);
  }); 

  return (
    <div className="text-center text-sm p-6 text-muted-foreground animate-pulse">
      We&apos;re waiting for the onramp to complete. We&apos;ll redirect you as soon as we
      detect the funds...
    </div>
  );
}
