"use client";

import { AccountManager } from "@/components/account-manager";
import { Avatar } from "@/components/avatar";
import { ShareCollectorLink } from "@/components/copy-collector-link";
import { DonationCard } from "@/components/donations/card";
import { DeactivateFundraiser } from "@/components/fundraisers/deactivate";
import { FundraiserStatus } from "@/components/fundraisers/status";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_ASSETS } from "@/config";
import {
  useDonations,
  usePool,
  usePoolMembers,
  usePoolSummary,
} from "@/hooks/distributor";
import { formatUsdcBalance, shortenAddress } from "@/lib/utils";
import { PoolStatus } from "@/types/distributor";
import { useCurrentUser, useIsInitialized } from "@coinbase/cdp-hooks";
import { ChartBarIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import {
  DollarSign,
  EllipsisVerticalIcon,
  MoveLeftIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const poolId = BigInt(id);

  const { currentUser } = useCurrentUser();
  const { isInitialized } = useIsInitialized();

  const { pool, isLoading: isPoolLoading } = usePool(poolId);
  const { poolSummary, isLoading: isLoadingPoolSummary } =
    usePoolSummary(poolId);
  const { donations } = useDonations(poolId);
  const { members, isLoading: isLoadingPoolMembers } = usePoolMembers(poolId);

  const [openDeactivateDialog, setOpenDeactivateDialog] = useState(false);

  useEffect(() => {
    if (!currentUser && isInitialized) {
      router.push("/auth");
    }
  }, [currentUser, isInitialized, router]);

  const totalDonationsAmount = poolSummary?.totalDonationsAmount ?? 0n;
  const totalDonationsCount = poolSummary?.totalDonationsCount ?? 0n;
  const uniqueDonatorsCount = poolSummary?.uniqueDonatorsCount ?? 0n;
  const averageDonation = (
    totalDonationsCount === 0n ? 0n : totalDonationsAmount / totalDonationsCount
  ) as bigint;

  if (isPoolLoading || isLoadingPoolSummary || isLoadingPoolMembers) {
    return (
      <div className="min-h-screen min-w-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  return (
    <div>
      <nav className="border-b">
        <div className="flex  items-center justify-between h-[72px] max-w-6xl mx-auto">
          <Link
            href="/dashboard"
            className="flex items-center justify-center h-[46px] w-[46px]  border rounded-full"
          >
            <MoveLeftIcon className="w-4 h-4" />
          </Link>

          <AccountManager />
        </div>
      </nav>

      <div className="h-[100px] bg-muted"></div>

      <div className="max-w-6xl mx-auto py-14 relative">
        <div className="absolute -top-[60px] left-0 -translate-y-1 rounded-md overflow-hidden border">
          <Avatar
            src={pool?.imageUri ?? undefined}
            alt="Fundraiser"
            size={100}
            seed={pool?.creator}
            className="rounded-lg"
          />
        </div>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <h1 className="text-2xl font-bold">{pool?.title}</h1>
              <FundraiserStatus status={pool?.status ?? PoolStatus.PENDING} />
            </div>
            <p className="text-muted-foreground">{pool?.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <ShareCollectorLink
              link={`${window.location.origin}/fundraisers/${id}/donate`}
            >
              <Button disabled={pool?.status !== PoolStatus.ACTIVE}>
                Share Collector Link
              </Button>
            </ShareCollectorLink>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={pool?.status !== PoolStatus.ACTIVE} variant="outline" className="h-9 w-9 rounded-full">
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setOpenDeactivateDialog(true)}>
                  Deactivate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="bg-muted flex rounded-xl p-6 mt-10 gap-4">
          <div className="p-4 bg-background rounded-xl w-min">
            <UsersIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="font-bold">Members</h1>
            <p>
              {members
                .map(
                  (member) =>
                    `${shortenAddress(member.member)} ${
                      member.percentage / 100n
                    }%`
                )
                .join(" | ")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-10">
          <div className="bg-muted rounded-xl p-6">
            <div className="p-4 bg-background rounded-xl w-min mb-2">
              <CurrencyDollarIcon className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">
              {formatUsdcBalance(totalDonationsAmount, SUPPORTED_ASSETS.USDC.decimals)} USDC
            </p>
            <h2 className="text-sm text-muted-foreground font-medium">
              Total Donations 
            </h2>
          </div>

          <div className="bg-muted rounded-xl p-6">
            <div className="p-4 bg-background rounded-xl w-min mb-2">
              <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">
              {formatUsdcBalance(averageDonation, SUPPORTED_ASSETS.USDC.decimals)} USDC
            </p>
            <h2 className="text-sm text-muted-foreground font-medium">
              Average Donation
            </h2>
          </div>

          <div className="bg-muted rounded-xl p-6">
            <div className="p-4 bg-background rounded-xl w-min mb-2">
              <ChartBarIcon className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold">{uniqueDonatorsCount}</p>
            <h2 className="text-sm text-muted-foreground font-medium">
              Total Donators
            </h2>
          </div>
        </div>

        <div className="mt-10 flex items-center">
          <h1 className="text-2xl font-bold">Donations</h1>
        </div>

        {donations?.length ? (
          <div className="grid grid-cols-3 gap-4 mt-10">
            {donations.map((donation) => (
              <DonationCard key={donation.transactionHash} donation={donation} />
            ))}
          </div>
        ) : (
          <div className="mt-10 border rounded-xl px-6 py-20 text-center">
            <div className="bg-muted rounded-xl mb-4 h-10 w-10 flex items-center justify-center mx-auto">
              <DollarSign className="w-4 h-4" />
            </div>

            <h2 className="text-xl font-bold">No donations yet</h2>
            <p className="text-muted-foreground text-sm">
              Your donations will appear here <br /> once people start donating.
            </p>
          </div>
        )}
      </div>

      <DeactivateFundraiser
        poolId={poolId}
        open={openDeactivateDialog}
        setOpen={setOpenDeactivateDialog}
      />
    </div>
  );
}
