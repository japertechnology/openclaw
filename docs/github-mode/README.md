# GitHub Mode

GitHub Mode extends OpenClaw into repository workflows, running assistant behavior directly from repository state while preserving the installed runtime experience.

## Architecture

- [Overview](overview.md) — product and architecture spec
- [The Idea](the-idea.md) — core thesis and design principles

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

## Analysis

- [Why](analysis/why.md) — rationale for GitHub as runtime platform
- [Magic](analysis/magic.md) — where the LM reasoning lives in the codebase
- [WWWWWH](analysis/wwwwwh.md) — the 5 Ws and 1 H
- [Libraries](analysis/libraries.md) — external dependency inventory
- [Directories](analysis/directories.md) — codebase directory map

## Runtime Contracts

Runtime contract artifacts live in [`runtime/github/`](../../runtime/github/README.md) and are validated by `pnpm contracts:github:validate`.

## Extension Architecture

When GitHub Mode requires TypeScript runtime code, it must follow the [extension pattern](../../extensions/) by implementing that code in `extensions/github/` rather than embedding code in `src/`.

This is a hard boundary, not a preference:

- [ADR 0001](adr/0001-runtime-boundary-and-ownership.md) assigns `src/**` ownership to installed runtime flows and assigns GitHub Mode ownership to `.github/**` orchestration plus `runtime/github/**` contracts.
- ADR 0001 explicitly prohibits GitHub Mode workflows/actions from importing installed runtime internals from `src/**`.
- Existing extensions are the reference implementation for this boundary: new GitHub Mode runtime behavior should mirror extension packaging and dependency isolation instead of creating new `src/**` coupling.

## Maintenance During Ongoing Development

These docs are designed to withstand continuous OpenClaw core evolution by following three isolation principles:

1. **No `src/` import coupling.** GitHub Mode docs reference `src/` paths only descriptively (in analysis snapshots). No doc tooling, validation, or navigation depends on `src/` internal structure. When `src/` paths change, update the analysis snapshots but nothing else breaks.

2. **Contract-first validation.** Runtime contracts in `runtime/github/` are the only machine-validated artifacts. The validation script (`scripts/validate-github-runtime-contracts.ts`) checks contract structure, not doc prose. This means core refactors do not break doc validation.

3. **Analysis snapshots are explicitly dated.** `analysis/directories.md` and `analysis/libraries.md` are point-in-time snapshots with staleness notes. Regenerate them when the codebase structure or dependency set changes materially.

When touching these docs during core development:

- Keep internal links relative (not root-relative) so they resolve on GitHub without Mintlify navigation.
- Do not add `src/` imports or runtime dependencies to validation scripts.
- Update analysis snapshots only when relevant structure changes; do not block unrelated PRs on snapshot freshness.
