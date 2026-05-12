import { createRng, type Rng, type Seed } from "./rng.js";
import type {
  Activity,
  ActivityMoment,
  ActivityType,
  BuyerState,
  BuyingCommitteeRole,
  BuyingStyle,
  CommunicationStyle,
  Contact,
  ContactPersonality,
  Deal,
  DealStakeholder,
  DealStatus,
  GeneratedWorld,
  InfluenceLevel,
  Lead,
  LeadStatus,
  Note,
  Organization,
  OrganizationStory,
  Rep,
  RepBehavior,
  RunArtifacts,
  ScenarioConfig,
  Seniority,
  SimulationEvent,
  Stage,
  TruthReport,
  Workspace,
  Email,
} from "./types.js";

export type SimulationOptions = {
  seed: Seed;
  generatedAt?: string;
};

type MutableDeal = Deal;

const SIMULATOR_VERSION = "0.1.0";
const DAY_MS = 24 * 60 * 60 * 1000;

const FIRST_NAMES = [
  "Aiva",
  "Marta",
  "Laura",
  "Elina",
  "Sofia",
  "Anna",
  "Noah",
  "Rihards",
  "Maks",
  "Leo",
  "Daniel",
  "Oskars",
];

const LAST_NAMES = [
  "Ozolina",
  "Kalnina",
  "Berzina",
  "Krumina",
  "Liepa",
  "Vitolins",
  "Anderson",
  "Bennett",
  "Cooper",
  "Meyer",
  "Novak",
  "Schmidt",
];

const ORG_PREFIXES = [
  "Northstar",
  "Brightpath",
  "Fieldstone",
  "Silverline",
  "UrbanPeak",
  "Meridian",
  "Cloudforge",
  "GreenGrid",
  "Oakline",
  "BlueHarbor",
  "Clearbay",
  "SignalWorks",
];

const ORG_SUFFIXES = ["Systems", "Group", "Labs", "Digital", "Partners", "Commerce", "Industries", "Works"];
const INDUSTRIES = ["SaaS", "Manufacturing", "Retail", "Logistics", "Healthcare", "Fintech", "Professional Services", "Education"];
const REGIONS = ["Baltics", "Nordics", "DACH", "Benelux", "UKI", "Central Europe"];
const SIZE_BANDS = ["11-50", "51-200", "201-500", "501-1000", "1001-5000"];
const REVENUE_BANDS = ["1M-5M", "5M-20M", "20M-50M", "50M-100M", "100M+"];
const GROWTH_STAGES = ["early scale", "growth", "expansion", "mature", "turnaround"];
const PAINS = [
  "forecast confidence",
  "pipeline hygiene",
  "slow rep follow-up",
  "manual reporting",
  "unclear deal risk",
  "weak lead prioritization",
  "fragmented account context",
];
const BUYING_TRIGGERS = [
  "the CEO asked for a weekly pipeline readout after two missed forecasts",
  "the team is hiring new account executives and wants cleaner handoffs",
  "a recent campaign created more leads than the reps can manually prioritize",
  "board reporting now requires a clearer view of stalled opportunities",
  "RevOps found that forecast calls rely on anecdotal rep updates",
];
const DECISION_PRESSURES = [
  "they need visible improvement before the next monthly leadership review",
  "budget is available this quarter if the team can prove fast setup",
  "the sales leader wants a pilot before rolling anything out to the full team",
  "the finance lead will block spend unless pipeline risk is tied to revenue impact",
];
const ROLES = ["CEO", "Head of Sales", "Revenue Operations Lead", "Sales Manager", "Finance Director", "Operations Manager", "CRM Admin"];
const CONTACT_PRIORITIES = [
  "faster follow-up",
  "cleaner forecasting",
  "less manual reporting",
  "rep adoption",
  "lead prioritization",
  "board-ready metrics",
  "low implementation effort",
];
const CONTACT_OBJECTIONS = [
  "unclear ROI",
  "implementation time",
  "messy CRM data",
  "another tool for reps to ignore",
  "security review",
  "budget timing",
];
type LabContactProfile = {
  name: string;
  role: string;
  seniority: Seniority;
  influence: InfluenceLevel;
  committeeRole: BuyingCommitteeRole;
  communicationStyle: CommunicationStyle;
  personality: ContactPersonality;
  priorities: string[];
  likelyObjections: string[];
  responsiveness: number;
  sentimentBias: number;
};

const LAB_CONTACT_PROFILES: LabContactProfile[] = [
  {
    name: "Marta Cooper",
    role: "CEO",
    seniority: "executive",
    influence: "economic-buyer",
    committeeRole: "executive-sponsor",
    communicationStyle: "skeptical",
    personality: "pragmatic",
    priorities: ["lead prioritization", "rep adoption", "low implementation effort"],
    likelyObjections: ["budget timing", "security review"],
    responsiveness: 60,
    sentimentBias: 0.14,
  },
  {
    name: "Rihards Schmidt",
    role: "Head of Sales",
    seniority: "executive",
    influence: "champion",
    committeeRole: "champion",
    communicationStyle: "warm",
    personality: "pragmatic",
    priorities: ["faster follow-up", "less manual reporting", "board-ready metrics"],
    likelyObjections: ["another tool for reps to ignore"],
    responsiveness: 68,
    sentimentBias: 0.22,
  },
  {
    name: "Maks Kalnina",
    role: "Revenue Operations Lead",
    seniority: "manager",
    influence: "evaluator",
    committeeRole: "technical-evaluator",
    communicationStyle: "direct",
    personality: "curious",
    priorities: ["board-ready metrics", "lead prioritization", "less manual reporting"],
    likelyObjections: ["implementation time", "messy CRM data"],
    responsiveness: 77,
    sentimentBias: 0.24,
  },
  {
    name: "Sofia Cooper",
    role: "Finance Director",
    seniority: "executive",
    influence: "economic-buyer",
    committeeRole: "finance-approver",
    communicationStyle: "busy",
    personality: "political",
    priorities: ["forecast confidence", "cleaner forecasting"],
    likelyObjections: ["unclear ROI", "budget timing"],
    responsiveness: 62,
    sentimentBias: -0.3,
  },
  {
    name: "Daniel Bennett",
    role: "CRM Admin",
    seniority: "manager",
    influence: "user",
    committeeRole: "crm-admin",
    communicationStyle: "skeptical",
    personality: "time-poor",
    priorities: ["rep adoption", "low implementation effort", "data quality"],
    likelyObjections: ["messy CRM data", "security review"],
    responsiveness: 74,
    sentimentBias: -0.21,
  },
  {
    name: "Noah Schmidt",
    role: "Security & Operations Manager",
    seniority: "director",
    influence: "blocker",
    committeeRole: "legal-security",
    communicationStyle: "direct",
    personality: "risk-averse",
    priorities: ["security review", "low implementation effort", "operational control"],
    likelyObjections: ["security review", "implementation time"],
    responsiveness: 70,
    sentimentBias: -0.19,
  },
  {
    name: "Laura Novak",
    role: "Sales Manager",
    seniority: "manager",
    influence: "user",
    committeeRole: "end-user",
    communicationStyle: "warm",
    personality: "enthusiastic",
    priorities: ["cleaner forecasting", "less manual reporting", "faster follow-up"],
    likelyObjections: ["rep adoption"],
    responsiveness: 67,
    sentimentBias: 0.08,
  },
  {
    name: "Aiva Meyer",
    role: "Sales Operations Analyst",
    seniority: "individual-contributor",
    influence: "evaluator",
    committeeRole: "end-user",
    communicationStyle: "analytical",
    personality: "curious",
    priorities: ["board-ready metrics", "CRM data quality", "less manual reporting"],
    likelyObjections: ["messy CRM data"],
    responsiveness: 73,
    sentimentBias: -0.07,
  },
  {
    name: "Oskars Anderson",
    role: "COO",
    seniority: "executive",
    influence: "blocker",
    committeeRole: "blocker",
    communicationStyle: "busy",
    personality: "pragmatic",
    priorities: ["low implementation effort", "clear ROI"],
    likelyObjections: ["unclear ROI", "implementation time"],
    responsiveness: 58,
    sentimentBias: -0.12,
  },
];
const SOURCES = ["inbound", "outbound", "referral", "webinar", "event", "partner", "paid campaign"];
const LOST_REASONS = ["No decision", "Budget paused", "Chose competitor", "Timing mismatch", "Procurement blocked"];
const NEEDS = [
  "better visibility into pipeline risk",
  "a reliable sales operating rhythm",
  "cleaner CRM reporting for leadership",
  "faster follow-up on high-intent leads",
  "stronger forecast discipline",
];

function pad(value: number): string {
  return String(value).padStart(3, "0");
}

function id(prefix: string, index: number): string {
  return `${prefix}_${pad(index)}`;
}

function addDays(date: string, days: number): string {
  return new Date(new Date(date).getTime() + days * DAY_MS).toISOString();
}

function maxDate(...dates: string[]): string {
  return dates.sort().at(-1) ?? new Date(0).toISOString();
}

function daysBetween(start: string, end: string): number {
  return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / DAY_MS);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function joinHuman(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function trimSentence(text: string): string {
  return text.replace(/[.?!]\s*$/, "");
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)/g, "");
}

function pickMany(rng: Rng, items: readonly string[], count: number): string[] {
  return rng.sample(items, count);
}

