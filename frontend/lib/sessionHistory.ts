import type { MintedCertificate } from "@/types";

const SESSION_KEY = "soulbound-cert.minted-session";

function isMintedCertificate(value: unknown): value is MintedCertificate {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.tokenId === "string" &&
    typeof item.recipient === "string" &&
    typeof item.studentName === "string" &&
    typeof item.course === "string" &&
    typeof item.issueDate === "string" &&
    typeof item.uri === "string" &&
    typeof item.mintedAt === "number"
  );
}

export function loadMintedSession(): MintedCertificate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMintedCertificate);
  } catch {
    return [];
  }
}

export function saveMintedSession(items: MintedCertificate[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(items));
  } catch {
    // Storage full/unavailable — non-fatal.
  }
}

export function clearMintedSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable — non-fatal.
  }
}