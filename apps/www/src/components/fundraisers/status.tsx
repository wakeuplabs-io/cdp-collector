import { PoolStatus } from "@/types/distributor";

export const FundraiserStatus = ({ status }: { status: PoolStatus }) => {
  if (status === PoolStatus.PENDING) {
    return (
      <div className="bg-yellow-200/50 border border-yellow-500 text-yellow-500 px-2 h-6 flex items-center justify-center rounded-full text-xs font-medium">
        Pending
      </div>
    );
  } else if (status === PoolStatus.ACTIVE) {
    return (
      <div className="bg-green-200/50 border border-green-500 text-green-500 px-2 h-6 flex items-center justify-center rounded-full text-xs font-medium">
        Active
      </div>
    );
  } else if (status === PoolStatus.INACTIVE) {
    return (
      <div className="bg-red-200/50 border border-red-500 text-red-500 px-2 h-6 flex items-center justify-center rounded-full text-xs font-medium">
        Inactive
      </div>
    );
  } else {
    return null;
  }
};
