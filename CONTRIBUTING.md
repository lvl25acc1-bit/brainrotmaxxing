# Contributing

## Development

```bash
npm install
npm start
```

Run checks before opening a pull request:

```bash
npm run check
npm run security:scan
```

## Pull Requests

- Keep changes focused.
- Do not commit `node_modules/`, `dist/`, or packaged `.app` files.
- Do not commit `.env` files, cookie databases, browser profiles, API keys, private keys, signing certificates, or personal app data.
- Include module JSON changes when adding bundled modules.
- Update `README.md` when changing user-facing behavior.
- Explain security impact when touching webviews, terminal spawning, IPC, cookie import, or persistent storage.

## Security Issues

Do not open public issues for vulnerabilities. Follow `SECURITY.md` and use a private report path.
