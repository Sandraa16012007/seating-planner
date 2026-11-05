/**
 * Browser-side ownership token helpers.
 *
 * The raw token is the only bearer secret for a registration. It lives in
 * localStorage and is never stored in Supabase; only its SHA-256 hash is.
 */

export const OWNERSHIP_TOKEN_STORAGE_KEY =
  "farewell-seating-planner.ownership-token";

const OWNERSHIP_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const TOKEN_BYTES = 32;

export function isValidOwnershipToken(
  value: string | null | undefined,
): value is string {
  return typeof value === "string" && OWNERSHIP_TOKEN_PATTERN.test(value);
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/** 256 bits of cryptographically secure randomness, base64url encoded. */
export function generateOwnershipToken() {
  const bytes = new Uint8Array(TOKEN_BYTES);
  window.crypto.getRandomValues(bytes);

  return encodeBase64Url(bytes);
}

export function readOwnershipToken() {
  try {
    const token = window.localStorage.getItem(OWNERSHIP_TOKEN_STORAGE_KEY);

    return isValidOwnershipToken(token) ? token : null;
  } catch {
    return null;
  }
}

export function saveOwnershipToken(token: string) {
  if (!isValidOwnershipToken(token)) {
    return false;
  }

  try {
    window.localStorage.setItem(OWNERSHIP_TOKEN_STORAGE_KEY, token);
    return true;
  } catch {
    return false;
  }
}

export function clearOwnershipToken() {
  try {
    window.localStorage.removeItem(OWNERSHIP_TOKEN_STORAGE_KEY);
  } catch {
    // Nothing else is safe to do; the token simply stays in storage.
  }
}
