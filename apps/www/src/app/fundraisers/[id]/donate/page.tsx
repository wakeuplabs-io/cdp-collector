"use client";

import { Button } from "@/components/ui/button";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();

  const { evmAddress } = useEvmAddress();

  useEffect(() => {
    if (evmAddress) {
      router.push(`/fundraisers/${id}/donate/method`);
    }
  }, [evmAddress, id, router]);

  return (
    <div className="p-6 border-t">
      <Button className="w-full h-12" size="lg">
        Sign Up or Login to Donate
      </Button>
    </div>
  );
}
