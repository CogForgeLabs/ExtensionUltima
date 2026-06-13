// Breach Checker — checks a password against HaveIBeenPwned using k-anonymity: only the
// first 5 chars of the SHA-1 hash are sent, never the password. Also rates strength.
// The password is never stored.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'breach-checker',
    name: 'Breach Checker',
    version: '0.1.0',
    description: 'Check if a password has appeared in known breaches (privacy-preserving).',
    icon: '🛡️',
    keywords: ['breach', 'password', 'pwned', 'hibp', 'security', 'leak', 'strength'],
    category: 'Security',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log'],
    hostAccess: true, // fetches api.pwnedpasswords.com
  },

  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },

  commands: {
    async check(p: { password: string }) {
      if (!p.password) return { count: 0, strength: 0 };
      const hash = (await sha1Hex(p.password)).toUpperCase();
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);
      let count = 0;
      try {
        const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        const text = await res.text();
        for (const line of text.split('\n')) {
          const [suf, c] = line.trim().split(':');
          if (suf === suffix) {
            count = parseInt(c, 10) || 0;
            break;
          }
        }
      } catch {
        return { count: -1, strength: strength(p.password) }; // -1 = lookup failed
      }
      return { count, strength: strength(p.password) };
    },
  },
};

async function sha1Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** 0–4 strength score from length and character variety. */
function strength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

export default mod;
