Below is a tactical execution breakdown for **Phases 0–7**, with each task mapped to a workstream and paired with concrete acceptance criteria derived from the plan’s deliverables/exit criteria.

---

## Phase 0 — Baseline and Design Locks

Phase 0 status: ✅ Complete (Task 0.1, 0.2, 0.3 accepted on 2026-02-16; see `docs/github-mode/planning/implementation-plan.md` evidence snapshot and `docs/github-mode/planning/task-0-analysis.md`).

### Task 0.1 — Runtime Boundary ADR Package

Status: ✅ Complete.

**Workstream:** WS-A (Runtime contracts and parity)

**Scope:** Author and review ADR(s) that lock installed-runtime vs GitHub-mode boundaries and explicitly define non-regression rules.

**Acceptance Criteria:**

- ADR document set is merged and approved by maintainers.
- Boundaries include ownership, allowed shared modules, and prohibited coupling patterns.
- Backout trigger (“runtime coupling detected”) is documented.

---

### Task 0.2 — Installed Runtime Regression Baseline

Status: ✅ Complete.

**Workstream:** WS-A

**Scope:** Define smoke checks proving installed runtime behavior remains unchanged and wire them into CI.

**Acceptance Criteria:**

- Baseline smoke check suite runs in CI.
- Checks are green on mainline baseline.
- Failing baseline blocks merge for GitHub-mode-touching changes.

---

### Task 0.3 — GitHub Threat Model and Trigger Matrix

Status: ✅ Complete.

**Workstream:** WS-B (GitHub security foundation)

**Scope:** Create trusted/untrusted trigger matrix, abuse cases, and mapped controls for all planned workflows.

**Acceptance Criteria:**

- Threat model approved by maintainers.
- Matrix covers fork PR, internal PR, push, schedule, manual dispatch.
- Every abuse case has at least one mapped preventive/detective control.

**Security Check:** Must encode guardrails that no privileged workflow execution occurs in untrusted contexts and that privileged branch mutation happens only via PR flow.

---

## Cross-cutting Runtime Constraint — GitHub Actions as Stateless Ephemeral Workers

All implementation tasks must treat GitHub Actions runners as **stateless ephemeral workers**. Jobs receive fresh execution environments, and local runner disks are temporary scratch space that cannot be depended on after the run.

### Must be externalized before run start

- **Memory/context:** Any agent memory, durable context, routing state, or policy state required by a run.
- **Artifacts/evidence history:** Prior reports, attestations, summaries, and audit evidence needed for gating or diagnosis.
- **Checkpoints/resume markers:** Long-running evaluation or migration checkpoints, replay markers, and resume tokens.
- **Reusable caches:** Dependency/build/model/data caches intended for cross-run reuse via explicit cache/artifact/registry systems.

### Must not rely on local persistence between runs

- Files created on runner-local disk in earlier runs.
- Previous run temp directories, process memory, or local DB/state files.
- Same host/workspace affinity across runs (runner identity is non-deterministic).
- Any log/output not explicitly exported to durable storage/artifacts.

### Task design requirement

When defining or implementing tasks in Phases 1–7, include where durable state lives, how it is fetched at run start, and how outputs are re-externalized at run end so retries/replays remain deterministic.

---

## Cross-cutting Runtime Constraint — Extension Architecture Boundary

GitHub Mode TypeScript runtime code must follow the extension pattern by implementing code in `extensions/github/` rather than embedding code in `src/`. See `docs/github-mode/README.md` and ADR 0001 for the full boundary rationale.

- GitHub Mode workflows/actions must not import installed runtime internals from `src/**`.
- New GitHub Mode runtime behavior should mirror extension packaging and dependency isolation.
- Violation of this boundary triggers the ADR 0001 backout process.

---

## Cross-cutting Runtime Constraint — Upstream Sync Guard

