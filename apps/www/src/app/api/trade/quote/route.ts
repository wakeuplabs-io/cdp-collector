import { NETWORK } from "@/config";
import { CdpClient } from "@coinbase/cdp-sdk";
import { NextResponse } from "next/server";
import { Address } from "viem";

const cdp = new CdpClient({
  apiKeyId: process.env.CDP_API_KEY,
  apiKeySecret: process.env.CDP_API_SECRET,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") as Address;
    const to = searchParams.get("to") as Address;
    const amount = BigInt(searchParams.get("amount") ?? "0");
    const taker = searchParams.get("taker") as Address;
    const signer = searchParams.get("signer") as Address;

    if (NETWORK === "base-sepolia") {
      throw new Error("Swap is not supported on base-sepolia");
    }

    const swapResult = await cdp.evm.createSwapQuote({
      network: NETWORK,
      toToken: to,
      fromToken: from,
      fromAmount: amount,
      taker: taker,
      signerAddress: signer, // Owner will sign permit2 messages
      slippageBps: 300, // 3% slippage tolerance
    });

    // Check if swap is available
    if (!swapResult.liquidityAvailable) {
      throw new Error("Insufficient liquidity for this swap pair or amount.");
    }

    // Check liquidity
    if (!swapResult.liquidityAvailable) {
      throw new Error("Insufficient liquidity available");
    }

    // Check balance issues
    if (swapResult.issues?.balance) {
      throw new Error("Insufficient balance");
    }

    // Check allowance issues
    if (swapResult.issues?.allowance) {
      throw new Error("Insufficient allowance");
    }

    return NextResponse.json({
      transaction: {
        to: swapResult.transaction?.to,
        value: swapResult.transaction?.value.toString(),
        data: swapResult.transaction?.data.toString(),
        gas: swapResult.transaction?.gas.toString(),
        gasPrice: swapResult.transaction?.gasPrice.toString(),
      },
      permit2: {
        domain: swapResult.permit2?.eip712.domain,
        types: swapResult.permit2?.eip712.types,
        primaryType: swapResult.permit2?.eip712.primaryType,
        message: swapResult.permit2?.eip712.message,
      },
    });
  } catch (error) {
    console.error("error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
