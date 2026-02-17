# GitHub Mode Fork Installation Guide

This guide explains how to install GitHub Mode components into an existing fork of the OpenClaw repository.

---

## Overview

GitHub Mode is an additive runtime layer that shifts OpenClaw orchestration to GitHub Actions workflows while preserving the installed runtime. To use GitHub Mode in your own fork, you install a specific set of components from the upstream repository.

### Component groups

GitHub Mode consists of six component groups. Each group can be installed independently, but a complete installation requires all six.

| Group                  | Directory / Files                                                         | Purpose                                                                            |
| ---------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Runtime Contracts      | `runtime/github/`                                                         | Machine-readable contracts, schemas, and policies that define GitHub Mode behavior |
| Workflows              | `.github/workflows/github-mode-*.yml`                                     | GitHub Actions workflows for validation, commands, and policy enforcement          |
| Documentation          | `docs/github-mode/`                                                       | Architecture docs, ADRs, security analysis, and planning guides                    |
| Validation Scripts     | `scripts/validate-*.ts`, `scripts/check-*.ts`, `scripts/setup-*.ts`       | Contract validation and upstream-additive guard scripts                            |
| Tests                  | `test/validate-*.test.ts`, `test/check-*.test.ts`, `test/setup-*.test.ts` | Test suites for contract validation and guards                                     |
| Repository Entrypoints | `.GITHUB-MODE-ACTIVE.md`, `.GITHUB-MODE-README.md`                        | Top-level fork orientation files                                                   |

---

## Prerequisites

Before installing GitHub Mode components into your fork:

1. **Node.js 22+** installed
2. **pnpm** package manager installed
3. A **local clone of your OpenClaw fork** with a `.git` directory and `package.json`
4. A **local clone of upstream OpenClaw** (this repository) to copy components from

---

## Installation pathways

### Pathway 1: Automated setup script (recommended)

The setup script copies all GitHub Mode components from upstream into your fork in a single command.

```bash
# From the upstream OpenClaw repo root:
pnpm github-mode:setup-fork /path/to/your/fork
```

#### Dry run

Preview what would be copied without making changes:

```bash
pnpm github-mode:setup-fork /path/to/your/fork --dry-run
```

#### Force overwrite

Overwrite existing files in the target fork:

```bash
pnpm github-mode:setup-fork /path/to/your/fork --force
```

#### What the script does

1. Validates prerequisites (source has contracts, target is a git repo with `package.json`).
2. Copies each component group into the target directory.
3. Skips files that already exist (unless `--force` is used).
4. Prints a summary of copied, skipped, and failed paths.
5. Provides next steps for completing the setup.

---

### Pathway 2: Manual installation (component-by-component)

If you prefer to install components selectively, copy each group individually.

#### Step 1: Runtime contracts

Copy the entire `runtime/github/` directory. This is the minimum requirement for GitHub Mode.

```bash
cp -r runtime/github/ /path/to/your/fork/runtime/github/
```

**Files installed:**

- `runtime-manifest.json` — component versions and ownership
- `command-policy.json` — allowed actions and enforcement mode
- `trust-levels.json` — trust tier definitions (untrusted, semi-trusted, trusted)
- `parity-matrix.json` — feature parity classifications (native, adapter, emulated, installed-only)
- `adapter-contracts.json` — adapter capabilities and trust constraints
- `workspace-convergence-map.json` — acceptance criteria and reconciliation signals
- `entity-manifest.json` — entity identity and trust tier
- `collaboration-policy.json` — deny-by-default collaboration routing
- `manifest.schema.json` — JSON Schema for runtime manifest
- `entity-manifest.schema.json` — JSON Schema for entity manifests
- `collaboration-policy.schema.json` — JSON Schema for collaboration policies
- `collaboration-envelope.schema.json` — JSON Schema for cross-entity message envelopes
- `README.md` — contract consumption guide

#### Step 2: GitHub Actions workflows

Copy the GitHub Mode workflows:

```bash
cp .github/workflows/github-mode-*.yml /path/to/your/fork/.github/workflows/
```

Currently implemented:

- `github-mode-contracts.yml` — PR validation and contract checking

#### Step 3: Validation scripts

Copy the validation scripts:

```bash
cp scripts/validate-github-runtime-contracts.ts /path/to/your/fork/scripts/
cp scripts/check-upstream-additions-only.ts /path/to/your/fork/scripts/
cp scripts/setup-github-mode-fork.ts /path/to/your/fork/scripts/
```

#### Step 4: Tests

Copy the test files:

```bash
cp test/validate-github-runtime-contracts.test.ts /path/to/your/fork/test/
cp test/check-upstream-additions-only.test.ts /path/to/your/fork/test/
cp test/setup-github-mode-fork.test.ts /path/to/your/fork/test/
```

#### Step 5: Documentation

Copy the GitHub Mode docs tree:

```bash
cp -r docs/github-mode/ /path/to/your/fork/docs/github-mode/
```

#### Step 6: Entrypoint files

Copy the repository-level entrypoints:

```bash
cp .GITHUB-MODE-ACTIVE.md /path/to/your/fork/
cp .GITHUB-MODE-README.md /path/to/your/fork/
```

---

### Pathway 3: Git-based sync (upstream tracking)

For forks that want to stay synchronized with upstream GitHub Mode changes, use git remotes.

