"use client";

import { Address } from "@/components/address";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";
import QrCode from "react-qr-code";

export default function Donate() {
  const { id } = useParams();
  const [tab, setTab] = useState<
    "auth" | "method" | "crypto" | "processing" | "success"
  >("success");

  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center justify-center bg-background">
      <div className="bg-background rounded-xl max-w-md min-h-[500px] border flex flex-col">
        <div className="bg-gradient-to-b from-blue-200 to-background h-20 relative rounded-t-xl">
          <Image
            src="/avatar.webp"
            alt="Fundraiser"
            width={80}
            height={80}
            className="rounded-full absolute left-1/2 -translate-x-1/2 -bottom-6"
          />
        </div>

        <div className="p-6 pt-10 flex-1">
          <h1 className="text-2xl font-bold text-center">Fundraiser Title</h1>
          <p className="text-muted-foreground text-center">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </p>
        </div>

        {tab === "auth" && (
          <div className="border-t p-6">
            <Button className="w-full h-12" size="lg" onClick={() => setTab("method")}>
              Sign Up or Login to Donate
            </Button>
          </div>
        )}

        {tab === "method" && (
          <div className="border-t p-6 space-y-3">
            <Button className="w-full h-12" size="lg" onClick={() => setTab("crypto")}>
              Donate with Crypto
            </Button>
            <Button variant="outline" className="w-full h-12" size="lg" onClick={() => setTab("processing")}>
              Donate with Fiat
            </Button>
          </div>
        )}

        {tab === "crypto" && (
          <div className="border-t pb-6 pt-10 px-6">
            <QrCode
              className="h-40 w-40 mx-auto mb-6"
              value={"0xA1D3ba06878B6B7EC54781A5BaCBF5068BCaa1d0"}
            />

            <Address
              address={"0xA1D3ba06878B6B7EC54781A5BaCBF5068BCaa1d0"}
              className="mb-2"
            />

            <p className="text-center text-sm mb-10">
              Deposit <span className="font-bold">USDC</span> or{" "}
              <span className="font-bold">POL</span> to this address in{" "}
              <span className="font-bold">Base Mainnet</span>
            </p>

            <Button variant="outline" className="w-full h-12" size="lg" onClick={() => setTab("method")}>
              Back
            </Button>
          </div>
        )}

        {tab === "processing" && (
          <div className="border-t py-10 px-6 min-h-[200px] flex flex-col gap-4 items-center justify-center text-center">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Processing your donation.
              <br />
              Don't close this page...
            </span>
          </div>
        )}

        {tab === "success" && (
          <div className="border-t p-6 space-y-3">
            <div className="text-center">
              <span className="text-2xl font-bold">🎉 Success! 🎉</span>
            </div>
            <div className="text-center mb-20 text-muted-foreground">
              The funds have been transferred to the fundraiser. Thank you for
              your donation!
            </div>

            <Button className="w-full h-12" size="lg">
              Create my own fundraiser
            </Button>
            <Button variant="outline" className="w-full h-12" size="lg">
              Open in explorer
            </Button>
          </div>
        )}
      </div>
      <div className="text-muted-foreground text-center mt-4 font-medium text-sm">
        Payments secured by Coinbase 🔒
      </div>
    </div>
  );
}
