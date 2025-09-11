"use client"

import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"
import { useState } from "react"

interface Token {
  id: string
  name: string
  symbol: string
  icon: string
  balance: string
}

const POPULAR_TOKENS: Token[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    icon: "₿",
    balance: "0.25",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    icon: "Ξ",
    balance: "1.5",
  },
  {
    id: "binancecoin",
    name: "BNB",
    symbol: "BNB",
    icon: "🔶",
    balance: "12.8",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    icon: "◎",
    balance: "45.2",
  },
  {
    id: "cardano",
    name: "Cardano",
    symbol: "ADA",
    icon: "₳",
    balance: "1,250.0",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    symbol: "AVAX",
    icon: "🔺",
    balance: "8.7",
  },
  {
    id: "polygon",
    name: "Polygon",
    symbol: "MATIC",
    icon: "🟣",
    balance: "500.0",
  },
  {
    id: "chainlink",
    name: "Chainlink",
    symbol: "LINK",
    icon: "🔗",
    balance: "75.3",
  },
  {
    id: "uniswap",
    name: "Uniswap",
    symbol: "UNI",
    icon: "🦄",
    balance: "25.6",
  },
  {
    id: "litecoin",
    name: "Litecoin",
    symbol: "LTC",
    icon: "Ł",
    balance: "3.2",
  },
]

export const CryptoTokenSelector: React.FC<{
    className?: string
}> = ({ className }) => {
  const [selectedToken, setSelectedToken] = useState<Token>(POPULAR_TOKENS[0])
  const [isOpen, setIsOpen] = useState(false)

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token)
    setIsOpen(false)
  }

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-md bg-muted flex items-center justify-between h-14"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg font-bold">
            {selectedToken.icon}
          </div>
          <div className="text-left">
            <p className="font-medium text-sm text-foreground">{selectedToken.name}</p>
            <p className="text-xs text-muted-foreground">{selectedToken.symbol}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="font-medium text-sm text-foreground">{selectedToken.balance}</p>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {POPULAR_TOKENS.map((token) => (
            <button
              key={token.id}
              onClick={() => handleTokenSelect(token)}
              className={cn(
                "w-full p-3 flex items-center justify-between hover:bg-accent/50 focus:outline-none focus:bg-accent/50 transition-colors first:rounded-t-lg last:rounded-b-lg",
                selectedToken.id === token.id && "bg-primary/10",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-lg font-bold">
                  {token.icon}
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{token.name}</p>
                  <p className="text-sm text-muted-foreground">{token.symbol}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="font-medium text-foreground">{token.balance}</p>
                </div>
                {selectedToken.id === token.id && <Check className="h-4 w-4 text-primary" />}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
