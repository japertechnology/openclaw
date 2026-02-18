# 🦞 GitHub Mode: Activated

### Delete or rename this file to disable GitHub Mode.

<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/japertechnology/openclaw/main/.GITHUB-MODE/assets/logo.png" alt="OpenClaw with GitHub Mode" width="500">
  </picture>
</p>

GitHub Mode is **explicitly enabled** while this file exists at:

- `.GITHUB-MODE/ACTIVE.md`

## Enforcement behavior

All `github-mode-*` workflows run `.GITHUB-MODE/scripts/check-github-mode-active.ts` as the first blocking guard step. If this file is missing, the guard exits non-zero and prints:

> GitHub Mode disabled by missing ACTIVE.md

That fail-closed guard blocks all subsequent workflow logic.

## Affected workflows

- `.github/workflows/github-mode-ci-scaffold.yml`
- `.github/workflows/github-mode-contracts.yml`
- `.github/workflows/github-mode-oidc-deploy-scaffold.yml`
- `.github/workflows/github-mode-security-lint.yml`
- `.github/workflows/github-mode-security.yml`
- `.github/workflows/github-mode-skill-emergency-revocation.yml`
- `.github/workflows/github-mode-skill-intake.yml`
- `.github/workflows/github-mode-skill-policy-classifier.yml`
- `.github/workflows/github-mode-skill-static-scan.yml`
- `.github/workflows/github-mode-trusted-command.yml`

