import { signEvmTypedData } from "@coinbase/cdp-core";
import {
  Address,
  encodeAbiParameters,
  encodePacked,
  hashTypedData,
  Hex,
  sliceHex,
} from "viem";

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
    smartAccountAddress: smartAccount,
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
