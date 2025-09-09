"use client";

import { SignIn } from "@coinbase/cdp-react";
import { useRouter } from "next/navigation";

export default function Auth() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="border rounded-xl min-w-lg p-4">
        <SignIn
          onSuccess={() => {
            router.push("/dashboard");
          }}
        />
      </div>
    </div>
  );
}
