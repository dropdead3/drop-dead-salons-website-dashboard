/**
 * Shared HMAC-based signed URL utilities for unsubscribe links.
 * Used by both insights and client marketing email unsubscribe flows.
 */

const getHmacKey = async (): Promise<CryptoKey> => {
  const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET") || Deno.env.get("JWT_SECRET") || "fallback";
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
};

/**
 * Build a signed URL for an edge function endpoint.
 * @param functionName - e.g. "unsubscribe-client-email"
 * @param payload - object to encode in the URL (e.g. { cid, oid, ts })
 * @returns full signed URL
 */
export async function buildSignedUrl(
  functionName: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const encoder = new TextEncoder();
  const key = await getHmacKey();

  const tokenPayload = btoa(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(tokenPayload));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `${supabaseUrl}/functions/v1/${functionName}?payload=${encodeURIComponent(tokenPayload)}&sig=${encodeURIComponent(sig)}`;
}

/**
 * Verify an HMAC-signed payload from a URL.
 * @returns decoded payload object
 * @throws Error if signature is invalid
 */
export async function verifySignedPayload(
  encodedPayload: string,
  sig: string,
): Promise<Record<string, unknown>> {
  const encoder = new TextEncoder();
  const key = await getHmacKey();

  const sigBytes = Uint8Array.from(atob(decodeURIComponent(sig)), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    encoder.encode(decodeURIComponent(encodedPayload)),
  );

  if (!valid) {
    throw new Error("Invalid signature");
  }

  return JSON.parse(atob(decodeURIComponent(encodedPayload)));
}
