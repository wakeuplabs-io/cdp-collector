import { USDC } from "@/config";
import { openExplorerTx } from "@/lib/explorer";
import { formatUsdcBalance, shortenAddress } from "@/lib/utils";
import { Donation } from "@/types/distributor";
import { ArrowUpRightIcon } from "lucide-react";

export function DonationCard({ donation }: { donation: Donation }) {
  return (
    <div className="border rounded-xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{shortenAddress(donation.donor)}</h2>
        <button className="flex items-center gap-2 cursor-pointer" onClick={() => openExplorerTx(donation.transactionHash)}>
          <span className="text-sm font-medium">more details</span>
          <ArrowUpRightIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-muted/50 rounded-xl p-4 mt-4 flex items-center justify-between">
        <span className="font-bold text-2xl">
          ${formatUsdcBalance(donation.amount, USDC.decimals)}
        </span>
        <span className="text-muted-foreground border rounded-full bg-muted px-2 py-1 text-sm font-medium">
          {formatUsdcBalance(donation.amount, USDC.decimals)} USDC
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Created</p>
          <p className="text-sm font-medium">
            {donation.createdAt.toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Receipt</p>
          <button className="text-sm font-medium cursor-pointer" onClick={() => openExplorerTx(donation.transactionHash)}>
            {shortenAddress(donation.transactionHash)}
          </button>
        </div>
      </div>
    </div>
  );
}