GitHub Mode changes must be purely additive so the fork can cleanly pull upstream OpenClaw upgrades. The `check-upstream-additions-only` script (`scripts/github-mode/check-upstream-additions-only.ts`) enforces this in CI.

**Owned paths** (safe to add or modify): `docs/github-mode/**`, `runtime/github-mode/**`, `.github/workflows/github-mode-*`, `scripts/github-mode/**`, `test/github-mode/**`.

Everything else is upstream-owned. Modifications to upstream files will fail the guard.

---

## Cross-cutting Scope Constraint — Non-Goals Reference

Task classes that should stay outside GitHub Mode are defined in `docs/github-mode/analysis/non-goals.md`. All task and workflow designs must respect these boundaries:

1. Real-time conversational loops and live operator steering.
2. Device-coupled operations requiring local hardware/IPC.
3. Privileged external side effects without human checkpoints.
4. Secrets regimes exceeding repository trust boundaries.
5. Long-lived mutable runtime state with strict continuity requirements.
6. Untrusted-trigger pathways with high-impact tools.
7. Organization governance actions requiring accountability identity.

When scoping commands or adapters, classify each as `github-native`, `github-gated`, `handoff-required`, or `installed-only` per the operating pattern in `non-goals.md`.

---

## Phase 1 — Contract Scaffolding and Parity Framework

Task 1 readiness: ✅ Ready to commence (all required runtime contracts exist and `pnpm contracts:github:validate` passes).

### Task 1.1 — Contract Schema Implementation

Status: ✅ Complete.

**Workstream:** WS-A

**Scope:** Add `runtime/github-mode/` contract artifacts (`manifest.schema.json`, `runtime-manifest.json`, `adapter-contracts.json`, `command-policy.json`, `trust-levels.json`, entity/collab schemas, convergence map, parity matrix).

**Task 1.1 contract dependencies (implemented):**

- Manifest contract: [`runtime/github-mode/manifest.schema.json`](../../../runtime/github-mode/manifest.schema.json), [`runtime/github-mode/runtime-manifest.json`](../../../runtime/github-mode/runtime-manifest.json)
- Adapter contract: [`runtime/github-mode/adapter-contracts.json`](../../../runtime/github-mode/adapter-contracts.json)
- Policy contract: [`runtime/github-mode/command-policy.json`](../../../runtime/github-mode/command-policy.json)
- Trust contract: [`runtime/github-mode/trust-levels.json`](../../../runtime/github-mode/trust-levels.json)
- Parity contract: [`runtime/github-mode/parity-matrix.json`](../../../runtime/github-mode/parity-matrix.json)
- Convergence contract: [`runtime/github-mode/workspace-convergence-map.json`](../../../runtime/github-mode/workspace-convergence-map.json)
- Entity manifest contract: [`runtime/github-mode/entity-manifest.schema.json`](../../../runtime/github-mode/entity-manifest.schema.json), [`runtime/github-mode/entity-manifest.json`](../../../runtime/github-mode/entity-manifest.json)
- Collaboration policy contract: [`runtime/github-mode/collaboration-policy.schema.json`](../../../runtime/github-mode/collaboration-policy.schema.json), [`runtime/github-mode/collaboration-policy.json`](../../../runtime/github-mode/collaboration-policy.json)
- Collaboration envelope contract: [`runtime/github-mode/collaboration-envelope.schema.json`](../../../runtime/github-mode/collaboration-envelope.schema.json)
- Consumption guide: [`runtime/github-mode/README.md`](../../../runtime/github-mode/README.md)
- Validation hook: [`scripts/github-mode/validate-github-runtime-contracts.ts`](../../../scripts/github-mode/validate-github-runtime-contracts.ts) via `pnpm contracts:github:validate`

**Acceptance Criteria:**

- ✅ All listed files exist with valid schema structure and version markers.
- ✅ Schemas are parseable and used by validators.

---

### Task 1.2 — Contract Validation Engine

Status: ✅ Complete.

