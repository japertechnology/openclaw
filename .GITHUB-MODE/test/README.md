# GitHub Mode tests

This directory contains targeted tests for GitHub Mode contracts and policy enforcement.

## Coverage focus

- Runtime contract validation behavior.
- Upstream-additive change guardrails.
- GitHub workflow security lint behavior.

## Running tests

You can run focused tests with Vitest patterns or paths, for example:

```bash
pnpm test -- .GITHUB-MODE/test/validate-github-runtime-contracts.test.ts
```

## Test design notes

- Keep tests behavior-oriented.
- Use fixtures in `test/fixtures/` for readable policy and regression scenarios.
- Prefer explicit assertions over snapshot-only checks for guardrail logic.
