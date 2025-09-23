// mostly ported from https://github.com/coinbase/cdp-sdk/blob/main/typescript/src/actions/evm/signAndWrapTypedDataForSmartAccount.ts

import { signEvmTypedData } from "@coinbase/cdp-core";
import {
  Address,
  encodeAbiParameters,
  encodePacked,
  hashTypedData,
  Hex,
  sliceHex,
} from "viem";

/**
 * Signs and wraps an EIP-712 message for a smart account using the required Coinbase Smart Wallet signature format.
 *
 * **Important: Coinbase Smart Wallet Contract Requirements**
 *
 * Due to the Coinbase Smart Wallet contract implementation (ERC-1271), CDP Smart Wallets have
 * specific requirements for EIP-712 message signing:
 *
 * 1. **Replay-Safe Hashing**: All typed messages must be wrapped in a replay-safe hash that
 *    includes the chain ID and smart account address. This prevents the same signature from
 *    being valid across different chains or accounts.
 *
 * 2. **Signature Wrapping**: The resulting signature must be wrapped in a `SignatureWrapper`
 *    struct that identifies which owner signed and contains the signature data in the format
 *    expected by the smart contract's `isValidSignature()` method.
 *
 * This function handles both requirements automatically, making it safe and convenient for
 * developers to sign EIP-712 messages with CDP Smart Wallets.
 *
 * @param {CdpOpenApiClientType} client - The CDP API client
 * @param {SignAndWrapTypedDataForSmartAccountOptions} options - Parameters for signing and wrapping the EIP-712 message.
 * @returns A promise that resolves to the signature that can be used with smart contracts.
 *
 * @example
 * ```ts
 * const result = await signAndWrapTypedDataForSmartAccount(client, {
 *   smartAccount: smartAccount,
 *   chainId: 1n,
 *   typedData: {
 *     domain: {
 *       name: "Permit2",
 *       chainId: 1,
 *       verifyingContract: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
 *     },
 *     types: {
 *       EIP712Domain: [
 *         { name: "name", type: "string" },
 *         { name: "chainId", type: "uint256" },
 *         { name: "verifyingContract", type: "address" },
 *       ],
 *       PermitTransferFrom: [
 *         { name: "permitted", type: "TokenPermissions" },
 *         { name: "spender", type: "address" },
 *         { name: "nonce", type: "uint256" },
 *         { name: "deadline", type: "uint256" },
 *       ],
 *       TokenPermissions: [
 *         { name: "token", type: "address" },
 *         { name: "amount", type: "uint256" },
 *       ],
 *     },
 *     primaryType: "PermitTransferFrom",
 *     message: {
 *       permitted: {
 *         token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
 *         amount: "1000000",
 *       },
 *       spender: "0xFfFfFfFFfFFfFFfFFfFFFFFffFFFffffFfFFFfFf",
 *       nonce: "0",
 *       deadline: "1717123200",
 *     },
 *   },
 * });
 *
 * // Use result.signature for smart contract calls
 * console.log(`Signature: ${result.signature}`);
 * ```
 */
export const signAndWrapTypedDataForSmartAccount = async (options: {
  smartAccount: Address;
  chainId: bigint;
  typedData: any;
  owner: Address;
}) => {
  const { smartAccount, chainId, typedData, owner } = options;

  const replaySafeTypedData = createReplaySafeTypedData({
    typedData,
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

  return wrappedSignature;
};

/**
 * The ABI structure for the SignatureWrapper struct expected by Coinbase Smart Wallets.
 * This matches the struct defined in the smart contract:
 *
 * struct SignatureWrapper {
 *   uint256 ownerIndex;
 *   bytes signatureData;
 * }
 */
export const SignatureWrapperStruct = {
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
} as const;

/**
 * Creates a replay-safe EIP-712 typed data structure by wrapping the original typed data with
 * chain ID and smart account address.
 *
 * **Coinbase Smart Wallet Requirement**: Due to the Coinbase Smart Wallet contract's ERC-1271
 * implementation, all EIP-712 messages must be wrapped in a replay-safe hash before signing.
 * This prevents signature replay attacks across different chains or smart account addresses.
 *
 * The smart contract's `isValidSignature()` method expects signatures to be validated against
 * this replay-safe hash, not the original message hash.
 *
 * @param params - The replay-safe hash parameters
 * @param params.typedData - The original EIP-712 typed data to make replay-safe
 * @param params.chainId - The chain ID for replay protection
 * @param params.smartAccountAddress - The smart account address for additional context
 * @returns The EIP-712 typed data structure for the replay-safe hash
 */
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

/**
 * Builds a signature wrapper for Coinbase Smart Wallets by decomposing a hex signature
 * into r, s, v components and encoding them in the format expected by the smart contract.
 *
 * All signatures on Coinbase Smart Wallets must be wrapped in this format to identify
 * which owner signed and provide the signature data.
 *
 * @param params - The signature parameters
 * @param params.signatureHex - The hex signature to wrap (65 bytes: r + s + v)
 * @param params.ownerIndex - The index of the owner that signed (from MultiOwnable.ownerAtIndex)
 * @returns The encoded signature wrapper in the format expected by the smart contract
 */
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

  const signatureData = encodePacked(
    ["bytes32", "bytes32", "uint8"],
    [r, s, v]
  );

  return encodeAbiParameters(
    [SignatureWrapperStruct],
    [
      {
        ownerIndex: Number(ownerIndex),
        signatureData,
      },
    ]
  ) as Hex;
}
