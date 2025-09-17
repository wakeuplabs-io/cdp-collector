import { NATIVE_ADDRESS, publicClient } from "@/config";
import { Token } from "@/types/token";
import { useEffect, useRef } from "react";
import { type Address, parseAbiItem } from "viem";

type IncomingTx = {
  token: Address;
  from: Address;
  amount: bigint;
  txHash?: `0x${string}`;
};

export function useIncomingTransactions(
  walletAddress: Address,
  tokens: Token[],
  initialBlock: bigint,
  onIncomingTx: (tx: IncomingTx) => void
) {
  const lastPolledBlockRef = useRef<Record<string, bigint>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!walletAddress || tokens.length === 0 || initialBlock === 0n) return;

    // Filter out native as it doesn't emit Transfer events
    const erc20Tokens = tokens.filter(
      (token) => token.address && token.address !== NATIVE_ADDRESS
    );
    const native = tokens.find((token) => token.address === NATIVE_ADDRESS);

    const pollForTransfers = async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber();

        // check native balance
        if (native) {
          const initialNativeBalance = await publicClient.getBalance({
            address: walletAddress,
            blockNumber: initialBlock,
          });
          const currentNativeBalance = await publicClient.getBalance({
            address: walletAddress,
            blockNumber: currentBlock,
          });
          if (currentNativeBalance > initialNativeBalance) {
            onIncomingTx({
              token: NATIVE_ADDRESS,
              from: walletAddress,
              amount: currentNativeBalance - initialNativeBalance,
            });
          }
        }

        for (const token of erc20Tokens) {
          const tokenKey = token.address;

          // Use initialBlock or default to 100 blocks ago on first run
          const lastPolledBlock =
            lastPolledBlockRef.current[tokenKey] ?? initialBlock;

          // Only poll if there are new blocks
          if (lastPolledBlock >= currentBlock) continue;

          const logs = await publicClient.getLogs({
            address: token.address,
            event: parseAbiItem(
              "event Transfer(address indexed from, address indexed to, uint256 value)"
            ),
            args: {
              to: walletAddress,
            },
            fromBlock: lastPolledBlock + 1n,
            toBlock: currentBlock,
          });

          if (logs.length > 0) {
            logs.forEach((log) => {
              onIncomingTx({
                token: token.address,
                from: log.args.from!,
                amount: log.args.value!,
                txHash: log.transactionHash!,
              });
            });
          }

          // Update last polled block for this token
          lastPolledBlockRef.current[tokenKey] = currentBlock;
        }
      } catch (error) {
        console.error("Error polling for transfers:", error);
      }
    };

    // Initial poll
    pollForTransfers();

    // Set up interval to poll every 1 second
    intervalRef.current = setInterval(pollForTransfers, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Reset polling state
      lastPolledBlockRef.current = {};
    };
  }, [walletAddress, tokens, onIncomingTx, initialBlock]);
}
