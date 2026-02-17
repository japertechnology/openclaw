/**
 * GitHub Mode Fork Setup
 *
 * Validates prerequisites and installs GitHub Mode components into a
 * forked OpenClaw repository. Designed to be run from the upstream repo
 * root, targeting a local clone of the user's fork.
 *
 * Usage:
 *   node --import tsx scripts/setup-github-mode-fork.ts <target-dir>
 *   pnpm github-mode:setup-fork <target-dir>
 *
 * Options:
 *   --dry-run   Show what would be copied without making changes.
 *   --force     Overwrite existing files in the target directory.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

// ── Component registry ───────────────────────────────────────────────

export type ComponentGroup = {
  id: string;
  label: string;
  description: string;
  paths: string[];
};

/**
 * All GitHub Mode component groups that must be installed into a fork.
 * Paths are relative to the repository root.
 */
export const COMPONENT_GROUPS: ComponentGroup[] = [
  {
    id: "runtime-contracts",
    label: "Runtime Contracts",
    description:
      "Machine-readable runtime contracts, schemas, and policies that define GitHub Mode behavior.",
    paths: ["runtime/github/"],
  },
  {
    id: "workflows",
    label: "GitHub Actions Workflows",
    description:
      "GitHub Mode CI/CD workflows for contract validation, commands, and policy enforcement.",
    paths: [".github/workflows/github-mode-contracts.yml"],
  },
  {
    id: "docs",
    label: "GitHub Mode Documentation",
    description: "Architecture docs, ADRs, security analysis, planning, and implementation guides.",
    paths: ["docs/github-mode/"],
  },
  {
    id: "validation-scripts",
    label: "Validation Scripts",
    description: "Contract validation and upstream-additive-change guard scripts.",
    paths: [
      "scripts/validate-github-runtime-contracts.ts",
      "scripts/check-upstream-additions-only.ts",
      "scripts/setup-github-mode-fork.ts",
    ],
  },
  {
    id: "tests",
    label: "Test Coverage",
    description: "Test suites for contract validation and upstream-additions guard.",
    paths: [
      "test/validate-github-runtime-contracts.test.ts",
      "test/check-upstream-additions-only.test.ts",
      "test/setup-github-mode-fork.test.ts",
    ],
  },
  {
    id: "entrypoints",
    label: "Repository Entrypoints",
    description: "Top-level GitHub Mode README files for fork orientation.",
    paths: [".GITHUB-MODE-ACTIVE.md", ".GITHUB-MODE-README.md"],
  },
];

// ── Prerequisite checks ──────────────────────────────────────────────

export type PrerequisiteResult = {
  ok: boolean;
  label: string;
  detail: string;
};

export function checkSourceRoot(sourceDir: string): PrerequisiteResult {
  const manifestPath = path.join(sourceDir, "runtime/github/runtime-manifest.json");
  const ok = existsSync(manifestPath);
  return {
    ok,
    label: "Source repo contains runtime contracts",
    detail: ok ? manifestPath : `Missing: ${manifestPath}`,
  };
}

export function checkTargetIsGitRepo(targetDir: string): PrerequisiteResult {
  const gitDir = path.join(targetDir, ".git");
  const ok = existsSync(gitDir);
  return {
    ok,
    label: "Target directory is a git repository",
    detail: ok ? gitDir : `Missing: ${gitDir}`,
  };
}

export function checkTargetHasPackageJson(targetDir: string): PrerequisiteResult {
  const pkgPath = path.join(targetDir, "package.json");
  const ok = existsSync(pkgPath);
  return {
    ok,
    label: "Target directory has package.json",
    detail: ok ? pkgPath : `Missing: ${pkgPath}`,
  };
}

export function checkAllPrerequisites(sourceDir: string, targetDir: string): PrerequisiteResult[] {
  return [
    checkSourceRoot(sourceDir),
    checkTargetIsGitRepo(targetDir),
    checkTargetHasPackageJson(targetDir),
  ];
}

// ── File operations ──────────────────────────────────────────────────

export type CopyPlan = {
  source: string;
  destination: string;
  isDirectory: boolean;
};

