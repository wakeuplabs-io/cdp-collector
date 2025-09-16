import { Button } from "@/components/ui/button";
import { usePoolSummary } from "@/hooks/distributor";
import { shortenAddress } from "@/lib/utils";
import { Pool } from "@/types/distributor";
import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { ShareCollectorLink } from "../copy-collector-link";
import { FundraiserStatus } from "./status";

export const FundraiserCard: React.FC<{ pool: Pool }> = ({ pool }) => {
  const router = useRouter();
  const { poolSummary } = usePoolSummary(pool.id);

  return (
    <div className="border rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{pool.title}</h2>
          <p className="text-muted-foreground">{pool.description}</p>
        </div>
        <FundraiserStatus status={pool.status} />
      </div>

      <div className="bg-muted/50 rounded-xl p-4 mt-4 flex items-center justify-between">
        <span className="font-bold text-2xl">
          ${poolSummary?.totalDonationsAmount ?? 0}
        </span>
        <span className="text-muted-foreground border rounded-full bg-muted px-2 py-1 text-sm font-medium">
          {poolSummary?.totalDonationsAmount ?? 0} USDC
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Created</p>
          <p className="text-sm font-medium">
            {pool.createdAt.toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Creator</p>
          <p className="text-sm font-medium">{shortenAddress(pool.creator)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <ShareCollectorLink
          link={`${window.location.origin}/fundraisers/${pool.id}/donate`}
        >
          <Button size="lg" variant="outline" className="flex-1">
            Share Collector Link
          </Button>
        </ShareCollectorLink>
        <Button
          size="lg"
          variant="outline"
          onClick={() => router.push(`/fundraisers/${pool.id}`)}
        >
          <ArrowUpRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
