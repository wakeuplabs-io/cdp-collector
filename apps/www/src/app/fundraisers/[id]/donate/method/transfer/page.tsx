"use client";

import { Address } from "@/components/address";
import { Button } from "@/components/ui/button";
import { SUPPORTED_ASSETS } from "@/config";
import { useIncomingTransactions } from "@/hooks/incoming-transactions";
import { useEvmAddress, useIsInitialized } from "@coinbase/cdp-hooks";
import { useRouter } from "next/navigation";
import React from "react";
import QrCode from "react-qr-code";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { evmAddress } = useEvmAddress();
  const { isInitialized } = useIsInitialized();

  useIncomingTransactions(evmAddress!, SUPPORTED_ASSETS, (tx) => {
    // TODO: Received transaction, wait for tx confirmation and create donation
    router.push(`/fundraisers/${id}/donate/success`);
  });

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <div className="pt-10 px-6 pb-6">
      <QrCode className="h-40 w-40 mx-auto mb-6" value={evmAddress ?? "0x0"} />

      <Address address={evmAddress ?? "0x0"} className="mb-2" />

      <p className="text-center text-sm mb-10">
        Deposit <span className="font-bold">USDC</span> or{" "}
        <span className="font-bold">POL</span> to this address in{" "}
        <span className="font-bold">Base Mainnet</span>
      </p>

      <div className="text-center text-sm mb-10 text-muted-foreground animate-pulse">
        We'll redirect you as soon as we detect your transaction...
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