```bash
cd /path/to/your/fork

# Add upstream remote (if not already added)
git remote add upstream https://github.com/openclaw/openclaw.git

# Fetch upstream changes
git fetch upstream main

# Cherry-pick or merge GitHub Mode files only
git checkout upstream/main -- \
  runtime/github/ \
  .github/workflows/github-mode-contracts.yml \
  docs/github-mode/ \
  scripts/validate-github-runtime-contracts.ts \
  scripts/check-upstream-additions-only.ts \
  scripts/setup-github-mode-fork.ts \
  test/validate-github-runtime-contracts.test.ts \
  test/check-upstream-additions-only.test.ts \
  test/setup-github-mode-fork.test.ts \
  .GITHUB-MODE-ACTIVE.md \
  .GITHUB-MODE-README.md
```

This pathway is recommended for ongoing maintenance since upstream can add new workflows, update contracts, or refine policies.

---

## Post-installation steps

After installing all components, complete the setup:

### 1. Install dependencies

```bash
cd /path/to/your/fork
pnpm install
```

### 2. Validate contracts

```bash
pnpm contracts:github:validate
```

This runs the contract validation script against all `runtime/github/` artifacts. All checks must pass.

### 3. Run tests

```bash
pnpm test -- test/validate-github-runtime-contracts.test.ts test/check-upstream-additions-only.test.ts
```

### 4. Add the npm script (if not present)

Ensure your fork's `package.json` includes the validation script:

```json
{
  "scripts": {
    "contracts:github:validate": "node --import tsx scripts/validate-github-runtime-contracts.ts"
  }
}
```

### 5. Commit and push

```bash
git add -A
git commit -m "chore: install GitHub Mode components"
git push
```

### 6. Enable GitHub Actions

Ensure GitHub Actions are enabled in your fork's repository settings. The `github-mode-contracts.yml` workflow will automatically validate contracts on PRs that touch GitHub Mode paths.

---

## Component dependency graph

Some components depend on others. The minimum viable installation order is:

```
runtime/github/          (required — contracts define all behavior)
    ↓
scripts/validate-*.ts    (required — validates contracts in CI)
    ↓
.github/workflows/       (required — enforces validation in CI)
    ↓
test/                    (recommended — validates contract logic)
    ↓
docs/github-mode/        (recommended — architecture and planning)
    ↓
.GITHUB-MODE-*.md        (optional — repository orientation)
```

---

## Security considerations

### Fork PR safety

GitHub Mode workflows are designed so that fork PRs run safely with no secret access. The `trust-levels.json` contract defines three trust tiers:

- **Untrusted**: fork PRs and unknown actors get read-only, constrained capabilities
- **Semi-trusted**: internal PRs with moderate capabilities but no secret access
- **Trusted**: maintainer-approved environments with full secret and mutation access

### Upstream sync safety

The `scripts/check-upstream-additions-only.ts` guard ensures that GitHub Mode changes are purely additive. This means your fork can safely pull upstream updates without merge conflicts in core OpenClaw files.

### Secret management

GitHub Mode never stores secrets in the repository. All secrets must be configured via GitHub repository Settings > Secrets and variables > Actions.

---

## Customizing GitHub Mode for your fork

### Entity identity

Edit `runtime/github/entity-manifest.json` to set your fork's entity identity:

```json
{
  "schemaVersion": "1.0",
  "entityId": "your-entity-id",
  "owner": "@your-org/your-team",
  "trustTier": "trusted",
  "capabilities": ["validate", "command", "agent-run", "bot-pr"]
}
```

### Command policy

Edit `runtime/github/command-policy.json` to customize allowed actions:

```json
{
  "schemaVersion": "1.0",
  "policyVersion": "v1.0.0",
  "enforcementMode": "enforce",
  "allowedActions": ["plan", "validate", "open-pr"],
  "constraints": ["No direct protected-branch mutation outside pull-request flow."]
}
```

### Collaboration policy

Edit `runtime/github/collaboration-policy.json` to configure cross-entity collaboration routes (deny-by-default).

---

## Troubleshooting

### Contract validation fails

If `pnpm contracts:github:validate` fails after installation:

1. Check that all `runtime/github/` files were copied correctly.
2. Verify JSON syntax in all contract files.
3. Ensure `parity-matrix.json` entries marked `installed-only` have `owner` and `rationale` fields.
4. Run with verbose output: `node --import tsx scripts/validate-github-runtime-contracts.ts`

### Workflow does not trigger

If the `github-mode-contracts.yml` workflow does not run on PRs:

1. Ensure GitHub Actions are enabled for your fork.
2. Check that the PR modifies files matching the workflow's `paths` filter.
3. Verify the workflow file is in `.github/workflows/`.

### Upstream sync conflicts

If `git checkout upstream/main -- runtime/github/` produces conflicts:

1. Review the changes with `git diff`.
2. Accept upstream changes for contract files (they are the source of truth).
3. Re-run `pnpm contracts:github:validate` after resolving.

---

## Related documents

- [GitHub Mode Overview](overview.md)
- [MVP Plan](planning/mvp.md)
- [Implementation Plan](planning/implementation-plan.md)
- [Implementation Tasks](planning/implementation-tasks.md)
- [ADR 0001: Runtime Boundary](adr/0001-runtime-boundary-and-ownership.md)
- [ADR 0002: Non-Regression Guardrails](adr/0002-installed-runtime-non-regression-guardrails.md)
- [Trigger Trust Matrix](security/0001-github-trigger-trust-matrix.md)
- [Runtime Contracts README](../../runtime/github/README.md)
