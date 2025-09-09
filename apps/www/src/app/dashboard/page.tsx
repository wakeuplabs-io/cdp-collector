"use client";

import { Button } from "@/components/ui/button";
import { useCurrentUser, useIsInitialized, useSignOut } from "@coinbase/cdp-hooks";
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
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>Dashboard</h1>
      <Button onClick={() => signOut()}>Sign Out</Button>
    </div>
  );
}
