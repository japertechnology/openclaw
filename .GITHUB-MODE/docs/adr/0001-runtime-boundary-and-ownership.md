# ADR 0001 Runtime boundary and ownership

- Status: Accepted
- Date: 2026-02-16
- Owners: Runtime maintainers, GitHub mode maintainers
- Decision scope: Installed runtime and GitHub mode architecture boundaries

## Context

OpenClaw now has two execution surfaces:

1. Installed runtime flows (CLI, gateway, channels, and local automation)
2. GitHub mode flows (workflow based automation and repository orchestration)

Without strict boundaries, features can couple across surfaces and create regressions in installed runtime behavior.

## Decision

### Ownership boundaries

- Installed runtime owns:
  - `src/**` runtime and provider execution
  - channel adapters and routing
  - local process lifecycle and CLI runtime semantics
- GitHub mode owns:
  - `.github/workflows/**` GitHub native orchestration
  - `.github/actions/**` reusable workflow action logic
  - `.GITHUB-MODE/**` contracts, policy metadata, docs, scripts, and tests for GitHub mode
- Shared ownership (contract only):
  - machine readable schemas and validators used to verify boundaries

### Allowed shared modules

GitHub mode may depend only on modules that are explicitly boundary safe:

- Contract artifacts in `.GITHUB-MODE/runtime/**`
- Pure utility packages with no runtime side effects and no installed runtime service dependencies
- Shared validation libraries that do not import `src/**` runtime implementations

### Prohibited coupling patterns

The following are prohibited and must fail review:

- GitHub mode workflows or actions importing installed runtime internals from `src/**`
- Installed runtime command paths requiring GitHub workflow outputs to run core behaviors
- Shared modules that perform runtime side effects (network calls, process control, provider auth) at import time
- Any direct branch mutation from privileged workflows outside PR mediated flow

### Coupling examples

Allowed patterns (interface-level reuse):

- A shared package exports pure command schema validators consumed by both installed runtime and GitHub mode.
- GitHub mode adapter implements an orchestration interface and maps it to GitHub workflow/job primitives.
- Contract tests replay the same fixture set against installed runtime and GitHub adapters without importing `src/**` internals.

Prohibited patterns (implementation coupling):

- A workflow action imports `src/agents/pi-embedded-runner` directly to execute runtime loops inside a job.
- A `.GITHUB-MODE/scripts/**` tool imports `src/routing/*` to compute policy decisions instead of using extracted contracts.
- A shared helper package imports installed runtime provider auth modules on load, then is required by GitHub mode checks.

### Guardrails

- Boundary checks must run in CI for changes touching `.github/**`, `.GITHUB-MODE/**`, or `src/**`.
- Reviews for boundary files require CODEOWNERS from both installed runtime and GitHub mode maintainers.

## Consequences

### Positive

- Runtime teams can evolve independently with explicit contracts.
- Security review surface is reduced by deny by default coupling policy.
- Regression risk for installed runtime is lower.

### Tradeoffs

- Additional schema and review overhead for cross boundary changes.
- New shared helpers may require extraction into neutral utility modules.

## Maintainer review checklist

- [ ] Ownership assignment is explicit and current.
- [ ] Allowed shared modules remain narrow and auditable.
- [ ] No prohibited coupling pattern is introduced.
- [ ] CI boundary checks are still mandatory.

## Approval signoff

```governance-signoff
[
  {
    "role": "runtime",
    "github": "@openclaw-runtime-lead",
    "approved_at": "2026-02-18"
  },
  {
    "role": "github-mode",
    "github": "@openclaw-github-mode-lead",
    "approved_at": "2026-02-18"
  }
]
```
