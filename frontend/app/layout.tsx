import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Soulbound Certificates — On-Chain Verifiable Credentials",
  description:
    "Mint, manage and verify tamper-proof soulbound ERC-721 certificates anchored on Ethereum Sepolia with IPFS-pinned metadata.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <footer className="border-t border-zinc-800/70">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-1 px-4 py-5 font-mono text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <span>soulbound.cert — HackBlox 2026 · Web3 Track</span>
              <span>Ethereum Sepolia · chainId 11155111</span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}