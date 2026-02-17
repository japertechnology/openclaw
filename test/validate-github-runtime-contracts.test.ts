import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SCRIPT = "scripts/validate-github-runtime-contracts.ts";

function runValidator(): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`node --import tsx ${SCRIPT}`, {
      encoding: "utf8",
      cwd: ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout: stdout.trim(), exitCode: 0 };
  } catch (error) {
    const err = error as { status: number; stderr?: string; stdout?: string };
    return { stdout: (err.stderr ?? err.stdout ?? "").trim(), exitCode: err.status };
  }
}

function withTempFile<T>(filePath: string, content: string, fn: () => T): T {
  const absolutePath = path.join(ROOT, filePath);
  const original = readFileSync(absolutePath, "utf8");
  writeFileSync(absolutePath, content, "utf8");
  try {
    return fn();
  } finally {
    writeFileSync(absolutePath, original, "utf8");
  }
}

function withRemovedFile<T>(filePath: string, fn: () => T): T {
  const absolutePath = path.join(ROOT, filePath);
  const original = readFileSync(absolutePath, "utf8");
  rmSync(absolutePath);
  try {
    return fn();
  } finally {
    writeFileSync(absolutePath, original, "utf8");
  }
}

describe("validate-github-runtime-contracts", () => {
  it("passes with valid contracts", () => {
    const result = runValidator();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("validation passed");
  });

  it("fails when runtime-manifest.json is missing a required key", () => {
    const result = withTempFile(
      "runtime/github/runtime-manifest.json",
      JSON.stringify({ schemaVersion: "1.0" }),
      runValidator,
    );
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("missing required key");
  });

  it("fails when parity-matrix.json has an invalid parity value", () => {
    const invalidMatrix = {
      schemaVersion: "1.0",
      matrixVersion: "v1.0.0",
      mappings: [
        {
          workflow: "test",
          installedRuntime: "test",
          githubMode: "test",
          parity: "full",
        },
      ],
    };
    const result = withTempFile(
      "runtime/github/parity-matrix.json",
      JSON.stringify(invalidMatrix, null, 2),
      runValidator,
    );
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("invalid parity value");
  });

  it("fails when installed-only parity entry lacks owner", () => {
    const noOwner = {
      schemaVersion: "1.0",
      matrixVersion: "v1.0.0",
      mappings: [
        {
          workflow: "test",
          installedRuntime: "test",
          githubMode: "test",
          parity: "installed-only",
          rationale: "test rationale",
        },
      ],
    };
    const result = withTempFile(
      "runtime/github/parity-matrix.json",
      JSON.stringify(noOwner, null, 2),
      runValidator,
    );
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("requires both");
  });

  it("fails when convergence map has no required signal", () => {
    const noRequiredSignal = {
      schemaVersion: "1.0",
      convergenceVersion: "v1.0.0",
      acceptanceCriteria: ["Some criteria"],
      reconciliationSignals: [{ signal: "test", source: "test", required: false }],
    };
    const result = withTempFile(
      "runtime/github/workspace-convergence-map.json",
      JSON.stringify(noRequiredSignal, null, 2),
      runValidator,
    );
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("required=true");
  });

  it("fails when manifest does not match schema", () => {
    const badManifest = {
      schemaVersion: "1.0",
      manifestVersion: "v1.0.0",
      components: [
        {
          id: "INVALID_ID_WITH_CAPS",
          version: "v1.0.0",
          owner: "@test",
        },
      ],
    };
    const result = withTempFile(
      "runtime/github/runtime-manifest.json",
      JSON.stringify(badManifest, null, 2),
      runValidator,
    );
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("schema validation failed");
  });

  it("accepts valid parity values: native, adapter, emulated, installed-only", () => {
    const validMatrix = {
      schemaVersion: "1.0",
      matrixVersion: "v1.0.0",
      mappings: [
        { workflow: "w1", installedRuntime: "ir1", githubMode: "gm1", parity: "native" },
        { workflow: "w2", installedRuntime: "ir2", githubMode: "gm2", parity: "adapter" },
        { workflow: "w3", installedRuntime: "ir3", githubMode: "gm3", parity: "emulated" },
        {
          workflow: "w4",
          installedRuntime: "ir4",
          githubMode: "gm4",
          parity: "installed-only",
          owner: "@test",
          rationale: "Test",
        },
      ],
    };
    const result = withTempFile(
      "runtime/github/parity-matrix.json",
      JSON.stringify(validMatrix, null, 2),
      runValidator,
    );
    expect(result.exitCode).toBe(0);
  });
});
