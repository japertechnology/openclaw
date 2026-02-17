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

When GitHub Mode requires TypeScript runtime code, it should follow the [extension pattern](../../extensions/) (`extensions/github/`) rather than embedding code in `src/`. This is enforced by [ADR 0001](adr/0001-runtime-boundary-and-ownership.md), which prohibits GitHub mode workflows from importing `src/**` internals.
