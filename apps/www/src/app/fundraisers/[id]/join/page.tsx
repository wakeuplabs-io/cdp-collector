"use client";

import { AccountManager } from "@/components/account-manager";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { useJoinPool, usePool, usePoolMembers } from "@/hooks/distributor";
import { openExplorerTx } from "@/lib/explorer";
import { shortenAddress } from "@/lib/utils";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { keccak256, toBytes } from "viem";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);
  const poolId = BigInt(id);
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const { pool, isLoading } = usePool(poolId);
  const { members } = usePoolMembers(poolId);
  const { joinPool, isLoading: isJoining } = useJoinPool();
  const { evmAddress } = useEvmAddress();

  const [successTx, setSuccessTx] = useState<string | null>(null);

  const onJoin = async () => {
    if (!code) {
      return;
    }

    joinPool(poolId, code)
      .then(({ hash }) => {
        setSuccessTx(hash);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Couldn't join fundraiser", {
          description: error.message,
        });
      });
  };

  const hashedCode = useMemo(() => {
    return keccak256(toBytes(code ?? "0x0"));
  }, [code]);
  const member = useMemo(() => {
    return members?.find((member) => member.invitationCodeHash === hashedCode);
  }, [members, hashedCode]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        {evmAddress && <AccountManager />}
      </div>

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
            {shortenAddress(
              pool?.creator ?? "0x0000000000000000000000000000000000000000"
            )}{" "}
            invited you to join their fundraiser and get{" "}
            {member?.percentage ? Number(member.percentage) / 100 : 0}% of the
            collected funds.
          </p>
        </div>

        <div className="border-t p-6">
          {!evmAddress ? (
            <div className="border-t p-6">
              <AuthButton
                className="flex items-center gap-2 rounded-md bg-primary h-[46px] shrink-0 text-sm font-normal [&_button]:!bg-transparent [&_button]:!text-primary-foreground [&_button]:!px-4 [&_button]:!text-center [&_button]:!w-full"
                id="account-manager"
              />
            </div>
          ) : member && !successTx ? (
            <Button
              size="lg"
              onClick={onJoin}
              disabled={isJoining}
              className="w-full h-12"
            >
              {isJoining ? "Joining..." : "Join"}
            </Button>
          ) : successTx ? (
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-2xl font-bold">🎉 Success! 🎉</span>
              </div>
              <div className="text-center mb-20 text-muted-foreground">
                You have joined the fundraiser successfully.
              </div>

              <Button
                className="w-full h-12"
                size="lg"
                onClick={() => router.push(`/dashboard`)}
              >
                Go to dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full h-12"
                size="lg"
                onClick={() => successTx && openExplorerTx(successTx)}
              >
                Open in explorer
              </Button>
            </div>
          ) : (
            <div className="text-center">Invalid Code.</div>
          )}
        </div>
      </div>
      <div className="text-muted-foreground text-center mt-4 font-medium text-sm">
        Secured by Coinbase 🔒
      </div>
    </div>
  );
}
