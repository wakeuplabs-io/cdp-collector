import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeactivatePool } from "@/hooks/distributor";
import { openExplorerTx } from "@/lib/explorer";
import { toast } from "sonner";

export function DeactivateFundraiser({
  poolId,
  children,
  open,
  setOpen,
}: {
  poolId: bigint;
  children?: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}) {
  const { deactivatePool, isLoading } = useDeactivatePool();

  const onDeactivate = () => {
    deactivatePool(poolId)
      .then(({ hash }) => {
        toast.success("Fundraiser deactivated", {
          description: `Transaction hash: ${hash}`,
          action: {
            label: "Explorer ↗",
            onClick: () => openExplorerTx(hash),
          },
        });
        setOpen?.(false);
      })
      .catch((error) => {
        toast.error("Failed to deactivate fundraiser", {
          description: error.message,
        });
      });
    
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deactivate fundraiser</DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate this fundraiser? Once
            deactivated, it cannot be reactivated and you won't be capable of
            receiving donations.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={isLoading}
            onClick={onDeactivate}
          >
            {isLoading ? "Deactivating..." : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
