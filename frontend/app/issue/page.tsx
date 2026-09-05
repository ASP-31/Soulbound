"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { isAddress, parseEventLogs } from "viem";
import type { Hash } from "viem";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileUp,
  Loader2,
  Rocket,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";
import {
  CONTRACT_ADDRESS,
  etherscanTxUrl,
  isContractConfigured,
  SOULBOUND_ABI,
} from "@/lib/contract";
import { publicClient } from "@/lib/viemPublicClient";
import { SessionMintedList } from "@/components/SessionMintedList";
import type {
  IssueStatus,
  MintedCertificate,
  RevokeState,
} from "@/types";

const STATUS_LABELS: Record<IssueStatus, string> = {
  idle: "Ready",
  pinning: "Pinning metadata to IPFS…",
  awaitingSignature: "Awaiting signature in wallet…",
  pending: "Transaction pending…",
  confirmed: "Certificate minted on chain",
  failed: "Minting failed",
};

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface PendingMint {
  recipient: string;
  studentName: string;
  course: string;
  issueDate: string;
  grade?: string;
  uri: string;
}

export default function IssuePage() {
  const { address, isConnected } = useAccount();

  const [recipient, setRecipient] = useState("");
  const [studentName, setStudentName] = useState("");
  const [course, setCourse] = useState("");
  const [issueDate, setIssueDate] = useState(() => toDateInputValue(new Date()));
  const [grade, setGrade] = useState("");

  const [status, setStatus] = useState<IssueStatus>("idle");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<Hash | null>(null);

  const [session, setSession] = useState<MintedCertificate[]>([]);
  const [revokeStatus, setRevokeStatus] = useState<Record<string, RevokeState>>({});

  const stubCounter = useRef(0);
  const processedHash = useRef<Hash | null>(null);
  const pendingMint = useRef<PendingMint | null>(null);

  const contractLive = isContractConfigured;
  const simulateMode = !contractLive;

  const { writeContractAsync, isPending: signingInProgress } = useWriteContract();

  const whitelistQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SOULBOUND_ABI,
    functionName: "issuers",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && contractLive && address),
    },
  });

  const ownerQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SOULBOUND_ABI,
    functionName: "owner",
    query: {
      enabled: Boolean(contractLive),
    },
  });

  const isOwner = address ? ownerQuery.data === address : false;
  const isWhitelisted = contractLive
    ? isOwner || Boolean(whitelistQuery.data)
    : true;
  const whitelistLoading =
    contractLive && (whitelistQuery.isPending || ownerQuery.isPending);
  const whitelistError =
    contractLive && (whitelistQuery.isError || ownerQuery.isError);

  const receipt = useWaitForTransactionReceipt({
    hash: mintTxHash ?? undefined,
    query: { enabled: Boolean(mintTxHash && status === "pending") },
  });

  const busy =
    status === "pinning" ||
    status === "awaitingSignature" ||
    status === "pending" ||
    signingInProgress;

  const formValid = useMemo(() => {
    if (busy || !isWhitelisted) return false;
    if (!recipient || !isAddress(recipient)) return false;
    if (studentName.trim().length === 0) return false;
    if (course.trim().length === 0) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) return false;
    if (!contractLive && !isConnected) return false;
    return true;
  }, [busy, isWhitelisted, recipient, studentName, course, issueDate, contractLive, isConnected]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!formValid || !address) return;

    setStatusError(null);

    const metadata = {
      name: `Soulbound Certificate — ${course.trim()}`,
      description:
        "On-chain verifiable credential issued via the Soulbound Certificate protocol. This token is soulbound and non-transferable.",
      attributes: [
        { trait_type: "Student Name", value: studentName.trim() },
        { trait_type: "Course", value: course.trim() },
        { trait_type: "Issue Date", value: issueDate },
        ...(grade.trim() ? [{ trait_type: "Grade", value: grade.trim() }] : []),
        { trait_type: "Issuer", value: address },
      ],
    };

    try {
      setStatus("pinning");

      const pinResponse = await fetch("/api/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });

      if (!pinResponse.ok) {
        const body = (await pinResponse.json().catch(() => null)) as {
          error?: string;
          details?: string[];
        } | null;
        throw new Error(
          body?.details?.join(" ") || body?.error || `Pinning failed (${pinResponse.status})`,
        );
      }

      const { uri } = (await pinResponse.json()) as { uri: string };
      pendingMint.current = {
        recipient,
        studentName: studentName.trim(),
        course: course.trim(),
        issueDate,
        grade: grade.trim() || undefined,
        uri,
      };

      if (!contractLive) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        stubCounter.current += 1;
        const minted: MintedCertificate = {
          tokenId: String(stubCounter.current),
          recipient,
          studentName: studentName.trim(),
          course: course.trim(),
          issueDate,
          grade: grade.trim() || undefined,
          uri,
          mintedAt: Date.now(),
        };
        setSession((prev) => [minted, ...prev]);
        setStatus("confirmed");
        resetForm();
        return;
      }

      setStatus("awaitingSignature");
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: SOULBOUND_ABI,
        functionName: "issueCertificate",
        args: [recipient, uri],
      });
      setMintTxHash(hash);
      setStatus("pending");
    } catch (error) {
      setStatus("failed");
      setStatusError(error instanceof Error ? error.message : "Unknown error");
    }
  }

  useEffect(() => {
    if (
      !receipt.data ||
      receipt.data.status !== "success" ||
      !mintTxHash ||
      processedHash.current === mintTxHash ||
      !pendingMint.current
    ) {
      return;
    }
    processedHash.current = mintTxHash;

    const mint = pendingMint.current;
    void (async () => {
      let tokenId: bigint | null = null;
      try {
        const issued = parseEventLogs({
          abi: SOULBOUND_ABI,
          logs: receipt.data.logs,
          eventName: "CertificateIssued",
        }) as unknown as {
          args?: { tokenId?: bigint };
        }[];
        tokenId = issued[0]?.args?.tokenId ?? null;
      } catch {
        tokenId = null;
      }

      if (tokenId === null) {
        try {
          const ids = (await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: SOULBOUND_ABI,
            functionName: "certificatesOf",
            args: [mint.recipient as `0x${string}`],
          })) as bigint[];
          tokenId = ids[ids.length - 1] ?? null;
        } catch {
          tokenId = null;
        }
      }

      const minted: MintedCertificate = {
        tokenId: tokenId !== null ? tokenId.toString() : "?",
        recipient: mint.recipient,
        studentName: mint.studentName,
        course: mint.course,
        issueDate: mint.issueDate,
        grade: mint.grade,
        uri: mint.uri,
        txHash: mintTxHash,
        mintedAt: Date.now(),
      };
      setSession((prev) => [minted, ...prev]);
      setStatus("confirmed");
      resetForm();
    })();
  }, [receipt.data, mintTxHash]);

  useEffect(() => {
    if (receipt.isError) {
      setStatus("failed");
      setStatusError(
        receipt.error?.message ?? "Transaction failed on chain.",
      );
    }
  }, [receipt.isError, receipt.error]);

  function resetForm() {
    setRecipient("");
    setStudentName("");
    setCourse("");
    setGrade("");
    setIssueDate(toDateInputValue(new Date()));
  }

  async function handleRevoke(tokenId: string) {
    if (!contractLive) return;
    setRevokeStatus((prev) => ({ ...prev, [tokenId]: { status: "signing" } }));
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: SOULBOUND_ABI,
        functionName: "revoke",
        args: [BigInt(tokenId)],
      });
      setRevokeStatus((prev) => ({
        ...prev,
        [tokenId]: { status: "pending", txHash: hash },
      }));
      await publicClient.waitForTransactionReceipt({ hash });
      setRevokeStatus((prev) => ({
        ...prev,
        [tokenId]: { status: "confirmed", txHash: hash },
      }));
      setSession((prev) =>
        prev.map((item) =>
          item.tokenId === tokenId
            ? { ...item, revoked: true, revokeTxHash: hash }
            : item,
        ),
      );
    } catch (error) {
      setRevokeStatus((prev) => ({
        ...prev,
        [tokenId]: {
          status: "failed",
          error: error instanceof Error ? error.message : "Revocation failed",
        },
      }));
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50";

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-blue-500">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Issuer Dashboard
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
            Connect a whitelisted issuer wallet to mint and revoke soulbound
            certificates on Sepolia.
          </p>
        </div>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
          Issuer Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Mint soulbound certificates to student wallets and manage them in this
          session.
        </p>
      </header>

      {simulateMode && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">Simulation mode.</span> No contract
            address has been configured yet —&nbsp;
            <code className="font-mono text-amber-300">shared/contract.json</code>
            &nbsp;is empty or <code className="font-mono text-amber-300">NEXT_PUBLIC_CONTRACT_ADDRESS</code> is a
            zero address. The form runs end-to-end (pin → mint) but writes are
            simulated locally.
          </p>
        </div>
      )}

      {isConnected && contractLive && !whitelistLoading && !isWhitelisted && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <ShieldX className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">This wallet is not a whitelisted issuer</p>
            <p className="mt-1 text-red-300/80">
              <code className="font-mono">{address}</code> has the&nbsp;
              <code className="font-mono">issuers()</code> role neither as an
              owner nor an issuer on the contract. Contact the contract owner to
              be added via <code className="font-mono">addIssuer()</code>. The
              form below is disabled.
            </p>
          </div>
        </div>
      )}

      {whitelistError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Could not read the issuer whitelist from the contract.</p>
        </div>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 pt-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            New Certificate
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold tracking-widest ${
              status === "confirmed"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : status === "failed"
                  ? "border-red-500/40 bg-red-500/10 text-red-400"
                  : busy
                    ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400"
            }`}
          >
            {busy && <Loader2 className="h-3 w-3 animate-spin" />}
            {status === "confirmed" && <CheckCircle2 className="h-3 w-3" />}
            {status === "failed" && <XCircle className="h-3 w-3" />}
            {STATUS_LABELS[status]}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Recipient Address
            </span>
            <input
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="0x…"
              disabled={!isWhitelisted}
              className={`${inputClass} font-mono`}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Student Name
            </span>
            <input
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              placeholder="Ada Lovelace"
              disabled={!isWhitelisted}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Course
            </span>
            <input
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              placeholder="B.Tech Computer Science"
              disabled={!isWhitelisted}
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Issue Date
              </span>
              <input
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
                disabled={!isWhitelisted}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Grade
                <span className="ml-1 font-normal normal-case text-zinc-600">
                  (optional)
                </span>
              </span>
              <input
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                placeholder="A+"
                disabled={!isWhitelisted}
                className={inputClass}
              />
            </label>
          </div>

          {!formValid && (recipient || studentName || course) && isWhitelisted && !busy && (
            <p className="text-xs text-red-400 sm:col-span-2">
              {!isAddress(recipient) && recipient
                ? "Recipient address is invalid."
                : !/^\d{4}-\d{2}-\d{2}$/.test(issueDate)
                  ? "Issue date must be valid."
                  : "Fill in the required fields to continue."}
            </p>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={!formValid}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              {status === "pinning"
                ? "Pinning to IPFS…"
                : status === "awaitingSignature"
                  ? "Waiting for signature…"
                  : status === "pending"
                    ? "Confirming transaction…"
                    : "Pin & Mint Certificate"}
            </button>
          </div>
        </form>

        {status === "failed" && statusError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="break-words">{statusError}</p>
          </div>
        )}

        {status === "pending" && mintTxHash && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3.5 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-zinc-300">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              Waiting for confirmation…
            </span>
            <a
              href={etherscanTxUrl(mintTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-blue-400 hover:text-blue-300"
            >
              {mintTxHash} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {status === "confirmed" && mintTxHash && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-sm">
            <span className="flex items-center gap-2 font-medium text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Certificate minted on chain.
            </span>
            <a
              href={etherscanTxUrl(mintTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-blue-400 hover:text-blue-300"
            >
              {mintTxHash} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </section>

      {simulateMode && session.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <Rocket className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            The entries below are <span className="font-semibold">simulated</span>
            &nbsp;— no on-chain transaction occurred. Deploy the contract and set
            its address to enable real minting and revocation.
          </p>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Session Mint History
          </h2>
          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
            {session.length}
          </span>
        </div>
        <SessionMintedList
          items={session}
          revokeStatus={revokeStatus}
          onRevoke={handleRevoke}
        />
      </section>
    </div>
  );
}