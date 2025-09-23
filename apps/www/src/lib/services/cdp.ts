import {
  bundlerClient,
  CDP_ONRAMP_BASE_URL,
  NATIVE_ADDRESS,
  NETWORK, tokenService,
  TRADE_PERMIT2_ADDRESS
} from "@/config";
import { Token } from "@/types/token";
import {
  getCurrentUser,
  sendUserOperation,
  SendUserOperationOptions,
  signEvmTypedData
} from "@coinbase/cdp-core";
import { Address, concat, encodeAbiParameters, encodePacked, hashTypedData, Hex, numberToHex, size, sliceHex } from "viem";
import { SignatureWrapperStruct } from "../utils/cdp-smart-wallet-signatures";

export class CdpService {
  static async sendUserOperation(
    userOperation: Omit<SendUserOperationOptions, "network" | "evmSmartAccount">
  ) {
    const user = await getCurrentUser();
    const evmSmartAccount = user?.evmSmartAccounts?.[0] as Address;
    if (!evmSmartAccount) {
      throw new Error("No smart account found");
    }

    return sendUserOperation({
      ...userOperation,
      network: NETWORK,
      evmSmartAccount: evmSmartAccount,
    });
  }

  static async generateOnrampUrl(
    to: string,
    assets: string[],
    amount?: string
  ): Promise<string> {
    const res = await fetch("/api/onramp/session-token", {
      method: "POST",
      body: JSON.stringify({
        addresses: [{ address: to, blockchains: ["base"] }],
        assets: assets,
      }),
    });
    if (!res.ok) throw new Error("quote API failed");
    const { token } = await res.json();

    return (
      `${CDP_ONRAMP_BASE_URL}/buy?assets=${assets.join(",")}&defaultAsset=${
        assets[0]
      }&fiatCurrency=USD&sessionToken=${token}` +
      (amount ? `&presetCryptoAmount=${amount}` : "")
    );
  }

  static async swap(
    from: Token,
    to: Token,
    amount: bigint
  ): Promise<{ hash: string }> {
    if (NETWORK === "base-sepolia") {
      throw new Error("Swap is not supported on base-sepolia");
    }

    const user = await getCurrentUser();
    const smartAccount = user?.evmSmartAccounts?.[0] as Address;
    const owner = user?.evmAccounts?.[0] as Address;

    // check allowance
    if (from.address !== NATIVE_ADDRESS) {
      console.log("checking allowance");
      const allowance = await tokenService.getAllowance(
        from.address as Address,
        smartAccount,
        TRADE_PERMIT2_ADDRESS
      );

      // if (allowance < amount) {
        console.log("Adding allowance")
        const result = await CdpService.sendUserOperation({
          calls: await tokenService.prepareApprove(
            from.address as Address,
            TRADE_PERMIT2_ADDRESS,
            amount,
          ),
          useCdpPaymaster: true, // Use the free CDP paymaster to cover the gas fees
        });

        await bundlerClient.waitForUserOperationReceipt({
          hash: result.userOperationHash,
        });
      // }
    }

    // Create the swap quote using CDP API
    const res = await fetch(
      `/api/trade/quote?from=${from.address}&to=${to.address}&amount=${amount}&taker=${smartAccount}&signer=${owner}`
    );
    if (!res.ok) throw new Error("quote API failed");
    const swapResult = await res.json();

    console.log("swapResult", swapResult);

    // Prepare the swap transaction data
    let txData = swapResult.transaction!.data as Hex;

    // If permit2 is needed, sign it with the owner
    if (swapResult.permit2?.domain) {
      console.log("\nSigning Permit2 message...", owner);

      // const signature = await signEvmTypedData({
      //   evmAccount: owner,
      //   typedData: {
      //     domain: swapResult.permit2.domain,
      //     types: swapResult.permit2.types,
      //     primaryType: swapResult.permit2.primaryType,
      //     message: swapResult.permit2.message,
      //   },
      // });

      const chainId = 8453n;
      const replaySafeTypedData = createReplaySafeTypedData({
        typedData: swapResult.permit2,
        chainId,
        smartAccountAddress: smartAccount as Hex,
      });

      const signature = await signEvmTypedData({
        evmAccount: owner,
        typedData: replaySafeTypedData,
      });
    
      // Wrap the signature in the format expected by the smart contract
      const wrappedSignature = createSmartAccountSignatureWrapper({
        signatureHex: signature.signature as Hex,
        ownerIndex: 0n,
      });
    

      // await signAndWrapTypedDataForSmartAccount(client, {
      //   smartAccount,
      //   chainId: BigInt(swap.permit2.eip712.domain.chainId || 1),
      //   typedData: swap.permit2.eip712,
      //   ownerIndex: 0n,
      //   idempotencyKey: undefined, // TODO: may need to be generated
      // });

      // Calculate the signature length as a 32-byte hex value
      const signatureLengthInHex = numberToHex(size(wrappedSignature), {
        signed: false,
        size: 32,
      });

      // Append the signature length and signature to the transaction data
      txData = concat([txData, signatureLengthInHex, wrappedSignature]);

      console.log("signedMessage", wrappedSignature, signatureLengthInHex)
    }

    // Submit the swap as a user operation
    console.log({
      to: swapResult.transaction!.to as Address,
      value: swapResult.transaction!.value
        ? BigInt(swapResult.transaction!.value)
        : BigInt(0),
      data: txData,
    });
    const userOpHash = await CdpService.sendUserOperation({
      calls: [
        {
          to: swapResult.transaction!.to as Address,
          value: swapResult.transaction!.value
            ? BigInt(swapResult.transaction!.value)
            : BigInt(0),
          data: txData,
        },
      ],
      useCdpPaymaster: true, // Use the free CDP paymaster to cover the gas fees
    });

    await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash.userOperationHash,
    });

    return { hash: userOpHash.userOperationHash };
  }
}



export function createReplaySafeTypedData({
  typedData,
  chainId,
  smartAccountAddress,
}: {
  typedData: any;
  chainId: bigint;
  smartAccountAddress: Hex;
}): any {
  // First hash the original typed data
  const originalHash = hashTypedData(typedData as any);

  // Create and return the replay-safe typed data structure
  return {
    domain: {
      name: "Coinbase Smart Wallet",
      version: "1",
      chainId: Number(chainId),
      verifyingContract: smartAccountAddress,
    },
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      CoinbaseSmartWalletMessage: [{ name: "hash", type: "bytes32" }],
    },
    primaryType: "CoinbaseSmartWalletMessage" as const,
    message: {
      hash: originalHash,
    },
  };
}


export function createSmartAccountSignatureWrapper({
  signatureHex,
  ownerIndex,
}: {
  signatureHex: Hex;
  ownerIndex: bigint;
}): Hex {
  // Decompose 65-byte hex signature into r (32 bytes), s (32 bytes), v (1 byte)
  const r = sliceHex(signatureHex, 0, 32);
  const s = sliceHex(signatureHex, 32, 64);
  const v = Number(`0x${signatureHex.slice(130, 132)}`); // 130 = 2 + 64 + 64

  const signatureData = encodePacked(["bytes32", "bytes32", "uint8"], [r, s, v]);

  return encodeAbiParameters(
    [SignatureWrapperStruct],
    [
      {
        ownerIndex: Number(ownerIndex),
        signatureData,
      },
    ],
  ) as Hex;
}
