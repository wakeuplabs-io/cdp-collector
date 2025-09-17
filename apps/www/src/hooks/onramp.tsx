import { CdpService } from "@/lib/services/cdp";
import { useState } from "react";

export const useOnramp = ({ to, assets }: { to: string; assets: string[] }) => {
  const [isLoading, setIsLoading] = useState(false);

  const openOnramp = async (amount?: string) => {
    if (!to) return;

    try {
      setIsLoading(true);

      const url = await CdpService.generateOnrampUrl(to, assets, amount);

      // open onramp as popup
      window.open(
        url,
        "Onramp",
        "width=500,height=800,scrollbars=no,resizable=no"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { openOnramp, isLoading };
};
