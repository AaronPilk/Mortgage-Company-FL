/**
 * Deploy preflight.
 *
 * Run before any production deployment. It checks the conditions that must hold
 * before this configuration serves real traffic — the ones deliberately kept out
 * of `parseServerEnv` so that a build is not the same thing as a deployment.
 *
 * It refuses loudly and prints the variable NAME that is wrong. It never prints
 * a value.
 */

import { assertProductionReady, parseServerEnv } from "../packages/schemas/src/env";

const env = parseServerEnv(process.env as Record<string, string | undefined>);
const problems = assertProductionReady(env);

if (problems.length === 0) {
  console.log("deploy preflight: configuration is ready for production traffic");
  process.exit(0);
}

console.error(`deploy preflight: ${problems.length} blocking problem(s)\n`);
for (const problem of problems) {
  console.error(`  ${problem.key}`);
  console.error(`    ${problem.message}`);
}
console.error("\nFix these before deploying. Values are never printed by this script.");
process.exit(1);
