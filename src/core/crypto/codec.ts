// Low-level encoding helpers used by the crypto layer. No keys or secrets live here.

// Return type is pinned to an ArrayBuffer-backed view so the bytes satisfy WebCrypto's
// `BufferSource` (which excludes SharedArrayBuffer-backed views).
export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const b = new Uint8Array(length);
  crypto.getRandomValues(b);
  return b;
}

export function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function fromBase64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return b;
}

/** Opaque, URL-safe-ish random id used for on-disk record keys (never derived from data). */
export function randomId(): string {
  return toBase64(randomBytes(16)).replace(/[+/=]/g, '').slice(0, 20);
}

export const utf8 = {
  encode: (s: string): Uint8Array<ArrayBuffer> => {
    const out = new Uint8Array(s.length * 3);
    const { written } = new TextEncoder().encodeInto(s, out);
    return out.subarray(0, written) as Uint8Array<ArrayBuffer>;
  },
  decode: (b: ArrayBuffer | Uint8Array): string => new TextDecoder().decode(b),
};
