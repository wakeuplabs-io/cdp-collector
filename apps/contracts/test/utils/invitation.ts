import { keccak256, toBytes } from "viem";

export const generateInvitation = (): {
  code: `0x${string}`;
  hash: `0x${string}`;
} => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const code = ("0x" +
    Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")) as `0x${string}`;
  return {
    code,
    hash: keccak256(toBytes(code)),
  };
};
