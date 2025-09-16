import { EXPLORER_BASE_URL } from "@/config";


export const buildExplorerTxUrl = (txHash: string) => {
  return `${EXPLORER_BASE_URL}/tx/${txHash}`;
};

export const openExplorerTx = (txHash: string, target: "_blank" | "_self" = "_blank") => {
  window.open(buildExplorerTxUrl(txHash), target);
};