/**
 * Resolves all files that need to be copied for a given component group.
 * Directories are expanded to individual files; missing source files are skipped.
 */
export function resolveCopyPlan(
  sourceDir: string,
  targetDir: string,
  group: ComponentGroup,
): CopyPlan[] {
  const plans: CopyPlan[] = [];

  for (const p of group.paths) {
    const sourcePath = path.join(sourceDir, p);

    if (!existsSync(sourcePath)) {
      continue;
    }

    const stat = statSync(sourcePath);
    if (stat.isDirectory()) {
      plans.push({
        source: sourcePath,
        destination: path.join(targetDir, p),
        isDirectory: true,
      });
    } else {
      plans.push({
        source: sourcePath,
        destination: path.join(targetDir, p),
        isDirectory: false,
      });
    }
  }

  return plans;
}

export type InstallResult = {
  group: string;
  copiedPaths: string[];
  skippedPaths: string[];
  errors: string[];
};

/**
 * Execute a copy plan for one component group.
 */
export function installGroup(
  sourceDir: string,
  targetDir: string,
  group: ComponentGroup,
  options: { dryRun: boolean; force: boolean },
): InstallResult {
  const result: InstallResult = {
    group: group.id,
    copiedPaths: [],
    skippedPaths: [],
    errors: [],
  };

  const plans = resolveCopyPlan(sourceDir, targetDir, group);

  for (const plan of plans) {
    try {
      if (existsSync(plan.destination) && !options.force) {
        result.skippedPaths.push(plan.destination);
        continue;
      }

      if (options.dryRun) {
        result.copiedPaths.push(plan.destination);
        continue;
      }

      // Ensure parent directory exists
      const parentDir = plan.isDirectory ? plan.destination : path.dirname(plan.destination);
      mkdirSync(parentDir, { recursive: true });

      if (plan.isDirectory) {
        cpSync(plan.source, plan.destination, { recursive: true, force: options.force });
      } else {
        cpSync(plan.source, plan.destination, { force: options.force });
      }
      result.copiedPaths.push(plan.destination);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`${plan.destination}: ${message}`);
    }
  }

  return result;
}

// ── Summary generation ───────────────────────────────────────────────

/**
 * Collect all paths across all component groups for summary display.
 */
export function collectAllSourcePaths(sourceDir: string): string[] {
  const paths: string[] = [];
  for (const group of COMPONENT_GROUPS) {
    for (const p of group.paths) {
      const sourcePath = path.join(sourceDir, p);
      if (!existsSync(sourcePath)) {
        continue;
      }
      const stat = statSync(sourcePath);
      if (stat.isDirectory()) {
        collectFilesRecursive(sourcePath, paths);
      } else {
        paths.push(sourcePath);
      }
    }
  }
  return paths;
}

function collectFilesRecursive(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFilesRecursive(fullPath, out);
    } else {
      out.push(fullPath);
    }
  }
}

// ── CLI entrypoint ───────────────────────────────────────────────────

export type SetupOptions = {
  sourceDir: string;
  targetDir: string;
  dryRun: boolean;
  force: boolean;
};

export function parseArgs(argv: string[]): SetupOptions | { error: string } {
  const args = argv.slice(2);
  let targetDir: string | undefined;
  let dryRun = false;
  let force = false;

  for (const arg of args) {
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--force") {
      force = true;
    } else if (arg === "--help" || arg === "-h") {
      return {
        error:
          "Usage: pnpm github-mode:setup-fork <target-dir> [--dry-run] [--force]\n\n" +
          "Installs GitHub Mode components into a forked OpenClaw repository.\n\n" +
          "Arguments:\n" +
          "  <target-dir>  Path to the local clone of your OpenClaw fork.\n\n" +
          "Options:\n" +
          "  --dry-run     Show what would be copied without making changes.\n" +
          "  --force       Overwrite existing files in the target directory.\n" +
          "  --help, -h    Show this help message.\n",
      };
    } else if (!arg.startsWith("-")) {
      targetDir = arg;
    } else {
      return { error: `Unknown option: ${arg}` };
    }
  }

  if (!targetDir) {
    return {
      error:
        "Missing required argument: <target-dir>\n\n" +
        "Usage: pnpm github-mode:setup-fork <target-dir> [--dry-run] [--force]",
    };
  }

  const resolvedTarget = path.resolve(targetDir);
  if (!existsSync(resolvedTarget)) {
    return { error: `Target directory does not exist: ${resolvedTarget}` };
  }

  return {
    sourceDir: process.cwd(),
    targetDir: resolvedTarget,
    dryRun,
    force,
  };
}

