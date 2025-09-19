"use client";

import { Address } from "@/components/address";
import { Button } from "@/components/ui/button";
import { SUPPORTED_ASSETS } from "@/config";
import { useIncomingTransactions } from "@/hooks/incoming-transactions";
import { useEvmAddress, useIsInitialized } from "@coinbase/cdp-hooks";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import QrCode from "react-qr-code";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { evmAddress } = useEvmAddress();
  const { isInitialized } = useIsInitialized();
  const queryParameters = useSearchParams();
  const startBlock = queryParameters.get("startBlock");

  useIncomingTransactions(evmAddress!, Object.values(SUPPORTED_ASSETS), BigInt(startBlock ?? 0), (tx) => {
    // Received transaction, let's make donation
    router.push(`/fundraisers/${id}/donate/processing?amount=${tx.amount.toString()}&token=${tx.token}` + (tx.txHash ? `&txHash=${tx.txHash}` : ""));
  });

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <div className="pt-10 px-6 pb-6">
      <QrCode className="h-40 w-40 mx-auto mb-6" value={evmAddress ?? "0x0"} />

      <Address address={evmAddress ?? "0x0"} className="mb-2" />

      <p className="text-center text-sm mb-10">
        Deposit {Object.keys(SUPPORTED_ASSETS).join(", ").replace(/, ([^,]*)$/, " or $1")} to this address in{" "}
        <span className="font-bold">Base Mainnet</span>. Collector will receive USDC each time.
      </p>

      <div className="text-center text-sm mb-10 text-muted-foreground animate-pulse">
        We&apos;ll redirect you as soon as we detect your transaction...
      </div>

      <Button
        variant="outline"
        className="w-full h-12"
        size="lg"
        onClick={() => router.push(`/fundraisers/${id}/donate/method`)}
      >
        Back
      </Button>
    </div>
  );
}
