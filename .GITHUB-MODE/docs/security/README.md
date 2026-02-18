# GitHub Mode Security Foundation

This directory contains the baseline threat modeling artifacts for GitHub mode rollout.

## Documents

- [GitHub trigger trust matrix and threat model](0001-github-trigger-trust-matrix.md)
- [Skills quarantine pipeline for trusted runs](0002-skills-quarantine-pipeline.md)
- [Secrets inventory and rotation standard](0003-secrets-inventory-and-rotation.md)

## Environment protection baseline (Task 2.2)

Task 2.2 is enforced by `.GITHUB-MODE/scripts/verify-github-environments.ts` and CI workflow `.github/workflows/github-mode-security.yml`.

Required environments and exact expected settings:

### `github-mode-dev`

- Required reviewers protection rule enabled.
- At least **1 reviewer**.
- `prevent_self_review=true`.
- Deployment branch policy shape:
  - `protected_branches=false`
  - `custom_branch_policies=true`
- Allowed deployment branch/tag policies:
  - branch `github-mode/dev`
  - tag `github-mode-dev-*`

### `github-mode-staging`

- Required reviewers protection rule enabled.
- At least **1 reviewer**.
- `prevent_self_review=true`.
- Deployment branch policy shape:
  - `protected_branches=false`
  - `custom_branch_policies=true`
- Allowed deployment branch/tag policies:
  - branch `github-mode/staging`
  - tag `github-mode-staging-*`

### `github-mode-prod`

- Required reviewers protection rule enabled.
- At least **2 reviewers**.
- Reviewer types must include at least one **User** and one **Team** reviewer.
- `prevent_self_review=true`.
- Deployment branch policy shape:
  - `protected_branches=false`
  - `custom_branch_policies=true`
- Allowed deployment branch/tag policies:
  - branch `main`
  - tag `v*`

Any missing environment or policy drift fails CI.

## Scope

These artifacts define:

- trusted versus untrusted trigger contexts
- threat model boundaries separating host/platform isolation guarantees from in-sandbox malicious logic risks
- abuse cases for planned GitHub mode workflows
- preventive and detective controls required before rollout phases can proceed

## Approval process

Phase 1 and later implementation tasks are enabled only after security artifact approvals are captured in-repo in the approval signoff blocks.

- Phase 1 gate status: ✅ Satisfied (Task 0.3 threat model approvals captured on 2026-02-16).
