import { CDP_ONRAMP_BASE_URL } from "@/config";
import { useCallback, useState } from "react";

export const useOnramp = ({
  to ,
  assets,
}: {
  to: string;
  assets: string[];
}) => {
  const [isLoading, setisLoading] = useState(false);

  const openOnramp = useCallback(async (amount?: string) => {
    if (!to) return;

    setisLoading(true);

    try {
      const res = await fetch("/api/onramp/session-token", {
        method: "POST",
        body: JSON.stringify({
          addresses: [{ address: to, blockchains: ["base"] }],
          assets: assets,
        }),
      });
      const { token } = await res.json();

      // open onramp as popup
      window.open(
        `${CDP_ONRAMP_BASE_URL}/buy?assets=${assets.join(",")}&defaultAsset=${assets[0]}&fiatCurrency=USD&sessionToken=${token}` + (amount ? `&presetCryptoAmount=${amount}` : ""),
        "Onramp",
        "width=500,height=800,scrollbars=no,resizable=no"
      );
    } finally {
      setisLoading(false);
    }
  }, [to, assets]);

  return { openOnramp, isLoading };
};
