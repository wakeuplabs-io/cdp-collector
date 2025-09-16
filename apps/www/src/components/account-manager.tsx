"use client";

import { Address } from "@/components/address";
import { CryptoTokenSelector } from "@/components/token-selector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { TOKEN_DECIMALS } from "@/config";
import { useBalance, useWithdraw } from "@/hooks/balance";
import { formatBalance, shortenAddress } from "@/lib/utils";
import { useEvmAddress, useSignOut } from "@coinbase/cdp-hooks";
import {
  ArrowLeftIcon,
  ArrowUpIcon,
  XIcon
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Tooltip } from "react-tooltip";
import { isAddress, parseUnits } from "viem";

enum Tab {
  Account = "account",
  Withdraw = "withdraw",
}

const Account: React.FC<{
  address: string;
  balance: bigint;
  setTab: (tab: Tab) => void;
}> = ({ setTab, address, balance }) => {
  const { signOut } = useSignOut();

  return (
    <>
      <Address
        address={address}
        balance={balance}
        balanceLabel="USDC"
        className="mb-2"
      />

      <Button onClick={() => setTab(Tab.Withdraw)} className="w-full mb-14" size="lg">
        <ArrowUpIcon className="w-4 h-4" />
        <span>Withdraw</span>
      </Button>

      <Button
        size="lg"
        variant="outline"
        onClick={signOut}
        className="w-full text-destructive hover:text-destructive/80 flex justify-center text-sm"
      >
        Sign out
      </Button>
    </>
  );
};

const Withdraw: React.FC<{ setTab: (tab: Tab) => void }> = ({ setTab }) => {
  const { evmAddress } = useEvmAddress();
  const { data: balance } = useBalance(evmAddress ?? undefined);
  const { isLoading: isWithdrawing } = useWithdraw();

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  const onWithdraw = useCallback(async () => {
    if (!evmAddress) return;

    // withdraw({
    //   amount: parseUnits(amount, TOKEN_DECIMALS),
    //   to: to as `0x${string}`,
    // })
    //   .then(({ userOperationHash }) => {
    //     toast.success(
    //       "Withdrawal created successfully with user operation hash: " +
    //         userOperationHash
    //     );
    //     setTab(Tab.Account);
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //     toast.error("Failed to withdraw", {
    //       description: error instanceof Error ? error.message : "Unknown error",
    //     });
    //   });
  }, [to, amount, evmAddress, setTab]);

  const validation = useMemo(() => {
    if (!to) {
      return { isValid: false, errors: ["To is required"] };
    }
    if (!isAddress(to)) {
      return { isValid: false, errors: ["To is not a valid address"] };
    }
    if (!amount) {
      return { isValid: false, errors: ["Amount is required"] };
    }
    if (parseUnits(amount, TOKEN_DECIMALS) > (balance ?? BigInt(0))) {
      return { isValid: false, errors: ["Amount is greater than balance"] };
    }
    if (parseUnits(amount, TOKEN_DECIMALS) <= BigInt(0)) {
      return { isValid: false, errors: ["Amount must be greater than 0"] };
    }

    return { isValid: true, errors: [] };
  }, [to, amount, balance]);

  if (!evmAddress) return null;
  return (
    <div>
      <CryptoTokenSelector className="mb-2" />

      <div className="bg-muted rounded-md px-4 py-3 flex items-center  gap-2 relative pt-6 mb-2">
        <span className="text-xs text-muted-foreground absolute left-4 top-1">
          To
        </span>
        <input
          className="text-sm text-muted-foreground outline-none w-full"
          placeholder="0x..."
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <div className="bg-muted rounded-md px-4 py-3 flex items-center  gap-2 relative pt-6 mb-2">
        <span className="text-xs text-muted-foreground absolute left-4 top-1">
          Amount
        </span>
        <input
          className="text-sm text-muted-foreground outline-none w-full"
          placeholder="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div data-tooltip-id="error-tooltip" className="mt-10">
        <Button
          size="lg"
          className="w-full"
          onClick={onWithdraw}
          disabled={!validation.isValid || isWithdrawing}
        >
          {isWithdrawing ? "Withdrawing..." : "Withdraw"}
        </Button>

        {!validation.isValid && (
          <Tooltip id="error-tooltip" content={validation.errors.join(", ")} />
        )}
      </div>
    </div>
  );
};

export const AccountManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState(Tab.Account);

  const { evmAddress } = useEvmAddress();
  const { data: balance } = useBalance(evmAddress ?? undefined);

  useEffect(() => {
    if (!evmAddress) {
      setIsOpen(false);
    }
  }, [evmAddress]);

  const currentTab = useMemo(() => {
    if (!evmAddress) {
      return {
        title: "",
        description: "",
        content: null,
      };
    }

    const tabs = {
      [Tab.Account]: {
        title: "Your account",
        description: "",
        content: (
          <Account
            setTab={setTab}
            address={evmAddress}
            balance={balance ?? BigInt(0)}
          />
        ),
      },
      [Tab.Withdraw]: {
        title: "Withdraw funds from your wallet",
        description: "Withdraw your rewards to your wallet",
        content: <Withdraw setTab={setTab} />,
      },
    } as const;

    return tabs[tab];
  }, [balance, evmAddress, tab]);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-4 rounded-full border h-[46px] px-4 shrink-0"
        >
          <Image
            src="/avatar.webp"
            alt="avatar"
            className="rounded-full"
            width={18}
            height={18}
          />
          <span className="text-sm">{shortenAddress(evmAddress ?? "")}</span>
          <span className="text-sm text-muted-foreground">
            {formatBalance(balance ?? BigInt(0))} USDC
          </span>
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[360px] rounded-3xl p-4 gap-0 pb-10">
          <div className=" mb-4 w-full flex justify-between">
            {tab !== Tab.Account ? (
              <button
                onClick={() => setTab(Tab.Account)}
                className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 rounded-full bg-muted h-4 w-4 flex items-center justify-center"
              >
                <ArrowLeftIcon />
              </button>
            ) : (
              <div />
            )}

            <DialogClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 rounded-full bg-muted h-4 w-4 flex items-center justify-center">
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          <DialogTitle className="text-center font-medium text-base mb-6">
            {currentTab.title}
          </DialogTitle>

          {currentTab.description !== "" && (
            <DialogDescription className="text-sm text-muted-foreground text-center mb-6">
              {currentTab.description}
            </DialogDescription>
          )}

          {currentTab.content}
        </DialogContent>
      </Dialog>
    </>
  );
};
