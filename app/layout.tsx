import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Burnote — Zero-Knowledge Secret Sharing",
  description:
    "Share secrets securely. End-to-end encrypted in your browser. The server never sees your secret.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f0f] text-neutral-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
