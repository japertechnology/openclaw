import { describe, expect, it } from "vitest";

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

type DiffEntry = { status: string; path: string };

function findViolations(entries: DiffEntry[]): string[] {
  const violations: string[] = [];
  for (const entry of entries) {
    if (entry.status === "A") {
      continue;
    }
    if (!isGithubModeOwned(entry.path)) {
      violations.push(`${entry.status}\t${entry.path}`);
    }
  }
  return violations;
}

describe("isGithubModeOwned", () => {
  it("accepts docs/github-mode paths", () => {
    expect(isGithubModeOwned("docs/github-mode/README.md")).toBe(true);
    expect(isGithubModeOwned("docs/github-mode/adr/0001-foo.md")).toBe(true);
  });

  it("accepts runtime/github paths", () => {
    expect(isGithubModeOwned("runtime/github/runtime-manifest.json")).toBe(true);
    expect(isGithubModeOwned("runtime/github/parity-matrix.json")).toBe(true);
  });

  it("accepts github-mode workflow files", () => {
    expect(isGithubModeOwned(".github/workflows/github-mode-contracts.yml")).toBe(true);
    expect(isGithubModeOwned(".github/workflows/github-mode-build.yml")).toBe(true);
  });

  it("accepts owned scripts", () => {
    expect(isGithubModeOwned("scripts/validate-github-runtime-contracts.ts")).toBe(true);
    expect(isGithubModeOwned("scripts/check-upstream-additions-only.ts")).toBe(true);
  });

  it("rejects upstream files", () => {
    expect(isGithubModeOwned("package.json")).toBe(false);
    expect(isGithubModeOwned("src/index.ts")).toBe(false);
    expect(isGithubModeOwned(".github/workflows/ci.yml")).toBe(false);
    expect(isGithubModeOwned("scripts/other-script.ts")).toBe(false);
    expect(isGithubModeOwned("docs/configuration.md")).toBe(false);
  });

  it("rejects paths that partially match owned patterns", () => {
    expect(isGithubModeOwned("docs/github-mode-extra.md")).toBe(false);
    expect(isGithubModeOwned("runtime/github-other/foo.json")).toBe(false);
  });
});

describe("findViolations", () => {
  it("allows all additions regardless of path", () => {
    const entries: DiffEntry[] = [
      { status: "A", path: "package.json" },
      { status: "A", path: "src/new-file.ts" },
      { status: "A", path: "docs/github-mode/new.md" },
    ];
    expect(findViolations(entries)).toEqual([]);
  });

  it("allows modifications to github-mode-owned paths", () => {
    const entries: DiffEntry[] = [
      { status: "M", path: "docs/github-mode/README.md" },
      { status: "M", path: "runtime/github/parity-matrix.json" },
      { status: "M", path: "scripts/validate-github-runtime-contracts.ts" },
    ];
    expect(findViolations(entries)).toEqual([]);
  });

  it("flags modifications to upstream files", () => {
    const entries: DiffEntry[] = [
      { status: "M", path: "package.json" },
      { status: "A", path: "docs/github-mode/new.md" },
    ];
    expect(findViolations(entries)).toEqual(["M\tpackage.json"]);
  });

  it("flags deletions of upstream files", () => {
    const entries: DiffEntry[] = [{ status: "D", path: "src/old-file.ts" }];
    expect(findViolations(entries)).toEqual(["D\tsrc/old-file.ts"]);
  });

  it("reports multiple violations", () => {
    const entries: DiffEntry[] = [
      { status: "M", path: "package.json" },
      { status: "M", path: ".github/workflows/ci.yml" },
      { status: "D", path: "src/removed.ts" },
      { status: "A", path: "runtime/github/new-contract.json" },
    ];
    const violations = findViolations(entries);
    expect(violations).toHaveLength(3);
    expect(violations).toContain("M\tpackage.json");
    expect(violations).toContain("M\t.github/workflows/ci.yml");
    expect(violations).toContain("D\tsrc/removed.ts");
  });
});