function event(
  events: SimulationEvent[],
  type: SimulationEvent["type"],
  occurredAt: string,
  entityType: SimulationEvent["entityType"],
  entityId: string,
  data: Record<string, unknown> = {},
): void {
  events.push({
    id: id("evt", events.length + 1),
    type,
    occurredAt,
    entityType,
    entityId,
    data,
  });
}

function generateReps(rng: Rng, count: number, startDate: string, events: SimulationEvent[]): Rep[] {
  const behaviors: RepBehavior[] = ["diligent", "overloaded", "inconsistent", "strong-closer", "weak-follow-up"];
  const segments = ["SMB", "Mid-Market", "Expansion", "Strategic"];

  return Array.from({ length: count }, (_, index) => {
    const name = `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[(index * 3) % LAST_NAMES.length]}`;
    const rep: Rep = {
      id: id("rep", index + 1),
      createdAt: startDate,
      updatedAt: startDate,
      externalOwnerId: 10_000 + index + 1,
      name,
      email: `${slug(name)}@example-sales.test`,
      segment: segments[index % segments.length],
      region: REGIONS[index % REGIONS.length],
      behavior: behaviors[index % behaviors.length],
      quota: 450_000 + rng.intBetween(0, 8) * 25_000,
    };

    event(events, "rep.created", rep.createdAt, "rep", rep.id, { name: rep.name, behavior: rep.behavior });
    return rep;
  });
}

function generateOrganizations(rng: Rng, scenario: ScenarioConfig, reps: Rep[], events: SimulationEvent[]): Organization[] {
  return Array.from({ length: scenario.volume.organizations }, (_, index) => {
    const createdAt = addDays(scenario.defaults.startDate, rng.intBetween(0, 35));
    const story: OrganizationStory = {
      industry: rng.choice(INDUSTRIES),
      region: rng.choice(REGIONS),
      sizeBand: rng.choice(SIZE_BANDS),
      revenueBand: rng.choice(REVENUE_BANDS),
      growthStage: rng.choice(GROWTH_STAGES),
      crmHygiene: rng.weightedChoice([
        { value: "clean", weight: 30 },
        { value: "average", weight: 50 },
        { value: "messy", weight: 20 },
      ]),
      buyingStyle: rng.weightedChoice<BuyingStyle>([
        { value: "founder-led", weight: 25 },
        { value: "committee", weight: 30 },
        { value: "procurement-heavy", weight: 20 },
        { value: "champion-led", weight: 25 },
      ]),
      pains: pickMany(rng, PAINS, rng.intBetween(2, 3)),
      buyingTrigger: rng.choice(BUYING_TRIGGERS),
      decisionPressure: rng.choice(DECISION_PRESSURES),
    };
    if (scenario.id === "single-organization-deal-lab") {
      story.industry = "SaaS";
      story.sizeBand = "51-200";
      story.revenueBand = "5M-20M";
      story.growthStage = "growth";
      story.buyingStyle = "champion-led";
      story.pains = ["forecast confidence", "slow rep follow-up", "manual reporting"];
      story.buyingTrigger = "the sales team missed its forecast twice while inbound demand kept rising";
      story.decisionPressure = "the Head of Sales wants a lightweight pilot before the next board update";
    }
    const org: Organization = {
      id: id("org", index + 1),
      createdAt,
      updatedAt: createdAt,
      name: `${ORG_PREFIXES[index % ORG_PREFIXES.length]} ${ORG_SUFFIXES[(index * 5) % ORG_SUFFIXES.length]}`,
      ownerId: reps[index % reps.length].id,
      story,
    };

    event(events, "organization.created", createdAt, "organization", org.id, { name: org.name, industry: story.industry });
    return org;
  });
}

function contactTraits(
  rng: Rng,
  contactIndex: number,
): Pick<Contact, "role" | "seniority" | "influence" | "committeeRole" | "communicationStyle" | "personality"> {
  const role = ROLES[contactIndex % ROLES.length];
  const seniority: Seniority = role.includes("CEO") || role.includes("Head") || role.includes("Director") ? "executive" : rng.choice(["director", "manager", "individual-contributor"]);
  const influence: InfluenceLevel = role.includes("CEO") || role.includes("Finance")
    ? "economic-buyer"
    : role.includes("Sales")
      ? "champion"
      : rng.choice(["evaluator", "blocker", "user"]);
  const personality: ContactPersonality = influence === "blocker"
    ? rng.choice(["risk-averse", "political", "time-poor"])
    : influence === "champion"
      ? rng.choice(["curious", "enthusiastic", "pragmatic"])
      : rng.choice(["pragmatic", "curious", "risk-averse", "time-poor", "political"]);
  const committeeRole: BuyingCommitteeRole = role.includes("CEO")
    ? "executive-sponsor"
    : role.includes("Finance")
      ? "finance-approver"
      : role.includes("Head")
        ? "champion"
        : role.includes("CRM")
          ? "crm-admin"
          : influence === "blocker"
            ? "blocker"
            : influence === "evaluator"
              ? "technical-evaluator"
              : "end-user";

  return {
    role,
    seniority,
    influence,
    committeeRole,
    communicationStyle: rng.choice<CommunicationStyle>(["direct", "analytical", "warm", "skeptical", "busy"]),
    personality,
  };
}

function generateContacts(rng: Rng, scenario: ScenarioConfig, organizations: Organization[], reps: Rep[], events: SimulationEvent[]): Contact[] {
  const contacts: Contact[] = [];

  for (const org of organizations) {
    const count = rng.intBetween(scenario.volume.contactsPerOrganization.min, scenario.volume.contactsPerOrganization.max);

    for (let localIndex = 0; localIndex < count; localIndex++) {
      const index = contacts.length + 1;
      const profile = scenario.id === "single-organization-deal-lab" ? LAB_CONTACT_PROFILES[localIndex % LAB_CONTACT_PROFILES.length] : undefined;
      const name = profile?.name ?? `${rng.choice(FIRST_NAMES)} ${rng.choice(LAST_NAMES)}`;
      const traits = profile ?? contactTraits(rng, localIndex);
      const createdAt = addDays(org.createdAt, profile ? localIndex + 1 : rng.intBetween(0, 12));
      const contact: Contact = {
        id: id("con", index),
        createdAt,
        updatedAt: createdAt,
        organizationId: org.id,
        ownerId: org.ownerId,
        name,
        email: rng.bool(0.94) ? `${slug(name)}@${slug(org.name)}.test` : undefined,
        phone: rng.bool(0.82) ? `+371 2${rng.intBetween(10_000_000, 99_999_999)}` : undefined,
        ...traits,
        priorities: profile?.priorities ?? pickMany(rng, CONTACT_PRIORITIES, rng.intBetween(2, 3)),
        likelyObjections: profile?.likelyObjections ?? pickMany(rng, CONTACT_OBJECTIONS, rng.intBetween(1, 2)),
        responsiveness: profile?.responsiveness ?? round(clamp(rng.normalish(62, 18), 8, 98), 0),
        sentimentBias: profile?.sentimentBias ?? round(clamp(rng.normalish(0, 0.32), -0.8, 0.8), 2),
      };

      contacts.push(contact);
      event(events, "contact.created", createdAt, "contact", contact.id, { organizationId: org.id, role: contact.role });
    }
  }

  return contacts;
}

function contactsByOrganization(contacts: Contact[]): Map<string, Contact[]> {
  const map = new Map<string, Contact[]>();
  for (const contact of contacts) {
    map.set(contact.organizationId, [...(map.get(contact.organizationId) ?? []), contact]);
  }
  return map;
}

function generateLeads(
  rng: Rng,
  scenario: ScenarioConfig,
  organizations: Organization[],
  contacts: Contact[],
  events: SimulationEvent[],
): Lead[] {
  const byOrg = contactsByOrganization(contacts);
  const endDate = addDays(scenario.defaults.startDate, scenario.defaults.simulationDays - 1);

  return Array.from({ length: scenario.volume.leads }, (_, index) => {
    const organization = organizations[index % organizations.length];
    const organizationContacts = byOrg.get(organization.id) ?? contacts;
    const labLeadRoles: BuyingCommitteeRole[] = ["executive-sponsor", "finance-approver", "technical-evaluator", "champion", "legal-security"];
    const contact = scenario.id === "single-organization-deal-lab"
      ? organizationContacts.find((item) => item.committeeRole === labLeadRoles[index]) ?? organizationContacts[index % organizationContacts.length]
      : rng.choice(organizationContacts);
    const leadWindowStart = maxDate(scenario.defaults.startDate, organization.createdAt, contact.createdAt);
    const latestLeadCreateOffset = Math.max(1, daysBetween(leadWindowStart, endDate) - 45);
    const createdAt = addDays(leadWindowStart, rng.intBetween(0, latestLeadCreateOffset));
    const status: LeadStatus = index < Math.floor(scenario.volume.leads * 0.62)
      ? "CONVERTED"
      : rng.weightedChoice([
          { value: "NEW", weight: 30 },
          { value: "QUALIFIED", weight: 45 },
          { value: "UNQUALIFIED", weight: 25 },
        ]);
    const expectedCloseDate = rng.bool(scenario.messiness.missingCloseDateRate) ? undefined : addDays(createdAt, rng.intBetween(35, 100));
    const lead: Lead = {
      id: id("lead", index + 1),
      createdAt,
      updatedAt: addDays(createdAt, rng.intBetween(0, 18)),
      title: `${organization.name} ${rng.choice(["CRM review", "pipeline visibility", "forecast cleanup", "sales analytics"])} lead`,
      organizationId: organization.id,
      contactId: contact.id,
      ownerId: organization.ownerId,
      status,
      source: rng.choice(SOURCES),
      label: rng.choice(["warm", "demo-request", "nurture", "priority"]),
      value: rng.intBetween(8, 90) * 1_000,
      currency: scenario.defaults.currency,
      expectedCloseDate: expectedCloseDate && expectedCloseDate > endDate ? endDate : expectedCloseDate,
      lastActivityDate: addDays(createdAt, rng.intBetween(1, 24)),
    };

    event(events, "lead.created", createdAt, "lead", lead.id, { source: lead.source, status: lead.status });
    return lead;
  });
}

