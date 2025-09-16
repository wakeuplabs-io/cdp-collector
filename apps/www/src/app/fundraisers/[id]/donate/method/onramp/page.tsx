"use client";

import { SUPPORTED_ASSETS } from "@/config";
import { useIncomingTransactions } from "@/hooks/incoming-transactions";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { useRouter } from "next/navigation";
import React from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { evmAddress } = useEvmAddress();

  useIncomingTransactions(evmAddress!, SUPPORTED_ASSETS, (tx) => {
    // TODO: Received transaction, wait for tx confirmation and create donation
    router.push(`/fundraisers/${id}/donate/success`);
  });

  return (
    <div className="text-center text-sm p-6 text-muted-foreground animate-pulse">
      We're waiting for the onramp to complete. We'll redirect you as soon as we
      detect the funds...
    </div>
  );
}
