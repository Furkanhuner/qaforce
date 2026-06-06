# AGENTS.md

Instructions for AI coding agents (Codex, Claude Code, Cursor, etc.) working in this repo.

## Build & Test

```bash
pnpm install          # install all workspace dependencies
pnpm build            # compile all packages (tsup → CJS)
pnpm test             # Vitest unit tests (no real API calls)
pnpm lint             # ESLint + Prettier check
pnpm e2e              # Playwright e2e against examples/demo-app
```

## Conventions

- **TypeScript strict** throughout. `any` is banned — ESLint will error.
- **Locator rule**: `getByRole` → `getByLabel` → `getByText` → `getByTestId` → `css`. XPath is last resort.
- **Every generated test** must have a `/** @istqb ... */` metadata block.
- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `test:`.
- **Secrets**: never commit API keys or tokens. All credentials flow through environment variables.
- **Model names**: never hardcode — always via `process.env['AI_MODEL']`.

## Package structure

```
packages/
  core/           — defineConfig, types, Session, config loader
  providers/      — LLMProvider interface + Anthropic (full), OpenAI/Ollama (stubs)
  agents/
    generator/    — NL prompt → Playwright spec renderer
  cli/            — commander-based CLI (qaforge binary)
examples/
  demo-app/       — self-contained login form + pre-written spec
```

## Adding a new provider

1. Create `packages/providers/src/<name>.ts` implementing `LLMProvider`.
2. Export from `packages/providers/src/index.ts`.
3. Add a case to `createProvider()` in `factory.ts`.
4. Write a unit test in `src/__tests__/factory.test.ts`.

## Adding a new agent (Phase 2+)

1. Create `packages/agents/<name>/` with its own `package.json` + `tsconfig.json`.
2. Use types from `@qaforge/core`; return results compatible with `RunResult` or `TestArtifact`.
3. Wire up a new CLI command in `packages/cli/src/commands/`.
4. Add to `pnpm-workspace.yaml` if not already covered by the `packages/**` glob.
