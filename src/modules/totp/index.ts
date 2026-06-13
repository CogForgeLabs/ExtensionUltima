// Authenticator — generates TOTP (2FA) codes. Secrets are stored in the encrypted vault
// and only used in memory to compute the current code.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { secondsRemaining, totp, type TotpAlgorithm } from './totp';

interface Account {
  id: string;
  label: string;
  issuer?: string;
  secret: string;
  digits?: number;
  period?: number;
  algorithm?: TotpAlgorithm;
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'totp',
    name: 'Authenticator',
    version: '0.1.0',
    description: 'Generate 2FA (TOTP) codes; secrets stored encrypted.',
    icon: '🔐',
    keywords: ['2fa', 'totp', 'authenticator', 'otp', 'code', 'two factor', 'mfa'],
    category: 'Security',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log'],
  },

  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const n = (await load()).length;
      return { active: n > 0, summary: `${n} account${n === 1 ? '' : 's'}` };
    },
    async list() {
      const accounts = await load();
      return Promise.all(
        accounts.map(async (a) => ({
          id: a.id,
          label: a.label,
          issuer: a.issuer ?? '',
          period: a.period ?? 30,
          remaining: secondsRemaining(a.period ?? 30),
          code: await safeCode(a),
        })),
      );
    },
    async add(p: { label: string; issuer?: string; secret: string; digits?: number; period?: number; algorithm?: TotpAlgorithm }) {
      if (!p.secret?.trim()) throw new Error('A secret is required.');
      // Validate the secret produces a code before saving.
      await totp(p.secret, { digits: p.digits, period: p.period, algorithm: p.algorithm });
      const accounts = await load();
      accounts.push({
        id: randomId(),
        label: p.label || 'Account',
        issuer: p.issuer,
        secret: p.secret.replace(/\s/g, ''),
        digits: p.digits,
        period: p.period,
        algorithm: p.algorithm,
      });
      await ctx.storage.put('accounts', accounts);
      return { ok: true };
    },
    async remove(p: { id: string }) {
      await ctx.storage.put('accounts', (await load()).filter((a) => a.id !== p.id));
      return { ok: true };
    },
  },
};

async function safeCode(a: Account): Promise<string> {
  try {
    return await totp(a.secret, { digits: a.digits, period: a.period, algorithm: a.algorithm });
  } catch {
    return 'ERR';
  }
}

async function load(): Promise<Account[]> {
  return (await ctx.storage.get<Account[]>('accounts')) ?? [];
}

function randomId(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export default mod;