function dealStatusForIndex(rng: Rng, scenario: ScenarioConfig, index: number): DealStatus {
  if (scenario.id === "single-organization-deal-lab") {
    if (index === 0) return "WON";
    if (index === 1) return "LOST";
    return "OPEN";
  }

  if (index < scenario.targets.minClosedDeals) {
    return rng.bool((scenario.targets.winRate.min + scenario.targets.winRate.max) / 2) ? "WON" : "LOST";
  }

  return rng.weightedChoice<DealStatus>([
    { value: "OPEN", weight: 72 },
    { value: "WON", weight: 10 },
    { value: "LOST", weight: 18 },
  ]);
}

function behaviorActivityBias(behavior: RepBehavior): number {
  if (behavior === "diligent") return 1.25;
  if (behavior === "strong-closer") return 1.1;
  if (behavior === "overloaded") return 0.85;
  if (behavior === "weak-follow-up") return 0.7;
  return 0.9;
}

function compactDate(value: string | undefined): string {
  if (!value) return "not set";
  return value.slice(0, 10);
}

function sentimentPhraseForState(state: BuyerState): string {
  if (state.sentiment >= 0.45) return "positive";
  if (state.sentiment >= 0.15) return "open but still cautious";
  if (state.sentiment <= -0.35) return "skeptical";
  if (state.sentiment <= -0.1) return "cautious";
  return "neutral";
}

function sentimentPhrase(deal: Deal): string {
  return sentimentPhraseForState(deal.buyerState);
}

function engagementPhraseForState(state: BuyerState): string {
  if (state.engagement >= 75) return "highly engaged";
  if (state.engagement >= 55) return "responsive";
  if (state.engagement >= 35) return "somewhat engaged";
  return "hard to keep engaged";
}

function engagementPhrase(deal: Deal): string {
  return engagementPhraseForState(deal.buyerState);
}

function frictionPhraseForState(state: BuyerState): string {
  if (state.friction >= 75) return "there is heavy internal friction";
  if (state.friction >= 55) return "there are a few internal blockers";
  if (state.friction >= 35) return "there are manageable concerns";
  return "there is limited friction so far";
}

function frictionPhrase(deal: Deal): string {
  return frictionPhraseForState(deal.buyerState);
}

function activityDescription(
  activityType: ActivityType,
  moment: ActivityMoment,
  deal: Deal,
  contact: Contact,
  organization: Organization,
  stage: Stage,
  buyerState: BuyerState,
  trigger: string,
  nextStepDate?: string,
): string {
  const nextStep = nextStepDate ? `Next step is scheduled for ${compactDate(nextStepDate)}.` : "No next step is currently scheduled.";
  const riskLine = deal.story.riskFactors.length > 0 ? `Known risk: ${deal.story.riskFactors.join(", ")}.` : "No material risk recorded yet.";
  const stateLine = `${contact.name} sounded ${sentimentPhraseForState(buyerState)} and ${engagementPhraseForState(buyerState)}; ${frictionPhraseForState(buyerState)}.`;

  if (moment === "discovery") {
    return `Discovery with ${contact.name} at ${organization.name}: confirmed ${deal.story.need} is tied to ${organization.story.buyingTrigger}. ${stateLine} ${nextStep}`;
  }

  if (moment === "process_mapping") {
    return `Mapped the current sales process with ${contact.name}. Focus areas were ${joinHuman(contact.priorities)} and the team asked how the pilot would fit existing CRM habits. ${stateLine} ${nextStep}`;
  }

  if (moment === "data_quality_review") {
    return `Reviewed CRM data quality concerns with ${contact.name}. Main objection was ${deal.story.knownObjections[0]}; ${riskLine} ${stateLine} ${nextStep}`;
  }

  if (moment === "pilot_scope") {
    return `Scoped a lightweight pilot with ${contact.name}: success should prove ${deal.story.winCondition}. ${stateLine} ${nextStep}`;
  }

  if (moment === "finance_review") {
    return `Finance review with ${contact.name}: tied ${deal.story.need} to revenue impact and discussed ${deal.story.knownObjections[0]}. ${stateLine} ${nextStep}`;
  }

  if (moment === "security_review") {
    return `Security and implementation checkpoint with ${contact.name}. Covered ${deal.story.knownObjections.join(", ")} without changing the canonical deal facts. ${stateLine} ${nextStep}`;
  }

  if (moment === "ghosting_nudge") {
    return `Follow-up attempt after engagement slowed down. ${contact.name} had not moved the next step forward; ${riskLine} ${stateLine}`;
  }

  if (moment === "pilot_success") {
    return `Pilot proof discussion with ${contact.name}: evidence now supports ${deal.story.winCondition}. ${stateLine} ${nextStep}`;
  }

  if (moment === "close_confirmation") {
    return `Close confirmation with ${contact.name}. Outcome is ${deal.status}; final proof point was ${deal.story.winCondition}. ${stateLine}`;
  }

  if (moment === "loss_review") {
    return `Loss review with ${contact.name}. The deal could not get past ${deal.story.knownObjections[0]}; recorded risk factors were ${joinHuman(deal.story.riskFactors)}. ${stateLine}`;
  }

  if (activityType === "call") {
    return `Spoke with ${contact.name} at ${organization.name} about ${deal.story.need}. ${stateLine} Trigger: ${trigger}. ${riskLine} ${nextStep}`;
  }

  if (activityType === "meeting") {
    return `Meeting recap for ${organization.name}: reviewed ${deal.story.need}, current stage ${stage.name}, and win condition: ${deal.story.winCondition}. ${stateLine} Objections discussed: ${deal.story.knownObjections.join(", ")}. Trigger: ${trigger}. ${nextStep}`;
  }

  if (activityType === "email") {
    return `Follow-up sent to ${contact.name} covering ${deal.story.need}. Mentioned urgency driver: ${deal.story.urgencyReason}. ${stateLine} Trigger: ${trigger}. ${riskLine}`;
  }

  if (activityType === "deadline") {
    return `Deadline checkpoint for ${deal.title}. Expected close date: ${compactDate(deal.expectedCloseDate)}. Current status: ${deal.status}. ${stateLine} Trigger: ${trigger}. ${riskLine}`;
  }

  return `Internal task for ${deal.title}: verify current stakeholder alignment, update CRM fields, and confirm whether ${contact.name} owns the next step. ${stateLine} Trigger: ${trigger}. ${nextStep}`;
}

function noteBody(kind: "deal-summary" | "risk" | "close", deal: Deal, contact: Contact, organization: Organization, stage: Stage): string {
  if (kind === "risk") {
    return `${organization.name} risk note: ${deal.story.riskFactors.join(", ")}. ${contact.name} is the current linked stakeholder and tends to be ${contact.personality}. The account is ${engagementPhrase(deal)}, but ${frictionPhrase(deal)}. Latest sentiment trigger: ${deal.story.sentimentArc.at(-1)?.trigger ?? "not recorded"}.`;
  }

  if (kind === "close") {
    if (deal.status === "WON") {
      return `Closed won with ${organization.name}. Win condition met: ${deal.story.winCondition}. Primary contact was ${contact.name}.`;
    }

    return `Closed lost with ${organization.name}. Lost reason: ${deal.lostReason ?? "not recorded"}. Main objections were ${deal.story.knownObjections.join(", ")}.`;
  }

  return `${deal.title} summary: ${organization.name} is evaluating ${deal.story.need}. Current stage is ${stage.name}. Urgency reason: ${deal.story.urgencyReason}. Buying trigger: ${organization.story.buyingTrigger}. Decision process: ${trimSentence(deal.story.decisionProcess)}. Known objections: ${deal.story.knownObjections.join(", ")}.`;
}

function emailBody(direction: Email["direction"], deal: Deal, contact: Contact, organization: Organization): string {
  if (direction === "inbound") {
    if (deal.buyerState.sentiment < -0.2 || deal.buyerState.friction >= 60) {
      return `Hi, thanks for the follow-up. We are still interested in ${deal.story.need}, but I need a clearer answer on ${deal.story.knownObjections[0]} before I can pull more people into this. The timing pressure is real, but I do not want to create noise for the team.`;
    }

    return `Hi, this is useful. The part that connects most for us is ${contact.priorities[0]}, especially because ${organization.story.decisionPressure}. Can you send the next-step outline and what you need from our side?`;
  }

  return `Hi ${contact.name}, following up on our conversation about ${deal.story.need} at ${organization.name}. I heard that ${joinHuman(contact.priorities)} matter most, and I do not want this to feel like another reporting chore for the team. The main next step is to confirm this path: ${deal.story.winCondition}.`;
}

