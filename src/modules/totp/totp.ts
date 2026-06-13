// RFC 6238 TOTP via WebCrypto HMAC. Secrets are base32 (standard authenticator format).
export type TotpAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

export interface TotpOpts {
  digits?: number;
  period?: number;
  algorithm?: TotpAlgorithm;
}

export async function totp(secretB32: string, opts: TotpOpts = {}, nowMs = Date.now()): Promise<string> {
  const digits = opts.digits ?? 6;
  const period = opts.period ?? 30;
  const algorithm = opts.algorithm ?? 'SHA-1';

  const counter = Math.floor(nowMs / 1000 / period);
  const msg = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = c & 0xff;
    c = Math.floor(c / 256);
  }

  const key = await crypto.subtle.importKey('raw', base32Decode(secretB32), { name: 'HMAC', hash: algorithm }, false, ['sign']);
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (bin % 10 ** digits).toString().padStart(digits, '0');
}

export function secondsRemaining(period = 30, nowMs = Date.now()): number {
  return period - (Math.floor(nowMs / 1000) % period);
}

function base32Decode(s: string): Uint8Array<ArrayBuffer> {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = s.replace(/=+$/, '').replace(/\s/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}
