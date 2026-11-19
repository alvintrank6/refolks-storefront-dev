// WebCrypto only, so the same code runs in Node (next dev/start) and the Worker.
// 100k is the PBKDF2 iteration ceiling Cloudflare Workers accept.
const ITERATIONS = 100_000;
const encoder = new TextEncoder();
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (value: string): Uint8Array<ArrayBuffer> =>
  new Uint8Array(value.match(/../g)?.map((b) => parseInt(b, 16)) ?? []);

export const randomToken = () =>
  hex(crypto.getRandomValues(new Uint8Array(32)));

export const sha256 = async (value: string) =>
  hex(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(value)),
    ),
  );

async function derive(password: string, salt: Uint8Array<ArrayBuffer>) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
      key,
      256,
    ),
  );
}

/** Format: pbkdf2$<iterations>$<salt hex>$<hash hex>. */
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${hex(salt)}$${hex(await derive(password, salt))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, salt, expected] = stored.split("$");
  if (scheme !== "pbkdf2" || Number(iterations) !== ITERATIONS) return false;
  const actual = await derive(password, fromHex(salt));
  const target = fromHex(expected);
  if (actual.length !== target.length) return false;
  let diff = 0; // constant-time compare
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ target[i];
  return diff === 0;
}
