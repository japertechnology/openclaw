# Security lint fixtures

These YAML files are input scenarios for `.GITHUB-MODE/test/github-mode-security-lint.test.ts`.

## Scenario groups

- Safe untrusted-fork patterns.
- Unsafe secret exposure in untrusted contexts.
- Privileged execution without required guards.
- Action pinning/policy-actionability failures.

## Fixture maintenance

- Keep each fixture focused on one primary failure/success signal.
- Use clear file names that describe expected behavior.
- If lint rules evolve, update fixtures and test assertions together.