**Workstream:** WS-A

**Scope:** Implement schema validators for all runtime contract artifacts.

**Acceptance Criteria:**

- ✅ CI has a mandatory validation check.
- ✅ Invalid schema/data fails CI with actionable error output.
- ✅ Validation covers entity and collaboration schemas, not just runtime manifest.

---

### Task 1.3 — Parity and Convergence Validators

Status: ✅ Complete.

**Workstream:** WS-A

**Scope:** Implement parity-matrix validator (owner + rationale required for installed-only) and workspace-convergence-map validator (fails on unmapped high-value installed workflows).

**Acceptance Criteria:**

- ✅ Validator fails when installed-only entries lack owner/rationale.
- Validator fails when high-value workflows are unmapped.
- Parity report artifact is generated per PR affecting relevant subsystems.

---

### Task 1.4 — Contract Versioning and Compatibility Policy

Status: ✅ Complete.

**Workstream:** WS-G (Observability/compliance/governance)

**Scope:** Define incompatible-change process (migration notes + compatibility validator updates) and enforce in CI.

**Acceptance Criteria:**

- Incompatible schema change without migration notes fails.
- Compatibility validator is updated as part of breaking changes.
- ✅ Process is documented in contributor workflow (see `runtime/github-mode/README.md` "Contract versioning and compatibility" section).

---

## Phase 2 — Security Foundation (GitHub-native)

### Task 2.1 — Secrets Inventory and Rotation Standard

**Workstream:** WS-B

**Scope:** Produce secret inventory, ownership, rotation intervals, and emergency revocation process.

**Acceptance Criteria:**

- Inventory covers all GitHub-mode workflows requiring secret material.
- Rotation policy document is published and linked in ops docs.
- Owners and review cadence are defined.

**Security Check:** Must enforce “GitHub mode never requires custom in-repo secret vaulting” and “secrets only via GitHub Secrets/Environment Secrets”.

---

### Task 2.2 — Environment Protection Configuration

**Workstream:** WS-B

**Scope:** Configure `github-mode-dev`, `github-mode-staging`, `github-mode-prod` environments with required reviewers + branch/tag restrictions.

**Acceptance Criteria:**

- All three environments exist with reviewer gates and restrictions.
- Promotion paths require environment approval.
- Unauthorized branch/tag attempts are blocked.

**Security Check:** Must enforce guardrails for approval-gated promotion and no direct privileged branch mutations.

---

### Task 2.3 — Workflow Permission Hardening

**Workstream:** WS-B

**Scope:** Add explicit least-privilege permissions: at workflow/job level for all GitHub-mode pipelines.

**Acceptance Criteria:**

- No GitHub-mode workflow relies on default token permissions.
- Security lint passes for over-broad permissions.
- Fork PR jobs have zero secret access.

---

### Task 2.4 — OIDC Adoption for Cloud Access

**Workstream:** WS-B

**Scope:** Replace static cloud credentials with OIDC where applicable and document trust relationships.

**Acceptance Criteria:**

- OIDC configured for applicable cloud paths.
- Static long-lived cloud credentials removed from workflow usage.
- Fallback paths documented only for non-OIDC-compatible systems.

**Security Check:** Must satisfy checklist item: “OIDC replaces static cloud credentials where possible”.

---

### Task 2.5 — Security Lint and Simulation Harness

**Workstream:** WS-B

**Scope:** Implement lint/tests that fail on unpinned actions, broad permissions, and secret exposure in untrusted triggers.

**Acceptance Criteria:**

- Lint blocks unpinned third-party actions.
- Lint blocks broad permissions and unsafe trigger/secret combinations.
- Simulated fork PR run confirms no secret availability.

**Security Check:** Must enforce “all third-party actions pinned to full commit SHA.”

---

### Task 2.6 — Skills Quarantine Pipeline

**Workstream:** WS-B

