import Image from "next/image";
import Link from "next/link";

export const Logo: React.FC<{
  width: number;
  height: number;
  className?: string;
}> = ({ width, height, className }) => {
  return (
    <Link href="/dashboard">
      <Image
        src={"/logo.png"}
        alt="logo"
        width={width}
        height={height}
        className={className}
      />
    </Link>
  );
};
