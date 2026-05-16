import { writeRunArtifacts } from "./adapters/json-adapter.js";
import { simulateScenario } from "./engine/simulator.js";
import type { ScenarioConfig } from "./engine/types.js";
import { assertValidForImport, validateWorld } from "./engine/validators.js";
import singleOrganizationDealLabScenario from "../scenarios/single-organization-deal-lab.js";
import stalePipelineHiddenRiskScenario from "../scenarios/stale-pipeline-hidden-risk.js";
import ghostedHighValueOpportunityScenario from "../scenarios/ghosted-high-value-opportunity.js";
import committeeSecurityDelayScenario from "../scenarios/committee-security-delay.js";
import messyCrmHygieneAccountScenario from "../scenarios/messy-crm-hygiene-account.js";
import expansionAfterWonPilotScenario from "../scenarios/expansion-after-won-pilot.js";

const scenarios: Record<string, ScenarioConfig> = {
  [singleOrganizationDealLabScenario.id]: singleOrganizationDealLabScenario,
  [ghostedHighValueOpportunityScenario.id]: ghostedHighValueOpportunityScenario,
  [committeeSecurityDelayScenario.id]: committeeSecurityDelayScenario,
  [messyCrmHygieneAccountScenario.id]: messyCrmHygieneAccountScenario,
  [expansionAfterWonPilotScenario.id]: expansionAfterWonPilotScenario,
  [stalePipelineHiddenRiskScenario.id]: stalePipelineHiddenRiskScenario,
};

function getFlagValue(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

function printHelp(): void {
  console.log("CRM Simulator CLI");
  console.log("");
  console.log("Implemented commands:");
  console.log("  generate --scenario <id> --seed <seed>");
  console.log("  generate-suite --seed <seed>");
  console.log("");
  console.log(`Available scenarios: ${Object.keys(scenarios).join(", ")}`);
  console.log("");
  console.log("Planned commands:");
  console.log("  validate");
  console.log("  seed-local");
  console.log("  push-pipedrive");
  console.log("  advance");
}

async function generate(args: readonly string[]): Promise<void> {
  const scenarioId = getFlagValue(args, "--scenario") ?? "single-organization-deal-lab";
  const seed = getFlagValue(args, "--seed") ?? "42";
  const scenario = scenarios[scenarioId];

  if (!scenario) {
    console.error(`Unknown scenario: ${scenarioId}`);
    console.error(`Available scenarios: ${Object.keys(scenarios).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const { artifacts, runDir } = await generateScenario(scenario, seed);
  printRunSummary(artifacts, runDir);
}

async function generateSuite(args: readonly string[]): Promise<void> {
  const seed = getFlagValue(args, "--seed") ?? "42";

  for (const scenario of Object.values(scenarios)) {
    const { artifacts, runDir } = await generateScenario(scenario, seed);
    printRunSummary(artifacts, runDir);
    console.log("");
  }
}

async function generateScenario(scenario: ScenarioConfig, seed: string): Promise<{ artifacts: ReturnType<typeof simulateScenario>; runDir: string }> {
  const artifacts = simulateScenario(scenario, { seed });
  const validationReport = validateWorld(artifacts.world, artifacts.events);
  validationReport.generatedAt = artifacts.world.metadata.generatedAt;
  artifacts.validationReport = validationReport;

  assertValidForImport(validationReport);

  return {
    artifacts,
    runDir: await writeRunArtifacts(artifacts),
  };
}

function printRunSummary(artifacts: ReturnType<typeof simulateScenario>, runDir: string): void {
  console.log(`Generated run: ${artifacts.world.metadata.runId}`);
  console.log(`Wrote artifacts: ${runDir}`);
  console.log(
    `World: ${artifacts.world.organizations.length} organizations, ${artifacts.world.contacts.length} contacts, ${artifacts.world.leads.length} leads, ${artifacts.world.deals.length} deals, ${artifacts.world.activities.length} activities`,
  );
  console.log(
    `Truth: ${artifacts.truth?.coldDealIds.length ?? 0} cold deals, ${artifacts.truth?.stalledDealIds.length ?? 0} stalled deals, ${artifacts.truth?.activityGapDealIds.length ?? 0} activity gaps`,
  );
}

export async function main(): Promise<void> {
  const command = process.argv[2] ?? "help";
  const args = process.argv.slice(3);

  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "generate") {
    await generate(args);
    return;
  }

  if (command === "generate-suite") {
    await generateSuite(args);
    return;
  }

  console.error(`Command not implemented yet: ${command}`);
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
