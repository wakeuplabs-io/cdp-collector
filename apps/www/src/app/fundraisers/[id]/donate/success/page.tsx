"use client";

import { Button } from "@/components/ui/button";
import { openExplorerTx } from "@/lib/explorer";
import { useRouter, useSearchParams } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const txHash = searchParams.get("txHash");

  return (
    <div className="p-6 space-y-3">
      <div className="text-center">
        <span className="text-2xl font-bold">🎉 Success! 🎉</span>
      </div>
      <div className="text-center mb-20 text-muted-foreground">
        The funds have been transferred to the fundraiser. Thank you for your
        donation!
      </div>

      <Button
        onClick={() => router.push(`/dashboard`)}
        className="w-full h-12"
        size="lg"
      >
        Create your own fundraiser
      </Button>
      <Button
        variant="outline"
        className="w-full h-12"
        size="lg"
        onClick={() => txHash && openExplorerTx(txHash)}
      >
        Open in explorer
      </Button>
    </div>
  );
}
