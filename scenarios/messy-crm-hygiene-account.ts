import type { ScenarioConfig } from "../src/engine/types.js";
import { salesPipelineStages } from "./shared.js";

export const messyCrmHygieneAccountScenario: ScenarioConfig = {
  id: "messy-crm-hygiene-account",
  name: "Messy CRM Hygiene Account",
  description:
    "A data-quality stress scenario with missing fields, imperfect activity capture, uneven stakeholder engagement, and several risky opportunities.",
  version: "0.1.0",
  defaults: {
    currency: "EUR",
    simulationDays: 150,
    startDate: "2026-01-01T00:00:00.000Z",
  },
  volume: {
    reps: 3,
    organizations: 6,
    contactsPerOrganization: { min: 3, max: 7 },
    leads: 18,
    deals: 16,
    activitiesPerDeal: { min: 3, max: 7 },
  },
  targets: {
    minColdDeals: 3,
    minStalledDeals: 2,
    minClosedDeals: 5,
    winRate: { min: 0.2, max: 0.38 },
  },
  pipeline: {
    name: "Sales Pipeline",
    stages: salesPipelineStages,
  },
  messiness: {
    missingCloseDateRate: 0.3,
    missingActivityRate: 0.18,
    duplicateLikeContactRate: 0.12,
  },
};

export default messyCrmHygieneAccountScenario;

