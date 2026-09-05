import type { CertificateMetadata } from "@/types";

export const PINATA_GATEWAY = "https://gateway.pinata.cloud";

export function resolveIpfsUrl(
  uri: string | null | undefined,
): string | null {
  if (!uri) return null;
  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    return `${PINATA_GATEWAY}/ipfs/${cid}`;
  }
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }
  return null;
}

export async function fetchCertificateMetadata(
  uri: string,
): Promise<CertificateMetadata | null> {
  const httpUrl = resolveIpfsUrl(uri);
  if (!httpUrl || typeof window === "undefined") return null;

  try {
    const response = await fetch(httpUrl, {
      method: "GET",
      headers: { Accept: "application/json, text/plain" },
    });
    if (!response.ok) return null;
    const raw = await response.json();
    if (!raw || typeof raw !== "object") return null;

    const metadata: CertificateMetadata = {
      name:
        typeof raw.name === "string" ? raw.name : "Soulbound Certificate",
      description:
        typeof raw.description === "string" ? raw.description : "",
      image: typeof raw.image === "string" ? raw.image : undefined,
      attributes: Array.isArray(raw.attributes)
        ? raw.attributes.filter(
            (attr: unknown) =>
              attr &&
              typeof attr === "object" &&
              typeof (attr as { trait_type?: unknown }).trait_type ===
                "string" &&
              typeof (attr as { value?: unknown }).value === "string",
          )
        : [],
    };
    return metadata;
  } catch {
    return null;
  }
}

export function attributeValue(
  metadata: CertificateMetadata | null,
  traitType: string,
): string | undefined {
  return metadata?.attributes.find((attr) => attr.trait_type === traitType)
    ?.value;
}