**Scope:** Implement the skills quarantine and vetting pipeline defined in `docs/github-mode/security/0002-skills-quarantine-pipeline.md` for trusted GitHub Mode workflows. This covers intake, static scan, policy evaluation, approval/publish to trusted registry, production enforcement, and emergency revocation.

**Acceptance Criteria:**

- Quarantine registry exists for skill submissions with `pending_scan` state.
- Static scan gate runs integrity, malware, license, provenance, and dependency risk checks with immutable evidence artifacts.
- Policy evaluation classifies skills as `approved_limited`, `approved_trusted`, or `rejected_policy`.
- Two-party approval authority enforced (security approver + runtime owner approver, distinct people, no self-approval).
- Trusted registry enforces allowlist keyed by immutable skill digest/SHA.
- Production trusted workflows fail closed when approval metadata is missing or revoked.
- Workflow startup enforcement implements all four gates: pre-resolution, artifact verification, dependency graph, and runtime activation.
- Emergency revocation path exists with immediate effect: revokes digest, removes from allowlist, invalidates caches, broadcasts incident notice, and opens tracking issue.
- Skill provenance policy enforced: signed/pinned packages, source provenance checks, dependency provenance requirements, deny-by-default for untrusted sources.

**Security Check:** Must enforce “only vetted skills can run in trusted GitHub mode workflows” and “deny by default for untrusted sources.”

---

## Phase 3 — Validation, Simulation, Eval, and Cost Workflows

### Task 3.1 — Core CI Workflow Set Implementation

**Workstream:** WS-C (Validation/policy/eval/cost)

**Scope:** Implement `github-mode-build/check/test/policy/route-sim/eval-tier0/cost/sync-templates`.

**Acceptance Criteria:**

- All named workflows exist and trigger correctly.
- Each emits deterministic artifacts + markdown summaries.
- Required checks are wired to merge gates.

---

### Task 3.2 — Untrusted-Safe Fork Execution Paths

**Workstream:** WS-B

**Scope:** Ensure all Phase 3 workflows run safely for untrusted fork PR contexts.

**Acceptance Criteria:**

- Fork executions complete without secret access.
- Privileged steps are skipped/guarded for untrusted actors.
- Tests/simulations demonstrate enforcement.

**Security Check:** Must preserve “no privileged workflow execution from untrusted contexts.”

---

### Task 3.3 — Policy/Route Drift Detection

**Workstream:** WS-C

**Scope:** Add drift detection for policy and route changes with fail conditions and readable output.

**Acceptance Criteria:**

- Drift is detected and surfaced in summaries/artifacts.
- Drift failures block promotion-related workflows.
- Output includes remediation pointers.

---

### Task 3.4 — Eval/Cost Threshold Gates

**Workstream:** WS-C

**Scope:** Define and enforce threshold gates for eval and cost outcomes.

**Acceptance Criteria:**

- Thresholds are versioned and policy-governed.
- Failing thresholds block promotion.
- Gate results are attached to run artifacts.

---

### Task 3.5 — Template Drift + Migration Guidance

**Workstream:** WS-F (Multi-entity template/collaboration)

**Scope:** Implement template drift detection and auto-generated migration guidance/PR output.

**Acceptance Criteria:**

- Drift is detected against template baseline.
- Guidance is generated consistently in PR/run summary.
- Required checks remain green only when drift is acknowledged/resolved.

---

## Phase 4 — Command Runtime and Bot PR Loop

### Task 4.1 — Command Workflow Implementation

**Workstream:** WS-D (Command runtime and bot PR loop)

**Scope:** Implement `github-mode-command.yml`, `github-mode-agent-run.yml`, `github-mode-bot-pr.yml`.

**Acceptance Criteria:**

