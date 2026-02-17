# GitHub Mode

GitHub Mode extends OpenClaw into repository workflows, running assistant behavior directly from repository state while preserving the installed runtime experience.

## Architecture

- [Overview](overview.md) — product and architecture spec
- [The Idea](idea.md) — core thesis, parity target, and interaction model boundaries

## Planning

- [MVP](planning/mvp.md) — minimum viable implementation
- [MVVP](planning/mvvp.md) — minimum viable vision product
- [MVVVP](planning/mvvvp.md) — minimum viable valuable product
- [Implementation Plan](planning/implementation-plan.md) — phased execution plan
- [Implementation Tasks](planning/implementation-tasks.md) — tactical task breakdown
- [Task 0 Analysis](planning/task-0-analysis.md) — Phase 0 impact analysis

## Architecture Decision Records

- [ADR Index](adr/README.md)
- [ADR 0001: Runtime Boundary and Ownership](adr/0001-runtime-boundary-and-ownership.md)
- [ADR 0002: Installed Runtime Non-Regression Guardrails](adr/0002-installed-runtime-non-regression-guardrails.md)

## Security

- [Security Index](security/README.md)
- [Trigger Trust Matrix](security/0001-github-trigger-trust-matrix.md)
- [Skills Quarantine Pipeline](security/0002-skills-quarantine-pipeline.md)

## Analysis

- [Why](analysis/why.md) — rationale for GitHub as runtime platform
- [Magic](analysis/magic.md) — where the LM reasoning lives in the codebase
- [WWWWWH](analysis/wwwwwh.md) — the 5 Ws and 1 H
- [Libraries](analysis/libraries.md) — external dependency inventory
- [Directories](analysis/directories.md) — codebase directory map
- [Non-goals](analysis/non-goals.md) — task classes that should stay outside GitHub Mode

## Writing Style for GitHub Mode Docs

When describing local mode risk in this docs area, use **risk-focused, non-dismissive** language:

- State concrete risk classes and operating constraints (for example: secrets exposure, weak isolation, missing governance controls).
- Avoid ridicule, absolutist labels, or language that dismisses existing users and workflows.
- Prefer comparative framing: local mode is appropriate for some contexts, while GitHub mode is designed for stronger control, auditability, and team governance.

## Runtime Contracts

Runtime contract artifacts live in [`runtime/github-mode/`](../../runtime/github-mode/README.md) and are validated by `pnpm contracts:github:validate`.

## Extension Architecture

When GitHub Mode requires TypeScript runtime code, it must follow the [extension pattern](../../extensions/) by implementing that code in `extensions/github/` rather than embedding code in `src/`.

This is a hard boundary, not a preference:

- [ADR 0001](adr/0001-runtime-boundary-and-ownership.md) assigns `src/**` ownership to installed runtime flows and assigns GitHub Mode ownership to `.github/**` orchestration plus `runtime/github-mode/**` contracts.
- ADR 0001 explicitly prohibits GitHub Mode workflows/actions from importing installed runtime internals from `src/**`.
- Existing extensions are the reference implementation for this boundary: new GitHub Mode runtime behavior should mirror extension packaging and dependency isolation instead of creating new `src/**` coupling.

## Upstream Sync Guard

GitHub Mode changes must be purely additive to ensure the fork can cleanly pull upstream OpenClaw upgrades. The `check-upstream-additions-only` script enforces this:

```bash
node --import tsx scripts/github-mode/check-upstream-additions-only.ts
```

This runs automatically in the [`github-mode-contracts`](../../.github/workflows/github-mode-contracts.yml) CI workflow for PRs touching GitHub Mode paths.

**Owned paths** (safe to add or modify):

- `docs/github-mode/**`
- `runtime/github-mode/**`
- `.github/workflows/github-mode-*`
- `scripts/github-mode/**`
- `test/github-mode/**`

Everything else is upstream-owned. Modifications to upstream files will fail the guard.

## Maintenance During Ongoing Development

These docs are designed to withstand continuous OpenClaw core evolution by following three isolation principles:

1. **No `src/` import coupling.** GitHub Mode docs reference `src/` paths only descriptively (in analysis snapshots). No doc tooling, validation, or navigation depends on `src/` internal structure. When `src/` paths change, update the analysis snapshots but nothing else breaks.

2. **Contract-first validation.** Runtime contracts in `runtime/github-mode/` are the only machine-validated artifacts. The validation script (`scripts/github-mode/validate-github-runtime-contracts.ts`) checks contract structure, not doc prose. This means core refactors do not break doc validation.

3. **Analysis snapshots are explicitly dated.** `analysis/directories.md` and `analysis/libraries.md` are point-in-time snapshots with staleness notes. Regenerate them when the codebase structure or dependency set changes materially.

When touching these docs during core development:

- Keep internal links relative (not root-relative) so they resolve on GitHub without Mintlify navigation.
- Do not add `src/` imports or runtime dependencies to validation scripts.
- Update analysis snapshots only when relevant structure changes; do not block unrelated PRs on snapshot freshness.
