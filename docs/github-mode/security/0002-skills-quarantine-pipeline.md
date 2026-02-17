# Skills Quarantine Pipeline for Trusted GitHub Mode

This document defines how skills move from intake to production availability in GitHub mode.

## Goal

Only vetted skills can run in **trusted** GitHub mode workflows. Unvetted or revoked skills must be blocked from production GitHub mode runs.

## Pipeline

### 1) Intake

Inputs can come from:

- bundled OpenClaw skills
- managed skills mirrored from approved internal sources
- external submissions approved for evaluation

Every intake submission must include:

- immutable source reference (repo URL + commit SHA or release artifact digest)
- declared maintainers
- declared runtime dependencies and network needs
- intended trust tier usage (`untrusted`, `semi-trusted`, `trusted`)

The intake workflow stores the submission in a **quarantine registry** namespace and marks it `pending_scan`.

### 2) Static scan

Quarantined skills are scanned before policy review:

- integrity checks (digest/signature verification, lockfile consistency)
- malware and suspicious pattern scanning
- license and provenance checks
- dependency risk checks against allow/deny lists

Scan output is attached as an immutable artifact (scan report + evidence bundle). Failing scans transition the skill to `rejected_scan`.

### 3) Policy evaluation

Passing scan artifacts are evaluated against GitHub mode security policy:

- tool and capability surface (filesystem, network, process spawn, external API)
- data handling constraints (secrets handling, artifact/log safety)
- trust-tier compatibility (`trusted` requires stricter controls)
- operational controls (owner assignment, update cadence, rollback readiness)

Policy outcomes:

- `approved_limited` (allowed only in non-trusted contexts)
- `approved_trusted` (allowed in trusted GitHub mode runs)
- `rejected_policy`

### 4) Approval + publish to trusted registry

Only skills with `approved_trusted` can be published to the **trusted registry** used by production GitHub mode workflows.

Publish requirements:

- approval record with approver identities and timestamps
- referenced scan and policy artifacts
- immutable version pin (digest/SHA)
- SBOM/provenance attachment

Production trusted workflows resolve skills exclusively from this trusted registry.

## Production enforcement

Trusted GitHub mode workflows must:

- enforce an allowlist keyed by immutable skill digest/SHA
- fail closed when a skill is missing approval metadata
- block runtime fetch from non-trusted registries
- emit attestations listing loaded skill versions and digests

Result: only vetted skills are available to production GitHub mode runs.

## Approval authority

Approvals for `approved_trusted` require **two-party authorization**:

1. **Security approver** (member of the security code owners group for GitHub mode security artifacts)
2. **Runtime owner approver** (member of the GitHub mode runtime owners group)

Minimum rules:

- approvers must be distinct people
- approvers cannot approve their own submitted skill version
- approvals expire on skill version change; every new version repeats the pipeline

## Emergency revocation

Emergency revocation is a fast-path deny action for suspected compromise or policy breach.

### Revocation triggers

- confirmed malicious behavior
- newly disclosed critical dependency vulnerability
- provenance/signature mismatch
- unauthorized behavior in production run evidence

### Revocation actions

1. Mark skill digest/version as `revoked` in registry metadata.
2. Remove digest/version from trusted allowlist.
3. Trigger cache invalidation for GitHub mode runners.
4. Broadcast incident notice to owners and security channel.
5. Open incident tracking issue with mitigation and re-approval criteria.

### Revocation authority

Either of the following can initiate immediate revocation:

- a security incident commander/on-call security lead
- a repository admin from the GitHub mode maintainers group

Revocation is immediate; restoration requires full re-intake, re-scan, re-evaluation, and dual approval.
