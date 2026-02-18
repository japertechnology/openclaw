# GitHub Mode test fixtures

Reusable fixture files for GitHub Mode test cases.

## Purpose

Fixtures model realistic workflow and policy inputs so tests can validate expected pass/fail behavior without inline YAML noise.

## Structure

- `security-lint/`: workflow YAML fixtures used by GitHub Mode security lint tests.

## Guidelines

- Keep fixture names scenario-driven (for example, `untrusted-fork-safe.yml`).
- Keep fixtures minimal while preserving the behavior under test.
- When adding a fixture, add or update the test that consumes it in the same PR.
