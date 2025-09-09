"use client";

import { AccountManager } from "@/components/account-manager";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
    useCurrentUser,
    useIsInitialized,
    useSignOut,
} from "@coinbase/cdp-hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const router = useRouter();

  const { signOut } = useSignOut();
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
        <div className="flex  items-center justify-between h-[72px] max-w-7xl mx-auto">
          <Logo width={150} height={46} />

          <AccountManager />
        </div>
      </nav>
      <div className="flex flex-col items-center justify-center h-screen">
        <Button onClick={() => signOut()}>Sign Out</Button>
      </div>
    </div>
  );
}
