"use client";

import { cn, formatBalance } from "@/lib/utils";
import { TokenWithBalance } from "@/types/token";
import { Check, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export const CryptoTokenSelector: React.FC<{
  tokens: TokenWithBalance[];
  value: TokenWithBalance;
  onChange: (token: TokenWithBalance) => void;
  className?: string;
}> = ({ className, tokens, value, onChange }) => {
  const [selectedToken, setSelectedToken] = useState<TokenWithBalance>(value);
  const [isOpen, setIsOpen] = useState(false);

  const handleTokenSelect = (token: TokenWithBalance) => {
    setSelectedToken(token);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-md bg-muted flex items-center justify-between h-14"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg font-bold">
            <Image
              src={selectedToken.iconUrl}
              alt={selectedToken.name}
              width={32}
              height={32}
            />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm text-foreground">
              {selectedToken.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedToken.symbol}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="font-medium text-sm text-foreground">
              {formatBalance(selectedToken.balance, selectedToken.decimals)}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {tokens.map((token) => (
            <button
              key={token.address}
              onClick={() => handleTokenSelect(token)}
              className={cn(
                "w-full p-3 flex items-center justify-between hover:bg-accent/50 focus:outline-none focus:bg-accent/50 transition-colors first:rounded-t-lg last:rounded-b-lg",
                selectedToken.address === token.address && "bg-primary/10"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-lg font-bold">
                  <Image
                    src={token.iconUrl}
                    alt={token.name}
                    width={32}
                    height={32}
                  />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{token.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {token.symbol}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="font-medium text-foreground">
                    {formatBalance(token.balance, token.decimals)}
                  </p>
                </div>
                {selectedToken.address === token.address && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
