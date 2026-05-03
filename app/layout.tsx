import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "hedwig — Zero-Knowledge Secret Sharing",
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
      <body className="min-h-screen" style={{ backgroundColor: "#FFFFEB", color: "#1A1A1A" }}>
        {children}
      </body>
    </html>
  );
}
