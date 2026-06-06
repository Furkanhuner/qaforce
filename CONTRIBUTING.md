# Contributing to qaforge

Thank you for your interest in contributing! All contributors are welcome.

## Development setup

```bash
git clone https://github.com/your-org/qaforge.git
cd qaforge
pnpm install
pnpm build
pnpm test
```

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add visual regression support
fix: heal locator when role attribute changes
docs: update README quickstart
chore: bump @anthropic-ai/sdk to 0.25
test: add factory.test.ts for OllamaProvider
```

## Workflow

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes and add tests
4. Run `pnpm build && pnpm test && pnpm e2e && pnpm lint`
5. Open a PR — fill in the PR template

## Package structure

| Package | Purpose |
|---------|---------|
| `@qaforge/core` | Config, types, Session |
| `@qaforge/providers` | LLM providers (Anthropic, OpenAI, Ollama) |
| `@qaforge/generator` | NL → Playwright spec |
| `@qaforge/healer` | Self-healing locator agent |
| `@qaforge/cli` | `qaforge` binary |

## Adding a new LLM provider

1. Create `packages/providers/src/<name>.ts` implementing `LLMProvider`
2. Export from `packages/providers/src/index.ts`
3. Add a `case` in `createProvider()` in `factory.ts`
4. Write a unit test in `src/__tests__/factory.test.ts`

## Code style rules

- TypeScript strict — `any` is banned
- Locator priority: `getByRole → getByLabel → getByText → getByTestId → css` — never XPath
- Every generated test must have a `/** @istqb */` metadata block
- No hardcoded model names — always `process.env['AI_MODEL']`
- No secrets in code — always environment variables
