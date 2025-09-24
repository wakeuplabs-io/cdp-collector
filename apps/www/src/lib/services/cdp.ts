import {
  bundlerClient,
  CDP_CLIENT_API_KEY,
  CDP_ONRAMP_BASE_URL,
  CHAIN_ID,
  NATIVE_ADDRESS,
  NETWORK,
  tokenService,
  TRADE_PERMIT2_ADDRESS,
} from "@/config";
import { Token } from "@/types/token";
import {
  EIP712TypedData,
  getCurrentUser,
  sendUserOperation,
  SendUserOperationOptions,
  signEvmTypedData,
} from "@coinbase/cdp-core";
import {
  Address,
  concat,
  encodeAbiParameters,
  encodePacked,
  erc20Abi,
  hashTypedData,
  Hex,
  numberToHex,
  parseEventLogs,
  size,
  sliceHex,
} from "viem";

export type CdpSqlQueryEventResult = {
  action: string;
  address: Hex;
  block_hash: Hex;
  block_number: string;
  block_timestamp: string;
  event_name: string;
  event_signature: string;
  log_index: number;
  parameter_types: Record<string, string>;
  parameters: Record<string, string>;
  topics: Hex[];
  transaction_from: Hex;
  transaction_hash: Hex;
  transaction_to: Hex;
};

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

  static async sqlQueryEvents(sql: string): Promise<CdpSqlQueryEventResult[]> {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${CDP_CLIENT_API_KEY}`);
    headers.append("Content-Type", "application/json");

    if (!sql.includes(".events")) {
      // Mostly for type safety
      throw new Error("SQL query not supported");
    }

    const res = await fetch(
      "https://api.cdp.coinbase.com/platform/v2/data/query/run",
      {
        method: "POST",
        headers,
        body: JSON.stringify({ sql }),
      }
    ).then((response) => response.json());

    return res.result;
  }

  static async swap(
    fromToken: Token,
    toToken: Token,
    fromAmount: bigint
  ): Promise<{ hash: string, amount: bigint }> {
    if (NETWORK === "base-sepolia") {
      throw new Error("Swap is not supported on base-sepolia");
    }

    console.log("swapping", fromToken, toToken, fromAmount);

    const user = await getCurrentUser();
    const smartAccount = user?.evmSmartAccounts?.[0] as Address;
    const owner = user?.evmAccounts?.[0] as Address;

    // check allowance
    if (fromToken.address !== NATIVE_ADDRESS) {
      const allowance = await tokenService.getAllowance(
        fromToken.address as Address,
        smartAccount,
        TRADE_PERMIT2_ADDRESS
      );

      if (allowance < fromAmount) {
        const result = await CdpService.sendUserOperation({
          calls: await tokenService.prepareApprove(
            fromToken.address as Address,
            TRADE_PERMIT2_ADDRESS,
            fromAmount
          ),
          useCdpPaymaster: true, // Use the free CDP paymaster to cover the gas fees
        });

        await bundlerClient.waitForUserOperationReceipt({
          hash: result.userOperationHash,
        });
        console.log("Approved", result.userOperationHash);
      }
    }

    // Create the swap quote using CDP API
    const res = await fetch(
      `/api/trade/quote?from=${fromToken.address}&to=${toToken.address}&amount=${fromAmount}&taker=${smartAccount}&signer=${owner}`
    );
    if (!res.ok) throw new Error("quote API failed");
    const quote = await res.json();

    // Prepare the swap transaction data
    let txData = quote.transaction!.data as Hex;

    // If permit2 is needed, sign it with the owner
    if (quote.permit2?.domain) {
      const wrappedSignature =
        await CdpService.signAndWrapTypedDataForSmartAccount({
          owner,
          smartAccount,
          chainId: CHAIN_ID,
          typedData: quote.permit2,
        });

      // Calculate the signature length as a 32-byte hex value
      const signatureLengthInHex = numberToHex(size(wrappedSignature), {
        signed: false,
        size: 32,
      });

      // Append the signature length and signature to the transaction data
      txData = concat([txData, signatureLengthInHex, wrappedSignature]);
    }

    console.log("txData", txData);
    console.log("swapResult.transaction!.to", quote.transaction!.to);
    console.log("swapResult.transaction!.value", quote.transaction!.value);

    // Submit the swap as a user operation
    const userOpHash = await CdpService.sendUserOperation({
      calls: [
        {
          to: quote.transaction!.to as Address,
          value: quote.transaction!.value
            ? BigInt(quote.transaction!.value)
            : BigInt(0),
          data: txData,
        },
      ],
      useCdpPaymaster: true, // Use the free CDP paymaster to cover the gas fees
    });


    // from logs extract amount of tokens received
    console.log("userOpHash", userOpHash);

    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash.userOperationHash,
    });

    console.log("receipt", receipt);

    const parsedLogs = parseEventLogs({
      abi: erc20Abi,
      logs: receipt.logs,
      eventName: "Transfer",
    });

    const amount = parsedLogs.find((log) => log.args.to === smartAccount)?.args?.value ?? BigInt(0);

    return { hash: userOpHash.userOperationHash, amount };
  }

  /// Ported from https://github.com/coinbase/cdp-sdk/blob/7afd6a7ac83e153e18cc76b455c2bc8e0bf32f72/typescript/src/actions/evm/signAndWrapTypedDataForSmartAccount.ts#L102
  static signAndWrapTypedDataForSmartAccount = async (options: {
    smartAccount: Address;
    chainId: bigint;
    typedData: EIP712TypedData;
    owner: Address;
  }) => {
    const { smartAccount, chainId, typedData, owner } = options;

    const replaySafeTypedData = CdpService.#createReplaySafeTypedData({
      typedData,
      chainId,
      smartAccountAddress: smartAccount as Hex,
    });

    const signature = await signEvmTypedData({
      evmAccount: owner,
      typedData: replaySafeTypedData,
    });

    // Wrap the signature in the format expected by the smart contract
    const wrappedSignature = CdpService.#createSmartAccountSignatureWrapper({
      signatureHex: signature.signature as Hex,
      ownerIndex: 0n,
    });

    return wrappedSignature;
  };

  /// Ported from https://github.com/coinbase/cdp-sdk/blob/7afd6a7ac83e153e18cc76b455c2bc8e0bf32f72/typescript/src/actions/evm/signAndWrapTypedDataForSmartAccount.ts#L151
  static #createReplaySafeTypedData({
    typedData,
    chainId,
    smartAccountAddress,
  }: {
    typedData: EIP712TypedData;
    chainId: bigint;
    smartAccountAddress: Hex;
  }): EIP712TypedData {
    // First hash the original typed data
    const originalHash = hashTypedData(typedData);

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

  /// Ported from https://github.com/coinbase/cdp-sdk/blob/7afd6a7ac83e153e18cc76b455c2bc8e0bf32f72/typescript/src/actions/evm/signAndWrapTypedDataForSmartAccount.ts#L199
  static #createSmartAccountSignatureWrapper({
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

    const signatureData = encodePacked(
      ["bytes32", "bytes32", "uint8"],
      [r, s, v]
    );

    return encodeAbiParameters(
      [
        // SignatureWrapperStruct ported from  https://github.com/coinbase/cdp-sdk/blob/7afd6a7ac83e153e18cc76b455c2bc8e0bf32f72/typescript/src/actions/evm/signAndWrapTypedDataForSmartAccount.ts#L233
        {
          components: [
            {
              name: "ownerIndex",
              type: "uint8",
            },
            {
              name: "signatureData",
              type: "bytes",
            },
          ],
          name: "SignatureWrapper",
          type: "tuple",
        },
      ],
      [
        {
          ownerIndex: Number(ownerIndex),
          signatureData,
        },
      ]
    ) as Hex;
  }
}
