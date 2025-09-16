"use client";

import { usePool } from "@/hooks/distributor";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const { pool } = usePool(id);
  const { evmAddress } = useEvmAddress();

  const [tab, setTab] = useState<
    "auth" | "method" | "crypto" | "processing" | "success"
  >("auth");

  useEffect(() => {
    if (!evmAddress) {
      setTab("auth");
    } else if (tab === "auth") {
      setTab("method");
    }
  }, [evmAddress, tab]);

  return (
    <div className="py-10 px-6 min-h-[200px] flex flex-col gap-4 items-center justify-center text-center">
      <Loader2 className="w-10 h-10 animate-spin" />
      <span className="text-sm text-muted-foreground">
        Processing your donation.
        <br />
        Don't close this page...
      </span>
    </div>
  );
}
