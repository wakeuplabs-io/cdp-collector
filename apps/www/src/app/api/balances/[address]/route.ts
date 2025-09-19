import { NETWORK, SUPPORTED_ASSETS } from "@/config";
import { CdpClient } from "@coinbase/cdp-sdk";
import { NextResponse } from "next/server";
import { Address } from "viem";

export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
    try {

      // Get API credentials from environment variables
      const apiKeyId = process.env.CDP_API_KEY;
      const apiKeySecret = process.env.CDP_API_SECRET;
      if (!apiKeyId || !apiKeySecret) {
        throw new Error(
          "Missing CDP API credentials. Please set CDP_API_KEY and CDP_API_SECRET environment variables."
        );
      }
      const cdp = new CdpClient({ apiKeyId, apiKeySecret });

      const {address} = await params;
      const balances = await cdp.evm.listTokenBalances({
        address: address as Address,
        network: NETWORK,
      });

      return NextResponse.json(balances.balances.map((b) => ({
        token: SUPPORTED_ASSETS.find((t) => t.address.toLowerCase() === b.token.contractAddress.toLowerCase()),
        balance: b.amount.amount.toString(),
      })).filter((b) => b.token !== undefined));
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to get balances" },
        { status: 500 }
      );
    }
}