- All three workflows execute in intended sequence.
- Command baseline (explain, refactor, test, diagram) is supported.
- `github-mode-command.yml` and `github-mode-agent-run.yml` run blocking pre-agent gates in this order: skill/package scan, lockfile/provenance checks, policy evaluation.
- Gates are fail-closed: any gate failure or indeterminate decision stops workflow before agent execution.
- Each gate emits a minimal pass/fail record in summary + artifact:
  - `gate=<skill-package-scan|lockfile-provenance|policy-eval>`
  - `result=<PASS|FAIL>`
  - `reason=<short machine-parseable reason>`
  - `evidence=<artifact-or-log-reference>`
- End-to-end command-to-PR works for trusted users.

---

### Task 4.2 — Trust-Aware Authorization Layer

**Workstream:** WS-D

**Scope:** Enforce trust-level-based command authorization and privileged adapter restrictions.

**Acceptance Criteria:**

- Trusted actors can invoke authorized privileged flows.
- Untrusted actors are denied privileged adapters/secret-backed paths.
- Denials are explicit and auditable.

**Security Check:** Must enforce guardrail “no privileged execution from untrusted contexts.”

---

### Task 4.3 — Policy-Gated Adapter Invocation

**Workstream:** WS-C

**Scope:** Ensure adapter invocations are policy-checked before execution.

**Acceptance Criteria:**

- Every adapter call has policy decision evidence.
- Policy failures halt execution safely.
- Decision metadata is persisted in artifacts.

---

### Task 4.4 — Provenance Metadata Embedding

**Workstream:** WS-G

**Scope:** Embed source command, commit SHA, run id, and policy version in outputs/PR artifacts.

**Acceptance Criteria:**

- Provenance fields present for all command outputs.
- Metadata schema is standardized and machine-parseable.
- Missing provenance fails validation.

---

### Task 4.5 — Protected Branch Mutation Controls

**Workstream:** WS-B

**Scope:** Ensure bot changes only via PR workflow; block direct writes to protected branches.

**Acceptance Criteria:**

- Bot cannot push directly to protected branches.
- All mutations are traceable to PR runs.
- Controls are tested via negative cases.

**Security Check:** Must enforce guardrail “all privileged branch mutations via PR workflow only.”

---

### Task 4.6 — UX Progress Checkpoint Contract

**Workstream:** WS-D

**Scope:** Implement the 6-checkpoint lifecycle and user-facing state model defined in `docs/github-mode/overview.md` §3.3–3.4 for all GitHub Mode remote runs. Checkpoints: Provisioning → Runner startup → Hydration → Scanning → Execution → Upload/finalize.

**Acceptance Criteria:**

- All six checkpoints are emitted in order for every GitHub Mode remote run; skipped checkpoints emit `skipped` state.
- User-facing state model implemented: `queued`, `provisioning`, `running`, `waiting_on_input`, `completed`, `failed`.
- CLI progress labels mapped to checkpoints using `src/cli/progress.ts` spinner/progress primitives.
- `openclaw status --all` shows trigger source, trust context, gate outcomes, active phase, and terminal outcome per the checkpoint mapping table in overview.md.
- `openclaw status --deep` includes probe evidence, failing identifiers, timeout class, and completion-time regressions per the checkpoint mapping table.
- Status notification pattern follows state-change-driven updates (not per-log-line), includes run id, current state, elapsed time, and next expected transition.
- Single-thread progress updates preferred (comment edits or one canonical status thread, not noisy comment spam).
- Completion handoff pattern includes: outcome statement, evidence bundle, operator action, and ownership continuity.
- Fallback behavior when telemetry is unavailable: preserve checkpoint ordering, show last confirmed checkpoint, mark unresolved state as `unknown`, add degraded-telemetry note to `status --all`, emit best-effort end state.

---

### Task 4.7 — Persistent Memory and State Adapter Pipeline

**Workstream:** WS-D

**Scope:** Implement the durable persistent-memory layer defined in `docs/github-mode/planning/implementation-plan.md` §2.1 so agent context survives runner teardown. Runner filesystem is never a source of truth.

**Acceptance Criteria:**

