"use client";

import { Avatar } from "@/components/avatar";
import { usePool } from "@/hooks/distributor";
import React from "react";

export default function Page({ params, children }: { params: Promise<{ id: string }>, children: React.ReactNode }) {
  const { id } = React.use(params);
  const { pool } = usePool(id);

  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center justify-center bg-background">
      <div className="bg-background rounded-xl w-sm min-h-[500px] border flex flex-col">
        <div className="bg-gradient-to-b from-blue-200 to-background h-20 relative rounded-t-xl">
          <Avatar
            src={pool?.imageUri}
            alt="Fundraiser"
            size={80}
            seed={pool?.creator}
            className="rounded-full absolute left-1/2 -translate-x-1/2 -bottom-6"
          />
        </div>

        <div className="p-6 pt-10 flex-1">
          <h1 className="text-2xl font-bold text-center">{pool?.title}</h1>
          <p className="text-muted-foreground text-center">
            {pool?.description}
          </p>
        </div>

        <div className="border-t">
          {children}
        </div>
      </div>
      <div className="text-muted-foreground text-center mt-4 font-medium text-sm">
        Payments secured by Coinbase 🔒
      </div>
    </div>
  );
}
