import { useCopyToClipboard } from "@/hooks/copy";
import { Button, ButtonProps } from "./button";

export type CopyButtonProps = Omit<ButtonProps, "onClick"> & {
  text: string;
  copied: React.ReactNode;
  fallback: React.ReactNode;
};

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  className,
  copied,
  fallback,
  ...props
}) => {
  const { copyToClipboard, copied: isCopied } = useCopyToClipboard();

  return (
    <Button
      onClick={() => copyToClipboard(text)}
      {...props}
    >
      {isCopied ? copied : fallback}
    </Button>
  );
};
