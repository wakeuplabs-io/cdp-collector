import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { CopyIcon, UploadCloudIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const metadataForm = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

const membersForm = z.object({
  members: z
    .array(
      z.object({
        identifier: z.string().min(1, "Required"), // wallet or email
        proportion: z.string().min(1, "Required"),
      })
    )
    .min(1, "At least one participant required"),
});

export const CreateFundraiser = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [tab, setTab] = useState<"create" | "invite" | "success">("create");
  const [id, setId] = useState<string>("");
  const [proportion, setProportion] = useState<string>("");
  const [shared, setShared] = useState<boolean>(false);

  const metadata = useForm<z.infer<typeof metadataForm>>({
    resolver: zodResolver(metadataForm),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const members = useForm<z.infer<typeof membersForm>>({
    resolver: zodResolver(membersForm),
    defaultValues: {
      members: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: members.control,
    name: "members",
  });

  function onSubmitMetadata(values: z.infer<typeof metadataForm>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    setTab("invite");
  }

  function onSubmitMembers(values: z.infer<typeof membersForm>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    setTab("success");
  }

  useEffect(() => {
    if (open) {
      setTab("create");
      setShared(false);
      metadata.reset();
      members.reset();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="p-0">
        {tab === "create" && (
          <>
            <DialogHeader className="p-6 border-b">
              <DialogTitle>Create Fundraiser</DialogTitle>
              <DialogDescription>
                Create a new fundraiser to help a cause you care about.
              </DialogDescription>
            </DialogHeader>

            <Form {...metadata}>
              <form onSubmit={metadata.handleSubmit(onSubmitMetadata)}>
                <div className="px-6 pt-4 pb-6 space-y-4">
                  <FormField
                    control={metadata.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={metadata.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            className="h-24"
                            placeholder="Description"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Image</FormLabel>
                    <Image
                      src="/avatar.webp"
                      alt="Fundraiser"
                      width={60}
                      height={60}
                      className="rounded-full mt-3"
                    />

                    <div className="p-4 rounded-md border mt-4 text-center">
                      <div className="h-10 w-10 border rounded-md flex justify-center items-center mx-auto mb-3">
                        <UploadCloudIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="font-medium text-primary hover:underline text-sm">
                        Click to upload and attach files
                      </div>
                      <div className="text-xs text-muted-foreground">
                        SVG, PNG, JPG or GIF (max. 800x400px)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 border-t p-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => metadata.reset()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Continue</Button>
                </div>
              </form>
            </Form>
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

            <Form {...members}>
              <form onSubmit={members.handleSubmit(onSubmitMembers)}>
                <div className="px-6 flex gap-2 mt-2">
                  <Input
                    className="h-11"
                    placeholder="Address or email"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                  />
                  <Input
                    placeholder="0%"
                    className="max-w-14 h-11"
                    value={proportion}
                    onChange={(e) => setProportion(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-5"
                    onClick={() => {
                      append({ identifier: id, proportion });
                      setId("");
                      setProportion("0");
                    }}
                  >
                    Add
                  </Button>
                </div>

                <div className="px-6 mt-4 space-y-2">
                  <MemberItem
                    member={{ identifier: "You", proportion: "0" }}
                    action={
                      <Button
                        onClick={() =>
                          window.alert("You cannot remove yourself")
                        }
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    }
                  />
                  {fields.map((field, index) => (
                    <MemberItem
                      key={field.id}
                      member={field}
                      action={
                        <Button
                          onClick={() => remove(index)}
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

                <div className="flex justify-end gap-2 mt-6 border-t p-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      metadata.reset();
                      setTab("create");
                    }}
                  >
                    Back
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </Form>
          </>
        )}

        {tab === "success" && (
          <>
            <DialogHeader className="p-6 border-b">
              <DialogTitle>Success!</DialogTitle>
              <DialogDescription>
                Your fundraiser has been created successfully. Just one step
                missing, invite your friends to join you.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 mt-4 space-y-2">
              <MemberItem
                member={{ identifier: "You", proportion: "0" }}
                action={
                  <div className="text-sm text-muted-foreground">Joined</div>
                }
              />
              {fields.map((field, index) => (
                <MemberItem
                  key={field.id}
                  member={field}
                  action={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <CopyIcon className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  }
                />
              ))}
            </div>

            <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 mx-6">
              <Checkbox checked={shared} onCheckedChange={(checked) => setShared(!!checked)} />
              <div className="grid gap-1.5 font-normal">
                <p className="text-sm leading-none font-medium">
                  I have shared invitation links
                </p>
                <p className="text-muted-foreground text-sm">
                  These won't be available once you close the dialog.
                </p>
              </div>
            </Label>

            <div className="flex justify-end gap-2 mt-6 border-t p-6">
              <Button type="submit" disabled={!shared}>
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
  member: z.infer<typeof membersForm>["members"][number];
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
          <div className="text-sm">{member.identifier}</div>
          <div className="text-sm text-muted-foreground">
            {member.proportion}%
          </div>
        </div>
      </div>

      {action}
    </div>
  );
};
