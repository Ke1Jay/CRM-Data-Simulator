import type { ScenarioConfig } from "../src/engine/types.js";
import { salesPipelineStages } from "./shared.js";

export const ghostedHighValueOpportunityScenario: ScenarioConfig = {
  id: "ghosted-high-value-opportunity",
  name: "Ghosted High-Value Opportunity",
  description:
    "A compact inspection scenario where one high-value opportunity had strong early engagement, then went quiet while the close date stayed optimistic.",
  version: "0.1.0",
  defaults: {
    currency: "EUR",
    simulationDays: 150,
    startDate: "2026-01-01T00:00:00.000Z",
  },
  volume: {
    reps: 2,
    organizations: 2,
    contactsPerOrganization: { min: 4, max: 6 },
    leads: 8,
    deals: 8,
    activitiesPerDeal: { min: 4, max: 8 },
  },
  targets: {
    minColdDeals: 2,
    minStalledDeals: 1,
    minClosedDeals: 3,
    winRate: { min: 0.3, max: 0.45 },
  },
  pipeline: {
    name: "Sales Pipeline",
    stages: salesPipelineStages,
  },
  messiness: {
    missingCloseDateRate: 0.12,
    missingActivityRate: 0.12,
    duplicateLikeContactRate: 0.02,
  },
};

export default ghostedHighValueOpportunityScenario;

