"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clipboard,
  ExternalLink,
  Link2,
  Loader2,
  ShieldX,
  TriangleAlert,
} from "lucide-react";
import { etherscanAddressUrl, etherscanTokenUrl } from "@/lib/contract";
import { attributeValue, resolveIpfsUrl } from "@/lib/pinata";
import { resolveTokenInfo } from "@/lib/viemPublicClient";
import type { CertificateInfo } from "@/types";

const CREDENTIAL_TYPE_ICONS: Record<string, string> = {
  "Academic Certificate": "🎓",
  "Professional Certification": "📜",
  "Skill Certification": "💻",
  "Course Completion": "🎯",
  Achievement: "🏆",
};

function FactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </p>
      <div className="mt-0.5 text-sm text-zinc-200">{children}</div>
    </div>
  );
}

function ExternalLinkAnchor({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group/link inline-flex items-center gap-1 font-mono text-xs text-blue-400 transition-colors hover:text-blue-300"
    >
      <span className="truncate">{children}</span>
      <ExternalLink className="h-3 w-3 shrink-0 opacity-60 transition-opacity group-hover/link:opacity-100" />
    </a>
  );
}

function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-400" />
      ) : (
        <Clipboard className="h-4 w-4" />
      )}
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

export default function CredentialPage({
  params,
}: {
  params: Promise<{ tokenId: string }>;
}) {
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tokenIdRef = useRef<string | null>(null);
  const [viewUrl, setViewUrl] = useState("");

  useEffect(() => {
    void Promise.resolve(params).then(({ tokenId }) => {
      tokenIdRef.current = tokenId;
      setViewUrl(
        `${window.location.origin}/credential/${encodeURIComponent(tokenId)}`,
      );
      if (!/^\d+$/.test(tokenId)) {
        setError("Invalid token ID. Credentials are addressed by token number.");
        setLoading(false);
        return;
      }
      void resolveTokenInfo(BigInt(tokenId))
        .then((info) => {
          if (!info.existed) {
            setError(
              `Token #${tokenId} does not exist on this contract or has been burned.`,
            );
            return;
          }
          setCertificate(info);
        })
        .catch((cause) => {
          setError(
            cause instanceof Error
              ? `Verification failed: ${cause.message}`
              : "Verification failed. The Sepolia RPC may be unreachable.",
          );
        })
        .finally(() => setLoading(false));
    });
  }, [params]);

  const metadata = certificate?.metadata ?? null;
  const type =
    attributeValue(metadata, "Credential Type") || "Academic Certificate";
  const typeIcon = CREDENTIAL_TYPE_ICONS[type] ?? "🎓";
  const studentName =
    attributeValue(metadata, "Student Name") ||
    metadata?.name ||
    "Unknown Student";
  const course =
    attributeValue(metadata, "Course") || metadata?.name || "—";
  const grade = attributeValue(metadata, "Grade");
  const issueDate = attributeValue(metadata, "Issue Date") || "—";
  const metadataUrl = certificate?.tokenURI
    ? resolveIpfsUrl(certificate.tokenURI)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/verify"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to verify
      </Link>

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-16">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          <p className="text-sm text-zinc-400">
            Resolving credential from the Sepolia RPC…
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-6">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-200">
              Credential not found
            </p>
            <p className="mt-1 text-sm break-words text-amber-200/80">{error}</p>
          </div>
        </div>
      )}

      {certificate && (
        <div className="mx-auto w-full max-w-2xl">
          <div
            className={`rounded-2xl border bg-zinc-950/90 p-6 shadow-[0_0_40px_-18px_rgba(0,0,0,0.9)] sm:p-8 ${
              certificate.status === "valid"
                ? "border-emerald-500/30"
                : "border-red-500/30"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                On-chain Credential #{certificate.tokenId.toString()}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-bold tracking-widest ${
                  certificate.status === "valid"
                    ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                    : "border border-red-500/40 bg-red-500/15 text-red-400"
                }`}
              >
                {certificate.status === "valid" ? (
                  <BadgeCheck className="h-3.5 w-3.5" />
                ) : (
                  <ShieldX className="h-3.5 w-3.5" />
                )}
                {certificate.status === "valid" ? "VALID" : "REVOKED"}
              </span>
            </div>

            <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row">
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-300">
                  <span aria-hidden>{typeIcon}</span> {type}
                </p>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-50">
                  {studentName}
                </h1>
                <p className="mt-1 text-base text-zinc-400">{course}</p>
              </div>

              <div className="mx-auto shrink-0 rounded-xl border border-zinc-800 bg-white p-3">
                <QRCodeSVG value={viewUrl} size={148} marginSize={1} />
                <p className="mt-1.5 max-w-[148px] text-center font-mono text-[9px] leading-tight text-zinc-700">
                  Scan to verify this credential on-chain
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <FactRow label="Holder">
                <ExternalLinkAnchor href={etherscanAddressUrl(certificate.owner)}>
                  {certificate.owner}
                </ExternalLinkAnchor>
              </FactRow>
              <FactRow label="Issuer">
                <ExternalLinkAnchor href={etherscanAddressUrl(certificate.issuer)}>
                  {certificate.issuer}
                </ExternalLinkAnchor>
              </FactRow>
              <FactRow label="Issue Date">{issueDate}</FactRow>
              <FactRow label="Grade">{grade || "—"}</FactRow>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-5">
              <div className="flex flex-wrap gap-2">
                <ExternalLinkAnchor href={etherscanTokenUrl(certificate.tokenId)}>
                  View on Etherscan <ExternalLink className="h-3 w-3" />
                </ExternalLinkAnchor>
                {metadataUrl && (
                  <ExternalLinkAnchor href={metadataUrl}>
                    IPFS metadata <ExternalLink className="h-3 w-3" />
                  </ExternalLinkAnchor>
                )}
              </div>
              {viewUrl && <ShareButton url={viewUrl} />}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-center font-mono text-xs text-zinc-600">
            <Link2 className="h-3.5 w-3.5" />
            Independently verified against the SBC contract on Ethereum Sepolia
            (chain ID 11155111)
          </div>
        </div>
      )}
    </div>
  );
}