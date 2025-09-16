import { publicClient } from "@/config";
import { erc20Abi } from "@/lib/abis/erc20";
import { Token } from "@/types/token";
import { useEffect } from "react";
import { type Address } from "viem";


type IncomingTx = {
  token: Address;
  from: Address;
  amount: string;
  txHash: `0x${string}`;
};

export function useIncomingTransactions(
  walletAddress: Address,
  tokens: Token[],
  onIncomingTx: (tx: IncomingTx) => void
) {
  useEffect(() => {
    if (!walletAddress || tokens.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    tokens.forEach((token) => {
      const unsubscribe = publicClient.watchContractEvent({
        address: token.address,
        abi: erc20Abi,
        eventName: "Transfer",
        onLogs: (logs) => {
          logs.forEach((log) => {
            const { args, transactionHash } = log;
            if (args.to?.toLowerCase() !== walletAddress.toLowerCase()) return;

            const amount = Number(args.value) / 10 ** (token.decimals ?? 18);
            onIncomingTx({ token: token.address, from: args.from!, amount: amount.toString(), txHash: transactionHash });
          });
        },
      });

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [walletAddress, tokens]);
}
