import type { ScenarioConfig } from "../src/engine/types.js";
import { salesPipelineStages } from "./shared.js";

export const committeeSecurityDelayScenario: ScenarioConfig = {
  id: "committee-security-delay",
  name: "Committee Security Delay",
  description:
    "A buying-committee scenario where champion and RevOps interest are real, but finance and security drag the opportunity into a stalled active stage.",
  version: "0.1.0",
  defaults: {
    currency: "EUR",
    simulationDays: 160,
    startDate: "2026-01-01T00:00:00.000Z",
  },
  volume: {
    reps: 3,
    organizations: 4,
    contactsPerOrganization: { min: 5, max: 8 },
    leads: 14,
    deals: 12,
    activitiesPerDeal: { min: 5, max: 9 },
  },
  targets: {
    minColdDeals: 2,
    minStalledDeals: 3,
    minClosedDeals: 4,
    winRate: { min: 0.25, max: 0.4 },
  },
  pipeline: {
    name: "Sales Pipeline",
    stages: salesPipelineStages,
  },
  messiness: {
    missingCloseDateRate: 0.1,
    missingActivityRate: 0.08,
    duplicateLikeContactRate: 0.03,
  },
};

export default committeeSecurityDelayScenario;

