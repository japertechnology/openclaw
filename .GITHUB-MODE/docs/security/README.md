# GitHub Mode Security Foundation

This directory contains the baseline threat modeling artifacts for GitHub mode rollout.

## Documents

- [GitHub trigger trust matrix and threat model](0001-github-trigger-trust-matrix.md)
- [Skills quarantine pipeline for trusted runs](0002-skills-quarantine-pipeline.md)

## Scope

These artifacts define:

- trusted versus untrusted trigger contexts
- threat model boundaries separating host/platform isolation guarantees from in-sandbox malicious logic risks
- abuse cases for planned GitHub mode workflows
- preventive and detective controls required before rollout phases can proceed

## Approval process

Phase 1 and later implementation tasks are enabled only after security artifact approvals are captured in-repo in the approval signoff blocks.

- Phase 1 gate status: ✅ Satisfied (Task 0.3 threat model approvals captured on 2026-02-16).
