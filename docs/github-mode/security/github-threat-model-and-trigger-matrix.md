# GitHub mode threat model and trigger matrix

- Status: Proposed
- Date: 2026-02-16
- Owners: GitHub mode maintainers, security maintainers
- Decision scope: GitHub mode workflows and trust boundaries

## Security goals

1. No privileged workflow execution in untrusted contexts.
2. Privileged branch mutation is allowed only through pull request flow.
3. Every workflow trigger has explicit preventive and detective controls.

## Trigger trust matrix

| Trigger                             | Default trust level   | Privileged actions allowed | Required controls                                                       |
| ----------------------------------- | --------------------- | -------------------------- | ----------------------------------------------------------------------- |
| `pull_request` from fork            | Untrusted             | No                         | Read-only token permissions, no secrets, explicit actor/repo trust gate |
| `pull_request` from internal branch | Semi-trusted          | Limited                    | Minimal permissions, branch protection checks, required status checks   |
| `push` (protected branches)         | Trusted               | Yes, but PR-mediated only  | Branch protection, required checks, CODEOWNERS approval                 |
| `schedule`                          | Trusted automation    | Yes                        | Environment approval for promotion, attestations, audit artifact output |
| `workflow_dispatch`                 | Trusted operator path | Yes                        | Restricted callers, environment reviewer gate, immutable run evidence   |

## Abuse cases and mapped controls

| Abuse case                                           | Preventive controls                                                                                  | Detective controls                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Fork PR tries to exfiltrate secrets                  | `pull_request` only for untrusted code, no secrets in fork paths, minimal `GITHUB_TOKEN` permissions | Workflow summary includes secret-access state and trust classification |
| Malicious branch push attempts privileged mutation   | Protected branch rules, PR-required merge policy, no direct workflow write path                      | Audit log review + workflow evidence with branch and actor metadata    |
| `workflow_dispatch` triggered by unauthorized actor  | allowlist/role gate before privileged jobs, environment required reviewers                           | Rejected-dispatch artifact with actor and denial reason                |
| Scheduled workflow uses over-broad permissions       | Explicit job-level permissions, action pinning to commit SHA                                         | Security lint results published as artifact                            |
| Reusable workflow called with unsafe trigger context | Trigger and trust-level validation against matrix before privileged steps                            | Validation report artifact blocks and records violation                |

## Guardrails encoded in repository policy

GitHub mode guardrails are encoded in `runtime/github/threat-model/trigger-matrix.json` and validated by `scripts/validate-github-mode-threat-model.mjs`, which enforces both JSON schema conformance and semantic guardrails.

Mandatory encoded guardrails:

- Untrusted contexts must not be marked as privileged-capable.
- Privileged branch mutation must be marked as PR-flow-only.
- Every abuse case must have at least one preventive and one detective control.

## Maintainer review checklist

- [ ] Trigger matrix includes fork PR, internal PR, push, schedule, and manual dispatch.
- [ ] Trust classification is explicit and matches workflow design.
- [ ] Abuse-case controls map to enforceable workflow checks.
- [ ] Guardrail validator passes in CI.

## Approval signoff

- Security maintainer: `@TBD`
- GitHub mode maintainer: `@TBD`
- Approval date: `YYYY-MM-DD`
