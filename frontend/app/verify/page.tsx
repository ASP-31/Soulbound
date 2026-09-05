"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isAddress } from "viem";
import { Search, TriangleAlert, Wallet } from "lucide-react";
import {
  resolveHolderCertificates,
  resolveTokenInfo,
} from "@/lib/viemPublicClient";
import { CertificateCard } from "@/components/CertificateCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import type { CertificateInfo } from "@/types";

type QueryKind = "token" | "address";

function parseQuery(value: string): { kind: QueryKind; raw: string } | null {
  const trimmed = value.trim();
  if (isAddress(trimmed)) return { kind: "address", raw: trimmed };
  if (/^\d+$/.test(trimmed)) return { kind: "token", raw: trimmed };
  return null;
}

function VerifyLoading() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialQuery =
    searchParams.get("token") ?? searchParams.get("address") ?? "";
  const [input, setInput] = useState(initialQuery);
  const [submitted, setSubmitted] = useState("");
  const [kind, setKind] = useState<QueryKind | null>(null);
  const [certificates, setCertificates] = useState<CertificateInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seq = useRef(0);
  const booted = useRef(false);

  async function execute(query: string) {
    const parsed = parseQuery(query);
    if (!parsed) {
      setError("Enter a valid Ethereum address (0x…) or a numeric token ID.");
      setCertificates([]);
      setKind(null);
      setSubmitted("");
      return;
    }

    const current = ++seq.current;
    setLoading(true);
    setError(null);
    setCertificates([]);
    setKind(parsed.kind);
    setSubmitted(parsed.raw);

    try {
      const results =
        parsed.kind === "token"
          ? [await resolveTokenInfo(BigInt(parsed.raw))]
          : await resolveHolderCertificates(parsed.raw as `0x${string}`);
      if (seq.current !== current) return;
      setCertificates(results);
    } catch (cause) {
      if (seq.current !== current) return;
      setError(
        cause instanceof Error
          ? `Verification failed: ${cause.message}`
          : "Verification failed. The Sepolia RPC may be unreachable.",
      );
      setCertificates([]);
    } finally {
      if (seq.current === current) setLoading(false);
    }
  }

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (initialQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void execute(initialQuery);
    }
  }, [initialQuery]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void execute(input);
  }

  const notFoundTokens = certificates.filter((c) => c.status === "notFound");
  const displayCertificates = certificates.filter((c) => c.status !== "notFound");
  const emptyAddress = kind === "address" && !loading && !error && certificates.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
          Verify a Certificate
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Look up any certificate by recipient address or token ID. Reads run
          against the public Sepolia RPC — no wallet or signature required.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Wallet address 0x… or token ID (e.g. 42)"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2.5 pl-10 pr-3.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          Verify
        </button>
      </form>

      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-600">
        <Wallet className="h-3.5 w-3.5" /> Public RPC · unauthenticated ·{" "}
        Ethereum Sepolia (11155111)
      </p>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="break-words">{error}</p>
        </div>
      )}

      {loading && <VerifyLoading />}

      {emptyAddress && (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-5 py-10 text-center">
          <p className="font-mono text-sm font-semibold text-zinc-300">
            No certificates found for this address.
          </p>
          <p className="mt-1.5 text-xs text-zinc-500">
            <code className="font-mono text-zinc-400">{submitted}</code> has no
            minted soulbound tokens.
          </p>
        </div>
      )}

      {kind === "token" && !loading && !error && notFoundTokens.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <p>
            <span className="font-mono font-semibold">Token #{String(notFoundTokens[0].tokenId)}</span>{" "}
            does not exist on this contract.
          </p>
        </div>
      )}

      {!loading && displayCertificates.length > 0 && (
        <div className="flex flex-col gap-4">
          {kind === "address" && (
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              {certificates.length} certificate
              {certificates.length === 1 ? "" : "s"} found for{" "}
              <span className="text-zinc-300">{submitted}</span>
            </p>
          )}
          {displayCertificates.map((info) => (
            <CertificateCard key={info.tokenId.toString()} info={info} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyLoading />}>
      <VerifyContent />
    </Suspense>
  );
}