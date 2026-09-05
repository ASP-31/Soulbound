"use client";

import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldX,
  XCircle,
} from "lucide-react";
import { etherscanTxUrl, shortenAddress } from "@/lib/contract";
import type { MintedCertificate, RevokeState } from "@/types";

interface SessionMintedListProps {
  items: MintedCertificate[];
  revokeStatus: Record<string, RevokeState>;
  onRevoke: (tokenId: string) => void;
}

function RevokeButton({
  item,
  revoke,
  onRevoke,
}: {
  item: MintedCertificate;
  revoke: RevokeState;
  onRevoke: (tokenId: string) => void;
}) {
  if (item.revoked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-red-400">
        <ShieldX className="h-3.5 w-3.5" /> REVOKED
        {item.revokeTxHash && (
          <a
            href={etherscanTxUrl(item.revokeTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </span>
    );
  }

  if (revoke?.status === "signing" || revoke?.status === "pending") {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-blue-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {revoke.status === "signing" ? "Confirm in wallet…" : "Tx pending…"}
      </span>
    );
  }

  if (revoke?.status === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Revoked
        {revoke.txHash && (
          <a
            href={etherscanTxUrl(revoke.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onRevoke(item.tokenId)}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-xs font-semibold text-red-400 transition-colors hover:border-red-500/50 hover:bg-red-500/10"
    >
      <ShieldX className="h-3.5 w-3.5" /> Revoke
    </button>
  );
}

export function SessionMintedList({
  items,
  revokeStatus,
  onRevoke,
}: SessionMintedListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
        No certificates have been minted yet.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-800/70 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
      {items.map((item) => {
        const revoke = revokeStatus[item.tokenId] ?? { status: "idle" };
        return (
          <li
            key={item.tokenId}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-500">
                  #{item.tokenId}
                </span>
                <span className="text-sm font-semibold text-zinc-100">
                  {item.studentName}
                </span>
                <span className="text-xs text-zinc-400">· {item.course}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                <span>to {shortenAddress(item.recipient, 4)}</span>
                <span>{item.issueDate}</span>
                {item.txHash ? (
                  <a
                    href={etherscanTxUrl(item.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-blue-400 hover:text-blue-300"
                  >
                    Tx <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="max-w-[220px] truncate font-mono text-zinc-600">
                    {item.uri}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {item.txHash ? (
                <RevokeButton item={item} revoke={revoke} onRevoke={onRevoke} />
              ) : (
                <span className="text-zinc-500">Simulated</span>
              )}
              {revoke?.status === "failed" && (
                <span
                  className="inline-flex items-center gap-1 text-xs text-red-400"
                  title={revoke.error}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}