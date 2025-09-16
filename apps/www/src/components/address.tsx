import { useCopyToClipboard } from "@/hooks/copy";
import { cn, formatBalance, shortenAddress } from "@/lib/utils";
import { TokenWithBalance } from "@/types/token";
import { Check, Copy } from "lucide-react";

export const Address = ({
  label,
  address,
  tokenBalance,
  className,
}: {
  label?: string;
  address: string;
  tokenBalance?: TokenWithBalance;
  className?: string;
}) => {
  const { copyToClipboard, copied } = useCopyToClipboard();

  return (
    <div
      className={cn(
        "bg-muted rounded-md px-4 py-3 flex items-center  gap-2 relative pt-6",
        className
      )}
    >
      <span className="text-xs text-muted-foreground absolute left-4 top-1">
        {label ?? "Address"}
      </span>
      <div className="text-sm text-muted-foreground">
        {shortenAddress(address)}
      </div>
      <button
        disabled={copied}
        onClick={() => copyToClipboard(address)}
        className="text-muted-foreground"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>

      {tokenBalance !== undefined && tokenBalance.balance !== undefined && (
        <div
          className={cn(
            "text-xs text-muted-foreground absolute right-0 bottom-1 bg-muted rounded-md px-4 py-3"
          )}
        >
          {formatBalance(tokenBalance.balance, tokenBalance.decimals) + " " + tokenBalance.symbol}
        </div>
      )}
    </div>
  );
};
