"use client";

import { SignIn } from "@coinbase/cdp-react";
import { useRouter } from "next/navigation";

export default function Auth() {
  const router = useRouter();

  return (
    <div className="flex flex-row items-center justify-center h-screen">
      <div className="border rounded-xl max-w-lg pb-8 flex-1">
        <SignIn
          onSuccess={() => {
            router.push("/dashboard");
          }}
        />
      </div>
    </div>
  );
}
