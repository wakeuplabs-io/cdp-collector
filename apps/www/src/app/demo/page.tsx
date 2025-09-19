"use client";

import { Button } from "@/components/ui/button";
import { SUPPORTED_ASSETS } from "@/config";
import { useBalances } from "@/hooks/balance";
import { useSwap } from "@/hooks/swap";
import { useCurrentUser, useEvmAddress } from "@coinbase/cdp-hooks";
import { useEffect, useState } from "react";
import { Address } from "viem";

export default function Demo() {
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { balances } = useBalances(evmAddress ?? undefined);
  const { swap, isLoading } = useSwap();

  const [owner, setOwner] = useState<Address | null>(null);
  const [taker, setTaker] = useState<Address | null>(null);

  useEffect(() => {
    setOwner(currentUser?.evmAccounts?.[0] as Address);
    setTaker(currentUser?.evmSmartAccounts?.[0] as Address);
  }, [currentUser]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-4">
      <div className="max-w-lg w-full space-y-4">
        <pre className="bg-muted overflow-x-scroll">owner: {JSON.stringify(owner, null, 2)}</pre>
        <pre className="bg-muted overflow-x-scroll">taker: {JSON.stringify(taker, null, 2)}</pre>
        <pre className="bg-muted overflow-x-scroll">{JSON.stringify(balances, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2)}</pre>

        <Button
          onClick={() => {
            swap({
              from: SUPPORTED_ASSETS.cbBTC,
              to: SUPPORTED_ASSETS.USDC,
              amount: 300n,
            });
          }}
          disabled={isLoading}
        >
          {isLoading ? "Swapping..." : "Swap"}
        </Button>
      </div>
    </div>
  );
}
