import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMPONENT_GROUPS,
  checkAllPrerequisites,
  checkSourceRoot,
  checkTargetHasPackageJson,
  checkTargetIsGitRepo,
  collectAllSourcePaths,
  installGroup,
  parseArgs,
  resolveCopyPlan,
  runSetup,
} from "../scripts/setup-github-mode-fork.js";

const ROOT = process.cwd();

function makeTempDir(): string {
  return mkdtempSync(path.join(tmpdir(), "github-mode-fork-test-"));
}

function makeFakeFork(tmpDir: string): string {
  const forkDir = path.join(tmpDir, "fork");
  mkdirSync(forkDir, { recursive: true });
  mkdirSync(path.join(forkDir, ".git"), { recursive: true });
  writeFileSync(path.join(forkDir, "package.json"), '{"name": "test-fork"}');
  return forkDir;
}

describe("setup-github-mode-fork", () => {
  describe("COMPONENT_GROUPS", () => {
    it("has at least 5 component groups", () => {
      expect(COMPONENT_GROUPS.length).toBeGreaterThanOrEqual(5);
    });

    it("every group has required fields", () => {
      for (const group of COMPONENT_GROUPS) {
        expect(group.id).toBeTruthy();
        expect(group.label).toBeTruthy();
        expect(group.description).toBeTruthy();
        expect(group.paths.length).toBeGreaterThan(0);
      }
    });

    it("includes runtime-contracts group", () => {
      const group = COMPONENT_GROUPS.find((g) => g.id === "runtime-contracts");
      expect(group).toBeDefined();
      expect(group?.paths).toContain("runtime/github/");
    });

    it("includes workflows group", () => {
      const group = COMPONENT_GROUPS.find((g) => g.id === "workflows");
      expect(group).toBeDefined();
    });
  });

  describe("prerequisite checks", () => {
    it("checkSourceRoot passes for the real repo", () => {
      const result = checkSourceRoot(ROOT);
      expect(result.ok).toBe(true);
    });

    it("checkSourceRoot fails for a random directory", () => {
      const tmp = makeTempDir();
      try {
        const result = checkSourceRoot(tmp);
        expect(result.ok).toBe(false);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it("checkTargetIsGitRepo passes for a directory with .git", () => {
      const tmp = makeTempDir();
      try {
        mkdirSync(path.join(tmp, ".git"), { recursive: true });
        const result = checkTargetIsGitRepo(tmp);
        expect(result.ok).toBe(true);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it("checkTargetIsGitRepo fails for a directory without .git", () => {
      const tmp = makeTempDir();
      try {
        const result = checkTargetIsGitRepo(tmp);
        expect(result.ok).toBe(false);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it("checkTargetHasPackageJson passes when package.json exists", () => {
      const tmp = makeTempDir();
      try {
        writeFileSync(path.join(tmp, "package.json"), "{}");
        const result = checkTargetHasPackageJson(tmp);
        expect(result.ok).toBe(true);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it("checkTargetHasPackageJson fails when missing", () => {
      const tmp = makeTempDir();
      try {
        const result = checkTargetHasPackageJson(tmp);
        expect(result.ok).toBe(false);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it("checkAllPrerequisites returns 3 checks", () => {
      const tmp = makeTempDir();
      try {
        const forkDir = makeFakeFork(tmp);
        const results = checkAllPrerequisites(ROOT, forkDir);
        expect(results).toHaveLength(3);
        expect(results.every((r) => r.ok)).toBe(true);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  describe("resolveCopyPlan", () => {
    it("resolves directory paths for runtime-contracts", () => {
      const tmp = makeTempDir();
      try {
        const forkDir = makeFakeFork(tmp);
        const group = COMPONENT_GROUPS.find((g) => g.id === "runtime-contracts")!;
        const plans = resolveCopyPlan(ROOT, forkDir, group);
        expect(plans.length).toBeGreaterThan(0);
        expect(plans[0].isDirectory).toBe(true);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it("resolves file paths for validation-scripts", () => {
      const tmp = makeTempDir();
      try {
        const forkDir = makeFakeFork(tmp);
        const group = COMPONENT_GROUPS.find((g) => g.id === "validation-scripts")!;
        const plans = resolveCopyPlan(ROOT, forkDir, group);
        expect(plans.length).toBeGreaterThan(0);
        expect(plans.some((p) => !p.isDirectory)).toBe(true);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  describe("installGroup", () => {
    it("copies runtime-contracts to target directory", () => {
      const tmp = makeTempDir();
      try {
        const forkDir = makeFakeFork(tmp);
        const group = COMPONENT_GROUPS.find((g) => g.id === "runtime-contracts")!;
        const result = installGroup(ROOT, forkDir, group, {
          dryRun: false,
          force: false,
        });

        expect(result.errors).toHaveLength(0);
        expect(result.copiedPaths.length).toBeGreaterThan(0);

        // Verify the manifest was actually copied
        const manifestPath = path.join(forkDir, "runtime/github/runtime-manifest.json");
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        expect(manifest.schemaVersion).toBe("1.0");
        expect(manifest.components).toBeDefined();
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it("skips existing files without --force", () => {
      const tmp = makeTempDir();
      try {
        const forkDir = makeFakeFork(tmp);
        const group = COMPONENT_GROUPS.find((g) => g.id === "entrypoints")!;

        // First install
        installGroup(ROOT, forkDir, group, { dryRun: false, force: false });

        // Second install should skip
        const result = installGroup(ROOT, forkDir, group, {
          dryRun: false,
          force: false,
        });

        expect(result.skippedPaths.length).toBeGreaterThan(0);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it("overwrites existing files with --force", () => {
      const tmp = makeTempDir();
      try {
        const forkDir = makeFakeFork(tmp);
        const group = COMPONENT_GROUPS.find((g) => g.id === "entrypoints")!;

        // First install
        installGroup(ROOT, forkDir, group, { dryRun: false, force: false });

        // Second install with force should overwrite
        const result = installGroup(ROOT, forkDir, group, {
          dryRun: false,
          force: true,
        });

        expect(result.copiedPaths.length).toBeGreaterThan(0);
        expect(result.skippedPaths).toHaveLength(0);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it("dry run does not create files", () => {
      const tmp = makeTempDir();
      try {
        const forkDir = makeFakeFork(tmp);
        const group = COMPONENT_GROUPS.find((g) => g.id === "runtime-contracts")!;
        const result = installGroup(ROOT, forkDir, group, {
          dryRun: true,
          force: false,
        });

        expect(result.copiedPaths.length).toBeGreaterThan(0);
        expect(result.errors).toHaveLength(0);

        // File should NOT exist
        const manifestPath = path.join(forkDir, "runtime/github/runtime-manifest.json");
        expect(() => readFileSync(manifestPath)).toThrow();
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  describe("collectAllSourcePaths", () => {
    it("finds source files from the real repo", () => {
      const paths = collectAllSourcePaths(ROOT);
      expect(paths.length).toBeGreaterThan(10);
    });
  });

  describe("parseArgs", () => {
    it("parses target directory", () => {
      const result = parseArgs(["node", "script.ts", ROOT]);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.targetDir).toBe(ROOT);
        expect(result.dryRun).toBe(false);
        expect(result.force).toBe(false);
      }
    });

    it("parses --dry-run flag", () => {
      const result = parseArgs(["node", "script.ts", ROOT, "--dry-run"]);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.dryRun).toBe(true);
      }
    });

    it("parses --force flag", () => {
      const result = parseArgs(["node", "script.ts", ROOT, "--force"]);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.force).toBe(true);
      }
    });

    it("returns error for missing target", () => {
      const result = parseArgs(["node", "script.ts"]);
      expect("error" in result).toBe(true);
    });

    it("returns error for nonexistent target", () => {
      const result = parseArgs(["node", "script.ts", "/nonexistent/path"]);
      expect("error" in result).toBe(true);
    });

    it("returns help text for --help", () => {
      const result = parseArgs(["node", "script.ts", "--help"]);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Usage:");
      }
    });
  });

  describe("runSetup", () => {
    it("installs all components into a fake fork", () => {
      const tmp = makeTempDir();
      try {
        const forkDir = makeFakeFork(tmp);
        const result = runSetup({
          sourceDir: ROOT,
          targetDir: forkDir,
          dryRun: false,
          force: false,
        });

        expect(result.success).toBe(true);
        expect(result.prerequisites.every((p) => p.ok)).toBe(true);
        expect(result.results.length).toBe(COMPONENT_GROUPS.length);

        // Verify key files exist
        const manifestPath = path.join(forkDir, "runtime/github/runtime-manifest.json");
        expect(JSON.parse(readFileSync(manifestPath, "utf8")).schemaVersion).toBe("1.0");

        const activePath = path.join(forkDir, ".GITHUB-MODE-ACTIVE.md");
        expect(readFileSync(activePath, "utf8")).toContain("GitHub Mode");
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it("fails when prerequisites are not met", () => {
      const tmp = makeTempDir();
      try {
        // No .git directory
        writeFileSync(path.join(tmp, "package.json"), "{}");
        const result = runSetup({
          sourceDir: ROOT,
          targetDir: tmp,
          dryRun: false,
          force: false,
        });

        expect(result.success).toBe(false);
        expect(result.prerequisites.some((p) => !p.ok)).toBe(true);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it("dry run succeeds without creating files", () => {
      const tmp = makeTempDir();
      try {
        const forkDir = makeFakeFork(tmp);
        const result = runSetup({
          sourceDir: ROOT,
          targetDir: forkDir,
          dryRun: true,
          force: false,
        });

        expect(result.success).toBe(true);

        // Verify files were NOT created
        const manifestPath = path.join(forkDir, "runtime/github/runtime-manifest.json");
        expect(() => readFileSync(manifestPath)).toThrow();
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });
});
