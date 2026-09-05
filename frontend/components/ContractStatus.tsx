"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  CONTRACT_ADDRESS,
  isContractConfigured,
  SEPOLIA_EXPLORER,
  shortenAddress,
} from "@/lib/contract";
import {
  isContractReachable,
  publicClient,
  sepoliaChain,
} from "@/lib/viemPublicClient";

type Status =
  | "checking"
  | "live"
  | "stub"
  | "notDeployed"
  | "unreachable";

export function ContractStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const { reachable, deployed } = await isContractReachable();
        if (cancelled) return;
        if (!reachable) {
          setStatus("unreachable");
          return;
        }
        setStatus(deployed ? "live" : isContractConfigured ? "notDeployed" : "stub");
        setChainId((await publicClient.getChainId()) ?? null);
      } catch {
        if (!cancelled) setStatus("unreachable");
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const dots = {
    checking: "bg-yellow-400 animate-pulse",
    live: "bg-emerald-400",
    stub: "bg-amber-400",
    notDeployed: "bg-amber-400",
    unreachable: "bg-red-500",
  };

  const labels: Record<Status, string> = {
    checking: "Checking RPC…",
    live: "Contract live on Sepolia",
    stub: "Stub — contract not deployed",
    notDeployed: "Contract address set but no code at address",
    unreachable: "Sepolia RPC unreachable",
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 font-mono text-xs text-zinc-400">
      <span className="inline-flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dots[status]}`} />
        {labels[status]}
      </span>
      <span className="hidden text-zinc-600 sm:inline">·</span>
      <span>{sepoliaChain.name} (chainId {chainId ?? 11155111})</span>
      <span className="hidden text-zinc-600 sm:inline">·</span>
      <a
        href={`${SEPOLIA_EXPLORER}/address/${CONTRACT_ADDRESS}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
      >
        {shortenAddress(CONTRACT_ADDRESS)} <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}