export interface CertificateAttribute {
  trait_type: string;
  value: string;
}

export interface CertificateMetadata {
  name: string;
  description: string;
  image?: string;
  attributes: CertificateAttribute[];
}

export type CertificateStatus =
  | "valid"
  | "revoked"
  | "notFound"
  | "error"
  | "loading";

export interface CertificateInfo {
  tokenId: bigint;
  status: CertificateStatus;
  valid: boolean;
  revoked: boolean;
  existed: boolean;
  issuer: string;
  owner: string;
  tokenURI: string;
  metadata: CertificateMetadata | null;
  imageUrl: string | null;
}

export type IssueStatus =
  | "idle"
  | "pinning"
  | "awaitingSignature"
  | "pending"
  | "confirmed"
  | "failed";

export interface MintedCertificate {
  tokenId: string;
  recipient: string;
  studentName: string;
  course: string;
  issueDate: string;
  grade?: string;
  uri: string;
  txHash?: string;
  mintedAt: number;
  revoked?: boolean;
  revokeTxHash?: string;
}

export type RevokeState = {
  status: "idle" | "signing" | "pending" | "confirmed" | "failed";
  txHash?: string;
  error?: string;
};