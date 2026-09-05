"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ShieldCheck } from "lucide-react";

const NAV_LINKS = [
  { href: "/issue", label: "Issue" },
  { href: "/verify", label: "Verify" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-blue-500 transition-colors group-hover:border-blue-500/60 group-hover:text-blue-400">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-mono text-sm font-bold tracking-tight text-zinc-50">
              soulbound<span className="text-blue-500">.cert</span>
            </span>
            <span className="text-[10px] font-medium tracking-widest text-zinc-500">
              SEPOLIA · ERC-721
            </span>
          </span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 sm:order-2 sm:ml-6 sm:w-auto">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-800 text-zinc-50"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="order-2 ml-auto sm:order-3">
          <ConnectButton
            showBalance={false}
            accountStatus="address"
            chainStatus="icon"
          />
        </div>
      </div>
    </header>
  );
}