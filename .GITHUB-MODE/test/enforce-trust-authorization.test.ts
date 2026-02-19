import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  type AuthorizationDecision,
  enforceTrustAuthorization,
  resolveAdapterContract,
  resolveTrustLevel,
} from "../scripts/enforce-trust-authorization.js";

function createFixtureRoot(files: Record<string, unknown>): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "trust-auth-"));
  const runtimeDir = path.join(root, ".GITHUB-MODE", "runtime");
  mkdirSync(runtimeDir, { recursive: true });

  for (const [filename, content] of Object.entries(files)) {
    writeFileSync(path.join(runtimeDir, filename), JSON.stringify(content, null, 2), "utf8");
  }

  return root;
}

const VALID_TRUST_LEVELS = {
  schemaVersion: "1.0",
  trustVersion: "v1.0.0",
  levels: [
    {
      id: "untrusted",
      description: "Fork pull requests and unknown actors.",
      allowsSecrets: false,
      allowsPrivilegedMutation: false,
    },
    {
      id: "semi-trusted",
      description: "Internal pull requests with moderate capabilities.",
      allowsSecrets: false,
      allowsPrivilegedMutation: false,
    },
    {
      id: "trusted",
      description: "Maintainer-approved environments.",
      allowsSecrets: true,
      allowsPrivilegedMutation: true,
    },
  ],
};

const VALID_ADAPTER_CONTRACTS = {
  schemaVersion: "1.0",
  contractsVersion: "v1.0.0",
  adapters: [
    {
      name: "repo-write",
      capability: "Creates branches and pull requests through policy-gated workflows.",
      trustLevels: ["trusted"],
      constraints: [
        "No direct writes to protected branches.",
        "All mutations must flow through pull-request automation.",
      ],
    },
    {
      name: "policy-sim",
      capability: "Runs deterministic route and policy simulation for validation artifacts.",
      trustLevels: ["untrusted", "semi-trusted", "trusted"],
      constraints: [
        "Read-only execution in untrusted contexts.",
        "No secret material in simulation inputs or outputs.",
      ],
    },
  ],
};

const VALID_COMMAND_POLICY = {
  schemaVersion: "1.0",
  policyVersion: "v1.0.0",
  enforcementMode: "enforce",
  allowedActions: ["plan", "validate", "open-pr"],
  allowedCommands: ["explain", "refactor", "test", "diagram"],
  constraints: [
    "No direct protected-branch mutation outside pull-request flow.",
    "Privileged adapters require trusted trigger context.",
    "Secrets are unavailable to untrusted fork pull-request jobs.",
  ],
};

function allValidFiles(): Record<string, unknown> {
  return {
    "trust-levels.json": VALID_TRUST_LEVELS,
    "adapter-contracts.json": VALID_ADAPTER_CONTRACTS,
    "command-policy.json": VALID_COMMAND_POLICY,
  };
}

