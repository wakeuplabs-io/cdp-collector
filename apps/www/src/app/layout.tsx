import { Providers } from "@/providers";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FairShare",
  description: "Collect donations for causes you care about.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <Providers>
          {" "}
          <div className="hidden xl:block">{children}</div>
          <div className="xl:hidden flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold">Mobile Not Available</h1>
            <p className="text-lg text-center mt-4">
              Please open this application on a desktop browser. Mobile version
              coming soon.
            </p>
          </div>
        </Providers>
      </body>
    </html>
  );
}


