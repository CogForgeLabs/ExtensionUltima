// Passphrase Generator — memorable diceware-style passphrases using a built-in wordlist and
// cryptographically-random selection.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

// Compact wordlist (128 short, common words → 7 bits of entropy per word).
const WORDS =
  'able acid aged also area army away baby back ball band bank base bath bear beat been bell belt bird blue boat body bone book born both bowl bulk burn bush busy cake calm card care cart cash cell chat chip city clay coal coat code coin cold cook cool cope copy cord core corn cost crew crop dark data date dawn days dead deal dean dear debt deck deep deer disk dish does done door dose down draw drew drop drum dual duke dust duty each earn east easy edge else even ever face fact fail fair fall farm fast fate fear feed feel feet fell felt file fill film find fine fire firm fish five flag flat flow food foot ford form fort four free frog fuel full fund gain game gate gave gear gene gift girl give glad goal goat gold golf gone good gray grew grey grid grow gulf hair half hall hand hang hard harm hate have head'.split(
    ' ',
  );

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'passphrase-generator',
    name: 'Passphrase Generator',
    version: '0.1.0',
    description: 'Generate strong, memorable passphrases.',
    icon: '🎲',
    keywords: ['passphrase', 'password', 'diceware', 'generate', 'random', 'memorable'],
    category: 'Security',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log'],
  },
  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },
  commands: {
    generate(p: { words?: number; separator?: string }) {
      const count = Math.max(3, Math.min(12, p.words ?? 5));
      const sep = p.separator ?? '-';
      const rnd = new Uint32Array(count);
      crypto.getRandomValues(rnd);
      const picked = Array.from(rnd, (r) => WORDS[r % WORDS.length]);
      const bits = Math.round(count * Math.log2(WORDS.length));
      return { passphrase: picked.join(sep), bits };
    },
  },
};

export default mod;