export function runSetup(options: SetupOptions): {
  success: boolean;
  results: InstallResult[];
  prerequisites: PrerequisiteResult[];
} {
  const prerequisites = checkAllPrerequisites(options.sourceDir, options.targetDir);
  const failed = prerequisites.filter((p) => !p.ok);

  if (failed.length > 0) {
    return { success: false, results: [], prerequisites };
  }

  const results: InstallResult[] = [];
  for (const group of COMPONENT_GROUPS) {
    const result = installGroup(options.sourceDir, options.targetDir, group, {
      dryRun: options.dryRun,
      force: options.force,
    });
    results.push(result);
  }

  const hasErrors = results.some((r) => r.errors.length > 0);
  return { success: !hasErrors, results, prerequisites };
}

function main(): void {
  const parsed = parseArgs(process.argv);
  if ("error" in parsed) {
    console.error(parsed.error);
    process.exit(1);
  }

  console.log("🦞 OpenClaw GitHub Mode — Fork Installation\n");

  if (parsed.dryRun) {
    console.log("  [DRY RUN] No files will be modified.\n");
  }

  // Prerequisites
  console.log("Prerequisites:");
  const prerequisites = checkAllPrerequisites(parsed.sourceDir, parsed.targetDir);
  for (const check of prerequisites) {
    const icon = check.ok ? "✅" : "❌";
    console.log(`  ${icon} ${check.label}`);
    if (!check.ok) {
      console.log(`     ${check.detail}`);
    }
  }
  console.log();

  const failed = prerequisites.filter((p) => !p.ok);
  if (failed.length > 0) {
    console.error("Prerequisites not met. Aborting.\n");
    process.exit(1);
  }

  // Install components
  console.log("Installing components:\n");
  const results: InstallResult[] = [];
  for (const group of COMPONENT_GROUPS) {
    const result = installGroup(parsed.sourceDir, parsed.targetDir, group, {
      dryRun: parsed.dryRun,
      force: parsed.force,
    });
    results.push(result);

    const icon = result.errors.length > 0 ? "❌" : "✅";
    console.log(`  ${icon} ${group.label} (${group.id})`);
    console.log(`     ${group.description}`);

    if (result.copiedPaths.length > 0) {
      const verb = parsed.dryRun ? "Would copy" : "Copied";
      console.log(`     ${verb}: ${result.copiedPaths.length} path(s)`);
    }
    if (result.skippedPaths.length > 0) {
      console.log(`     Skipped (exists): ${result.skippedPaths.length} path(s)`);
    }
    if (result.errors.length > 0) {
      for (const err of result.errors) {
        console.log(`     Error: ${err}`);
      }
    }
    console.log();
  }

  // Summary
  const totalCopied = results.reduce((sum, r) => sum + r.copiedPaths.length, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skippedPaths.length, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  console.log("Summary:");
  console.log(`  ${parsed.dryRun ? "Would copy" : "Copied"}: ${totalCopied} path(s)`);
  console.log(`  Skipped: ${totalSkipped} path(s)`);
  console.log(`  Errors: ${totalErrors}`);
  console.log();

  if (totalErrors > 0) {
    console.error("Installation completed with errors.\n");
    process.exit(1);
  }

  if (!parsed.dryRun) {
    console.log("Next steps:");
    console.log("  1. cd " + parsed.targetDir);
    console.log("  2. pnpm install");
    console.log("  3. pnpm contracts:github:validate");
    console.log("  4. git add -A && git commit -m 'chore: install GitHub Mode components'");
    console.log("  5. git push");
    console.log();
    console.log("See docs/github-mode/fork-installation.md for full setup guide.");
  }

  console.log("\n🦞 Done.\n");
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("setup-github-mode-fork.ts")
) {
  main();
}
