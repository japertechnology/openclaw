# GitHub Mode and `src/` usage: practical analysis

## Your core concern

You are absolutely spotting a real design tension: when you inspect `.GITHUB-MODE`, you do **not** see it importing `/src` implementations, yet some docs talk about `src/**` concepts. That can make the mode feel “not deeply wired.”

The important thing is this:

- **Current implementation intent is boundary-first**: GitHub Mode should _not_ directly import installed runtime internals from `src/**`.
- **Current implementation mechanics are contract/workflow-driven**: `.GITHUB-MODE/scripts`, `.GITHUB-MODE/runtime`, and `.github/workflows/github-mode-*` validate policy/contracts and orchestrate CI/runtime governance.

So GitHub Mode is currently designed more as a **governance/control plane overlay** than as a direct execution path into `src/**` code.

---

## Where `src/**` appears today (and why)

### 1) Boundary ownership docs (normative references)

`src/**` is referenced in architecture docs to define ownership boundaries, not to call code:

- `.GITHUB-MODE/README.md` says installed runtime internals stay in `src/**` and GitHub Mode should avoid coupling to those internals.
- ADR 0001 explicitly prohibits GitHub mode workflows/actions importing installed runtime internals from `src/**`.

These are **policy references**, not import statements.

### 2) Guardrail scripts/tests that enforce “don’t couple to src”

The script `.GITHUB-MODE/scripts/check-runtime-boundary-doc-consistency.ts` scans docs for phrases that imply direct `src/**` reuse and fails when wording conflicts with ADR 0001.

So even `src/**` mentions are being linted as part of boundary policy.

### 3) Planning/analysis docs with mixed messages

Some docs (notably `.GITHUB-MODE/docs/overview.md`) still mention potential reuse areas in `src/...` as conceptual capability anchors. Other analysis docs call this contradiction out explicitly.

This is why it can feel confusing: **the policy is strict separation, while parts of planning prose still describe src-adjacent ideas.**

---

## What I verified in code

I checked import patterns in GitHub Mode scripts/tests/workflows.

### Result

- No `.GITHUB-MODE/scripts/**` or `github-mode-*` workflow logic directly imports from `src/**`.
- The only `src/**` hits in `.GITHUB-MODE/test/**` are test strings used to validate the boundary checker behavior.

That means your observation is correct: GitHub Mode currently does not “deeply work” by directly driving installed runtime internals via imports.

---

## How GitHub Mode “deeply works” without direct `src/**` imports

Think of the architecture in layers:

1. **Contracts and policy data** (`.GITHUB-MODE/runtime/*.json`, schemas)
   - machine-readable runtime intent.
2. **Validation and enforcement scripts** (`.GITHUB-MODE/scripts/*.ts`)
   - fail-fast checks for drift, policy violations, and governance requirements.
3. **GitHub workflow entrypoints** (`.github/workflows/github-mode-*.yml`)
   - trigger orchestration and execute the checks in CI contexts.
4. **Installed runtime remains separate** (`src/**`)
   - continues to own CLI/gateway/channel execution.

So “deep” here means **deep governance integration in repository workflows**, not deep runtime coupling.

---

## Why this can still feel incomplete

You are likely expecting one of these:

- a concrete `extensions/github/` runtime adapter that bridges GitHub events into stable SDK interfaces, or
- explicit extracted shared packages that both `src/**` and GitHub Mode consume.

Without one of those, GitHub Mode is structurally strong on policy/validation but intentionally thin on direct runtime behavior reuse.

---

## Bottom-line interpretation

- Your confusion is valid and technically justified.
- `.GITHUB-MODE` currently uses `src/**` mostly as a **boundary reference** and **anti-coupling rule target**, not as an implementation dependency.
- The mode can still “work” as a CI/control-plane system, but it will feel less “deeply integrated” until shared, boundary-safe execution interfaces are implemented (for example through an actual GitHub extension adapter).
