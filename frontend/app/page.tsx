import Link from "next/link";
import {
  ArrowRight,
  Fingerprint,
  FileSearch,
  Globe,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { ContractStatus } from "@/components/ContractStatus";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Soulbound by design",
    body: "Non-transferable ERC-721 tokens. Once minted, credentials belong to the recipient alone — permanent, tamper-proof, irrevocably bound.",
  },
  {
    icon: Link2,
    title: "IPFS-anchored metadata",
    body: "Certificate details are pinned to IPFS through a secure server route, with the content hash stored immutably on chain.",
  },
  {
    icon: FileSearch,
    title: "Zero-friction verification",
    body: "Recruiters verify any holder or token ID in seconds — no wallet, no extension, no login. Just an RPC call.",
  },
  {
    icon: Fingerprint,
    title: "Issuer-gated minting",
    body: "Only whitelisted institutional addresses can mint or revoke. Every certificate records its issuer on chain.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col items-center gap-6 pt-10 text-center sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-zinc-400">
          <Globe className="h-3.5 w-3.5 text-blue-500" />
          Ethereum Sepolia · chainId 11155111
        </span>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-zinc-50 sm:text-6xl">
          On-chain credentials that{" "}
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            can&apos;t be forged
          </span>
          .
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
          Whitelisted issuers mint soulbound ERC-721 credentials representing
          skills, achievements, and academic work directly to a recipient&apos;s
          wallet — anchored to IPFS metadata and publicly verifiable by anyone,
          wallet or no wallet.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/issue"
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Issue a certificate
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/verify"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-6 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500"
          >
            Verify a credential
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-600"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-blue-500">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-zinc-100">{title}</h2>
            <p className="mt-1.5 text-sm leading-6 text-zinc-400">{body}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          Contract Status
        </h2>
        <ContractStatus />
      </section>
    </div>
  );
}