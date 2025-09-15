"use client";

import { cn } from "@/lib/utils";
import jazzicon from "@metamask/jazzicon";
import Image from "next/image";
import { useMemo } from "react";

type ResolveAvatarParam = {
  seed?: string | null;
  size: number;
};
const CACHE: Record<string, string> = {};

/*
 * A function that takes in an address and a size and returns a string.
 * It's generating a unique metamask avatar for a given address using the algorithm taken from metamask repo.
 */
export const getMetamaskAvatar = (payload: ResolveAvatarParam) => {
  const cacheId = `${payload.size}-${payload.seed}`;
  if (CACHE[cacheId]) {
    return CACHE[cacheId];
  }

  // https://github.com/MetaMask/metamask-filecoin-developer-beta/blob/4ec4bf9995e64bfb0eb732cbe10ae2f2bac2ddff/ui/lib/icon-factory.js#L65
  let seed = parseInt(payload.seed?.slice(2, 10) ?? "0", 16);
  seed = seed == 0 ? Math.round(Math.random() * 10000000) : seed;
  const divWithSvg = jazzicon(payload.size, seed);

  const svg = divWithSvg.firstChild;
  if (!svg) {
    return "/avatar.webp";
  }
  const xmlSerializer = new XMLSerializer();
  const str = xmlSerializer.serializeToString(svg);
  const dataUrl = `data:image/svg+xml,${encodeSvg(str)}`;
  CACHE[cacheId] = dataUrl;
  return dataUrl;
};

/* Encoding the SVG string so that it can be used in a URL. */
/**
 * It takes a string of SVG markup and returns a string of HTML markup
 * @param {string} svgString - The SVG string to encode.
 */
export function encodeSvg(svgString: string): string {
  return svgString
    .replace(
      "<svg",
      ~svgString.indexOf("xmlns")
        ? "<svg"
        : '<svg xmlns="http://www.w3.org/2000/svg"'
    )
    .replace(/"/g, "'")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/{/g, "%7B")
    .replace(/}/g, "%7D")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/\s+/g, " ");
}

export const Avatar = ({
  src,
  alt,
  size,
  className,
  seed,
}: {
  src?: string;
  alt: string;
  size: number;
  className?: string;
  seed?: string;
}) => {
  const srcUrl = useMemo(() => {
    if (src) {
      return src;
    }
    if (seed) {
      return getMetamaskAvatar({ seed, size: size });
    }
    return "/avatar.webp";
  }, [src, seed, size]);

  return (
    <div
      className={cn("rounded-full overflow-hidden bg-white", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={srcUrl}
        alt={alt}
        width={size}
        height={size}
        className={"object-cover"}
      />
    </div>
  );
};
