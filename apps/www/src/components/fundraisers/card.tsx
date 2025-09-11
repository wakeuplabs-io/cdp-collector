import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/copy";
import { ArrowUpRight, CheckIcon, CopyIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export const FundraiserCard: React.FC<{ id: string }> = ({ id }) => {
  const router = useRouter();
  const { copyToClipboard, copied } = useCopyToClipboard();

  return (
    <div className="border rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fundraiser</h2>
          <p className="text-muted-foreground">
            Lorem, ipsum dolor sit amet consectetur adipisicing elit.
          </p>
        </div>
        <div className="bg-green-200/50 border border-green-500 text-green-500 px-2 h-6 flex items-center justify-center rounded-full text-xs font-medium">
          Active
        </div>
      </div>

      <div className="bg-muted/50 rounded-xl p-4 mt-4 flex items-center justify-between">
        <span className="font-bold text-2xl">$100</span>
        <span className="text-muted-foreground border rounded-full bg-muted px-2 py-1 text-sm font-medium">100 USDC</span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Created</p>
          <p className="text-sm font-medium">10/10/2025</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Receipt</p>
          <p className="text-sm font-medium">0x123...7890</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Members</p>
          <p className="text-sm font-medium">10</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button size="lg" variant="outline" className="flex-1" onClick={() => copyToClipboard(`${window.location.origin}/fundraisers/${id}/donate`)}>
          {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
          {copied ? "Copied" : "Copy Link"}
        </Button>
        <Button size="lg" variant="outline" onClick={() => router.push(`/fundraisers/${id}`)}>
          <ArrowUpRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
