import type { ScenarioConfig } from "../src/engine/types.js";

export const singleOrganizationDealLabScenario: ScenarioConfig = {
  id: "single-organization-deal-lab",
  name: "Single Organization Deal Lab",
  description:
    "A compact inspection scenario with one account, many stakeholders, several leads and deals, and enough activity history to manually review story continuity.",
  version: "0.1.0",
  defaults: {
    currency: "EUR",
    simulationDays: 120,
    startDate: "2026-01-01T00:00:00.000Z",
  },
  volume: {
    reps: 1,
    organizations: 1,
    contactsPerOrganization: { min: 9, max: 9 },
    leads: 10,
    deals: 8,
    activitiesPerDeal: { min: 4, max: 7 },
  },
  targets: {
    minColdDeals: 1,
    minStalledDeals: 1,
    minClosedDeals: 3,
    winRate: { min: 0.3, max: 0.45 },
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
    missingCloseDateRate: 0.1,
    missingActivityRate: 0.05,
    duplicateLikeContactRate: 0,
  },
};

export default singleOrganizationDealLabScenario;
