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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPPORTED_ASSETS } from "@/config";
import { CheckIcon, CopyIcon } from "lucide-react";
import { CopyButton } from "./ui/copy";

export const ShareCollectorLink: React.FC<{
  link: string;
  children: React.ReactNode;
}> = ({ link, children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Collector Link</DialogTitle>
          <DialogDescription>
            Share this link to collect donations. Users can make donations in{" "}
            {Object.keys(SUPPORTED_ASSETS).join(", ")} or fiat but
            you&apos;ll receive USDC each time. Funds will be automatically splitted
            between all members.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <div className="relative">
              <Input id="link" defaultValue={link} readOnly className="h-10 rounded-lg" />
              <CopyButton
                text={link}
                copied={<CheckIcon className="w-5 h-5" />}
                fallback={<CopyIcon className="w-5 h-5" />}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                variant="outline"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
