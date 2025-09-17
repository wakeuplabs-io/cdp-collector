import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreatePool } from "@/hooks/distributor";
import { openExplorerTx } from "@/lib/explorer";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import {
  CheckIcon,
  CopyIcon,
  PlusIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar } from "../avatar";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { CopyButton } from "../ui/copy";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const metadataForm = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
});

const memberForm = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  proportion: z
    .string()
    .min(1, { message: "Proportion is required" })
    .refine((val) => Number(val) > 0 && Number(val) <= 100, {
      message: "Proportion must be between 0 and 100",
    }),
});

export const CreateFundraiser = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const { evmAddress } = useEvmAddress();

  const [open, setOpen] = useState<boolean>(false);
  const [shared, setShared] = useState<boolean>(false);
  const [invitedAllMembers, setInvitedAllMembers] = useState<boolean>(false);
  const [tab, setTab] = useState<"create" | "invite" | "success">("create");
  const [newMemberEmail, setNewMemberEmail] = useState<string>("");
  const [newMemberProportion, setNewMemberProportion] = useState<string>("");
  const [metadata, setMetadata] = useState<{
    title: string;
    description: string;
    image: File | null;
  }>({
    title: "",
    description: "",
    image: null,
  });
  const [members, setMembers] = useState<
    {
      id: string;
      proportion: number;
      code?: string;
    }[]
  >([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [poolId, setPoolId] = useState<string | null>(null);

  const { createPool, isLoading: isCreatingPool } = useCreatePool();

  function onSubmitMetadata() {
    const result = metadataForm.safeParse(metadata);
    if (!result.success) {
      setErrors(result.error.errors.map((e) => e.message));
      return;
    }
    setErrors([]);
    setTab("invite");
  }

  function onAddMember() {
    const result = memberForm.safeParse({
      email: newMemberEmail,
      proportion: newMemberProportion,
    });
    if (members.some((member) => member.id === newMemberEmail)) {
      setErrors(["Member already added"]);
      return;
    }
    if (!result.success) {
      setErrors(result.error.errors.map((e) => e.message));
      return;
    }

    setErrors([]);
    setNewMemberEmail("");
    setNewMemberProportion("0");
    setMembers([
      ...members,
      { id: newMemberEmail, proportion: Number(newMemberProportion) },
    ]);
  }

  function onCreate() {
    createPool({
      title: metadata.title,
      description: metadata.description,
      image: metadata.image ?? undefined,
      members,
    })
      .then(({ hash, poolId, members }) => {
        setPoolId(poolId.toString());
        setMembers(members);
        setTab("success");
        toast.success("Fundraiser created successfully", {
          description: `Transaction hash ${hash}`,
          action: {
            label: "Explorer ↗",
            onClick: () => openExplorerTx(hash),
          },
        });
      })
      .catch((error) => {
        console.log("error", error);
        toast.error("Couldn't create fundraiser", {
          description: error.message,
        });
      });
  }

  useEffect(() => {
    if (open) {
      setErrors([]);
      setNewMemberEmail("");
      setNewMemberProportion("0");
      setMembers([]);
      setMetadata({ title: "", description: "", image: null });
      setTab("create");
      setShared(false);
    }
  }, [open]);

  const creatorProportion = useMemo(() => {
    return 100 - members.reduce((acc, member) => acc + member.proportion, 0);
  }, [members]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="p-0">
        {tab === "create" && (
          <>
            <DialogHeader className="p-6 border-b">
              <DialogTitle>Create Collector Link</DialogTitle>
              <DialogDescription>
                Create a new fundraiser to help a cause you care about.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pt-4 pb-6 space-y-4">
              <Label>Title</Label>
              <Input
                placeholder="Title"
                value={metadata.title}
                onChange={(e) =>
                  setMetadata({ ...metadata, title: e.target.value })
                }
              />

              <Label>Description</Label>
              <Textarea
                className="h-24"
                placeholder="Description"
                value={metadata.description}
                onChange={(e) =>
                  setMetadata({ ...metadata, description: e.target.value })
                }
              />

              <div>
                <Label>Image</Label>
                <Avatar
                  className="mt-3"
                  src={
                    metadata.image
                      ? URL.createObjectURL(metadata.image)
                      : undefined
                  }
                  alt="Fundraiser"
                  size={60}
                  seed={evmAddress ?? undefined}
                />

                <input
                  type="file"
                  id="image"
                  className="hidden"
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      image: e.target.files?.[0] ?? null,
                    })
                  }
                />

                <label
                  className="p-4 rounded-md border mt-4 text-center block"
                  htmlFor="image"
                >
                  <div className="h-10 w-10 border rounded-md flex justify-center items-center mx-auto mb-3">
                    <UploadCloudIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="font-medium text-primary hover:underline text-sm">
                    Click to upload and attach files
                  </div>
                  <div className="text-xs text-muted-foreground">
                    SVG, PNG, JPG or GIF (max. 800x400px)
                  </div>
                </label>
              </div>
            </div>

            {errors.length ? (
              <div className="mx-6">
                {errors.map((error) => (
                  <div key={error} className="text-destructive">
                    {error}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 mt-4 border-t p-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={onSubmitMetadata}>Continue</Button>
            </div>
          </>
        )}

        {tab === "invite" && (
          <>
            <DialogHeader className="p-6 border-b">
              <DialogTitle>Invite members</DialogTitle>
              <DialogDescription>
                Invite members to your fundraiser and split the collect.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 flex gap-2 mt-2">
              <div className="flex items-center flex-1">
                <Input
                  className="h-11 rounded-r-none border-r-0"
                  placeholder="Email address"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
                <Input
                  placeholder="0%"
                  className="max-w-14 h-11 rounded-l-none"
                  value={newMemberProportion}
                  onChange={(e) => setNewMemberProportion(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 px-5 rounded-full"
                onClick={onAddMember}
              >
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="px-6 mt-4 space-y-2">
              <MemberItem
                member={{
                  id: "You",
                  proportion: creatorProportion,
                }}
                action={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 disabled:opacity-20 disabled:cursor-not-allowed"
                    disabled
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                }
              />
              {members.map((member, index) => (
                <MemberItem
                  key={member.id}
                  member={member}
                  action={
                    <Button
                      onClick={() =>
                        setMembers(members.filter((_, i) => i !== index))
                      }
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  }
                />
              ))}
            </div>

            {errors.length ? (
              <div className="mx-6">
                {errors.map((error) => (
                  <div key={error} className="text-destructive">
                    {error}
                  </div>
                ))}
              </div>
            ) : (
              <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 mx-6">
                <Checkbox
                  checked={invitedAllMembers}
                  onCheckedChange={(checked) => setInvitedAllMembers(!!checked)}
                />
                <div className="grid gap-1.5 font-normal">
                  <p className="text-sm leading-none font-medium">
                    I have invited all members
                  </p>
                  <p className="text-muted-foreground text-sm">
                    You cannot add more members later.
                  </p>
                </div>
              </Label>
            )}

            <div className="flex justify-end gap-2 mt-6 border-t p-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMetadata({ title: "", description: "", image: null });
                  setTab("create");
                }}
              >
                Back
              </Button>
              <Button
                onClick={onCreate}
                disabled={isCreatingPool || !invitedAllMembers}
              >
                {isCreatingPool ? "Creating..." : "Continue"}
              </Button>
            </div>
          </>
        )}

        {tab === "success" && (
          <>
            <DialogHeader className="p-6 border-b">
              <DialogTitle>Ask members to join</DialogTitle>
              <DialogDescription>
                Your fundraiser has been created successfully. Just one step
                missing, invite your friends to join you.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 mt-4 space-y-2">
              <MemberItem
                member={{
                  id: "You",
                  proportion: creatorProportion,
                }}
                action={
                  <div className="text-sm text-muted-foreground">Joined</div>
                }
              />
              {members.map((member) => (
                <MemberItem
                  key={member.id}
                  member={member}
                  action={
                    <CopyButton
                      variant="ghost"
                      size="icon"
                      text={`${window.location.origin}/fundraisers/${poolId}/join?code=${member.code}`}
                      className="h-8 w-8"
                      copied={<CheckIcon className="w-4 h-4" />}
                      fallback={<CopyIcon className="w-4 h-4" />}
                    />
                  }
                />
              ))}
            </div>

            <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 mx-6">
              <Checkbox
                checked={shared}
                onCheckedChange={(checked) => setShared(!!checked)}
              />
              <div className="grid gap-1.5 font-normal">
                <p className="text-sm leading-none font-medium">
                  I have shared invitation links
                </p>
                <p className="text-muted-foreground text-sm">
                  These won&apos;t be available once you close the dialog.
                </p>
              </div>
            </Label>

            <div className="flex justify-end gap-2 mt-6 border-t p-6">
              <Button
                disabled={!shared}
                onClick={() => {
                  setOpen(false);
                  router.push(`/fundraisers/${poolId}`);
                }}
              >
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const MemberItem = ({
  member,
  action,
}: {
  member: { id: string; proportion: number; code?: string };
  action?: React.ReactNode;
}) => {
  return (
    <div className="bg-muted rounded-lg p-3 flex items-center gap-2 justify-between h-11">
      <div className="flex items-center gap-2">
        <Image
          src="/avatar.webp"
          alt="Avatar"
          width={20}
          height={20}
          className="rounded-full"
        />
        <div className="flex gap-2">
          <div className="text-sm">{member.id}</div>
          <div className="text-sm text-muted-foreground">
            {member.proportion}%
          </div>
        </div>
      </div>

      {action}
    </div>
  );
};