function emailSubject(direction: Email["direction"], deal: Deal, organization: Organization): string {
  if (direction === "inbound") return `Re: ${deal.story.need}`;
  return `${organization.name}: ${deal.story.need}`;
}

function activityMoment(deal: Deal, activity: Activity): BuyerState {
  return deal.story.sentimentArc.find((moment) => moment.occurredAt === activity.dueDate && moment.contactId === activity.contactId)?.buyerState ?? deal.buyerState;
}

function emailBodyForActivity(direction: Email["direction"], deal: Deal, contact: Contact, organization: Organization, activity: Activity): string {
  const state = activityMoment(deal, activity);

  if (direction === "inbound") {
    if (activity.moment === "discovery" || activity.moment === "process_mapping") {
      return `This is worth exploring. Our main issue is still ${contact.priorities[0]}, but I need to see how it fits the way the team already works.`;
    }

    if (activity.moment === "data_quality_review") {
      return `The data-quality angle is the part I am worried about. If the pilot depends on perfectly clean CRM data, we will struggle to make it credible.`;
    }

    if (activity.moment === "finance_review") {
      return `I need the business case tightened before this goes wider. Please connect the pilot to revenue impact and what we can prove before the board update.`;
    }

    if (activity.moment === "security_review") {
      return `Security and implementation are still open items. Send the shortest checklist you have so I can see whether this is lightweight enough for us.`;
    }

    if (activity.moment === "pilot_success") {
      return `The pilot evidence is useful. If RevOps agrees with the stale-deal view, I can support moving this to the next step.`;
    }

    if (activity.moment === "close_confirmation") {
      return `Confirmed from our side. Let's keep the first rollout narrow and focused on the pilot proof points we agreed.`;
    }

    if (activity.moment === "loss_review") {
      return `I appreciate the follow-up. The need is real, but we are not going to move ahead right now. Final reason on our side: ${deal.lostReason ?? deal.story.knownObjections[0]}.`;
    }

    if (activity.moment === "ghosting_nudge") {
      return `Sorry, this has slipped. I do not have enough internal alignment to move it forward this week.`;
    }

    if (state.friction >= 70) {
      return `Hi, I am not comfortable moving this forward until we have a clearer answer on ${deal.story.knownObjections[0]}. The need is real, but the team will push back if the pilot adds work before the board update.`;
    }

    if (state.engagement < 40) {
      return `Thanks. I have not had time to review this properly yet. Please send the shortest version of what you need from us and I will try to come back to it.`;
    }

    if (state.sentiment >= 0.3) {
      return `This is directionally useful. The part that matters most for us is ${contact.priorities[0]}. Can you send the pilot outline and the sample view you mentioned?`;
    }

    return `Thanks for sending this. I still need to understand how it handles ${deal.story.knownObjections[0]}, but the use case is worth another look.`;
  }

  if (activity.moment === "discovery") {
    return `Hi ${contact.name}, thanks for opening up the conversation about ${deal.story.need}. I captured ${contact.priorities[0]} as the first thing to prove, and I will keep the next step lightweight.`;
  }

  if (activity.moment === "process_mapping") {
    return `Hi ${contact.name}, based on what you shared, I mapped the pilot around your current CRM process rather than asking the team to change behavior immediately. The next check is whether ${deal.story.winCondition}.`;
  }

  if (activity.moment === "data_quality_review") {
    return `Hi ${contact.name}, the data-quality concern is fair. I suggest we use the pilot to show what can be detected from the CRM as it exists today, then separate cleanup work from the buying decision.`;
  }

  if (activity.moment === "finance_review") {
    return `Hi ${contact.name}, I tightened the business case around ${deal.story.need}. The cleanest proof point is still ${deal.story.winCondition}, with the value tied back to ${contact.priorities[0]}.`;
  }

  if (activity.moment === "security_review") {
    return `Hi ${contact.name}, sending the implementation and security checklist we discussed. I kept it focused on the pilot scope so this does not turn into a broad rollout review too early.`;
  }

  if (activity.moment === "pilot_success") {
    return `Hi ${contact.name}, the pilot is now showing the risk pattern we wanted: ${deal.story.winCondition}. I suggest we use that as the basis for the close conversation.`;
  }

  if (activity.moment === "close_confirmation") {
    return `Hi ${contact.name}, confirming the close path from our side. We will keep the first step narrow, centered on ${deal.story.winCondition}, and avoid adding extra reporting work for the reps.`;
  }

  if (activity.moment === "loss_review") {
    return `Hi ${contact.name}, thanks for being direct through the process. I understand the final outcome is ${deal.lostReason ?? deal.story.knownObjections[0]}, so I will close this out cleanly and keep the notes for future timing.`;
  }

  if (activity.moment === "ghosting_nudge") {
    return `Hi ${contact.name}, quick nudge. I do not want to add noise, but the open item is still whether ${deal.story.winCondition}. Should I keep this alive or park it?`;
  }

  if (state.friction >= 65) {
    return `Hi ${contact.name}, following up with the shortest version of where we are: ${organization.name} is evaluating ${deal.story.need}, and the open concern is ${deal.story.knownObjections[0]}. I suggest we keep the next step focused on proof, not a broad rollout discussion.`;
  }

  if (state.engagement < 40) {
    return `Hi ${contact.name}, quick nudge on ${deal.story.need}. I know the team is busy, so I kept this to the next practical step: confirm whether ${deal.story.winCondition} is still the right proof point.`;
  }

  return `Hi ${contact.name}, thanks for the conversation about ${deal.story.need}. I heard that ${joinHuman(contact.priorities)} matter most, so the next step should stay tied to ${deal.story.winCondition}.`;
}

function stakeholderLabel(role: BuyingCommitteeRole): string {
  if (role === "primary-buyer") return "Primary buyer";
  if (role === "executive-sponsor") return "Executive sponsor";
  if (role === "champion") return "Internal champion";
  if (role === "finance-approver") return "Finance approver";
  if (role === "technical-evaluator") return "Technical evaluator";
  if (role === "crm-admin") return "CRM implementation owner";
  if (role === "legal-security") return "Security reviewer";
  if (role === "end-user") return "End user";
  return "Blocker";
}

function dealStakeholderRoles(primaryContact: Contact, organizationContacts: Contact[]): DealStakeholder[] {
  const preferredRoles: BuyingCommitteeRole[] = [
    "primary-buyer",
    "executive-sponsor",
    "champion",
    "technical-evaluator",
    "finance-approver",
    "crm-admin",
    "legal-security",
    "end-user",
    "blocker",
  ];
  const byRole = new Map<BuyingCommitteeRole, Contact>();

  byRole.set("primary-buyer", primaryContact);
  for (const contact of organizationContacts) {
    if (!byRole.has(contact.committeeRole)) byRole.set(contact.committeeRole, contact);
  }

  return preferredRoles
    .map((role) => {
      const contact = byRole.get(role);
      if (!contact) return undefined;
      return { contactId: contact.id, role, label: stakeholderLabel(role) };
    })
    .filter((item): item is DealStakeholder => Boolean(item));
}

function activityNoteBody(activity: Activity, deal: Deal, contact: Contact, organization: Organization): string {
  const state = activityMoment(deal, activity);
  const riskLine = deal.story.riskFactors.length > 0 ? `Risks: ${joinHuman(deal.story.riskFactors)}.` : "No major risk surfaced yet.";

  if (activity.moment === "discovery") {
    return `Discovery note with ${contact.name} (${contact.role}). Confirmed ${deal.story.need} connects to ${contact.priorities[0]}. Buyer was ${sentimentPhraseForState(state)} with engagement at ${state.engagement}/100.`;
  }

  if (activity.moment === "process_mapping") {
    return `Process mapping with ${contact.name}: current CRM workflow can support a small pilot, but adoption risk remains. ${riskLine}`;
  }

  if (activity.moment === "data_quality_review") {
    return `Data quality review with ${contact.name}. They questioned whether existing CRM hygiene is strong enough for credible insight. Friction now ${state.friction}/100. ${riskLine}`;
  }

  if (activity.moment === "pilot_scope") {
    return `Pilot scope agreed with ${contact.name}: keep proof narrow around ${deal.story.winCondition}. Engagement ${state.engagement}/100, urgency ${state.urgency}/100.`;
  }

  if (activity.moment === "finance_review") {
    return `Finance review with ${contact.name}: business case needs to tie ${deal.story.need} to revenue impact. Objection to manage: ${deal.story.knownObjections[0]}.`;
  }

  if (activity.moment === "security_review") {
    return `Security review with ${contact.name}: keep checklist limited to pilot scope. Open concerns: ${joinHuman(deal.story.knownObjections)}.`;
  }

  if (activity.moment === "pilot_success") {
    return `Pilot success note: ${contact.name} accepted that ${deal.story.winCondition}. Sentiment ${state.sentiment}, engagement ${state.engagement}/100.`;
  }

  if (activity.moment === "close_confirmation") {
    return `Close confirmation with ${contact.name}: outcome ${deal.status}. Final buyer state sentiment ${state.sentiment}, friction ${state.friction}/100.`;
  }

  if (activity.moment === "loss_review") {
    return `Loss review with ${contact.name}: final lost reason is ${deal.lostReason ?? deal.story.knownObjections[0]}. Underlying objection was ${deal.story.knownObjections[0]}. Keep account warm for future timing.`;
  }

  if (activity.moment === "ghosting_nudge") {
    return `Ghosting note: ${contact.name} has not advanced the next step. Engagement down to ${state.engagement}/100. ${riskLine}`;
  }

  if (activity.type === "meeting") {
    return `Meeting with ${contact.name} (${contact.role}) at ${organization.name}. Discussed ${deal.story.need}; buyer state was ${sentimentPhraseForState(state)} with ${state.engagement}/100 engagement and ${state.friction}/100 friction. ${contact.name} focused on ${joinHuman(contact.priorities)}. Objections: ${joinHuman(deal.story.knownObjections)}. ${riskLine}`;
  }

  if (activity.type === "call") {
    return `Call with ${contact.name}: kept the conversation around ${deal.story.need}. ${contact.name} was ${sentimentPhraseForState(state)} and ${engagementPhraseForState(state)}. Main next concern is ${deal.story.knownObjections[0]}. ${riskLine}`;
  }

  return `Internal CRM note after ${activity.type}: ${contact.name} remains tied to ${deal.story.need}. Current friction is ${state.friction}/100 and engagement is ${state.engagement}/100.`;
}

