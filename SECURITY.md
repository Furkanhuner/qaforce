# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.x     | Yes       |

## Reporting a vulnerability

**Please do not report security vulnerabilities via public GitHub issues.**

Email: hunerfurkan@gmail.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

You will receive a response within 48 hours. We will work with you to understand and address the issue before public disclosure.

## Security model

- **API keys**: qaforge never logs, stores, or transmits API keys. All credentials are read from environment variables at runtime only.
- **Locator store**: `locator-store.json` is a local file. It contains only locator strings and URLs — no secrets.
- **Browser automation**: qaforge only navigates to URLs you explicitly provide in `qa.config.ts` or via CLI flags.
- **LLM data**: Page accessibility snapshots are sent to your configured LLM provider. Do not run qaforge against pages containing sensitive personal data.
