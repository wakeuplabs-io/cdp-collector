"use client";

import { AccountManager } from "@/components/account-manager";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser, useIsInitialized } from "@coinbase/cdp-hooks";
import { ChartBarIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { ArrowUpRightIcon, EllipsisVerticalIcon, MoveLeftIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FundraiserDetails() {
  const router = useRouter();

  const { currentUser } = useCurrentUser();
  const { isInitialized } = useIsInitialized();

  useEffect(() => {
    if (!currentUser && isInitialized) {
      router.push("/auth");
    }
  }, [currentUser, isInitialized]);

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
          <Image src="/avatar.webp" alt="Fundraiser" width={100} height={100} />
        </div>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Fundraiser title</h1>
            <p className="text-muted-foreground">
              Lorem ipsum dolor sit, amet consectetur adipisicing elit. Libero
              iste itaque aspernatur voluptates dolore necessitatibus nulla
              accusantium rerum amet consequatur voluptate veniam iure aliquam,
              blanditiis, ab consectetur architecto odio suscipit.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" className="h-9 w-9 rounded-full">
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Fundraiser</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Copy Link</DropdownMenuItem>
                <DropdownMenuItem>Team</DropdownMenuItem>
                <DropdownMenuItem>Deactivate</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-10">
          <div className="bg-muted rounded-xl p-6">
            <div className="p-4 bg-background rounded-xl w-min mb-2">
              <CurrencyDollarIcon className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">10 USDC</p>
            <h2 className="text-sm text-muted-foreground font-medium">
              Total Donations
            </h2>
          </div>

          <div className="bg-muted rounded-xl p-6">
            <div className="p-4 bg-background rounded-xl w-min mb-2">
              <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">10 USDC</p>
            <h2 className="text-sm text-muted-foreground font-medium">
              Average Donation
            </h2>
          </div>

          <div className="bg-muted rounded-xl p-6">
            <div className="p-4 bg-background rounded-xl w-min mb-2">
              <ChartBarIcon className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold">10</p>
            <h2 className="text-sm text-muted-foreground font-medium">
              Total Donators
            </h2>
          </div>
        </div>

        <div className="mt-10 flex items-center">
          <h1 className="text-2xl font-bold">Donations</h1>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-10">
          <FundraiserCard />
          <FundraiserCard />
        </div>

        {/* <div className="mt-10 border rounded-xl px-6 py-20 text-center">
          <div className="bg-muted rounded-xl mb-4 h-10 w-10 flex items-center justify-center mx-auto">
            <DollarSign className="w-4 h-4" />
          </div>

          <h2 className="text-xl font-bold">No donations yet</h2>
          <p className="text-muted-foreground text-sm">
            Your donations will appear here <br /> once people start donating.
          </p>
        </div> */}
      </div>
    </div>
  );
}

function FundraiserCard() {
  return (
    <div className="border rounded-xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">0x12...7890</h2>
        <ArrowUpRightIcon className="w-4 h-4" />
      </div>

      <div className="bg-muted/50 rounded-xl p-4 mt-4 flex items-center justify-between">
        <span className="font-bold text-2xl">$100</span>
        <span className="text-muted-foreground border rounded-full bg-muted px-2 py-1 text-sm font-medium">
          100 USDC
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Created</p>
          <p className="text-sm font-medium">10/10/2025</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Receipt</p>
          <p className="text-sm font-medium">0x1234567890</p>
        </div>
      </div>
    </div>
  );
}
