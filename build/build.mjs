// Cross-browser build: bundles the TypeScript source once per target and emits a
// ready-to-load WebExtension package under dist/<target>/ (Rule 4 in CLAUDE.md).
import { build } from 'esbuild';
import { mkdir, writeFile, copyFile, rm } from 'node:fs/promises';

const VERSION = '0.1.0';

// Minimal valid 1x1 PNG, written to each package as icon.png so the action and
// notifications have an icon without shipping a binary asset in source.
const ICON_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Shared manifest fields. Per-target overrides below handle the real differences
// (MV3 service_worker vs background.scripts, gecko settings, etc.).
const base = {
  manifest_version: 3,
  name: 'ExtensionUltima',
  version: VERSION,
  description: 'Modular, encryption-first ultimate browser extension.',
  icons: { 16: 'icon.png', 48: 'icon.png', 128: 'icon.png' },
  action: { default_title: 'ExtensionUltima', default_popup: 'popup.html', default_icon: 'icon.png' },
  // Explicit MV3 CSP: only first-party scripts, no remote code, no objects.
  content_security_policy: { extension_pages: "script-src 'self'; object-src 'self'" },
  // Required at install: only what the core itself needs — the encrypted vault ('storage',
  // incl. storage.session) and the scheduler keepalive ('alarms'). Everything else is
  // OPTIONAL and requested per-tool, at the moment a tool is enabled (see PermissionManager).
  permissions: ['storage', 'alarms'],
  // Granted on demand. Browser permissions are extension-global, so once a tool grants one it
  // is shared by every other tool that needs it — requested once, never twice.
  optional_permissions: ['tabs', 'scripting', 'notifications', 'cookies', 'sessions', 'downloads', 'contextMenus'],
  optional_host_permissions: ['<all_urls>'],
  // Keyboard shortcut slots (assign keys at the browser's shortcuts page) + omnibox keyword.
  commands: {
    'eu-1': { description: 'ExtensionUltima: run hotkey 1' },
    'eu-2': { description: 'ExtensionUltima: run hotkey 2' },
    'eu-3': { description: 'ExtensionUltima: run hotkey 3' },
    'eu-4': { description: 'ExtensionUltima: run hotkey 4' },
  },
  omnibox: { keyword: 'eu' },
};

// The New-Tab Dashboard is OPT-IN: it does NOT replace your new tab page by default (you can
// open it on demand). To make it your real new-tab page, build with EU_NEWTAB=1.
if (process.env.EU_NEWTAB === '1') {
  base.chrome_url_overrides = { newtab: 'newtab.html' };
}

const targets = {
  chrome: {
    ...base,
    background: { service_worker: 'background.js' },
  },
  edge: {
    ...base,
    background: { service_worker: 'background.js' },
  },
  firefox: {
    ...base,
    // Firefox MV3 uses an event-page style background script list.
    background: { scripts: ['background.js'] },
    browser_specific_settings: {
      gecko: { id: 'extensionultima@local', strict_min_version: '115.0' },
    },
  },
  safari: {
    ...base,
    background: { service_worker: 'background.js' },
  },
};

const entries = [
  { in: 'src/background/index.ts', out: 'background.js' },
  { in: 'src/ui/popup/popup.ts', out: 'popup.js' },
  { in: 'src/ui/newtab/newtab.ts', out: 'newtab.js' },
];

async function bundle(entry, outfile) {
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'iife', // works as both an MV3 service worker and a classic background script
    platform: 'browser',
    target: 'es2022',
    sourcemap: true,
    legalComments: 'none',
    logLevel: 'warning',
  });
}

for (const [name, manifest] of Object.entries(targets)) {
  const out = `dist/${name}`;
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  for (const e of entries) await bundle(e.in, `${out}/${e.out}`);
  await copyFile('src/ui/popup/popup.html', `${out}/popup.html`);
  await copyFile('src/ui/newtab/newtab.html', `${out}/newtab.html`);
  await writeFile(`${out}/icon.png`, Buffer.from(ICON_PNG_B64, 'base64'));
  await writeFile(`${out}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`built dist/${name}`);
}

console.log('\nAll targets built. Load an unpacked extension from the matching dist/<browser> folder.');
