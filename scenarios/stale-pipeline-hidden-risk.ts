import type { ScenarioConfig } from "../src/engine/types.js";

export const stalePipelineHiddenRiskScenario: ScenarioConfig = {
  id: "stale-pipeline-hidden-risk",
  name: "Stale Pipeline Hidden Risk",
  description:
    "A sales team appears to have a strong open pipeline, but many high-value deals are old, under-touched, and forecasted too optimistically.",
  version: "0.1.0",
  defaults: {
    currency: "EUR",
    simulationDays: 180,
    startDate: "2026-01-01T00:00:00.000Z",
  },
  volume: {
    reps: 6,
    organizations: 90,
    contactsPerOrganization: { min: 1, max: 4 },
    leads: 120,
    deals: 140,
    activitiesPerDeal: { min: 2, max: 8 },
  },
  targets: {
    minColdDeals: 14,
    minStalledDeals: 10,
    minClosedDeals: 38,
    winRate: { min: 0.22, max: 0.34 },
  },
  pipeline: {
    name: "Sales Pipeline",
    stages: [
      { key: "lead-in", name: "Lead In", order: 0, defaultWinProbability: 0.12 },
      { key: "qualified", name: "Qualified", order: 1, defaultWinProbability: 0.24 },
      { key: "proposal-sent", name: "Proposal Sent", order: 2, defaultWinProbability: 0.42 },
      { key: "negotiation", name: "Negotiation", order: 3, defaultWinProbability: 0.62 },
      { key: "closing", name: "Closing", order: 4, defaultWinProbability: 0.78 },
    ],
  },
  messiness: {
    missingCloseDateRate: 0.18,
    missingActivityRate: 0.08,
    duplicateLikeContactRate: 0.04,
  },
};

export default stalePipelineHiddenRiskScenario;