function generateDeals(
  rng: Rng,
  scenario: ScenarioConfig,
  organizations: Organization[],
  contacts: Contact[],
  leads: Lead[],
  pipelineId: string,
  stages: Stage[],
  events: SimulationEvent[],
): Deal[] {
  const byOrg = contactsByOrganization(contacts);
  const convertedLeads = leads.filter((lead) => lead.status === "CONVERTED");
  const endDate = addDays(scenario.defaults.startDate, scenario.defaults.simulationDays - 1);

  return Array.from({ length: scenario.volume.deals }, (_, index) => {
    const sourceLead = convertedLeads[index];
    const organization = sourceLead ? organizations.find((item) => item.id === sourceLead.organizationId) ?? organizations[index % organizations.length] : organizations[index % organizations.length];
    const organizationContacts = byOrg.get(organization.id) ?? contacts;
    const contact = sourceLead ? contacts.find((item) => item.id === sourceLead.contactId) ?? rng.choice(organizationContacts) : rng.choice(organizationContacts);
    const ownerId = organization.ownerId;
    const dealWindowStart = maxDate(scenario.defaults.startDate, organization.createdAt, contact.createdAt, sourceLead?.createdAt ?? scenario.defaults.startDate);
    const daysAvailableForCreate = Math.max(1, daysBetween(dealWindowStart, endDate));
    const minCreateOffset = Math.min(sourceLead ? 2 : 8, daysAvailableForCreate);
    const maxCreateOffset = Math.max(minCreateOffset, Math.min(sourceLead ? 18 : 45, daysAvailableForCreate));
    const createdAt = addDays(dealWindowStart, rng.intBetween(minCreateOffset, maxCreateOffset));
    const status = dealStatusForIndex(rng, scenario, index);
    const isForcedCold = index >= scenario.targets.minClosedDeals && index < scenario.targets.minClosedDeals + scenario.targets.minColdDeals;
    const hasDedicatedStalledSlot = index >= scenario.targets.minClosedDeals + scenario.targets.minColdDeals
      && index < scenario.targets.minClosedDeals + scenario.targets.minColdDeals + scenario.targets.minStalledDeals;
    const shouldOverlapColdAndStalled =
      scenario.targets.minStalledDeals > 0 && scenario.volume.deals <= scenario.targets.minClosedDeals + scenario.targets.minColdDeals;
    const isForcedStalled = hasDedicatedStalledSlot || (shouldOverlapColdAndStalled && isForcedCold);
    const stage = status === "OPEN"
      ? stages[isForcedCold || isForcedStalled ? rng.intBetween(1, stages.length - 2) : rng.intBetween(0, stages.length - 1)]
      : stages[stages.length - 1];
    const baseValue = rng.intBetween(12, 180) * 1_000;
    const daysUntilSimulationEnd = Math.max(1, daysBetween(createdAt, endDate));
    const earliestCloseOffset = Math.min(24, daysUntilSimulationEnd);
    const latestCloseOffset = Math.max(earliestCloseOffset, Math.min(130, daysUntilSimulationEnd));
    const closedAt = addDays(createdAt, rng.intBetween(earliestCloseOffset, latestCloseOffset));
    const lastActivityDate = status === "OPEN" && (isForcedCold || isForcedStalled)
      ? addDays(endDate, -rng.intBetween(35, 80))
      : status === "OPEN"
        ? addDays(endDate, -rng.intBetween(1, 24))
        : addDays(closedAt, -rng.intBetween(0, 8));
    const nextActivityDate = status === "OPEN" && !isForcedCold && !isForcedStalled ? addDays(endDate, -rng.intBetween(0, 5)) : undefined;
    const sentiment = contact.sentimentBias + (status === "WON" ? 0.45 : status === "LOST" ? -0.35 : isForcedCold ? -0.28 : 0);
    const frictionFloor = isForcedStalled || isForcedCold ? 58 : 0;
    const focusedDealNames = ["DataHub pilot", "sales analytics rollout", "forecast risk expansion"];
    const dealTitle = scenario.id === "single-organization-deal-lab"
      ? `${organization.name} - ${focusedDealNames[index] ?? "CRM intelligence"}`
      : `${organization.name} - ${rng.choice(["DataHub rollout", "CRM intelligence", "sales analytics", "pipeline audit"])}`;
    const deal: MutableDeal = {
      id: id("deal", index + 1),
      createdAt,
      updatedAt: status === "OPEN" ? lastActivityDate : closedAt,
      title: dealTitle,
      organizationId: organization.id,
      contactId: contact.id,
      ownerId,
      pipelineId,
      stageId: stage.id,
      sourceLeadId: sourceLead?.id,
      status,
      value: baseValue,
      currency: scenario.defaults.currency,
      expectedCloseDate: rng.bool(scenario.messiness.missingCloseDateRate) ? undefined : addDays(createdAt, rng.intBetween(45, 145)),
      wonTime: status === "WON" ? closedAt : undefined,
      lostTime: status === "LOST" ? closedAt : undefined,
      lostReason: status === "LOST" ? rng.choice(LOST_REASONS) : undefined,
      lastActivityDate,
      nextActivityDate,
      activitiesCount: 0,
      buyerState: {
        sentiment: round(clamp(sentiment, -1, 1), 2),
        engagement: round(clamp(rng.normalish(status === "WON" ? 78 : isForcedCold ? 24 : 56, 15), 0, 100), 0),
        urgency: round(clamp(rng.normalish(status === "WON" ? 72 : 52, 18), 0, 100), 0),
        friction: round(clamp(rng.normalish(status === "LOST" ? 76 : isForcedStalled || isForcedCold ? 68 : 38, 17), frictionFloor, 100), 0),
      },
      story: {
        need: rng.choice(NEEDS),
        urgencyReason: rng.choice(["board reporting pressure", "new quarter planning", "missed forecast review", "recent campaign spike"]),
        knownObjections: pickMany(rng, ["budget", "implementation time", "CRM data quality", "security review", "change management"], rng.intBetween(1, 3)),
        winCondition: rng.choice(["executive sponsor confirms value", "RevOps validates pipeline report", "pilot proves stale-deal detection"]),
        riskFactors: isForcedCold || isForcedStalled ? ["low recent activity", "optimistic close date"] : pickMany(rng, ["stakeholder alignment", "budget timing", "data quality"], 2),
        decisionProcess: `${organization.story.buyingStyle} evaluation driven by ${organization.story.buyingTrigger}; ${organization.story.decisionPressure}. ${contact.name} is the ${stakeholderLabel(contact.committeeRole).toLowerCase()} and is focused on ${joinHuman(contact.priorities)}.`,
        stakeholders: dealStakeholderRoles(contact, organizationContacts),
        sentimentArc: [],
      },
    };

    if (deal.expectedCloseDate && deal.expectedCloseDate > endDate) {
      deal.expectedCloseDate = endDate;
    }

    if (sourceLead) {
      sourceLead.convertedDealId = deal.id;
      sourceLead.updatedAt = createdAt;
      event(events, "lead.converted", createdAt, "lead", sourceLead.id, { dealId: deal.id });
    }

    event(events, "deal.created", createdAt, "deal", deal.id, { organizationId: organization.id, stageId: deal.stageId });
    if (stage.order > 0) {
      const latestStageChangeOffset = Math.max(1, Math.min(28, daysUntilSimulationEnd));
      event(events, "deal.stage_changed", addDays(createdAt, rng.intBetween(1, latestStageChangeOffset)), "deal", deal.id, { stageId: stage.id });
    }
    if (status === "WON") event(events, "deal.won", deal.wonTime!, "deal", deal.id, { value: deal.value });
    if (status === "LOST") event(events, "deal.lost", deal.lostTime!, "deal", deal.id, { lostReason: deal.lostReason });

    return deal;
  });
}

