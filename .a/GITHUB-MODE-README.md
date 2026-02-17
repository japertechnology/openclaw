# 🦞 OpenClaw GitHub Mode — Repository-First AI Assistant Runtime

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/japertechnology/openclaw/main/docs/assets/openclaw-logo-text-dark.png">
    <img src="https://raw.githubusercontent.com/japertechnology/openclaw/main/docs/assets/openclaw-logo-text.png" alt="OpenClaw" width="500">
  </picture>
</p>

<p align="center">
  <strong>Run OpenClaw workflows directly from GitHub state, with contracts, policy guardrails, and auditable automation.</strong>
</p>

<p align="center">
  <a href="https://github.com/japertechnology/openclaw/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/japertechnology/openclaw/ci.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="https://github.com/japertechnology/openclaw/releases"><img src="https://img.shields.io/github/v/release/japertechnology/openclaw?include_prereleases&style=for-the-badge" alt="GitHub release"></a>
  <a href="https://discord.gg/clawd"><img src="https://img.shields.io/discord/1456350064065904867?label=Discord&logo=discord&logoColor=white&color=5865F2&style=for-the-badge" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

GitHub Mode is an additive runtime for **OpenClaw** that shifts orchestration to repository-native workflows while preserving compatibility with the installed runtime. It is designed for teams that need strict reviewability, policy boundaries, and durable runtime contracts.

- Website: https://openclaw.ai
- Docs: https://docs.openclaw.ai
- GitHub Mode docs index: https://github.com/japertechnology/openclaw/tree/main/docs/github-mode
- Runtime contracts: https://github.com/japertechnology/openclaw/tree/main/runtime/github

---

## Why GitHub Mode

Standard OpenClaw operation is excellent for personal/local operation. GitHub Mode exists for a different operating profile:

- **Repo-governed automation**: behavior derives from committed state and reviewed workflow changes.
- **Auditable execution**: task activity, policy checks, and artifact updates are visible in pull requests and Actions logs.
- **Contract-first design**: machine-readable runtime contracts under `runtime/github/` are validated in CI.
- **Upstream-safe customization**: GitHub Mode changes are intended to remain additive so upstream sync stays clean.

If you need repeatability across contributors and repositories, GitHub Mode is the right abstraction.

---

## Scope and boundaries

GitHub Mode intentionally separates ownership between installed runtime and repo runtime:

- Installed runtime internals stay in `src/**`.
- GitHub Mode orchestration lives in `.github/**` and contract/runtime assets under `runtime/github/**`.
- GitHub Mode TypeScript runtime behavior should follow extension architecture (`extensions/github/`) instead of coupling to `src/**` internals.

For architecture rationale, read:

- ADR 0001 Runtime Boundary and Ownership: https://github.com/japertechnology/openclaw/blob/main/docs/github-mode/adr/0001-runtime-boundary-and-ownership.md
- ADR 0002 Installed Runtime Non-Regression Guardrails: https://github.com/japertechnology/openclaw/blob/main/docs/github-mode/adr/0002-installed-runtime-non-regression-guardrails.md

---

## Repository map for GitHub Mode

Use this map to orient changes:

- `docs/github-mode/` — architecture, security, planning, and analysis docs.
- `runtime/github/` — runtime contracts and schemas.
- `.github/workflows/github-mode-*` — GitHub Mode CI and policy workflows.
- `scripts/validate-github-runtime-contracts.ts` — contract validation entrypoint.
- `scripts/check-upstream-additions-only.ts` — additive-change policy enforcement.
- `test/validate-github-runtime-contracts.test.ts` — validation coverage.
- `test/check-upstream-additions-only.test.ts` — upstream-sync guard coverage.

---

## Quick start (GitHub Mode contributors)

### 1) Prerequisites

- Node.js 22+
- pnpm
- GitHub repository access with Actions permissions

Install dependencies:

```bash
pnpm install
```

### 2) Validate contracts

```bash
pnpm contracts:github:validate
```

### 3) Run guardrail checks

```bash
node --import tsx scripts/check-upstream-additions-only.ts
pnpm test -- test/validate-github-runtime-contracts.test.ts test/check-upstream-additions-only.test.ts
```

### 4) Run full project checks before opening a PR

```bash
pnpm build
pnpm check
pnpm test
```

---

## Development workflow

1. **Start from a clear intent**
   - Decide whether the change is contract, workflow, docs, or policy.
2. **Keep changes additive when possible**
   - Prefer extending GitHub Mode-owned directories rather than modifying upstream-owned core files.
3. **Update docs with code**
   - If you modify behavior, update the corresponding `docs/github-mode/**` pages and ADR references.
4. **Validate locally**
   - Run contract validation + targeted tests before full suite.
5. **Open a focused PR**
   - Keep PR scope narrow and include rationale, risk, and rollback guidance.

---

## Security model highlights

GitHub Mode documentation emphasizes risk-aware operation instead of informal trust assumptions.

- Trigger trust and privilege expectations: https://github.com/japertechnology/openclaw/blob/main/docs/github-mode/security/0001-github-trigger-trust-matrix.md
- Skills quarantine pipeline: https://github.com/japertechnology/openclaw/blob/main/docs/github-mode/security/0002-skills-quarantine-pipeline.md

Recommended practice:

- Treat workflow inputs and repository events as untrusted until validated.
- Keep secrets handling explicit and minimal.
- Require code review for policy/workflow changes that affect execution boundaries.

---

## Planning documents

GitHub Mode planning is staged:

- MVP: https://github.com/japertechnology/openclaw/blob/main/docs/github-mode/planning/mvp.md
- MVVP: https://github.com/japertechnology/openclaw/blob/main/docs/github-mode/planning/mvvp.md
- MVVVP: https://github.com/japertechnology/openclaw/blob/main/docs/github-mode/planning/mvvvp.md
- Implementation plan: https://github.com/japertechnology/openclaw/blob/main/docs/github-mode/planning/implementation-plan.md
- Task breakdown: https://github.com/japertechnology/openclaw/blob/main/docs/github-mode/planning/implementation-tasks.md

Use these as the canonical roadmap before introducing new architecture branches.

---

## CI and policy checks

GitHub Mode depends on guardrails that should stay green for every PR touching mode-owned paths.

Core checks:

- Runtime contracts validation (`pnpm contracts:github:validate`)
- Upstream additive-change guard (`scripts/check-upstream-additions-only.ts`)
- Targeted guardrail tests under `test/`

If a change requires broadening owned paths or guard behavior, update docs/ADR rationale in the same PR.

---

## Relationship to standard OpenClaw README

This document is a **full alternative entrypoint** oriented toward repository/runtime governance.

Use the standard README when you want product onboarding and personal deployment guidance:

- https://github.com/japertechnology/openclaw/blob/main/README.md

Use this GitHub Mode README when you need:

- repository-first runtime architecture,
- contract and policy development workflow,
- security/governance references for collaborative operation.

---

## Additional references

- GitHub Mode overview: https://github.com/japertechnology/openclaw/blob/main/docs/github-mode/overview.md
- The Idea: https://github.com/japertechnology/openclaw/blob/main/docs/github-mode/idea.md
- Runtime contracts README: https://github.com/japertechnology/openclaw/blob/main/runtime/github/README.md
- OpenClaw docs portal: https://docs.openclaw.ai
- Community Discord: https://discord.gg/clawd

---

## License

MIT. See [LICENSE](LICENSE).
