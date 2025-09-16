"use client";

import { Address } from "@/components/address";
import { Button } from "@/components/ui/button";
import { publicClient, SUPPORTED_ASSETS } from "@/config";
import { useIncomingTransactions } from "@/hooks/incoming-transactions";
import { useEvmAddress, useIsInitialized } from "@coinbase/cdp-hooks";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import QrCode from "react-qr-code";
import { parseAbiItem } from "viem";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { evmAddress } = useEvmAddress();
  const { isInitialized } = useIsInitialized();
  const queryParameters = useSearchParams();
  const startBlock = queryParameters.get("startBlock");

  useIncomingTransactions(evmAddress!, SUPPORTED_ASSETS, (tx) => {
    // Received transaction, let's make donation
    router.push(`/fundraisers/${id}/donate/processing?txHash=${tx.txHash}&amount=${tx.amount}&token=${tx.token}`);
  }, startBlock ? BigInt(startBlock) : undefined); // Optional: start polling from this block

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <div className="pt-10 px-6 pb-6">
      <QrCode className="h-40 w-40 mx-auto mb-6" value={evmAddress ?? "0x0"} />

      <Address address={evmAddress ?? "0x0"} className="mb-2"  />

      <p className="text-center text-sm mb-10">
        Deposit {SUPPORTED_ASSETS.map((asset) => asset.symbol).join(", ").replace(/, ([^,]*)$/, " or $1")} to this address in{" "}
        <span className="font-bold">Base Mainnet</span>
      </p>

      <div className="text-center text-sm mb-10 text-muted-foreground animate-pulse">
        We&apos;ll redirect you as soon as we detect your transaction...
      </div>

      <Button
        variant="outline"
        className="w-full h-12"
        size="lg"
        // onClick={() => router.push(`/fundraisers/${id}/donate/method`)}
        onClick={async () => {
          console.log("Testing getLogs...");
          try {
            const logs = await publicClient.getLogs({
              address: SUPPORTED_ASSETS[0].address,
              event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
              fromBlock: 31134637n,
              toBlock: 31134648n,
              args: {
                to: "0x634A6c396D72e03C5a919Df40d12158770f08e06",
              },
            });
            console.log("Got logs:", logs.length);
            console.log("First few logs:", logs.slice(0, 3));
          } catch (error) {
            console.error("Error:", error);
          }
        }}
      >
        Back
      </Button>
    </div>
  );
}