function initialBuyerState(rng: Rng, contact: Contact, organization: Organization): BuyerState {
  const buyingStyleFriction = organization.story.buyingStyle === "procurement-heavy" ? 18 : organization.story.buyingStyle === "committee" ? 10 : 0;
  const hygieneFriction = organization.story.crmHygiene === "messy" ? 12 : organization.story.crmHygiene === "average" ? 6 : 0;
  const personalitySentiment = contact.personality === "enthusiastic" ? 0.18 : contact.personality === "risk-averse" ? -0.18 : contact.personality === "political" ? -0.08 : 0;
  const personalityFriction = contact.personality === "risk-averse" ? 14 : contact.personality === "political" ? 10 : contact.personality === "time-poor" ? 6 : 0;

  return {
    sentiment: round(clamp(contact.sentimentBias + personalitySentiment + rng.normalish(0, 0.12), -1, 1), 2),
    engagement: round(clamp(contact.responsiveness + rng.normalish(0, 8), 0, 100), 0),
    urgency: round(clamp(rng.normalish(52, 13) + (organization.story.decisionPressure.includes("quarter") ? 10 : 0), 0, 100), 0),
    friction: round(clamp(rng.normalish(34, 12) + buyingStyleFriction + hygieneFriction + personalityFriction, 0, 100), 0),
  };
}

function interpolateBuyerState(rng: Rng, start: BuyerState, target: BuyerState, step: number, total: number): BuyerState {
  if (step >= total) return target;

  const progress = total <= 1 ? 1 : step / total;
  const wobble = Math.sin(step * 1.7) * 0.08 + rng.normalish(0, 0.03);

  return {
    sentiment: round(clamp(start.sentiment + (target.sentiment - start.sentiment) * progress + wobble, -1, 1), 2),
    engagement: round(clamp(start.engagement + (target.engagement - start.engagement) * progress + rng.normalish(0, 4), 0, 100), 0),
    urgency: round(clamp(start.urgency + (target.urgency - start.urgency) * progress + rng.normalish(0, 3), 0, 100), 0),
    friction: round(clamp(start.friction + (target.friction - start.friction) * progress - wobble * 20 + rng.normalish(0, 4), 0, 100), 0),
  };
}

function sentimentTrigger(
  activityType: ActivityType,
  deal: Deal,
  contact: Contact,
  state: BuyerState,
  done: boolean,
  step: number,
  total: number,
): string {
  if (!done) return "rep scheduled a next step, but the buyer has not responded yet";
  if (step === 1) return `${contact.name} confirmed that the priority around ${contact.priorities[0]} matters enough to explore`;
  if (step === 2) return `${contact.name} asked how this would work inside their current sales process`;
  if (step <= Math.ceil(total * 0.45)) return `${contact.name} wanted to see whether their current CRM data was clean enough for a useful pilot`;
  if (step <= Math.ceil(total * 0.65)) return `${contact.name} asked what setup effort the team would need before the board update`;
  if (step >= total - 1 && deal.status === "WON") return `${contact.name} agreed the win condition was met: ${deal.story.winCondition}`;
  if (step >= total - 1 && deal.status === "LOST") return `${contact.name} could not get past ${deal.story.knownObjections[0]}`;
  if (step >= total - 1 && deal.status === "OPEN" && state.friction >= 55) return `${contact.name} still liked the need, but ${deal.story.knownObjections[0]} kept the deal from moving`;
  if (activityType === "meeting" && state.sentiment >= 0.25) return `${contact.name} saw a credible path to ${deal.story.winCondition}`;
  if (activityType === "meeting" && state.friction >= 60) return `${contact.name} brought up ${deal.story.knownObjections[0]} during the meeting`;
  if (activityType === "call" && contact.personality === "time-poor") return `${contact.name} kept the call short and asked for only the business impact`;
  if (activityType === "email" && state.engagement < 40) return `${contact.name} gave a thin reply after several follow-ups`;
  if (activityType === "deadline") return "the expected close date forced a pipeline hygiene check";
  if (contact.personality === "risk-averse") return `${contact.name} asked for proof before widening the evaluation`;
  if (contact.personality === "enthusiastic") return `${contact.name} offered to pull another stakeholder into the conversation`;
  if (contact.personality === "curious") return `${contact.name} asked how this would work inside their current sales process`;
  if (contact.personality === "political") return `${contact.name} wanted to know who else needed to approve the pilot`;
  if (contact.personality === "pragmatic") return `${contact.name} pushed for a practical next step tied to ${contact.priorities[0]}`;
  return `${contact.name} kept the conversation focused on ${contact.priorities[0]}`;
}

function dealStakeholders(primaryContact: Contact, organizationContacts: Contact[], dueDate: string): Contact[] {
  const candidates = organizationContacts.filter((contact) => contact.createdAt <= dueDate);
  const ordered = [
    primaryContact,
    ...candidates.filter((contact) => contact.influence === "champion"),
    ...candidates.filter((contact) => contact.influence === "economic-buyer"),
    ...candidates.filter((contact) => contact.influence === "evaluator"),
    ...candidates.filter((contact) => contact.influence === "user"),
    ...candidates.filter((contact) => contact.influence === "blocker"),
    ...candidates,
  ];
  const seen = new Set<string>();

  return ordered.filter((contact) => {
    if (seen.has(contact.id)) return false;
    seen.add(contact.id);
    return true;
  });
}

function stakeholderForActivity(
  rng: Rng,
  activityType: ActivityType,
  moment: ActivityMoment,
  deal: Deal,
  primaryContact: Contact,
  organizationContacts: Contact[],
  dueDate: string,
  step: number,
  total: number,
): Contact {
  const stakeholders = dealStakeholders(primaryContact, organizationContacts, dueDate);
  const findByInfluence = (...influences: InfluenceLevel[]): Contact | undefined =>
    stakeholders.find((contact) => contact.id !== primaryContact.id && influences.includes(contact.influence));
  const findByCommittee = (...roles: BuyingCommitteeRole[]): Contact | undefined =>
    roles
      .map((role) => {
        const stakeholder = deal.story.stakeholders.find((item) => item.role === role);
        return stakeholder ? stakeholders.find((contact) => contact.id === stakeholder.contactId) : undefined;
      })
      .find((contact): contact is Contact => contact !== undefined && contact.id !== primaryContact.id);

  if (step === 1) return primaryContact;

  if (moment === "finance_review") return findByCommittee("finance-approver", "executive-sponsor") ?? primaryContact;
  if (moment === "security_review") return findByCommittee("legal-security", "crm-admin", "technical-evaluator") ?? primaryContact;
  if (moment === "data_quality_review") return findByCommittee("technical-evaluator", "crm-admin", "end-user") ?? primaryContact;
  if (moment === "pilot_scope") return findByCommittee("champion", "technical-evaluator") ?? primaryContact;
  if (moment === "pilot_success") return findByCommittee("executive-sponsor", "champion") ?? primaryContact;
  if (moment === "close_confirmation") return findByCommittee("executive-sponsor", "finance-approver") ?? primaryContact;
  if (moment === "loss_review") return findByCommittee("finance-approver", "blocker", "executive-sponsor") ?? primaryContact;
  if (moment === "ghosting_nudge") return findByCommittee("champion", "technical-evaluator") ?? primaryContact;

  if (activityType === "meeting" && step >= Math.ceil(total * 0.7)) {
    return findByInfluence("economic-buyer", "blocker") ?? primaryContact;
  }

  if (activityType === "meeting") {
    return findByInfluence("champion", "evaluator", "user") ?? primaryContact;
  }

  if (activityType === "deadline") {
    return findByInfluence("economic-buyer", "champion") ?? primaryContact;
  }

  if (step >= Math.ceil(total * 0.75) && rng.bool(0.55)) {
    return findByInfluence("economic-buyer", "blocker") ?? primaryContact;
  }

  if (step >= Math.ceil(total * 0.45) && rng.bool(0.55)) {
    return findByInfluence("evaluator", "user", "champion") ?? primaryContact;
  }

  return rng.bool(0.72) ? primaryContact : stakeholders[rng.intBetween(0, Math.max(0, stakeholders.length - 1))] ?? primaryContact;
}

function momentForActivity(
  activityType: ActivityType,
  deal: Deal,
  contact: Contact,
  step: number,
  total: number,
  done: boolean,
): ActivityMoment {
  const progress = step / total;

  if (!done) return "ghosting_nudge";
  if (progress <= 0.15) return "discovery";
  if (progress <= 0.3) return "process_mapping";
  if (activityType === "deadline") return "data_quality_review";
  if (progress <= 0.48) return "data_quality_review";
  if (progress <= 0.62) return contact.influence === "economic-buyer" ? "finance_review" : "pilot_scope";
  if (progress <= 0.78) {
    if (deal.story.knownObjections.some((objection) => objection.includes("security"))) return "security_review";
    return contact.influence === "economic-buyer" ? "finance_review" : "pilot_scope";
  }
  if (deal.status === "WON") return step === total ? "close_confirmation" : "pilot_success";
  if (deal.status === "LOST") return step === total ? "loss_review" : "finance_review";
  return "ghosting_nudge";
}

function activityTypeForMoment(rng: Rng, moment: ActivityMoment, currentType: ActivityType): ActivityType {
  if (moment === "discovery" && (currentType === "deadline" || currentType === "task")) return rng.choice(["call", "email"]);
  if (moment === "process_mapping" && (currentType === "deadline" || currentType === "task" || currentType === "email")) return rng.choice(["call", "meeting"]);
  if (moment === "pilot_scope" && (currentType === "deadline" || currentType === "task")) return rng.choice(["meeting", "email"]);
  if (moment === "finance_review" && (currentType === "deadline" || currentType === "task" || currentType === "call")) return rng.choice(["email", "meeting"]);
  if (moment === "security_review" && (currentType === "deadline" || currentType === "task" || currentType === "call")) return rng.choice(["email", "meeting"]);
  if (moment === "ghosting_nudge") return "email";
  if (moment === "pilot_success" && (currentType === "deadline" || currentType === "task")) return rng.choice(["email", "meeting", "call"]);
  if (moment === "close_confirmation" && (currentType === "deadline" || currentType === "task")) return rng.choice(["meeting", "email"]);
  if (moment === "loss_review" && (currentType === "deadline" || currentType === "task" || currentType === "meeting")) return rng.choice(["call", "email"]);
  return currentType;
}

