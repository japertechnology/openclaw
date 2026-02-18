# GitHub Mode planning docs

This folder contains implementation planning artifacts for GitHub Mode rollout phases.

## Typical contents

- Phase plans (`mvp.md`, `mvvp.md`, `mvvvp.md`).
- Task breakdowns (`implementation-tasks.md`).
- Supporting plan narratives and historical plans.

## Planning expectations

- Keep plans actionable and testable.
- Explicitly call out dependencies, risks, and completion criteria.
- When plans change materially, update related task docs in the same PR.

## Relationship to execution

Planning docs should map to concrete checks in scripts/tests/workflows under `.GITHUB-MODE/` so progress is verifiable in CI.
