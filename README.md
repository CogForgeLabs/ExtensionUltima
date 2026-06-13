# ExtensionUltima

**ExtensionUltima** is a modular, security-first browser extension platform designed to host multiple independent automation and productivity modules under a single encrypted core.

Instead of installing and managing dozens of separate extensions, ExtensionUltima provides one secure host extension with a shared capability framework, encrypted storage, automation engine, and module ecosystem.

## Features

* 🔐 **Encryption-first architecture** — sensitive data is encrypted at rest using envelope encryption.
* 🧩 **Modular design** — add, remove, or develop modules independently.
* ⚡ **Background automation engine** — scheduling, triggers, and activity management built in.
* 🛡️ **Least-privilege security model** — modules only receive capabilities they explicitly declare.
* 🌐 **Cross-browser support** — Chrome, Firefox, Edge, and Safari builds.
* 📦 **Unified launcher UI** — discover, pin, configure, and manage modules from a single interface.
* 🔄 **Persistent automations** — jobs survive service worker restarts and browser background lifecycle events.

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
npm run typecheck
npm run build
```

Generated builds:

```text
dist/
  chrome/
  firefox/
  edge/
  safari/
```

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

This project is licensed under the **CogForgeLabs Non-Commercial Attribution License (CNCAL)**.

Commercial use is prohibited without written permission.

Any public use, redistribution, fork, or derivative work must provide attribution to:

**Cognitive Industries**
cognitive-industries.org

See the `LICENSE` file for complete terms.
