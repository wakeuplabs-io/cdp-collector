export enum PoolStatus {
  PENDING = 0,
  ACTIVE = 1,
  INACTIVE = 2,
}

export type Pool = {
  id: bigint;
  creator: `0x${string}`;
  title: string;
  description: string;
  imageUri: string;
  createdAt: Date;
  status: PoolStatus;
};

export type PoolSummary = {
  totalDonationsAmount: bigint;
  totalDonationsCount: bigint;
  uniqueDonatorsCount: bigint;
};

export type PoolMember = {
  member: `0x${string}`;
  invitationCodeHash: `0x${string}`;
  percentage: bigint;
};

export type UserSummary = {
  totalDonationsAmount: bigint;
  totalDonationsCount: bigint;
  poolCount: bigint;
};

export type Donation = {
  id: bigint;
  poolId: bigint;
  donor: `0x${string}`;
  amount: bigint;
  createdAt: Date;
  transactionHash: `0x${string}`;
};

