import { Address } from "viem";

export type Token = {
  address: Address;
  name: string;
  symbol: string;
  iconUrl: string;
  decimals: number;
};

export type TokenWithBalance = Token & {
  balance: bigint;
};