- System of record defined: primary object storage for checkpoint/event blobs, index/query database for metadata and coordination, optional projection stores as derived views.
- Read/write lifecycle implemented: hydrate at run start (latest snapshot + unapplied deltas), periodic checkpoints at deterministic boundaries with monotonic sequence IDs, finalize at run end (compact deltas into snapshot, record status/evidence), crash-safe fallback from previously persisted checkpoints.
- Consistency model enforced: read-your-writes within run scope, eventual consistency across concurrent runs, `baseVersion`/`newVersion` compare-and-swap on writes, reject stale writes on version mismatch, append-only event log with periodic snapshot compaction (no silent last-write-wins).
- Idempotency: all writes include idempotency keys (`runId` + `stepId` + `sequence`).
- Minimal persistent data model implemented: `MemorySnapshot`, `MemoryDelta`, `RunCheckpoint`, `RunJournal` with all required fields per the implementation plan.
- Retention/TTL policy defined: hot window for fast resume, warm audit window for governance/forensics, explicit policy-driven expiration with auditable tombstone records, legal/compliance hold overrides.
- Storage target selected using the latency/cost/access-control criteria in the implementation plan (GitHub Actions artifacts, GitHub Releases assets, cloud object storage via OIDC, or managed KV/database).

---

### Task 4.8 — Failure-Mode Contract Implementation

**Workstream:** WS-D

**Scope:** Implement the failure-mode contract defined in `docs/github-mode/overview.md` §4.3 and `docs/github-mode/planning/implementation-plan.md` §2.1 for all checkpointed GitHub runs.

**Acceptance Criteria:**

- Storage unavailable: detected by hydrate/finalize probe failure; exponential backoff with bounded retries; last committed snapshot/checkpoint preserved as source of truth; rehydrate from previous version on retry.
- Snapshot schema mismatch: detected by `schemaVersion` validation failure; no automatic retry; original snapshot preserved immutably; migration-required incident marker in `RunJournal`; resume only from migrated snapshot.
- Scan failures: detected by preflight gate FAIL/INDETERMINATE; one retry for transient errors, no retry for policy denials; fail closed before execution with zero side effects.
- Runner timeout/preemption: detected by cancellation/eviction/watchdog signal; auto-resume only when trust/policy context unchanged and retry budget remains; new run hydrates latest `RunCheckpoint` and replays deterministic remaining steps.
- Partial upload/corrupt checkpoint: detected by checksum/size/CAS/read-back failure; retry upload with same idempotency key; previous snapshot pointer preserved; corrupt objects tombstoned.
- Each failure mode produces a user-visible error message per the specification.
- All failure-mode behaviors are tested with explicit negative test cases.

---

## Phase 5 — Promotion, Attestation, and Incident Operations

### Task 5.1 — Promotion Pipeline Implementation

**Workstream:** WS-E (Promotion/attestation/incident ops)

**Scope:** Implement `github-mode-promote-dev/staging/prod.yml` with gate dependencies.

**Acceptance Criteria:**

- Promotions require green required checks.
- Environment approvals are mandatory.
- Failed gates prevent promotion.

---

### Task 5.2 — Attestation Generation + Verification

**Workstream:** WS-E

**Scope:** Generate and verify attestations with required fields (commit/environment, revisions, model/dataset, eval/cost, approvers+UTC, artifact/run refs).

**Acceptance Criteria:**

- Attestation exists for each promotion attempt.
- Verification fails on missing/invalid required fields.
- Verified attestation is mandatory for promotion success.

**Security Check:** Must enforce guardrails for approval-gated promotion and continuous compliance evidence.

---

### Task 5.3 — Drift and Incident Automation

**Workstream:** WS-E

**Scope:** Implement `github-mode-drift.yml` and `github-mode-incident.yml` with evidence-linked issue creation.

**Acceptance Criteria:**

