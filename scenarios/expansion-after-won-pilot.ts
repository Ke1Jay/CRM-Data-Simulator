import type { ScenarioConfig } from "../src/engine/types.js";
import { salesPipelineStages } from "./shared.js";

export const expansionAfterWonPilotScenario: ScenarioConfig = {
  id: "expansion-after-won-pilot",
  name: "Expansion After Won Pilot",
  description:
    "An account-level reasoning scenario with prior won business, a larger expansion opportunity, and mixed signals from the same buying committee.",
  version: "0.1.0",
  defaults: {
    currency: "EUR",
    simulationDays: 180,
    startDate: "2026-01-01T00:00:00.000Z",
  },
  volume: {
    reps: 2,
    organizations: 3,
    contactsPerOrganization: { min: 5, max: 8 },
    leads: 12,
    deals: 10,
    activitiesPerDeal: { min: 5, max: 10 },
  },
  targets: {
    minColdDeals: 1,
    minStalledDeals: 2,
    minClosedDeals: 4,
    winRate: { min: 0.4, max: 0.6 },
  },
  pipeline: {
    name: "Sales Pipeline",
    stages: salesPipelineStages,
  },
  messiness: {
    missingCloseDateRate: 0.08,
    missingActivityRate: 0.06,
    duplicateLikeContactRate: 0.02,
  },
};

export default expansionAfterWonPilotScenario;

