# ExtensionUltima

**ExtensionUltima** is a modular, security-first browser extension platform designed to host multiple independent automation and productivity modules under a single encrypted core.

Instead of installing and managing dozens of separate extensions, ExtensionUltima provides one secure host extension with a shared capability framework, encrypted storage, automation engine, and module ecosystem.

## Features

* 🔐 **Encryption-first architecture** — sensitive data is encrypted at rest using envelope encryption.
* 🧩 **Modular design** — a large, growing library of focused tools; add, remove, or develop modules independently.
* ⚡ **Background automation engine** — scheduling, triggers, and a global activity dashboard built in.
* 🛡️ **Least-privilege, opt-in permissions** — nothing scary at install; each tool requests only what it needs, when you enable it, and permissions are shared once granted.
* 🔒 **Auto-lock** — the vault locks itself after a configurable period of inactivity.
* 🌐 **Cross-browser support** — Chrome, Firefox, Edge, and Safari builds from one codebase.
* 📦 **Unified launcher UI** — search, pin, recent/most-used, and a Running view to see and control everything active.
* 🔄 **Persistent automations** — jobs (and active page effects) survive service-worker eviction and browser lifecycle events.
* 🙅 **No hijacking** — never overrides your new-tab page, search, or homepage unless you explicitly opt in.

---

## Security Model

ExtensionUltima is built around a layered encryption architecture.

### Envelope Encryption

A randomly generated 256-bit Data Encryption Key (DEK) encrypts all stored data.

The DEK is protected by a Key Encryption Key (KEK) derived from your master passphrase using PBKDF2-SHA256. Only the wrapped DEK and non-secret parameters are persisted.

### In-Memory Keys

When unlocked, the DEK exists only in memory as a non-extractable cryptographic key.

Locking the vault or browser worker eviction immediately removes access to encrypted data.

### Encrypted Storage

Both values and logical key names are encrypted before storage.

Persistent records use opaque identifiers rather than plaintext names.

### Least Privilege

Modules receive only the capabilities they explicitly declare.

Attempting to access undeclared functionality results in a runtime error.

### Auto-Lock

The vault locks automatically after a configurable period of inactivity (default 15 minutes),
clearing the in-memory key. The idle check is enforced even across a service-worker
eviction/resume, so it cannot be bypassed by the background lifecycle. Configure it in the
popup under 🛡️ **Security**.

### Opt-In, On-Demand Permissions

The install footprint is intentionally tiny — only `storage` and `alarms`. Every other
capability (`tabs`, `scripting`, host access, `notifications`, `cookies`, `sessions`,
`downloads`, `contextMenus`) is **optional** and requested the moment you enable a tool that
needs it, from a real user gesture. Because browser permissions are extension-global, a
permission granted for one tool is **shared by every other tool** that needs it — you're only
asked once. Review and revoke them anytime under 🛡️ **Security**.

---

## Architecture

```text
src/
  core/
    crypto/
    keyvault/
    storage/
    modules/
    browser.ts
    log.ts
    core.ts

  background/
  ui/popup/
  modules/<id>/

build/
  build.mjs
```

Core responsibilities:

* Cryptography
* Secure storage
* Key management
* Module lifecycle
* Capability enforcement
* Browser abstraction

---

## Build

```bash
npm install
npm run typecheck   # type-check the whole source tree
npm run build       # emit dist/<chrome|firefox|edge|safari>
npm run package     # zip each build into packages/ for store upload
```

Generated builds:

```text
dist/
  chrome/
  firefox/
  edge/
  safari/
```

### Build options

* `EU_NEWTAB=1 npm run build` — opt in to making the dashboard your actual new-tab page.
  By default the new-tab page is **not** overridden (the dashboard opens on demand instead).

---

## Loading the Extension

### Chrome / Edge

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Select **Load unpacked**
4. Choose `dist/chrome`

### Firefox

1. Open `about:debugging`
2. Select **This Firefox**
3. Click **Load Temporary Add-on**
4. Select `dist/firefox/manifest.json`

---

## First Launch

The first passphrase entered initializes a new encrypted vault.

After initialization, the same passphrase is required to unlock and access encrypted module data.

Tools that need browser permissions (e.g. page access for injection, cookies, downloads)
show an **Enable** prompt the first time you open them, listing exactly what they need. Granting
is one-time and shared across tools.

---

## Activity Manager

ExtensionUltima includes a centralized activity dashboard for all running automations.

Features include:

* Running job overview
* Site and tab grouping
* Module grouping
* Live countdown timers
* Pause and resume controls
* Individual stop controls
* Global stop-all actions
* Search and filtering

Module status is surfaced through a standardized status interface.

---

## Trigger Framework

Modules can schedule work through a unified trigger system.

### Trigger Types

* Manual
* Interval
* Randomized Interval
* Scheduled Time

### Scopes

* Current Tab
* URL
* Domain
* All Tabs
* Window

Jobs are stored encrypted and automatically restored when unlocked.

---

## Module Library

ExtensionUltima ships a broad library of focused tools (50+), grouped by category. A sample:

* **Automation** — Auto Refresh, Auto Click, Keep Alive, Page Watch, Scheduled Opener
* **Tabs** — Tab Switcher, Session Saver, Tab Suspender, Snooze Tab, Recently Closed, Copy Tab URLs, Merge Windows, Auto Mute
* **Security** — Password Vault, Authenticator (2FA/TOTP), Secure Notes, Bookmark Vault, Breach Checker, Passphrase Generator
* **Privacy** — Cookie Cleaner, URL Cleaner, Ephemeral Notes, Incognito Opener
* **Page** — Dark Mode, Reader Mode, Element Zapper, Web Highlighter, Sticky Notes, Find & Replace, Auto-Scroll, Selection Toolbar, Text Expander
* **Media** — Video Speed, Picture-in-Picture, Volume Booster
* **Monitoring** — Change Monitor, Uptime Monitor
* **Focus** — Pomodoro, Reminders, Site Blocker, Time Tracker, Habit Tracker
* **Utilities** — QR Code, Read Aloud, Screenshot, Image Downloader, Clipboard Manager
* **Power** — Hotkeys, Context-Menu Actions, Address-bar Commands, New-Tab Dashboard

Every tool that runs in the background or leaves an ongoing effect appears in the **Running**
view of the Activity dashboard, where it can be paused, stopped, or turned off.

---

## Developing Modules

Creating a module requires:

1. Creating `src/modules/<id>/`
2. Exporting an `ExtensionModule`
3. Declaring required capabilities
4. Registering the module in the core
5. Adding UI panels if required
6. Updating the module registry

Modules are intentionally isolated and should remain focused on a single responsibility.

---

## Project Status

ExtensionUltima is under active development.

Planned improvements include:

* Argon2id key derivation
* Enhanced capability enforcement
* Automatic vault locking
* Passphrase rotation support
* Integrity-verified module loading
* Expanded module ecosystem

---

## License

Copyright © 2026 CogForgeLabs

This work is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0
International License (CC BY-NC-SA 4.0)**.

`SPDX-License-Identifier: CC-BY-NC-SA-4.0`

You are free to **share** and **adapt** the material, under these terms:

* **Attribution** — credit *ExtensionUltima by CogForgeLabs* (cognitive-industries.org), link to the license, and indicate changes.
* **NonCommercial** — not for commercial use without written permission.
* **ShareAlike** — distribute derivatives under the same license.

Full legal code: <https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode>

See the [`LICENSE`](./LICENSE) file for the complete notice.