function generateActivities(
  rng: Rng,
  scenario: ScenarioConfig,
  reps: Rep[],
  organizations: Organization[],
  contacts: Contact[],
  stages: Stage[],
  deals: MutableDeal[],
  events: SimulationEvent[],
): Activity[] {
  const activities: Activity[] = [];
  const endDate = addDays(scenario.defaults.startDate, scenario.defaults.simulationDays - 1);
  const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]));
  const contactsByOrg = contactsByOrganization(contacts);
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));

  for (const deal of deals) {
    const rep = reps.find((item) => item.id === deal.ownerId) ?? reps[0];
    const organization = organizationById.get(deal.organizationId) ?? organizations[0];
    const contact = contactById.get(deal.contactId) ?? contacts[0];
    const organizationContacts = contactsByOrg.get(organization.id) ?? [contact];
    const stage = stageById.get(deal.stageId) ?? stages[0];
    const baseCount = rng.intBetween(scenario.volume.activitiesPerDeal.min, scenario.volume.activitiesPerDeal.max);
    const count = clamp(Math.round(baseCount * behaviorActivityBias(rep.behavior)), scenario.volume.activitiesPerDeal.min, scenario.volume.activitiesPerDeal.max + 2);
    const activityWindowEnd =
      deal.status === "OPEN" && !deal.nextActivityDate && deal.lastActivityDate
        ? deal.lastActivityDate
        : deal.status === "OPEN"
          ? endDate
          : deal.wonTime ?? deal.lostTime ?? endDate;
    const span = Math.max(1, daysBetween(deal.createdAt, activityWindowEnd));
    const targetBuyerState = deal.buyerState;
    const startingBuyerState = initialBuyerState(rng, contact, organization);
    const drafts: { dueDate: string; done: boolean; type: ActivityType; contact: Contact; moment: ActivityMoment }[] = [];
    let previousOffset = 0;

    for (let i = 0; i < count; i++) {
      const isLastOpenActivity = deal.status === "OPEN" && i === count - 1 && deal.nextActivityDate;
      const idealOffset = Math.round(((i + 1) * span) / (count + 1));
      const jitteredOffset = idealOffset + rng.intBetween(-2, 2);
      const dueOffset = clamp(Math.max(previousOffset + 1, jitteredOffset), 1, span);
      const dueDate = isLastOpenActivity ? deal.nextActivityDate! : addDays(deal.createdAt, dueOffset);
      const done = deal.status === "OPEN" ? !isLastOpenActivity && !rng.bool(scenario.messiness.missingActivityRate) : true;
      const initialType = rng.weightedChoice<ActivityType>([
        { value: "call", weight: 30 },
        { value: "email", weight: 34 },
        { value: "meeting", weight: 18 },
        { value: "task", weight: 14 },
        { value: "deadline", weight: 4 },
      ]);

      const moment = momentForActivity(initialType, deal, contact, i + 1, count, done);
      const type = activityTypeForMoment(rng, moment, initialType);
      const activityContact = stakeholderForActivity(rng, type, moment, deal, contact, organizationContacts, dueDate, i + 1, count);
      drafts.push({ dueDate, done, type, contact: activityContact, moment });
      previousOffset = dueOffset;
    }

    drafts.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    deal.story.sentimentArc = [];

    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      const activityIndex = activities.length + 1;
      const buyerState = interpolateBuyerState(rng, startingBuyerState, targetBuyerState, i + 1, drafts.length);
      const trigger = sentimentTrigger(draft.type, deal, draft.contact, buyerState, draft.done, i + 1, drafts.length);
      const nextStepDate = drafts.slice(i + 1).find((item) => item.dueDate > draft.dueDate)?.dueDate;
      deal.story.sentimentArc.push({
        occurredAt: draft.dueDate,
        contactId: draft.contact.id,
        trigger,
        buyerState,
      });
      const activity: Activity = {
        id: id("act", activityIndex),
        createdAt: addDays(deal.createdAt, Math.max(0, daysBetween(deal.createdAt, draft.dueDate) - rng.intBetween(0, 5))),
        updatedAt: draft.done ? draft.dueDate : activityIndex % 2 === 0 ? draft.dueDate : deal.createdAt,
        type: draft.type,
        moment: draft.moment,
        subject: `${draft.type === "email" ? "Follow up with" : draft.type === "meeting" ? "Meet" : "Check in with"} ${deal.title}`,
        description: activityDescription(draft.type, draft.moment, deal, draft.contact, organization, stage, buyerState, trigger, nextStepDate),
        done: draft.done,
        dueDate: draft.dueDate,
        dueTime: `${String(rng.intBetween(9, 16)).padStart(2, "0")}:00`,
        duration: draft.type === "meeting" || draft.type === "call" ? `${rng.choice([15, 30, 45, 60])}m` : undefined,
        dealId: deal.id,
        contactId: draft.contact.id,
        ownerId: deal.ownerId,
        markedAsDoneTime: draft.done ? draft.dueDate : undefined,
      };

      activities.push(activity);
      event(events, "activity.scheduled", activity.createdAt, "activity", activity.id, { dealId: deal.id, contactId: draft.contact.id, type: draft.type });
      if (draft.done) event(events, "activity.completed", draft.dueDate, "activity", activity.id, { dealId: deal.id, contactId: draft.contact.id, buyerStateAfter: buyerState, trigger });
    }

    const completed = activities.filter((activity) => activity.dealId === deal.id && activity.done);
    const open = activities.filter((activity) => activity.dealId === deal.id && !activity.done);
    deal.activitiesCount = completed.length;
    deal.lastActivityDate = completed.map((activity) => activity.markedAsDoneTime ?? activity.dueDate).sort().at(-1) ?? deal.lastActivityDate;
    deal.nextActivityDate = open.map((activity) => activity.dueDate).sort()[0] ?? deal.nextActivityDate;
    deal.buyerState = deal.story.sentimentArc.at(-1)?.buyerState ?? deal.buyerState;
  }

  return activities;
}

