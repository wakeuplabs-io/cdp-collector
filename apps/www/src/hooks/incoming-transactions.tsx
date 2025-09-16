import { publicClient } from "@/config";
import { Token } from "@/types/token";
import { useEffect, useRef } from "react";
import { type Address, parseAbiItem } from "viem";


type IncomingTx = {
  token: Address;
  from: Address;
  amount: string;
  txHash: `0x${string}`;
};

export function useIncomingTransactions(
  walletAddress: Address,
  tokens: Token[],
  onIncomingTx: (tx: IncomingTx) => void,
  initialBlock?: bigint
) {
  const lastPolledBlockRef = useRef<Record<string, bigint>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!walletAddress || tokens.length === 0) return;

    // Filter out ETH (0x000...000) as it doesn't emit Transfer events
    const erc20Tokens = tokens.filter(token => 
      token.address && token.address !== "0x0000000000000000000000000000000000000000"
    );

    console.log("Setting up polling for transfers", { 
      walletAddress, 
      tokenCount: erc20Tokens.length,
      tokens: erc20Tokens.map(t => `${t.symbol}:${t.address}`)
    });

    const pollForTransfers = async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber();

        for (const token of erc20Tokens) {
          const tokenKey = token.address;
          
          // Use initialBlock or default to 100 blocks ago on first run
          const lastPolledBlock = lastPolledBlockRef.current[tokenKey] ?? 
            (initialBlock ?? (currentBlock - 100n));
          
          // Only poll if there are new blocks
          if (lastPolledBlock >= currentBlock) continue;

          console.log(`Polling ${token.symbol} from block ${lastPolledBlock + 1n} to ${currentBlock}`);

          const logs = await publicClient.getLogs({
            address: token.address,
            event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
            args: {
              to: walletAddress,
            },
            fromBlock: lastPolledBlock + 1n,
            toBlock: currentBlock,
          });

          if (logs.length > 0) {
            console.log(`Found ${logs.length} incoming ${token.symbol} transfers`);
            
            logs.forEach((log) => {
              const amount = Number(log.args.value) / 10 ** (token.decimals ?? 18);
              console.log("Incoming transfer detected!", {
                token: token.symbol,
                amount,
                from: log.args.from,
                txHash: log.transactionHash,
                blockNumber: log.blockNumber
              });

              onIncomingTx({
                token: token.address,
                from: log.args.from!,
                amount: amount.toString(),
                txHash: log.transactionHash!
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
