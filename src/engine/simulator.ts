import { createRng, type Rng, type Seed } from "./rng.js";
import type {
  Activity,
  ActivityType,
  BuyingStyle,
  CommunicationStyle,
  Contact,
  Deal,
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
const ROLES = ["CEO", "Head of Sales", "Revenue Operations Lead", "Sales Manager", "Finance Director", "Operations Manager", "CRM Admin"];
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

function daysBetween(start: string, end: string): number {
  return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / DAY_MS);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
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
    };
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

function contactTraits(rng: Rng, contactIndex: number): Pick<Contact, "role" | "seniority" | "influence" | "communicationStyle"> {
  const role = ROLES[contactIndex % ROLES.length];
  const seniority: Seniority = role.includes("CEO") || role.includes("Head") || role.includes("Director") ? "executive" : rng.choice(["director", "manager", "individual-contributor"]);
  const influence: InfluenceLevel = role.includes("CEO") || role.includes("Finance")
    ? "economic-buyer"
    : role.includes("Sales")
      ? "champion"
      : rng.choice(["evaluator", "blocker", "user"]);

  return {
    role,
    seniority,
    influence,
    communicationStyle: rng.choice<CommunicationStyle>(["direct", "analytical", "warm", "skeptical", "busy"]),
  };
}