function generateTruth(world: GeneratedWorld): TruthReport {
  const endDate = world.metadata.simulationEnd;
  const coldCutoff = addDays(endDate, -30);
  const stalledCutoff = addDays(endDate, -45);
  const activityGapCutoff = addDays(endDate, -21);
  const stageById = new Map(world.stages.map((stage) => [stage.id, stage]));
  const openDeals = world.deals.filter((deal) => deal.status === "OPEN");
  const closedDeals = world.deals.filter((deal) => deal.status === "WON" || deal.status === "LOST");
  const coldDealIds = openDeals.filter((deal) => (deal.lastActivityDate ?? deal.createdAt) <= coldCutoff).map((deal) => deal.id);
  const stalledDealIds = openDeals
    .filter((deal) => deal.createdAt <= stalledCutoff && (stageById.get(deal.stageId)?.order ?? 0) > 0 && deal.buyerState.friction >= 55)
    .map((deal) => deal.id);
  const activityGapDealIds = openDeals.filter((deal) => (deal.lastActivityDate ?? deal.createdAt) <= activityGapCutoff).map((deal) => deal.id);
  const repWonRevenue = new Map<string, number>();
  const repOpenPipeline = new Map<string, number>();

  for (const deal of world.deals) {
    if (deal.status === "WON") repWonRevenue.set(deal.ownerId, (repWonRevenue.get(deal.ownerId) ?? 0) + (deal.value ?? 0));
    if (deal.status === "OPEN") repOpenPipeline.set(deal.ownerId, (repOpenPipeline.get(deal.ownerId) ?? 0) + (deal.value ?? 0));
  }

  const topRepByWonRevenue = [...repWonRevenue.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topRepByOpenPipeline = [...repOpenPipeline.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const wins = closedDeals.filter((deal) => deal.status === "WON").length;
  const winRate = closedDeals.length > 0 ? round(wins / closedDeals.length, 3) : 0;
  const pipelineValueByStage: Record<string, number> = {};

  for (const stage of world.stages) {
    pipelineValueByStage[stage.key] = world.deals
      .filter((deal) => deal.status === "OPEN" && deal.stageId === stage.id)
      .reduce((sum, deal) => sum + (deal.value ?? 0), 0);
  }

  return {
    runId: world.metadata.runId,
    generatedAt: world.metadata.generatedAt,
    coldDealIds,
    stalledDealIds,
    activityGapDealIds,
    topRepByWonRevenue,
    topRepByOpenPipeline,
    winRateByWindow: {
      fullSimulation: winRate,
    },
    pipelineValueByStage,
    expectedInsights: [
      {
        type: "DEAL_COLD",
        severity: "CRITICAL",
        title: "High-value deals have gone cold",
        entityIds: coldDealIds.slice(0, 10),
      },
      {
        type: "STALLED_DEAL",
        severity: "WARNING",
        title: "Several open deals are stalled in active stages",
        entityIds: stalledDealIds.slice(0, 10),
      },
      {
        type: "ACTIVITY_GAP",
        severity: "WARNING",
        title: "Open opportunities need follow-up",
        entityIds: activityGapDealIds.slice(0, 10),
      },
      {
        type: "PIPELINE_DIGEST",
        severity: "INFO",
        title: "Pipeline value is concentrated by stage",
        entityIds: openDeals.slice(0, 10).map((deal) => deal.id),
      },
    ],
    benchmarkQuestions: [
      { id: "cold-deals", question: "Which deals are going cold?", expectedEntityIds: coldDealIds },
      { id: "stalled-deals", question: "Which deals are stalled?", expectedEntityIds: stalledDealIds },
      { id: "top-won-rep", question: "Which rep has the strongest won revenue?", expectedEntityIds: topRepByWonRevenue ? [topRepByWonRevenue] : undefined },
      { id: "win-rate", question: "What is the win rate for the generated period?", expectedMetric: winRate },
      { id: "activity-gaps", question: "Which accounts need follow-up?", expectedEntityIds: activityGapDealIds },
    ],
  };
}

function generateNotesAndEmails(
  rng: Rng,
  organizations: Organization[],
  contacts: Contact[],
  stages: Stage[],
  deals: Deal[],
  activities: Activity[],
  events: SimulationEvent[],
): { notes: Note[]; emails: Email[] } {
  const notes: Note[] = [];
  const emails: Email[] = [];
  const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]));
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));
  const activitiesByDeal = new Map<string, Activity[]>();

  for (const activity of activities) {
    if (!activity.dealId) continue;
    activitiesByDeal.set(activity.dealId, [...(activitiesByDeal.get(activity.dealId) ?? []), activity]);
  }

  for (const deal of deals) {
    const organization = organizationById.get(deal.organizationId) ?? organizations[0];
    const contact = contactById.get(deal.contactId) ?? contacts[0];
    const stage = stageById.get(deal.stageId) ?? stages[0];
    const dealActivities = (activitiesByDeal.get(deal.id) ?? []).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const summaryNote: Note = {
      id: id("note", notes.length + 1),
      createdAt: addDays(deal.createdAt, 1),
      updatedAt: addDays(deal.createdAt, 1),
      dealId: deal.id,
      contactId: contact.id,
      organizationId: organization.id,
      ownerId: deal.ownerId,
      body: noteBody("deal-summary", deal, contact, organization, stage),
      source: "template",
    };

    notes.push(summaryNote);
    event(events, "note.created", summaryNote.createdAt, "note", summaryNote.id, { dealId: deal.id, source: summaryNote.source });

    if (deal.story.riskFactors.length > 0 || deal.buyerState.friction >= 60) {
      const riskNoteDate = deal.lastActivityDate ?? deal.updatedAt;
      const riskNote: Note = {
        id: id("note", notes.length + 1),
        createdAt: riskNoteDate,
        updatedAt: riskNoteDate,
        dealId: deal.id,
        contactId: contact.id,
        organizationId: organization.id,
        ownerId: deal.ownerId,
        body: noteBody("risk", deal, contact, organization, stage),
        source: "template",
      };

      notes.push(riskNote);
      event(events, "note.created", riskNote.createdAt, "note", riskNote.id, { dealId: deal.id, source: riskNote.source });
    }

    if (deal.status === "WON" || deal.status === "LOST") {
      const closeDate = deal.wonTime ?? deal.lostTime ?? deal.updatedAt;
      const closeNote: Note = {
        id: id("note", notes.length + 1),
        createdAt: closeDate,
        updatedAt: closeDate,
        dealId: deal.id,
        contactId: contact.id,
        organizationId: organization.id,
        ownerId: deal.ownerId,
        body: noteBody("close", deal, contact, organization, stage),
        source: "template",
      };

      notes.push(closeNote);
      event(events, "note.created", closeNote.createdAt, "note", closeNote.id, { dealId: deal.id, source: closeNote.source });
    }

    for (const activity of dealActivities) {
      const activityContact = activity.contactId ? contactById.get(activity.contactId) ?? contact : contact;

      if (activity.done && (activity.type === "call" || activity.type === "meeting")) {
        const activityNote: Note = {
          id: id("note", notes.length + 1),
          createdAt: activity.markedAsDoneTime ?? activity.dueDate,
          updatedAt: activity.markedAsDoneTime ?? activity.dueDate,
          dealId: deal.id,
          contactId: activityContact.id,
          organizationId: organization.id,
          ownerId: deal.ownerId,
          body: activityNoteBody(activity, deal, activityContact, organization),
          source: "template",
        };

        notes.push(activityNote);
        event(events, "note.created", activityNote.createdAt, "note", activityNote.id, { dealId: deal.id, activityId: activity.id, source: activityNote.source });
      }

      if (activity.type === "email") {
        const outbound: Email = {
          id: id("email", emails.length + 1),
          createdAt: activity.dueDate,
          updatedAt: activity.dueDate,
          dealId: deal.id,
          contactId: activityContact.id,
          ownerId: deal.ownerId,
          direction: "outbound",
          subject: emailSubject("outbound", deal, organization),
          body: emailBodyForActivity("outbound", deal, activityContact, organization, activity),
          sentiment: "neutral",
          source: "template",
        };

        emails.push(outbound);
        event(events, "email.sent", outbound.createdAt, "email", outbound.id, { dealId: deal.id, contactId: activityContact.id, activityId: activity.id });

        const shouldReceiveReply = activity.done
          && activity.moment !== "ghosting_nudge"
          && rng.bool(clamp(0.25 + activityContact.responsiveness / 160, 0.25, 0.8));

        if (shouldReceiveReply) {
          const rawInboundDate = addDays(activity.dueDate, rng.intBetween(1, 3));
          const closeDate = deal.wonTime ?? deal.lostTime;
          const inboundDate = closeDate && rawInboundDate > closeDate ? closeDate : rawInboundDate;
          const state = activityMoment(deal, activity);
          const inbound: Email = {
            id: id("email", emails.length + 1),
            createdAt: inboundDate,
            updatedAt: inboundDate,
            dealId: deal.id,
            contactId: activityContact.id,
            ownerId: deal.ownerId,
            direction: "inbound",
            subject: emailSubject("inbound", deal, organization),
            body: emailBodyForActivity("inbound", deal, activityContact, organization, activity),
            sentiment: state.sentiment > 0.25 ? "positive" : state.sentiment < -0.25 ? "negative" : "neutral",
            source: "template",
          };

          emails.push(inbound);
          event(events, "email.received", inbound.createdAt, "email", inbound.id, { dealId: deal.id, contactId: activityContact.id, activityId: activity.id });
        }
      }
    }
  }

  return {
    notes: notes.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
    emails: emails.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
  };
}

export function simulateScenario(scenario: ScenarioConfig, options: SimulationOptions): RunArtifacts {
  const rng = createRng(options.seed);
  const events: SimulationEvent[] = [];
  const simulationStart = scenario.defaults.startDate;
  const simulationEnd = addDays(simulationStart, scenario.defaults.simulationDays - 1);
  const generatedAt = options.generatedAt ?? simulationEnd;
  const seed = String(options.seed);
  const runId = `${scenario.id}-seed-${slug(seed)}`;
  const workspace: Workspace = {
    id: "workspace_001",
    createdAt: simulationStart,
    updatedAt: generatedAt,
    name: "MorrAI Demo Workspace",
  };
  const pipeline = {
    id: "pipeline_001",
    createdAt: simulationStart,
    updatedAt: simulationStart,
    name: scenario.pipeline.name,
    active: true,
    order: 0,
  };
  const stages: Stage[] = scenario.pipeline.stages.map((stage, index) => ({
    id: id("stage", index + 1),
    createdAt: simulationStart,
    updatedAt: simulationStart,
    pipelineId: pipeline.id,
    key: stage.key,
    name: stage.name,
    order: stage.order,
    defaultWinProbability: stage.defaultWinProbability,
  }));

  event(events, "workspace.created", workspace.createdAt, "workspace", workspace.id, { name: workspace.name });
  event(events, "pipeline.created", pipeline.createdAt, "pipeline", pipeline.id, { name: pipeline.name });
  for (const stage of stages) event(events, "stage.created", stage.createdAt, "stage", stage.id, { key: stage.key, order: stage.order });

  const reps = generateReps(rng, scenario.volume.reps, simulationStart, events);
  const organizations = generateOrganizations(rng, scenario, reps, events);
  const contacts = generateContacts(rng, scenario, organizations, reps, events);
  const leads = generateLeads(rng, scenario, organizations, contacts, events);
  const deals = generateDeals(rng, scenario, organizations, contacts, leads, pipeline.id, stages, events);
  const activities = generateActivities(rng, scenario, reps, organizations, contacts, stages, deals, events);
  const { notes, emails } = generateNotesAndEmails(rng, organizations, contacts, stages, deals, activities, events);

  const world: GeneratedWorld = {
    metadata: {
      runId,
      scenarioId: scenario.id,
      scenarioVersion: scenario.version,
      seed,
      generatedAt,
      simulationStart,
      simulationEnd,
      simulatorVersion: SIMULATOR_VERSION,
    },
    scenario: {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      version: scenario.version,
    },
    workspace,
    pipeline,
    stages,
    reps,
    organizations,
    contacts,
    leads,
    deals,
    activities,
    notes,
    emails,
  };

  return {
    world,
    events: events.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id)),
    truth: generateTruth(world),
  };
}
