import { useCopyToClipboard } from "@/hooks/copy";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "./button";


export const CopyButton = ({ text, className }: { text: string, className?: string }) => {
  const { copyToClipboard, copied } = useCopyToClipboard();

  return (
    <Button variant="ghost" size="icon" className={cn("h-8 w-8", className)} onClick={() => copyToClipboard(text)}>
      {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
    </Button>
  );
};