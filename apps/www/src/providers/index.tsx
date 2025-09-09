"use client";

import { Toaster } from "sonner";
import CdpProvider from "./cdp";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CdpProvider>
      {children}
      <Toaster />
    </CdpProvider>
  );
}
