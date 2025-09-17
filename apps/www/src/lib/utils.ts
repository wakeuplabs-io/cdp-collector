import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatUsdcBalance(
  balance: bigint,
  decimals: number
) {
  return parseFloat(Number(formatUnits(balance, decimals)).toFixed(2));
}
