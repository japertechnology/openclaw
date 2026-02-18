# GitHub Mode scripts

Automation scripts for GitHub Mode policy checks, contract validation, and workflow guardrails.

## Script categories

- Contract validation (`validate-github-runtime-contracts.ts`).
- Security and policy linting (`github-mode-security-lint.ts`, `lint-github-mode-workflows.ts`).
- Environment and credential guardrails (`verify-github-environments.ts`, `check-github-mode-oidc-credentials.ts`).
- Upstream safety checks (`check-upstream-additions-only.ts`).

## Usage

Run scripts through project commands when available (for consistent tooling and CI parity), for example:

```bash
pnpm contracts:github:validate
```

## Authoring guidance

- Keep script output actionable (clear failure reason + next step).
- Prefer deterministic checks; avoid network dependencies unless required.
- Coordinate script changes with tests in `.GITHUB-MODE/test/`.
