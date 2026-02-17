import Ajv from "ajv";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

type JsonObject = Record<string, unknown>;

type ContractCheck = {
  file: string;
  requiredKeys: string[];
};

const ROOT = process.cwd();

const requiredContracts: ContractCheck[] = [
  {
    file: "runtime/github/runtime-manifest.json",
    requiredKeys: ["schemaVersion", "manifestVersion", "components"],
  },
  {
    file: "runtime/github/command-policy.json",
    requiredKeys: [
      "schemaVersion",
      "policyVersion",
      "allowedActions",
      "constraints",
      "enforcementMode",
    ],
  },
  {
    file: "runtime/github/parity-matrix.json",
    requiredKeys: ["schemaVersion", "matrixVersion", "mappings"],
  },
  {
    file: "runtime/github/convergence-map.json",
    requiredKeys: [
      "schemaVersion",
      "convergenceVersion",
      "acceptanceCriteria",
      "reconciliationSignals",
    ],
  },
];

function readJson(filePath: string): JsonObject {
  const absolutePath = path.join(ROOT, filePath);
  const raw = readFileSync(absolutePath, "utf8");
  return JSON.parse(raw) as JsonObject;
}

function assertRequiredKeys(filePath: string, data: JsonObject, keys: string[]): void {
  for (const key of keys) {
    if (!(key in data)) {
      throw new Error(`${filePath}: missing required key \`${key}\``);
    }
  }
}

function validateManifestSchema(): void {
  const schemaPath = "runtime/github/manifest.schema.json";
  const manifestPath = "runtime/github/runtime-manifest.json";
  const schema = readJson(schemaPath);
  const manifest = readJson(manifestPath);

  const ajv = new Ajv({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  const valid = validate(manifest);
  if (!valid) {
    const errors = validate.errors
      ?.map((error) => `${error.instancePath || "/"} ${error.message}`)
      .join("; ");
    throw new Error(`${manifestPath}: schema validation failed (${errors ?? "unknown error"})`);
  }
}

function validateParityMatrix(): void {
  const parityPath = "runtime/github/parity-matrix.json";
  const parity = readJson(parityPath);
  const mappings = parity.mappings;

  if (!Array.isArray(mappings) || mappings.length === 0) {
    throw new Error(`${parityPath}: mappings must be a non-empty array`);
  }

  for (const [index, mapping] of mappings.entries()) {
    if (!mapping || typeof mapping !== "object") {
      throw new Error(`${parityPath}: mappings[${index}] must be an object`);
    }

    const row = mapping as JsonObject;
    for (const required of ["workflow", "installedRuntime", "githubMode", "parity"]) {
      if (!(required in row)) {
        throw new Error(`${parityPath}: mappings[${index}] missing required key \`${required}\``);
      }
    }

    if (row.parity === "installed-only") {
      if (!("owner" in row) || !("rationale" in row)) {
        throw new Error(
          `${parityPath}: mappings[${index}] parity=installed-only requires both \`owner\` and \`rationale\``,
        );
      }
    }
  }
}

function validateConvergenceMap(): void {
  const convergencePath = "runtime/github/convergence-map.json";
  const convergence = readJson(convergencePath);

  const acceptanceCriteria = convergence.acceptanceCriteria;
  if (!Array.isArray(acceptanceCriteria) || acceptanceCriteria.length === 0) {
    throw new Error(`${convergencePath}: acceptanceCriteria must be a non-empty array`);
  }

  const reconciliationSignals = convergence.reconciliationSignals;
  if (!Array.isArray(reconciliationSignals) || reconciliationSignals.length === 0) {
    throw new Error(`${convergencePath}: reconciliationSignals must be a non-empty array`);
  }

  const hasRequiredSignal = reconciliationSignals.some(
    (signal) =>
      typeof signal === "object" && signal !== null && (signal as JsonObject).required === true,
  );

  if (!hasRequiredSignal) {
    throw new Error(
      `${convergencePath}: must include at least one reconciliation signal with required=true`,
    );
  }
}

function validateTaskReadinessMarker(): void {
  const tasksPath = ".GITHUB-MODE-IMPLEMENTATION-TASKS.md";
  const tasksDoc = readFileSync(path.join(ROOT, tasksPath), "utf8");
  const marker = "Task 1 readiness: ✅ Ready to commence";

  if (!tasksDoc.includes(marker)) {
    throw new Error(`${tasksPath}: missing readiness marker \`${marker}\``);
  }
}

function main(): void {
  for (const contract of requiredContracts) {
    const data = readJson(contract.file);
    assertRequiredKeys(contract.file, data, contract.requiredKeys);
  }

  validateManifestSchema();
  validateParityMatrix();
  validateConvergenceMap();
  validateTaskReadinessMarker();

  console.log("GitHub runtime contracts: validation passed.");
}

main();