- Drift and incident workflows auto-create linked evidence artifacts/issues.
- Incident records include run and artifact references.
- Attestation verification failure auto-opens incident path.

---

### Task 5.4 — Promotion Failure Backout Controls

**Workstream:** WS-E

**Scope:** Implement blocking behavior + rollback procedures when attestation or gate verification fails.

**Acceptance Criteria:**

- Promotion is automatically blocked on attestation failure.
- Incident issue is generated automatically.
- Rollback/runbook link is attached in incident output.

---

## Phase 6 — Multi-Entity Bootstrap and Collaboration

### Task 6.1 — Entity Bootstrap Workflow

**Workstream:** WS-F

**Scope:** Implement `github-mode-bootstrap-entity.yml` for template-based entity creation.

**Acceptance Criteria:**

- New entities are generated with baseline structure.
- Bootstrap output includes validation report and remediation pointers.
- Re-run is idempotent for unchanged templates.

---

### Task 6.2 — Entity Baseline Validator

**Workstream:** WS-F

**Scope:** Validate labels, issue forms, PR templates, CODEOWNERS, environment placeholders, branch protection expectations.

**Acceptance Criteria:**

- Validator covers all listed baseline components.
- Missing baseline elements fail validation.
- Reports are attached to workflow artifacts.

---

### Task 6.3 — Collaboration Dispatch/Receive Workflows

**Workstream:** WS-F

**Scope:** Implement `github-mode-collab-dispatch.yml` and `github-mode-collab-receive.yml`.

**Acceptance Criteria:**

- Allowlisted intents dispatch/receive successfully across two generated entities.
- Rejected intents produce explicit denial reasons and audit evidence.
- Latency/success signals emitted for observability.

---

### Task 6.4 — Deny-by-Default Policy + Envelope Validation

**Workstream:** WS-B

**Scope:** Enforce collaboration policy routes and envelope validation (source/target, intent, correlation id, run id, policy version, ttl).

**Acceptance Criteria:**

- Non-allowlisted intents are denied by default.
- Envelope schema violations are rejected before execution.
- Audit traces capture decision + payload metadata.

**Security Check:** Must enforce guardrail for deny-by-default trust model and untrusted intent rejection with evidence.

---

### Task 6.5 — Abuse/Fault Containment Mode

**Workstream:** WS-E

**Scope:** Add operational control to disable dispatch permissions while keeping receive validation in monitor-only mode.

**Acceptance Criteria:**

- Toggle can be activated rapidly during incidents.
- Dispatch stops without breaking passive validation.
- Incident trail records who toggled and why.

---

## Phase 7 — Observability, Compliance, and Program Handoff

### Task 7.1 — Artifact + Summary Standardization

**Workstream:** WS-G

**Scope:** Define and adopt standardized artifact schemas and workflow summary format across phases.

**Acceptance Criteria:**

- Schema docs published and referenced by all GitHub-mode workflows.
- Validation confirms schema conformance.
- Maintainers can compare outputs across workflows consistently.

---

### Task 7.2 — Metrics Pipeline Implementation

**Workstream:** WS-G

**Scope:** Build metrics/reporting covering all dimensions from `docs/github-mode/planning/implementation-plan.md` §4 Phase 7, `docs/github-mode/planning/mvvp.md` §4, and `docs/github-mode/planning/mvvvp.md` §5.

Required metric categories (union of plan, MVVP, and MVVVP requirements):

- **Adoption:** PR coverage by GitHub Mode checks, trusted command usage by repository/cohort.
- **Effectiveness:** bot PR acceptance/merge rate, median command-to-PR lead time, pre-merge issues caught by policy/routing checks.
- **Safety:** blocked privileged attempts (with actor/context class), secret leakage incidents (target: zero), policy bypass incidents (target: zero).
- **Reliability:** workflow success rate by class, flake-driven rerun rate, median and p95 workflow duration.
- **Operability (MVVVP):** manual intervention count per week, mean time to recover from workflow breakage, stale parity entry count and trend direction.
- **Parity:** parity matrix freshness, parity score trends, count of `installed-only` items and trend.
- **Collaboration:** collaboration success/failure rates and latency.
- **Promotion:** promotion lead time and rollback time.

