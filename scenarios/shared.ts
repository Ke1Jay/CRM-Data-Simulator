import type { ScenarioStage } from "../src/engine/types.js";

export const salesPipelineStages: ScenarioStage[] = [
  { key: "lead-in", name: "Lead In", order: 0, defaultWinProbability: 0.12 },
  { key: "qualified", name: "Qualified", order: 1, defaultWinProbability: 0.24 },
  { key: "proposal-sent", name: "Proposal Sent", order: 2, defaultWinProbability: 0.42 },
  { key: "negotiation", name: "Negotiation", order: 3, defaultWinProbability: 0.62 },
  { key: "closing", name: "Closing", order: 4, defaultWinProbability: 0.78 },
];

