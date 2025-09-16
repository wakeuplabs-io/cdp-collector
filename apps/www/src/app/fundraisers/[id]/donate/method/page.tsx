"use client";

import { Button } from "@/components/ui/button";
import { publicClient, SUPPORTED_ASSETS } from "@/config";
import { useOnramp } from "@/hooks/onramp";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const router = useRouter();
  const { evmAddress } = useEvmAddress();
  const { openOnramp } = useOnramp({ to: evmAddress!, assets: SUPPORTED_ASSETS.map((asset) => asset.symbol) });

  const onDonateWithFiat = useCallback(async () => {
    const latestBlock = await publicClient.getBlockNumber();
    
    await openOnramp();
    router.push(`/fundraisers/${id}/donate/method/transfer?startBlock=${latestBlock}`);
  }, [openOnramp, router, id]);

  const onDonateWithTransfer = useCallback(async () => {
    const latestBlock = await publicClient.getBlockNumber();
    router.push(`/fundraisers/${id}/donate/method/transfer?startBlock=${latestBlock}`);
  }, [id, router]);

  return (
    <div className="space-y-3 p-6">
      <Button
        className="w-full h-12"
        size="lg"
        onClick={onDonateWithTransfer}
      >
        Donate with Transfer
      </Button>
      <Button
        variant="outline"
        className="w-full h-12"
        size="lg"
        onClick={onDonateWithFiat}
      >
        Donate with Fiat
      </Button>
    </div>
  );
}