**Acceptance Criteria:**

- Dashboards or reports available to maintainers.
- Metrics cover all listed categories with weekly rollup cadence.
- Data freshness/SLOs defined and monitored.
- MVVP metrics emitted by the time MVVP exit criteria are evaluated (see `mvvp.md` §5).
- MVVVP operability metrics emitted by the time MVVVP exit criteria are evaluated (see `mvvvp.md` §6).

---

### Task 7.3 — Governance Playbooks

**Workstream:** WS-G

**Scope:** Publish operational playbooks for key rotation, emergency revocation, compromised token response, attestation audit + rollback.

**Acceptance Criteria:**

- Playbooks are reviewed and approved.
- Docs link all playbooks from governance hub.
- Incident responders can execute playbooks without tribal knowledge.

**Security Check:** Must include guardrail-aligned procedures for secret rotation, token compromise response, and continuous compliance checks.

---

### Task 7.4 — Compliance Enforcement Automation

**Workstream:** WS-B

**Scope:** Add continuous checks for security acceptance checklist controls (pinning, permissions, trigger safety, branch protections, attestation gating, artifact scrubbing).

**Acceptance Criteria:**

- Compliance checks run continuously in CI.
- Violations are blocking for protected promotion paths.
- Secret leakage risk scanning is included for logs/artifacts.

**Security Check:** Must enforce: SHA-pinned third-party actions, explicit minimal `GITHUB_TOKEN` permissions, no direct writes to protected branches, promotion requires valid attestation.

---

### Task 7.5 — Program Handoff and Ownership Transfer

**Workstream:** WS-G

**Scope:** Complete milestone closeout package (M1–M7 evidence), owner assignment, and runbook handoff to maintainers.

**Acceptance Criteria:**

- Exit evidence mapped to each phase and DoD criterion.
- Ongoing owners assigned for each workflow/workstream.
- Handoff sign-off recorded by maintainers.

---

## Suggested Execution Packaging (optional)

- Epic per phase
- Stories per task above
- Subtasks for workflow files/tests/docs

Label stories by **workstream (WS-A…WS-G)** and **milestone (M1…M7)** for dependency tracking.

### MVP Rollout Phases (from `docs/github-mode/planning/mvp.md` §8)

Rollout is staged to manage risk:

- **Phase A (internal-only):** Enable workflows on default branch with maintainer-only command triggers. Measure reliability/flakiness and harden summaries/artifacts.
- **Phase B (limited trusted users):** Expand trusted command users. Keep privileged adapters scoped and audited.
- **Phase C (default-on required checks):** Enforce PR checks as required branch protection status checks. Keep command workflow guardrails unchanged unless explicitly reviewed.

**Rollback policy:** If abuse or reliability regressions occur, disable mutation-capable command paths and retain read-only validation checks.

### Maturity Progression (MVP → MVVP → MVVVP)

Each maturity stage has explicit exit criteria defined in its planning document:

- **MVP exit criteria:** `docs/github-mode/planning/mvp.md` §7 — required PR check, trusted command-to-bot-PR, untrusted denial, parity artifact, installed runtime unchanged.
- **MVVP exit criteria:** `docs/github-mode/planning/mvvp.md` §5 — MVP criteria sustained for 2 weeks plus vision metrics showing repeat usage and alignment.
- **MVVVP exit criteria:** `docs/github-mode/planning/mvvvp.md` §6 — MVVP criteria sustained for 4 weeks plus operability targets, compounding value, and zero safety incidents.

Scope expansion is gated by maturity: do not advance beyond MVP scope until MVP exit criteria hold, and likewise for MVVP → MVVVP.
