# Security Policy

## Supported Versions

This project is an experimental Electron app. Security fixes should target the latest commit on `main`.

## Reporting a Vulnerability

Please do not open a public GitHub issue for a suspected vulnerability.

Report security issues privately through GitHub Security Advisories for this repository. Include:

- The affected commit or release
- Steps to reproduce
- Impact and what local data or capability is exposed
- Any proof-of-concept code or screenshots needed to verify the issue

If GitHub Security Advisories are not available, contact the repository owner through a private channel and avoid posting exploit details publicly.

## Sensitive Areas

BrainrotMaxxing intentionally includes powerful local features:

- Electron `webview` tiles that load third-party sites
- Terminal tiles that can run local commands configured by the user
- A Chrome cookie import helper for local Google/YouTube login reuse
- Persistent app storage under the Electron user data directory

Treat changes in these areas as security-sensitive. Pull requests touching them should explain the risk model and include `npm run check` plus `npm run security:scan` output.

## Privacy Notes

The Chrome cookie import feature is local-only:

- It reads the local Chrome cookie database on this Mac after user confirmation.
- macOS may prompt for Keychain access to decrypt Chrome cookies.
- Imported cookies are copied into this app's Electron session storage.
- The app does not intentionally upload cookies, tokens, terminal output, or layout data.



