import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Aperture,
  BadgeCheck,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  Link2,
  ShieldX,
  Trophy,
  User,
} from "lucide-react";
import {
  etherscanAddressUrl,
  etherscanTokenUrl,
  shortenAddress,
} from "@/lib/contract";
import { attributeValue } from "@/lib/pinata";
import type { CertificateInfo, CertificateStatus } from "@/types";

interface CertificateCardProps {
  info: CertificateInfo;
}

const STATUS_STYLES: Record<
  CertificateStatus,
  { label: string; badge: string; ring: string }
> = {
  valid: {
    label: "VALID",
    badge:
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40",
    ring: "border-emerald-500/30 bg-emerald-500/[0.03]",
  },
  revoked: {
    label: "REVOKED",
    badge: "bg-red-500/15 text-red-400 border border-red-500/40",
    ring: "border-red-500/30 bg-red-500/[0.03]",
  },
  notFound: {
    label: "NOT FOUND",
    badge: "bg-zinc-500/15 text-zinc-400 border border-zinc-600/40",
    ring: "border-zinc-700 bg-zinc-900/40",
  },
  error: {
    label: "ERROR",
    badge: "bg-amber-500/15 text-amber-400 border border-amber-500/40",
    ring: "border-amber-500/30 bg-amber-500/[0.03]",
  },
  loading: {
    label: "LOADING",
    badge: "bg-blue-500/15 text-blue-400 border border-blue-500/40",
    ring: "border-blue-500/30",
  },
};

function FactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-700/80 bg-zinc-900 text-zinc-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {label}
        </p>
        <div className="truncate text-sm text-zinc-200">{children}</div>
      </div>
    </div>
  );
}

function AddressLink({ address, label }: { address: string; label?: string }) {
  return (
    <a
      href={etherscanAddressUrl(address)}
      target="_blank"
      rel="noopener noreferrer"
      className="group/link inline-flex max-w-full items-center gap-1 font-mono text-xs text-blue-400 transition-colors hover:text-blue-300"
      title={address}
    >
      <span className="truncate">{label ?? shortenAddress(address)}</span>
      <ExternalLink className="h-3 w-3 shrink-0 opacity-60 transition-opacity group-hover/link:opacity-100" />
    </a>
  );
}

export function CertificateCard({ info }: CertificateCardProps) {
  const { status, metadata } = info;
  const styles = STATUS_STYLES[status];

  const studentName =
    attributeValue(metadata, "Student Name") || metadata?.name || "Unknown Student";
  const course =
    attributeValue(metadata, "Course") || metadata?.name || "—";
  const issueDate = attributeValue(metadata, "Issue Date") || "—";
  const grade = attributeValue(metadata, "Grade");
  const imageUrl = info.imageUrl;

  return (
    <div
      className={`rounded-2xl border ${styles.ring} bg-zinc-950/90 p-5 shadow-[0_0_30px_-15px_rgba(0,0,0,0.9)] transition-colors`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
          Token #{info.tokenId.toString()}
        </span>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-bold tracking-widest ${styles.badge}`}
        >
          {status === "valid" ? (
            <BadgeCheck className="h-3.5 w-3.5" />
          ) : status === "revoked" ? (
            <ShieldX className="h-3.5 w-3.5" />
          ) : (
            <Aperture className="h-3.5 w-3.5" />
          )}
          {styles.label}
        </span>
      </div>

      {imageUrl && (
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={course}
            className="max-h-56 w-full rounded-lg border border-zinc-800 object-cover"
          />
        </div>
      )}

      <h3 className="mt-4 text-xl font-bold tracking-tight text-zinc-50">
        {studentName}
      </h3>
      <div className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-400">
        <GraduationCap className="h-4 w-4 text-blue-500" />
        {course}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FactRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Issue Date">
          {issueDate}
        </FactRow>
        <FactRow icon={<Trophy className="h-3.5 w-3.5" />} label="Grade">
          {grade || "—"}
        </FactRow>
        <FactRow icon={<User className="h-3.5 w-3.5" />} label="Holder">
          <AddressLink address={info.owner} />
        </FactRow>
        <FactRow icon={<Aperture className="h-3.5 w-3.5" />} label="Issuer">
          <AddressLink address={info.issuer} />
        </FactRow>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-4">
        <a
          href={etherscanTokenUrl(info.tokenId)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-zinc-400 transition-colors hover:text-zinc-200"
        >
          View on Etherscan <ExternalLink className="h-3 w-3" />
        </a>
        {info.tokenURI && (
          <span className="max-w-[55%] truncate font-mono text-[11px] text-zinc-600">
            {info.tokenURI}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-800/80 pt-3">
        <Link
          href={`/credential/${info.tokenId.toString()}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-400 transition-colors hover:border-blue-500/50 hover:text-blue-300"
        >
          <Link2 className="h-3 w-3" /> Shareable page
        </Link>
        {typeof window !== "undefined" && (
          <QRCodeSVG
            value={`${window.location.origin}/credential/${info.tokenId.toString()}`}
            size={64}
            marginSize={0}
            bgColor="#ffffff"
            fgColor="#18181b"
            className="rounded border border-zinc-800 bg-white p-1"
            title={`Verify credential #${info.tokenId.toString()}`}
          />
        )}
      </div>
    </div>
  );
}