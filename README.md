# ExtensionUltima

A modular, encryption-first "ultimate extension": one host that loads many sub-extension
modules, all running on a shared, security-focused core. See [`CLAUDE.md`](./CLAUDE.md) for
the standing rules and [`MODULE_LOG.md`](./MODULE_LOG.md) for the module registry.

## Architecture

```
src/
  core/                 thin, security-owning core
    crypto/             encryption engine (AES-GCM), KDF (PBKDF2), encoding
    keyvault/           master-key lifecycle (envelope encryption, in-memory DEK)
    storage/            SecureStore — encrypted-at-rest key/value with encrypted key index
    modules/            module contract + registry/loader (capability least-privilege)
    browser.ts          single WebExtension API entry (webextension-polyfill)
    log.ts              security-aware logger (never logs secrets)
    core.ts             wires it all together
  background/           service worker / background script — boots the core
  ui/popup/             unlock UI
  modules/<id>/         sub-extension modules (one folder each)
build/build.mjs         cross-browser build → dist/<chrome|firefox|edge|safari>/
```

### Security model
- **Envelope encryption.** A random 256-bit Data Encryption Key (DEK) encrypts all data.
  The DEK is wrapped by a Key Encryption Key (KEK) derived from your master passphrase
  (PBKDF2-SHA256). Only the wrapped DEK and non-secret params touch disk.
- **In-memory only.** On unlock, the DEK is unwrapped into a **non-extractable** key held
  only in the background worker's memory. Locking — or the worker being evicted — discards it.
- **Encrypted at rest, always.** Values and their logical key names are encrypted; on-disk
  record keys are opaque random ids.
- **Least privilege.** Each module gets a namespaced store and only the capabilities it
  declares; undeclared capabilities throw on use.

## Build & load

```sh
npm install
npm run typecheck   # type-check the whole source tree
npm run build       # emit dist/chrome, dist/firefox, dist/edge, dist/safari
```

Then load the unpacked extension from the matching folder:
- **Chrome/Edge:** `chrome://extensions` → enable Developer mode → *Load unpacked* → `dist/chrome`.
- **Firefox:** `about:debugging` → This Firefox → *Load Temporary Add-on* → `dist/firefox/manifest.json`.

First time you open the popup, the passphrase you enter **initializes** the vault. After
that, the same passphrase unlocks it.

## Launcher, triggers & capabilities

- **Launcher popup.** After unlock, the popup is a search-driven launcher: type to filter,
  scroll **Pinned / Most used / All**, and pin (📌) your favourites. Pins and usage counts
  are stored encrypted. Modules with `hasPanel: true` open a config panel; register the
  panel in `src/ui/popup/panels.ts`.
- **Activity manager.** The launcher shows a **Running now** panel at the top listing every
  active automation across all modules. It groups jobs **by tab/site** (or by module — toggle),
  with collapsible sections, a filter box, and a scroll area so long lists stay manageable.
  Each job has a **live countdown**, **pause/resume** (⏸/▶), and **stop** (⏹); groups and the
  whole panel have a **Stop all**. Module rows also show a "running" badge or an enabled-state
  summary. A module surfaces its state by exposing a `status` command returning `{ active, summary }`.
- **Triggers & scopes.** A module asks `ctx.triggers.schedule({ action, trigger, scope })`
  to run work later. **Trigger:** `manual` · `interval` (with optional random range) ·
  `schedule` (times of day). **Scope:** `tab` · `url` · `domain` · `all-tabs` · `window`.
  Jobs persist encrypted and resume on unlock.
- **Capabilities (least privilege).** A module receives only the `ctx.*` services it
  declares: `storage`, `log`, `tabs`, `triggers`, `scripting`, `notifications`. Anything
  undeclared throws on use.

## Modules

Each is single-purpose with its own small panel; they share the trigger/scope framework and
the popup controls in `src/ui/popup/controls.ts`.

- **Auto Refresh** (`src/modules/auto-refresh/`) — reload tabs on an interval (random range,
  cache-bypass, scroll-position memory) or at scheduled times; settings remembered per URL.
- **Keep Alive** (`src/modules/keep-alive/`) — light activity (plus an optional click) to
  stop sessions timing out. Never reloads.
- **Auto Click** (`src/modules/auto-click/`) — click a CSS-selected element on a timer/schedule.
- **Page Watch** (`src/modules/page-watch/`) — notify when given text appears on a page.

Page features (`auto-click`, scroll memory, keep-alive, text scan) use `scripting` injection;
each module keeps its self-contained injected functions in its own `inject.ts`.

### Background execution
Automations run from the background worker. Two mechanisms keep them firing when the popup is
closed and the worker is evicted:
- **Session key cache** — the DEK is held in `storage.session` (RAM only, never disk, cleared
  on browser close), so a restarted worker resumes without re-prompting. On browser restart
  the cache is gone and the vault asks for the passphrase again.
- **Alarm-driven scheduler** — jobs carry a persisted absolute next-fire time and a 30s tick
  alarm wakes the worker to fire due jobs, so timing survives eviction (≤30s granularity when
  the worker isn't kept warm) instead of resetting.

> Permissions: the build requests `<all_urls>` host access at install so automations work
> on every site without per-site prompts. Page injection also needs `scripting`. To tighten
> this later, switch to `optional_host_permissions` and request per-site on demand.

## Adding a module
1. Create `src/modules/<id>/index.ts` exporting an `ExtensionModule`. Copy a close example:
   `notes` (data + status), `auto-refresh` (timer jobs), or `auto-mute` (per-site effect with
   `activity`/`stopActivity`).
2. Fill the manifest: `icon`, `keywords`, `category`, `hasPanel`, `browsers` (Rule 4),
   `capabilities`. Use only the declared `ctx.*` services.
3. Register it in `src/core/core.ts`. If it has a panel, add `src/modules/<id>/panel.ts`
   and register it in `src/ui/popup/panels.ts`.
4. Surface it in the Activity dashboard via triggers, `activity`/`stopActivity`, or `status`
   (Rule 5).
5. Add a row to [`MODULE_LOG.md`](./MODULE_LOG.md) (Rule 1).

## Security roadmap
- Argon2id KDF (WASM) as an upgrade from PBKDF2.
- Per-module capability manifests enforced at registration.
- Optional auto-lock timeout and re-encryption on passphrase change.
- Integrity-verified module loading.