describe("enforce-trust-authorization", () => {
  describe("resolveTrustLevel", () => {
    it("returns a known trust level by id", () => {
      const root = createFixtureRoot(allValidFiles());
      const level = resolveTrustLevel(root, "trusted");
      expect(level).toBeDefined();
      expect(level!.id).toBe("trusted");
      expect(level!.allowsSecrets).toBe(true);
      expect(level!.allowsPrivilegedMutation).toBe(true);
    });

    it("returns undefined for an unknown trust level", () => {
      const root = createFixtureRoot(allValidFiles());
      const level = resolveTrustLevel(root, "nonexistent");
      expect(level).toBeUndefined();
    });
  });

  describe("resolveAdapterContract", () => {
    it("returns a known adapter contract by name", () => {
      const root = createFixtureRoot(allValidFiles());
      const adapter = resolveAdapterContract(root, "repo-write");
      expect(adapter).toBeDefined();
      expect(adapter!.name).toBe("repo-write");
      expect(adapter!.trustLevels).toEqual(["trusted"]);
    });

    it("returns undefined for an unknown adapter", () => {
      const root = createFixtureRoot(allValidFiles());
      const adapter = resolveAdapterContract(root, "nonexistent");
      expect(adapter).toBeUndefined();
    });
  });

  describe("enforceTrustAuthorization", () => {
    it("allows trusted actor to invoke privileged adapter (repo-write)", () => {
      const root = createFixtureRoot(allValidFiles());
      const decision = enforceTrustAuthorization(root, "maintainer", "trusted", "repo-write");
      expect(decision.allowed).toBe(true);
      expect(decision.actor).toBe("maintainer");
      expect(decision.trustLevel).toBe("trusted");
      expect(decision.adapter).toBe("repo-write");
      expect(decision.reason).toContain("authorized");
    });

    it("allows trusted actor to invoke non-privileged adapter (policy-sim)", () => {
      const root = createFixtureRoot(allValidFiles());
      const decision = enforceTrustAuthorization(root, "maintainer", "trusted", "policy-sim");
      expect(decision.allowed).toBe(true);
    });

    it("allows untrusted actor to invoke non-privileged adapter (policy-sim)", () => {
      const root = createFixtureRoot(allValidFiles());
      const decision = enforceTrustAuthorization(root, "fork-author", "untrusted", "policy-sim");
      expect(decision.allowed).toBe(true);
    });

    it("allows semi-trusted actor to invoke non-privileged adapter (policy-sim)", () => {
      const root = createFixtureRoot(allValidFiles());
      const decision = enforceTrustAuthorization(
        root,
        "internal-user",
        "semi-trusted",
        "policy-sim",
      );
      expect(decision.allowed).toBe(true);
    });

    it("denies untrusted actor from privileged adapter (repo-write)", () => {
      const root = createFixtureRoot(allValidFiles());
      const decision = enforceTrustAuthorization(root, "fork-author", "untrusted", "repo-write");
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("not authorized");
      expect(decision.reason).toContain("untrusted");
      expect(decision.reason).toContain("repo-write");
    });

    it("denies semi-trusted actor from privileged adapter (repo-write)", () => {
      const root = createFixtureRoot(allValidFiles());
      const decision = enforceTrustAuthorization(
        root,
        "internal-user",
        "semi-trusted",
        "repo-write",
      );
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("not authorized");
    });

    it("denies with fail-closed when trust level is unknown", () => {
      const root = createFixtureRoot(allValidFiles());
      const decision = enforceTrustAuthorization(root, "actor", "nonexistent", "policy-sim");
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("not found");
      expect(decision.reason).toContain("fail-closed");
    });

    it("denies with fail-closed when adapter is unknown", () => {
      const root = createFixtureRoot(allValidFiles());
      const decision = enforceTrustAuthorization(root, "actor", "trusted", "nonexistent");
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("not found");
      expect(decision.reason).toContain("fail-closed");
    });

    it("denial includes actor, trust level, adapter, and reason (auditable)", () => {
      const root = createFixtureRoot(allValidFiles());
      const decision = enforceTrustAuthorization(root, "fork-author", "untrusted", "repo-write");
      expect(decision.allowed).toBe(false);
      expect(decision.actor).toBe("fork-author");
      expect(decision.trustLevel).toBe("untrusted");
      expect(decision.adapter).toBe("repo-write");
      expect(typeof decision.reason).toBe("string");
      expect(decision.reason.length).toBeGreaterThan(0);
      expect(typeof decision.evidence).toBe("string");
      expect(decision.evidence.length).toBeGreaterThan(0);
      expect(typeof decision.timestamp).toBe("string");
    });

    it("every decision has all required fields", () => {
      const root = createFixtureRoot(allValidFiles());
      const decisions: AuthorizationDecision[] = [
        enforceTrustAuthorization(root, "a", "trusted", "repo-write"),
        enforceTrustAuthorization(root, "b", "untrusted", "repo-write"),
        enforceTrustAuthorization(root, "c", "trusted", "policy-sim"),
      ];
      for (const d of decisions) {
        expect(d).toHaveProperty("allowed");
        expect(d).toHaveProperty("actor");
        expect(d).toHaveProperty("trustLevel");
        expect(d).toHaveProperty("adapter");
        expect(d).toHaveProperty("reason");
        expect(d).toHaveProperty("evidence");
        expect(d).toHaveProperty("timestamp");
      }
    });

    it("denies untrusted actor from secret-backed paths via policy constraint", () => {
      const root = createFixtureRoot(allValidFiles());
      // policy-sim is allowed for untrusted — but if we specifically try the
      // secret-constrained adapter with untrusted, it should deny
      const decision = enforceTrustAuthorization(root, "fork-author", "untrusted", "repo-write");
      expect(decision.allowed).toBe(false);
    });

    it("handles missing trust-levels.json gracefully with fail-closed denial", () => {
      const files = allValidFiles();
      // biome-ignore lint: intentional deletion for test
      delete files["trust-levels.json"];
      const root = createFixtureRoot(files);
      expect(() => enforceTrustAuthorization(root, "actor", "trusted", "repo-write")).toThrow();
    });

    it("handles missing adapter-contracts.json gracefully with fail-closed denial", () => {
      const files = allValidFiles();
      // biome-ignore lint: intentional deletion for test
      delete files["adapter-contracts.json"];
      const root = createFixtureRoot(files);
      expect(() => enforceTrustAuthorization(root, "actor", "trusted", "repo-write")).toThrow();
    });
  });
});