function generateContacts(rng: Rng, scenario: ScenarioConfig, organizations: Organization[], reps: Rep[], events: SimulationEvent[]): Contact[] {
  const contacts: Contact[] = [];

  for (const org of organizations) {
    const count = rng.intBetween(scenario.volume.contactsPerOrganization.min, scenario.volume.contactsPerOrganization.max);

    for (let localIndex = 0; localIndex < count; localIndex++) {
      const index = contacts.length + 1;
      const name = `${rng.choice(FIRST_NAMES)} ${rng.choice(LAST_NAMES)}`;
      const traits = contactTraits(rng, localIndex);
      const createdAt = addDays(org.createdAt, rng.intBetween(0, 12));
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
        responsiveness: round(clamp(rng.normalish(62, 18), 8, 98), 0),
        sentimentBias: round(clamp(rng.normalish(0, 0.32), -0.8, 0.8), 2),
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
    const contact = rng.choice(byOrg.get(organization.id) ?? contacts);
    const latestLeadCreateOffset = Math.max(1, scenario.defaults.simulationDays - 45);
    const createdAt = addDays(scenario.defaults.startDate, rng.intBetween(0, latestLeadCreateOffset));
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

function sentimentPhrase(deal: Deal): string {
  if (deal.buyerState.sentiment >= 0.45) return "positive";
  if (deal.buyerState.sentiment >= 0.15) return "open but still cautious";
  if (deal.buyerState.sentiment <= -0.35) return "skeptical";
  if (deal.buyerState.sentiment <= -0.1) return "cautious";
  return "neutral";
}

function engagementPhrase(deal: Deal): string {
  if (deal.buyerState.engagement >= 75) return "highly engaged";
  if (deal.buyerState.engagement >= 55) return "responsive";
  if (deal.buyerState.engagement >= 35) return "somewhat engaged";
  return "hard to keep engaged";
}

function frictionPhrase(deal: Deal): string {
  if (deal.buyerState.friction >= 75) return "there is heavy internal friction";
  if (deal.buyerState.friction >= 55) return "there are a few internal blockers";
  if (deal.buyerState.friction >= 35) return "there are manageable concerns";
  return "there is limited friction so far";
}

function activityDescription(activityType: ActivityType, deal: Deal, contact: Contact, organization: Organization, stage: Stage): string {
  const nextStep = deal.nextActivityDate ? `Next step is scheduled for ${compactDate(deal.nextActivityDate)}.` : "No next step is currently scheduled.";
  const riskLine = deal.story.riskFactors.length > 0 ? `Known risk: ${deal.story.riskFactors.join(", ")}.` : "No material risk recorded yet.";

  if (activityType === "call") {
    return `Spoke with ${contact.name} at ${organization.name} about ${deal.story.need}. They sounded ${sentimentPhrase(deal)} and ${engagementPhrase(deal)}; ${frictionPhrase(deal)}. ${riskLine} ${nextStep}`;
  }

  if (activityType === "meeting") {
    return `Meeting recap for ${organization.name}: reviewed ${deal.story.need}, current stage ${stage.name}, and win condition: ${deal.story.winCondition}. Objections discussed: ${deal.story.knownObjections.join(", ")}. ${nextStep}`;
  }

  if (activityType === "email") {
    return `Follow-up sent to ${contact.name} covering ${deal.story.need}. Mentioned urgency driver: ${deal.story.urgencyReason}. ${riskLine}`;
  }

  if (activityType === "deadline") {
    return `Deadline checkpoint for ${deal.title}. Expected close date: ${compactDate(deal.expectedCloseDate)}. Current status: ${deal.status}. ${riskLine}`;
  }

  return `Internal task for ${deal.title}: verify current stakeholder alignment, update CRM fields, and confirm whether ${contact.name} owns the next step. ${nextStep}`;
}

function noteBody(kind: "deal-summary" | "risk" | "close", deal: Deal, contact: Contact, organization: Organization, stage: Stage): string {
  if (kind === "risk") {
    return `${organization.name} risk note: ${deal.story.riskFactors.join(", ")}. ${contact.name} is the current linked stakeholder. The account is ${engagementPhrase(deal)}, but ${frictionPhrase(deal)}.`;
  }

  if (kind === "close") {
    if (deal.status === "WON") {
      return `Closed won with ${organization.name}. Win condition met: ${deal.story.winCondition}. Primary contact was ${contact.name}.`;
    }

    return `Closed lost with ${organization.name}. Lost reason: ${deal.lostReason ?? "not recorded"}. Main objections were ${deal.story.knownObjections.join(", ")}.`;
  }

  return `${deal.title} summary: ${organization.name} is evaluating ${deal.story.need}. Current stage is ${stage.name}. Urgency reason: ${deal.story.urgencyReason}. Known objections: ${deal.story.knownObjections.join(", ")}.`;
}

function emailBody(direction: Email["direction"], deal: Deal, contact: Contact, organization: Organization): string {
  if (direction === "inbound") {
    return `Hi, thanks for the follow-up. We are still interested in ${deal.story.need}, but need to work through ${deal.story.knownObjections[0]} before committing to the next step.`;
  }

  return `Hi ${contact.name}, following up on our conversation about ${deal.story.need} at ${organization.name}. The main next step is to confirm this path: ${deal.story.winCondition}.`;
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
    const sourceLead = convertedLeads[index % convertedLeads.length];
    const organization = sourceLead ? organizations.find((item) => item.id === sourceLead.organizationId) ?? organizations[index % organizations.length] : organizations[index % organizations.length];
    const contact = sourceLead ? contacts.find((item) => item.id === sourceLead.contactId) ?? rng.choice(byOrg.get(organization.id) ?? contacts) : rng.choice(byOrg.get(organization.id) ?? contacts);
    const ownerId = organization.ownerId;
    const createdAt = sourceLead ? addDays(sourceLead.createdAt, rng.intBetween(2, 18)) : addDays(scenario.defaults.startDate, rng.intBetween(8, 100));
    const status = dealStatusForIndex(rng, scenario, index);
    const isForcedCold = index >= scenario.targets.minClosedDeals && index < scenario.targets.minClosedDeals + scenario.targets.minColdDeals;
    const isForcedStalled = index >= scenario.targets.minClosedDeals + scenario.targets.minColdDeals && index < scenario.targets.minClosedDeals + scenario.targets.minColdDeals + scenario.targets.minStalledDeals;
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
    const deal: MutableDeal = {
      id: id("deal", index + 1),
      createdAt,
      updatedAt: status === "OPEN" ? lastActivityDate : closedAt,
      title: `${organization.name} - ${rng.choice(["DataHub rollout", "CRM intelligence", "sales analytics", "pipeline audit"])}`,
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
        friction: round(clamp(rng.normalish(status === "LOST" ? 76 : isForcedStalled ? 68 : 38, 17), 0, 100), 0),
      },
      story: {
        need: rng.choice(NEEDS),
        urgencyReason: rng.choice(["board reporting pressure", "new quarter planning", "missed forecast review", "recent campaign spike"]),
        knownObjections: pickMany(rng, ["budget", "implementation time", "CRM data quality", "security review", "change management"], rng.intBetween(1, 3)),
        winCondition: rng.choice(["executive sponsor confirms value", "RevOps validates pipeline report", "pilot proves stale-deal detection"]),
        riskFactors: isForcedCold || isForcedStalled ? ["low recent activity", "optimistic close date"] : pickMany(rng, ["stakeholder alignment", "budget timing", "data quality"], 2),
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
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));

  for (const deal of deals) {
    const rep = reps.find((item) => item.id === deal.ownerId) ?? reps[0];
    const organization = organizationById.get(deal.organizationId) ?? organizations[0];
    const contact = contactById.get(deal.contactId) ?? contacts[0];
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

    for (let i = 0; i < count; i++) {
      const activityIndex = activities.length + 1;
      const isLastOpenActivity = deal.status === "OPEN" && i === count - 1 && deal.nextActivityDate;
      const dueDate = isLastOpenActivity ? deal.nextActivityDate! : addDays(deal.createdAt, rng.intBetween(1, span));
      const done = deal.status === "OPEN" ? !isLastOpenActivity && !rng.bool(scenario.messiness.missingActivityRate) : true;
      const type = rng.weightedChoice<ActivityType>([
        { value: "call", weight: 30 },
        { value: "email", weight: 34 },
        { value: "meeting", weight: 18 },
        { value: "task", weight: 14 },
        { value: "deadline", weight: 4 },
      ]);
      const activity: Activity = {
        id: id("act", activityIndex),
        createdAt: addDays(deal.createdAt, Math.max(0, daysBetween(deal.createdAt, dueDate) - rng.intBetween(0, 5))),
        updatedAt: done ? dueDate : activityIndex % 2 === 0 ? dueDate : deal.createdAt,
        type,
        subject: `${type === "email" ? "Follow up with" : type === "meeting" ? "Meet" : "Check in with"} ${deal.title}`,
        description: activityDescription(type, deal, contact, organization, stage),
        done,
        dueDate,
        dueTime: `${String(rng.intBetween(9, 16)).padStart(2, "0")}:00`,
        duration: type === "meeting" || type === "call" ? `${rng.choice([15, 30, 45, 60])}m` : undefined,
        dealId: deal.id,
        contactId: deal.contactId,
        ownerId: deal.ownerId,
        markedAsDoneTime: done ? dueDate : undefined,
      };

      activities.push(activity);
      event(events, "activity.scheduled", activity.createdAt, "activity", activity.id, { dealId: deal.id, type });
      if (done) event(events, "activity.completed", dueDate, "activity", activity.id, { dealId: deal.id });
    }

    const completed = activities.filter((activity) => activity.dealId === deal.id && activity.done);
    const open = activities.filter((activity) => activity.dealId === deal.id && !activity.done);
    deal.activitiesCount = completed.length;
    deal.lastActivityDate = completed.map((activity) => activity.markedAsDoneTime ?? activity.dueDate).sort().at(-1) ?? deal.lastActivityDate;
    deal.nextActivityDate = open.map((activity) => activity.dueDate).sort()[0] ?? deal.nextActivityDate;
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
  events: SimulationEvent[],
): { notes: Note[]; emails: Email[] } {
  const notes: Note[] = [];
  const emails: Email[] = [];
  const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]));
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));

  for (const deal of deals) {
    const organization = organizationById.get(deal.organizationId) ?? organizations[0];
    const contact = contactById.get(deal.contactId) ?? contacts[0];
    const stage = stageById.get(deal.stageId) ?? stages[0];
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

    const outboundDate = addDays(deal.createdAt, 2);
    const outbound: Email = {
      id: id("email", emails.length + 1),
      createdAt: outboundDate,
      updatedAt: outboundDate,
      dealId: deal.id,
      contactId: contact.id,
      ownerId: deal.ownerId,
      direction: "outbound",
      subject: `Next steps for ${organization.name}`,
      body: emailBody("outbound", deal, contact, organization),
      sentiment: "neutral",
      source: "template",
    };

    emails.push(outbound);
    event(events, "email.sent", outbound.createdAt, "email", outbound.id, { dealId: deal.id, contactId: contact.id });

    if (rng.bool(0.65)) {
      const inboundDate = addDays(deal.createdAt, rng.intBetween(4, 18));
      const inbound: Email = {
        id: id("email", emails.length + 1),
        createdAt: inboundDate,
        updatedAt: inboundDate,
        dealId: deal.id,
        contactId: contact.id,
        ownerId: deal.ownerId,
        direction: "inbound",
        subject: `Re: Next steps for ${organization.name}`,
        body: emailBody("inbound", deal, contact, organization),
        sentiment: deal.buyerState.sentiment > 0.25 ? "positive" : deal.buyerState.sentiment < -0.25 ? "negative" : "neutral",
        source: "template",
      };

      emails.push(inbound);
      event(events, "email.received", inbound.createdAt, "email", inbound.id, { dealId: deal.id, contactId: contact.id });
    }
  }

  return { notes, emails };
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
  const { notes, emails } = generateNotesAndEmails(rng, organizations, contacts, stages, deals, events);

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
