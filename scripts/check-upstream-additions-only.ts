/**
 * Upstream additions-only guard.
 *
 * Ensures that GitHub Mode changes are purely additive relative to
 * upstream OpenClaw — no modifications to upstream-owned files.
 * This allows the fork to cleanly pull upstream upgrades.
 *
 * Owned paths (safe to add/modify):
 *   - docs/github-mode/**
 *   - runtime/github/**
 *   - .github/workflows/github-mode-*
 *   - scripts/validate-github-runtime-contracts.ts
 *   - scripts/check-upstream-additions-only.ts
 *
 * Everything else is upstream-owned and must not be modified.
 */

import { execSync } from "node:child_process";
import process from "node:process";

const GITHUB_MODE_OWNED_PATTERNS = [
  /^docs\/github-mode\//,
  /^runtime\/github\//,
  /^\.github\/workflows\/github-mode-/,
  /^scripts\/validate-github-runtime-contracts\.ts$/,
  /^scripts\/check-upstream-additions-only\.ts$/,
];

function isGithubModeOwned(filePath: string): boolean {
  return GITHUB_MODE_OWNED_PATTERNS.some((pattern) => pattern.test(filePath));
}

function getModifiedUpstreamFiles(): string[] {
  // Find the merge base with main/default branch
  let baseBranch = "main";
  try {
    execSync(`git rev-parse --verify origin/${baseBranch}`, { stdio: "pipe" });
  } catch {
    try {
      execSync(`git rev-parse --verify origin/master`, { stdio: "pipe" });
      baseBranch = "master";
    } catch {
      // If no remote branches, compare against HEAD~1
      console.log("No remote base branch found. Comparing against HEAD~1.");
      baseBranch = "";
    }
  }

  const baseRef = baseBranch ? `origin/${baseBranch}` : "HEAD~1";

  let diffOutput: string;
  try {
    diffOutput = execSync(`git diff --name-status ${baseRef}...HEAD`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    // Fallback: compare against parent commit
    try {
      diffOutput = execSync(`git diff --name-status HEAD~1..HEAD`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    } catch {
      console.log("Cannot determine diff base. Skipping additions-only check.");
      return [];
    }
  }

  if (!diffOutput) {
    return [];
  }

  const violations: string[] = [];

  for (const line of diffOutput.split("\n")) {
    const parts = line.split("\t");
    if (parts.length < 2) {
      continue;
    }

    const status = parts[0].trim();
    const filePath = parts[1].trim();

    // 'A' = Added (always safe)
    // 'M' = Modified, 'D' = Deleted, 'R' = Renamed — only safe for GitHub-Mode-owned paths
    if (status === "A") {
      continue;
    }

    if (!isGithubModeOwned(filePath)) {
      violations.push(`${status}\t${filePath}`);
    }
  }

  return violations;
}

function main(): void {
  console.log("Checking that GitHub Mode changes are additions-only...\n");

  const violations = getModifiedUpstreamFiles();

  if (violations.length === 0) {
    console.log(
      "✅ All changes are additive. No upstream-owned files were modified.\n" +
        "   The fork can cleanly pull upstream OpenClaw upgrades.",
    );
    return;
  }

  console.error("❌ Non-additive changes detected in upstream-owned files:\n");
  for (const v of violations) {
    console.error(`   ${v}`);
  }
  console.error(
    "\nGitHub Mode changes must be purely additive — only new files or\n" +
      "modifications to GitHub-Mode-owned paths are allowed.\n" +
      "\nOwned paths:\n" +
      "  - docs/github-mode/**\n" +
      "  - runtime/github/**\n" +
      "  - .github/workflows/github-mode-*\n" +
      "  - scripts/validate-github-runtime-contracts.ts\n" +
      "  - scripts/check-upstream-additions-only.ts\n" +
      "\nTo fix: move your changes into GitHub-Mode-owned paths or\n" +
      "use the extension system (extensions/) for runtime additions.",
  );
  process.exit(1);
}

main();
