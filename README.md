
# BrainrotMaxxing
<img width="2764" height="1535" alt="Brainrot2" src="https://github.com/user-attachments/assets/b14ae31f-35f6-4b28-a3d0-d64f3679e572" />
67

## Features

Tiles and Layouts with Electron.

## Requirements

- macOS
- Node.js 20 or newer
- npm

## Getting Started

```bash
npm install
npm start
```

## Checks

```bash
npm run check
npm run security:scan
```

The check script validates JavaScript syntax and JSON module files. The security scan looks for obvious tracked secrets, private keys, cookie databases, and local env files.

## Build

```bash
npm run build
```

The macOS app is written to `dist/BrainrotMaxxing-darwin-*`. Build artifacts are intentionally ignored by Git.

## Modules

Bundled modules live in `modules/*.json`. User-created modules are stored in the app user data directory and can be managed from the app via **Modules**.

Module types:

- `webview`: a single URL
- `webview-tabs`: a tile with multiple labeled URLs
- `terminal`: a command with optional args and cwd

Use `modules/_TEMPLATE.json` as the file format reference.

## Privacy And Security

BrainrotMaxxing is a local Electron app. It does not intentionally upload layouts, cookies, terminal output, or user modules to a backend controlled by this project.

Sensitive local features:

- Web tiles load third-party sites in Electron `webview` sessions.
- Terminal tiles run local commands with your user permissions.
- The Chrome cookie import helper is optional, local-only, and may request macOS Keychain access to decrypt Chrome cookies before copying matching cookies into this app's Electron session.

Review [PRIVACY.md](PRIVACY.md) before using cookie import or running untrusted module definitions. Report vulnerabilities through [SECURITY.md](SECURITY.md), not public issues.

## Repository Notes

- `node_modules/`, `dist/`, and `BrainrotMaxxing.app` are ignored.
- `.env`, cookie databases, signing keys, certificates, and local browser data are ignored.
- Commit source files, module JSON files, `package.json`, and `package-lock.json`.
- License is not declared yet. Add a `LICENSE` file before publishing publicly if you want others to use or redistribute the project under specific terms.
