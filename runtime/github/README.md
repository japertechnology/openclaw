# GitHub mode runtime contracts

This directory contains Task 1 contract artifacts used by GitHub mode planning and validation.

## Required artifacts

- `manifest.schema.json`: schema contract for the runtime manifest.
- `runtime-manifest.json`: component identifiers, versions, and owners.
- `adapter-contracts.json`: adapter capability and trust gating contracts.
- `command-policy.json`: allowed actions, constraints, and enforcement mode.
- `trust-levels.json`: trust tier definitions and privilege boundaries.
- `parity-matrix.json`: expected parity mapping between installed runtime and GitHub mode.
- `workspace-convergence-map.json`: acceptance criteria and reconciliation signals.

## Task 1 consumption contract

Task 1 implementations must treat these files as required inputs:

1. Load and validate `runtime-manifest.json` against `manifest.schema.json`.
2. Parse and enforce required fields in `command-policy.json`:
   - `policyVersion`
   - `enforcementMode`
   - `allowedActions`
   - `constraints`
3. Parse `parity-matrix.json` and enforce:
   - every mapping has `workflow`, `installedRuntime`, `githubMode`, and `parity`
   - `installed-only` parity rows include both `owner` and `rationale`
4. Parse `workspace-convergence-map.json` and enforce:
   - non-empty `acceptanceCriteria`
   - at least one `reconciliationSignals[]` entry with `required: true`

### Failure behavior

Task 1 must fail fast when any required file is missing or malformed.

- Local validation failure: non-zero exit from `pnpm contracts:github:validate`.
- CI validation failure: the `github-mode-contracts` workflow fails and blocks merge.

## Validation command

Run this check before opening or merging Task 1 changes:

```bash
pnpm contracts:github:validate
```
