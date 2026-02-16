#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const matrixPath = resolve("runtime/github/threat-model/trigger-matrix.json");
const matrix = JSON.parse(readFileSync(matrixPath, "utf8"));

const requiredTriggerVariants = [
  ["pull_request", "fork"],
  ["pull_request", "internal"],
  ["push", "protected_branch"],
  ["schedule", "default"],
  ["workflow_dispatch", "default"],
];

const errors = [];

if (!Array.isArray(matrix.contexts)) {
  errors.push("contexts must be an array");
} else {
  for (const [trigger, variant] of requiredTriggerVariants) {
    const found = matrix.contexts.some(
      (context) => context.trigger === trigger && context.variant === variant,
    );
    if (!found) {
      errors.push(`missing required context: ${trigger}/${variant}`);
    }
  }

  for (const context of matrix.contexts) {
    if (context.trustLevel === "untrusted" && context.privilegedExecutionAllowed === true) {
      errors.push(
        `guardrail violation: untrusted context ${context.trigger}/${context.variant} allows privileged execution`,
      );
    }

    if (context.privilegedExecutionAllowed === true && context.branchMutationPolicy !== "pr_only") {
      errors.push(
        `guardrail violation: privileged context ${context.trigger}/${context.variant} must enforce branchMutationPolicy=pr_only`,
      );
    }
  }
}

if (!Array.isArray(matrix.abuseCases) || matrix.abuseCases.length === 0) {
  errors.push("abuseCases must be a non-empty array");
} else {
  for (const abuseCase of matrix.abuseCases) {
    if (!Array.isArray(abuseCase.preventiveControls) || abuseCase.preventiveControls.length === 0) {
      errors.push(`abuse case ${abuseCase.id ?? "<unknown>"} is missing preventive controls`);
    }
    if (!Array.isArray(abuseCase.detectiveControls) || abuseCase.detectiveControls.length === 0) {
      errors.push(`abuse case ${abuseCase.id ?? "<unknown>"} is missing detective controls`);
    }
  }
}

if (errors.length > 0) {
  console.error("GitHub mode threat model validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("GitHub mode threat model validation passed.");
