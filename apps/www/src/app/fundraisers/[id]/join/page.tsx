"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function Donate() {
  const { id } = useParams();
  const [tab, setTab] = useState<"auth" | "join" | "success">("auth");

  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center justify-center bg-background">
      <div className="bg-background rounded-xl max-w-md min-h-[500px] border flex flex-col">
        <div className="bg-gradient-to-b from-blue-200 to-background h-20 relative rounded-t-xl">
          <Image
            src="/avatar.webp"
            alt="Fundraiser"
            width={80}
            height={80}
            className="rounded-full absolute left-1/2 -translate-x-1/2 -bottom-6"
          />
        </div>

        <div className="p-6 pt-10 flex-1">
          <h1 className="text-2xl font-bold text-center">Fundraiser Title</h1>
          <p className="text-muted-foreground text-center">
            0x123 invited you to join their fundraiser and get 10% of the
            collected funds.
          </p>
        </div>

        {tab === "auth" && (
          <div className="border-t p-6">
            <Button
              className="w-full h-12"
              size="lg"
              onClick={() => setTab("join")}
            >
              Sign Up or Login to Join
            </Button>
          </div>
        )}

        {tab === "join" && (
          <div className="border-t p-6">
            <Button
              className="w-full h-12"
              size="lg"
              onClick={() => setTab("success")}
            >
              Join
            </Button>
          </div>
        )}

        {tab === "success" && (
          <div className="border-t p-6 space-y-3">
            <div className="text-center">
              <span className="text-2xl font-bold">🎉 Success! 🎉</span>
            </div>
            <div className="text-center mb-20 text-muted-foreground">
              You have joined the fundraiser successfully.
            </div>

            <Button className="w-full h-12" size="lg">
              Go to dashboard
            </Button>
            <Button variant="outline" className="w-full h-12" size="lg">
              Open in explorer
            </Button>
          </div>
        )}
      </div>
      <div className="text-muted-foreground text-center mt-4 font-medium text-sm">
        Secured by Coinbase 🔒
      </div>
    </div>
  );
}
