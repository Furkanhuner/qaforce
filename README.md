# qaforge

> AI-powered QA test automation framework — ISTQB-aligned, provider-independent, self-healing.

**Stack:** TypeScript · Playwright · Anthropic Claude (default) · role-based locators  
**Phase 0 (current):** NL → test generation + Playwright runner + HTML report  
**Roadmap:** Self-healing · Planner/crawl · Risk Engine · Visual regression · MCP server

---

## Quickstart (60 seconds)

```bash
# 1. Install dependencies
pnpm install

# 2. Build all packages
pnpm build

# 3. Install Playwright browsers
pnpm exec playwright install --with-deps

# 4. Run the pre-written demo (no API key needed)
pnpm e2e

# 5. View the HTML report
pnpm qaforge report
```

### Generate a test with AI (requires ANTHROPIC_API_KEY)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pnpm qaforge init          # creates qa.config.ts + playwright.config.ts + tests/
pnpm qaforge generate "User can log in with valid email and password; empty password shows an error (BVA + EP)"
pnpm qaforge run           # runs the generated test
pnpm qaforge report        # opens the HTML report
```

---

## CLI reference

| Command | Description | ISTQB phase |
|---------|-------------|-------------|
| `qaforge init` | Scaffold `qa.config.ts` + `playwright.config.ts` + `tests/` | Planning |
| `qaforge generate "<prompt>"` | NL → `*.spec.ts` with ISTQB metadata + role-based locators | Design |
| `qaforge run [--project name] [--shard k/n]` | Run Playwright tests (HTML report) | Execution |
| `qaforge report` | Open the HTML report | Completion |
| `qaforge explore` | *(Phase 2)* Crawl app → workflow + risk map | Analysis |
| `qaforge heal [--mode auto\|suggest]` | *(Phase 2)* Self-heal broken locators | Maintenance |
| `qaforge visual [--update]` | *(Phase 2)* Visual regression baseline / comparison | Execution |

---

## What makes qaforge different

- **ISTQB-first**: every generated test is tagged with level, type, technique (EP/BVA), and risk score — traceability built in.
- **Role-based locators**: `getByRole → getByLabel → getByText → getByTestId → css` — XPath is last resort. Resilient to UI refactors.
- **Provider-independent**: Anthropic Claude by default; OpenAI and Ollama adapters slot in via `qa.config.ts`.
- **Self-healing (Phase 2)**: broken locators are repaired automatically or surfaced as PRs.
- **Risk-based execution (Phase 2)**: `git diff` + test history → run only the tests that matter.

---

## Configuration (`qa.config.ts`)

```ts
import { defineConfig } from '@qaforge/core';

export default defineConfig({
  project: { name: 'my-project' },
  targets: {
    web: { baseUrl: process.env['WEB_BASE_URL']!, browsers: ['chromium'] },
  },
  ai: {
    provider: 'anthropic',
    model: process.env['AI_MODEL']!,   // pin via env — never hardcode
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
  locators: { strategy: ['role', 'label', 'testId', 'text'], selfHeal: 'suggest' },
  istqb: { traceability: true, techniques: ['BVA', 'EP'] },
});
```

---

## License

MIT © Furkan Hüner
