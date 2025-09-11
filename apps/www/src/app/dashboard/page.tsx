"use client";

import { AccountManager } from "@/components/account-manager";
import { CreateFundraiser } from "@/components/fundraisers/create";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useIsInitialized } from "@coinbase/cdp-hooks";
import { ChartBarIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { PiggyBankIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
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
          <Logo width={150} height={46} />

          <AccountManager />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto my-14">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">
            This is what's been happening with your fundraisers
          </p>
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
              Total Fundraisers
            </h2>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Fundraisers</h1>

          <CreateFundraiser>
            <Button>
              <PlusIcon className="w-5 h-5" />
              Create Fundraiser
            </Button>
          </CreateFundraiser>
        </div>

        {/* <div className="grid grid-cols-3 gap-4 mt-10">
          <FundraiserCard id="1" />
          <FundraiserCard id="2" />
        </div> */}

        <div className="mt-10 border rounded-xl px-6 py-20 text-center">
          <div className="bg-muted rounded-xl mb-4 h-10 w-10 flex items-center justify-center mx-auto">
            <PiggyBankIcon className="w-4 h-4" />
          </div>

          <h2 className="text-xl font-bold">No fundraisers yet</h2>
          <p className="text-muted-foreground text-sm">
            Your fundraisers will appear here <br /> once you create one.
          </p>
        </div>
      </div>
    </div>
  );
}
