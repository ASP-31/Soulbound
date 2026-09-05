import { NextResponse } from "next/server";
import { isAddress } from "viem";

export const runtime = "nodejs";

const PINATA_API = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

const REQUIRED_ATTRS = ["Credential Type", "Student Name", "Course", "Issue Date", "Issuer"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isString(value: unknown): value is string {
  return typeof value === "string";
}

interface AttributeInput {
  trait_type?: unknown;
  value?: unknown;
}

function validateMetadata(
  body: unknown,
): { ok: true; data: Record<string, unknown> } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, errors: ["Payload must be a JSON object."] };
  }
  const record = body as Record<string, unknown>;

  if (!isString(record.name) || record.name.trim() === "") {
    errors.push("'name' must be a non-empty string.");
  }
  if (!isString(record.description) || record.description.trim() === "") {
    errors.push("'description' must be a non-empty string.");
  }
  if (record.image !== undefined && record.image !== null) {
    if (
      !isString(record.image) ||
      !(record.image.startsWith("ipfs://") || record.image.startsWith("http"))
    ) {
      errors.push("'image' must be an ipfs:// or http(s):// URL.");
    }
  }

  if (!Array.isArray(record.attributes) || record.attributes.length === 0) {
    errors.push("'attributes' must be a non-empty array.");
  } else {
    const seen = new Set<string>();
    record.attributes.forEach((attr, index) => {
      const a = attr as AttributeInput;
      if (!a || typeof a !== "object" || Array.isArray(a)) {
        errors.push(`attributes[${index}] must be an object.`);
        return;
      }
      if (!isString(a.trait_type) || a.trait_type.trim() === "") {
        errors.push(`attributes[${index}].trait_type must be a non-empty string.`);
        return;
      }
      if (!isString(a.value) || a.value.trim() === "") {
        errors.push(`attributes[${index}].value must be a non-empty string.`);
        return;
      }
      seen.add(a.trait_type);

      if (a.trait_type === "Issue Date" && !DATE_RE.test(a.value)) {
        errors.push(
          `attributes[${index}].value must match YYYY-MM-DD for 'Issue Date'.`,
        );
      }
      if (a.trait_type === "Issuer" && !isAddress(a.value)) {
        errors.push(
          `attributes[${index}].value must be a valid Ethereum address for 'Issuer'.`,
        );
      }
    });

    for (const required of REQUIRED_ATTRS) {
      if (!seen.has(required)) {
        errors.push(`Missing required attribute '${required}'.`);
      }
    }
  }

  return errors.length > 0
    ? { ok: false, errors }
    : { ok: true, data: record };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!process.env.PINATA_JWT) {
    return NextResponse.json(
      { error: "Pinata JWT is not configured on the server." },
      { status: 500 },
    );
  }

  const validation = validateMetadata(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Invalid metadata payload.", details: validation.errors },
      { status: 400 },
    );
  }

  try {
    const pinata = await fetch(PINATA_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataContent: validation.data,
        pinataMetadata: {
          name:
            typeof validation.data.name === "string"
              ? validation.data.name
              : "soulbound-certificate",
        },
      }),
    });

    if (!pinata.ok) {
      const detail = await pinata.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Pinata API request failed (${pinata.status}).`,
          detail: detail.slice(0, 300),
        },
        { status: 500 },
      );
    }

    const result = (await pinata.json()) as { IpfsHash?: string };
    if (!result.IpfsHash) {
      return NextResponse.json(
        { error: "Pinata returned no IPFS hash." },
        { status: 500 },
      );
    }

    return NextResponse.json({ uri: `ipfs://${result.IpfsHash}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to pin metadata to IPFS.", detail: message },
      { status: 500 },
    );
  }
}