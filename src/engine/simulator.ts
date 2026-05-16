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
  // Baltic / Latvian
  "Aiva", "Marta", "Laura", "Elina", "Sofia", "Anna", "Noah", "Rihards", "Maks", "Leo", "Daniel", "Oskars",
  "Liene", "Karlis", "Janis", "Inese", "Andris", "Krista", "Edgars", "Madara", "Toms", "Zane", "Ivars", "Kristine",
  "Linda", "Reinis", "Jurgis", "Sandra", "Roberts", "Anete", "Davis", "Ilze", "Aigars", "Vita", "Peteris", "Dace",
  "Gints", "Inga", "Martins", "Ineta", "Valters", "Gunta", "Arturs", "Anita", "Raivis", "Aija", "Egils", "Ieva",
  // Nordic / continental EU
  "Henrik", "Astrid", "Linnea", "Mikael", "Freja", "Lukas", "Emil", "Sara", "Erik", "Maja", "Jonas", "Klara",
  "Sven", "Ingrid", "Magnus", "Annika", "Bjorn", "Tilde", "Soren", "Saga", "Anders", "Sigrid", "Niklas", "Elsa",
  "Petter", "Vilma", "Stefan", "Greta", "Markus", "Wilma", "Felix", "Nora", "Oskar", "Alva", "Kasper", "Linn",
  // Anglo / mixed
  "James", "Olivia", "Ethan", "Hannah", "Lucas", "Mia", "Owen", "Chloe", "Adam", "Grace", "Ben", "Isla",
  "William", "Sophie", "Charlie", "Emma", "Liam", "Ava", "Jack", "Ruby", "Harry", "Lily", "George", "Daisy",
  "Oliver", "Freya", "Theo", "Amelia", "Sam", "Hazel", "Max", "Jasmine", "Henry", "Phoebe", "Felix", "Eva",
  // Southern EU
  "Marco", "Lucia", "Diego", "Paula", "Andre", "Beatriz", "Hugo", "Elena", "Mateo", "Carmen",
  "Sergio", "Sofia", "Lorenzo", "Chiara", "Matteo", "Giulia", "Alessandro", "Valentina", "Pablo", "Isabella",
  "Joaquim", "Catarina", "Tiago", "Rita", "Bruno", "Inês", "Rafa", "Joana", "Nuno", "Mariana",
  // Polish / Czech / Hungarian
  "Tomasz", "Magdalena", "Pawel", "Alicja", "Krzysztof", "Natalia", "Jakub", "Karolina",
  "Petr", "Eva", "Jiri", "Hana", "Martin", "Lenka", "Tomas", "Klara",
  "Balazs", "Eszter", "Zoltan", "Reka", "Levente", "Dora", "Adam", "Anna",
];

const LAST_NAMES = [
  // Baltic / Latvian
  "Ozolina", "Kalnina", "Berzina", "Krumina", "Liepa", "Vitolins", "Ozolins", "Kalnins", "Berzins", "Krumins",
  "Liepins", "Apinis", "Skuja", "Eglitis", "Briedis", "Lacis", "Zarins", "Strauts", "Kalnitis", "Vitols",
  "Caune", "Roze", "Priede", "Bumbieris", "Bite", "Klavins", "Pumpurs", "Saulitis", "Zalitis", "Andersons",
  "Dzenis", "Vanags", "Pinkulis", "Smits", "Avotins", "Plavnieks", "Kazaks", "Sproge", "Veidemane", "Janovics",
  // Nordic / Germanic
  "Anderson", "Bennett", "Cooper", "Meyer", "Novak", "Schmidt", "Lindberg", "Kruger", "Bergstrom", "Sundqvist",
  "Holm", "Eriksen", "Hauser", "Vogel", "Mueller", "Fischer", "Becker", "Lindqvist", "Nilsen", "Larsson",
  "Persson", "Karlsson", "Olsen", "Hansen", "Jensen", "Pedersen", "Nilsson", "Andersson", "Johansson", "Berg",
  "Hoffmann", "Werner", "Klein", "Bauer", "Wagner", "Wolf", "Weber", "Schulz", "Hartmann", "Lehmann",
  // Anglo / mixed
  "Walsh", "Clarke", "Hughes", "Parker", "Brennan", "Cohen", "Reid", "Murray", "Doyle", "Hayes",
  "Bell", "Carter", "Ward", "Patel", "Khan", "Foster", "Mitchell", "Ross", "Webb", "Stone",
  "Riley", "Bennett", "Sutton", "Mason", "Holt", "Lane", "Pierce", "Lloyd", "Quinn", "Marsh",
  // Southern / continental EU
  "Rossi", "Conti", "Bianchi", "Marino", "Silva", "Costa", "Garcia", "Lopez", "Romano", "Esposito",
  "Russo", "Ferrari", "Greco", "Bruno", "Galli", "Moretti", "Mancini", "Lombardi", "Ricci", "Barbieri",
  "Martinez", "Sanchez", "Fernandez", "Gomez", "Hernandez", "Diaz", "Moreno", "Alvarez", "Ortiz", "Castro",
  "Pereira", "Almeida", "Carvalho", "Sousa", "Lima", "Goncalves", "Mendes", "Rocha", "Cardoso", "Teixeira",
  // Polish / Czech / Hungarian
  "Kowalski", "Nowak", "Wisniewski", "Wojcik", "Kaminski", "Lewandowski", "Zielinski", "Jankowski",
  "Novak", "Svoboda", "Dvorak", "Cerny", "Prochazka", "Kucera", "Vesely", "Horak",
  "Nagy", "Kovacs", "Toth", "Szabo", "Horvath", "Varga", "Kiss", "Molnar",
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
    name: "Sofia Lindberg",
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
    name: "Noah Kruger",
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

const LEAD_INTENT_SIGNALS = [
  "visited the pricing page twice after a forecast review",
  "asked for examples of stale-opportunity detection",
  "downloaded the RevOps pipeline hygiene checklist",
  "joined a webinar on sales forecast discipline",
  "replied to an outbound note about missed follow-up",
];

const CAMPAIGN_CONTEXTS = [
  "Q1 pipeline-risk campaign",
  "RevOps workflow webinar",
  "missed-forecast outbound sequence",
  "partner referral from a CRM consultant",
  "sales leadership nurture stream",
];

// ---- expansion-after-won-pilot scenario constants ----
// Premise: org_001 has a WON pilot already, an OPEN expansion deal now,
// and the same buying committee is mixed on widening scope.
const EXPANSION_ORG_STORY = {
  industry: "SaaS",
  sizeBand: "201-500" as const,
  revenueBand: "20M-50M" as const,
  growthStage: "expansion" as const,
  buyingStyle: "champion-led" as const,
  pains: ["scaling pilot wins across more reps", "uneven CRM adoption across teams", "expansion-stage forecasting confidence"],
  buyingTrigger: "the initial pilot proved revenue uplift and leadership now wants the rollout funded before the next planning cycle",
  decisionPressure: "the new CRO has 60 days to show whether the pilot can scale before committing to the larger budget",
};

const EXPANSION_PILOT_DEAL = {
  title: "DataHub pilot - sales leadership",
  need: "prove stale-deal detection inside one sales team",
  urgencyReason: "previous quarter's missed forecast was visible at board level",
  winCondition: "pilot proved stale-deal detection inside the inbound team",
  knownObjections: ["pilot scope creep", "CRM data quality"],
  riskFactors: ["change management on the broader rollout"],
  value: 42_000,
  expectedCloseOffsetDays: 70,
  // closed mid-simulation, ~day 80
};

const EXPANSION_EXPANSION_DEAL = {
  title: "DataHub expansion - full sales org",
  need: "scale the pilot across the full sales org without reopening the pilot debate",
  urgencyReason: "CRO wants the rollout decision before annual planning closes",
  winCondition: "the full sales org runs on the same risk signals the pilot validated",
  knownObjections: ["budget approval", "implementation cost", "rep training time"],
  riskFactors: ["expansion scope vs pilot scope drift", "CRO sponsorship still new"],
  value: 145_000,
  // open, mid-late stage, ~negotiation
};

const EXPANSION_LEAD_PILOT = {
  title: "DataHub pilot - sales leadership inquiry",
  source: "outbound" as const,
  label: "priority",
  value: 38_000,
  story: {
    intentSignal: "Head of Sales asked whether stale deals could be flagged before the next forecast review",
    campaignContext: "missed-forecast outbound sequence",
    qualificationReason: "exec sponsor confirmed forecast credibility is at risk",
    conversionRationale: "converted once the team agreed to scope a paid pilot rather than a free workshop",
    repAssessment: "narrow pilot is the only viable first step; rollout has to wait for proof",
  },
};

const EXPANSION_LEAD_EXPANSION = {
  title: "DataHub expansion after pilot results",
  source: "referral" as const,
  label: "expansion",
  value: 145_000,
  story: {
    intentSignal: "CRO asked for a rollout plan after seeing the pilot's first-month risk-detection results",
    campaignContext: "post-pilot expansion conversation",
    qualificationReason: "pilot evidence is real; CRO has budget authority for rollout",
    conversionRationale: "converted when champion volunteered to drive the cross-team rollout discussion",
    repAssessment: "live opportunity but rollout scope is fluid; risk is scope drift, not interest",
  },
};

// ---- committee-security-delay scenario constants ----
// Premise: org_001 has a stalled OPEN deal in Negotiation stage where champion + RevOps are
// engaged but Finance and Security are dragging it. The data must include both finance_review
// and security_review activities concentrated late in the deal's lifecycle.
const COMMITTEE_ORG_STORY = {
  industry: "FinTech",
  sizeBand: "501-1000" as const,
  revenueBand: "50M-200M" as const,
  growthStage: "growth" as const,
  buyingStyle: "committee" as const,
  crmHygiene: "average" as const,
  pains: ["fragmented account context", "long committee review cycles", "compliance overhead on every new tool"],
  buyingTrigger: "a missed forecast call surfaced gaps in committee visibility that compliance has been flagging for two quarters",
  decisionPressure: "committee meets monthly and security/finance reviews are now the gating step before any go-decision",
};

const COMMITTEE_CONTACT_PROFILES: LabContactProfile[] = [
  {
    name: "Linnea Holm",
    role: "CEO",
    seniority: "executive",
    influence: "economic-buyer",
    committeeRole: "executive-sponsor",
    communicationStyle: "direct",
    personality: "pragmatic",
    priorities: ["forecast confidence", "board-ready metrics", "executive accountability"],
    likelyObjections: ["unclear ROI", "compliance risk"],
    responsiveness: 64,
    sentimentBias: 0.18,
  },
  {
    name: "Henrik Lindberg",
    role: "Head of Sales",
    seniority: "executive",
    influence: "champion",
    committeeRole: "champion",
    communicationStyle: "warm",
    personality: "enthusiastic",
    priorities: ["faster follow-up", "less manual reporting", "rep adoption"],
    likelyObjections: ["another tool for reps to ignore"],
    responsiveness: 78,
    sentimentBias: 0.32,
  },
  {
    name: "Klara Bergstrom",
    role: "Revenue Operations Lead",
    seniority: "manager",
    influence: "evaluator",
    committeeRole: "technical-evaluator",
    communicationStyle: "analytical",
    personality: "curious",
    priorities: ["board-ready metrics", "stale-deal detection", "less manual reporting"],
    likelyObjections: ["data hygiene gaps", "implementation lift"],
    responsiveness: 82,
    sentimentBias: 0.24,
  },
  {
    name: "Mikael Eriksen",
    role: "Finance Director",
    seniority: "executive",
    influence: "economic-buyer",
    committeeRole: "finance-approver",
    communicationStyle: "skeptical",
    personality: "political",
    priorities: ["cleaner forecasting", "cost control", "auditable rollout"],
    likelyObjections: ["budget timing", "vendor concentration", "rollout cost ceiling"],
    responsiveness: 48,
    sentimentBias: -0.36,
  },
  {
    name: "Astrid Vogel",
    role: "Security & Compliance Manager",
    seniority: "director",
    influence: "blocker",
    committeeRole: "legal-security",
    communicationStyle: "direct",
    personality: "risk-averse",
    priorities: ["security review", "data residency", "operational control"],
    likelyObjections: ["security review", "data residency", "audit trail completeness"],
    responsiveness: 56,
    sentimentBias: -0.28,
  },
  {
    name: "Diego Marino",
    role: "CRM Admin",
    seniority: "manager",
    influence: "user",
    committeeRole: "crm-admin",
    communicationStyle: "direct",
    personality: "time-poor",
    priorities: ["low implementation effort", "data hygiene", "rep adoption"],
    likelyObjections: ["implementation time", "field mapping work"],
    responsiveness: 70,
    sentimentBias: -0.10,
  },
  {
    name: "Beatriz Esposito",
    role: "Sales Manager",
    seniority: "manager",
    influence: "user",
    committeeRole: "end-user",
    communicationStyle: "warm",
    personality: "pragmatic",
    priorities: ["faster follow-up", "rep adoption", "less manual reporting"],
    likelyObjections: ["change management"],
    responsiveness: 72,
    sentimentBias: 0.12,
  },
];

const COMMITTEE_DEAL_STORY = {
  title: "FinTech committee rollout - DataHub",
  need: "give the committee a single forecast-risk view they all trust",
  urgencyReason: "two missed forecast calls have made the committee's monthly meeting a tense check-in",
  winCondition: "finance and security both clear the rollout proposal in the same committee cycle",
  // knownObjections MUST include "security review" so momentForActivity triggers security_review at 62-78% progress
  knownObjections: ["security review", "rollout cost ceiling", "data residency"],
  riskFactors: ["security review pending", "finance review pending", "scope sprawl across committee asks"],
  value: 165_000,
};

const COMMITTEE_LEAD = {
  title: "DataHub committee evaluation - forecast risk",
  source: "outbound" as const,
  label: "committee-evaluation",
  value: 130_000,
  story: {
    intentSignal: "CEO asked for a committee-ready proposal after two consecutive missed forecast calls",
    campaignContext: "committee-buyer outbound sequence",
    qualificationReason: "executive sponsor confirmed the committee is the gating step for any new tool",
    conversionRationale: "converted once exec sponsor agreed to formally bring the committee into the evaluation",
    repAssessment: "deal is real but committee dynamics will set the timeline, not us",
  },
};

// ---- ghosted-high-value-opportunity scenario constants ----
// Premise: org_001 has one high-value OPEN deal that had strong early engagement,
// then went silent while the close date stayed optimistic. The signal pattern:
// stale lastActivityDate, expectedCloseDate still in the future, multiple
// ghosting_nudge activities, friction climbing.
const GHOSTED_ORG_STORY = {
  industry: "MarTech",
  sizeBand: "201-500" as const,
  revenueBand: "20M-50M" as const,
  growthStage: "growth" as const,
  buyingStyle: "champion-led" as const,
  crmHygiene: "average" as const,
  pains: ["uneven follow-up on enterprise opportunities", "champion-led deals stalling without sponsor backup", "forecast drift from optimistic close dates"],
  buyingTrigger: "a high-profile deal slipped a quarter and the CRO wants better forecast hygiene before the next QBR",
  decisionPressure: "the champion has been promoted into a busier role and is no longer driving the buying conversation week-to-week",
};

const GHOSTED_CONTACT_PROFILES: LabContactProfile[] = [
  {
    name: "Maja Larsson",
    role: "VP of Sales",
    seniority: "executive",
    influence: "champion",
    committeeRole: "champion",
    communicationStyle: "warm",
    personality: "enthusiastic",
    priorities: ["faster follow-up", "executive visibility", "forecast confidence"],
    likelyObjections: ["bandwidth on my side", "another procurement cycle"],
    responsiveness: 78,
    sentimentBias: 0.42,
  },
  {
    name: "Lukas Hauser",
    role: "CEO",
    seniority: "executive",
    influence: "economic-buyer",
    committeeRole: "executive-sponsor",
    communicationStyle: "direct",
    personality: "pragmatic",
    priorities: ["forecast confidence", "board-ready metrics", "rep accountability"],
    likelyObjections: ["unclear ROI"],
    responsiveness: 36,
    sentimentBias: 0.18,
  },
  {
    name: "Sara Walsh",
    role: "Revenue Operations Lead",
    seniority: "manager",
    influence: "evaluator",
    committeeRole: "technical-evaluator",
    communicationStyle: "analytical",
    personality: "curious",
    priorities: ["stale-deal detection", "less manual reporting", "data hygiene"],
    likelyObjections: ["data hygiene gaps"],
    responsiveness: 80,
    sentimentBias: 0.28,
  },
  {
    name: "Erik Brennan",
    role: "Finance Director",
    seniority: "executive",
    influence: "economic-buyer",
    committeeRole: "finance-approver",
    communicationStyle: "busy",
    personality: "time-poor",
    priorities: ["cost predictability", "auditable rollout"],
    likelyObjections: ["budget timing"],
    responsiveness: 42,
    sentimentBias: -0.05,
  },
  {
    name: "Astrid Reid",
    role: "Sales Manager",
    seniority: "manager",
    influence: "user",
    committeeRole: "end-user",
    communicationStyle: "warm",
    personality: "enthusiastic",
    priorities: ["faster follow-up", "rep adoption"],
    likelyObjections: ["change management"],
    responsiveness: 72,
    sentimentBias: 0.20,
  },
  {
    name: "Diego Costa",
    role: "CRM Admin",
    seniority: "manager",
    influence: "user",
    committeeRole: "crm-admin",
    communicationStyle: "direct",
    personality: "time-poor",
    priorities: ["low implementation effort", "data hygiene"],
    likelyObjections: ["implementation time"],
    responsiveness: 64,
    sentimentBias: 0.04,
  },
];

const GHOSTED_DEAL_STORY = {
  title: "Enterprise rollout - high-value pipeline",
  need: "stand up a forecast-risk view ahead of the next QBR before the slipping deal turns into a board issue",
  urgencyReason: "the deal that slipped last quarter was the second-largest of the year",
  winCondition: "champion brings the executive sponsor back into the conversation",
  knownObjections: ["bandwidth on the champion's side", "budget timing", "stakeholder alignment"],
  riskFactors: ["champion bandwidth", "executive sponsor disengaged", "optimistic close date stayed unchanged"],
  value: 195_000,
};

const GHOSTED_LEAD = {
  title: "DataHub enterprise pipeline visibility",
  source: "referral" as const,
  label: "high-value",
  value: 175_000,
  story: {
    intentSignal: "VP of Sales asked for help diagnosing why a flagship deal slipped a quarter",
    campaignContext: "champion referral after QBR debrief",
    qualificationReason: "champion has internal credibility and a real, named pain about forecast hygiene",
    conversionRationale: "converted once the champion agreed to bring the CEO into a discovery walkthrough",
    repAssessment: "champion-driven and time-sensitive; danger is the champion getting pulled away mid-cycle",
  },
};

// ---- messy-crm-hygiene-account scenario constants ----
// Premise: org_001 is the anchor account where the CRM is visibly messy. Signal patterns:
//   - duplicate-like contacts (same first name, slightly different last name / initial)
//   - missing emails/phones on multiple contacts
//   - the org's biggest open deal has no expectedCloseDate
//   - notes are short and vague ("ping", "circled back, n/a", "no update")
// Scenario-wide we also push higher missing-close-date rates and higher missing-field rates
// across other orgs - but the anchor org is where the messiness is intentionally concentrated
// so that scenario premise validation can be deterministic.
const MESSY_ANCHOR_ORG_STORY = {
  industry: "Logistics",
  sizeBand: "201-500" as const,
  revenueBand: "20M-50M" as const,
  growthStage: "growth" as const,
  buyingStyle: "champion-led" as const,
  crmHygiene: "messy" as const,
  pains: ["missing contact records", "stale opportunity data", "no consistent activity logging across reps"],
  buyingTrigger: "the new VP of Sales pulled a pipeline report and found half the records were unusable",
  decisionPressure: "the CRO told the team to clean up CRM hygiene before the next forecast review, but no one owns the cleanup",
};

// MESSY_CONTACT_PROFILES are intentionally inconsistent. Some have full names, some have first
// initials only. Two pairs share first names ("Anna Berzina" + "A. Berzina"; "Janis K." + "Janis Kalnins")
// which is the duplicate-like CRM hygiene pattern we want to assert on.
const MESSY_CONTACT_PROFILES: LabContactProfile[] = [
  {
    name: "Anna Berzina",
    role: "VP of Sales",
    seniority: "executive",
    influence: "champion",
    committeeRole: "champion",
    communicationStyle: "warm",
    personality: "pragmatic",
    priorities: ["pipeline cleanup", "rep accountability", "faster follow-up"],
    likelyObjections: ["bandwidth on my side", "CRM data quality"],
    responsiveness: 72,
    sentimentBias: 0.18,
  },
  {
    name: "A. Berzina",
    role: "Sales Director",
    seniority: "executive",
    influence: "champion",
    committeeRole: "champion",
    communicationStyle: "warm",
    personality: "pragmatic",
    priorities: ["pipeline cleanup", "rep accountability"],
    likelyObjections: ["CRM data quality"],
    responsiveness: 60,
    sentimentBias: 0.12,
  },
  {
    name: "Janis Kalnins",
    role: "CRM Admin",
    seniority: "manager",
    influence: "user",
    committeeRole: "crm-admin",
    communicationStyle: "direct",
    personality: "time-poor",
    priorities: ["low implementation effort", "data hygiene"],
    likelyObjections: ["implementation time"],
    responsiveness: 48,
    sentimentBias: -0.05,
  },
  {
    name: "Janis K.",
    role: "Sales Operations Analyst",
    seniority: "individual-contributor",
    influence: "user",
    committeeRole: "end-user",
    communicationStyle: "direct",
    personality: "time-poor",
    priorities: ["data hygiene", "less manual reporting"],
    likelyObjections: ["implementation time"],
    responsiveness: 45,
    sentimentBias: -0.02,
  },
  {
    name: "Linda Ozols",
    role: "Finance Director",
    seniority: "executive",
    influence: "economic-buyer",
    committeeRole: "finance-approver",
    communicationStyle: "busy",
    personality: "time-poor",
    priorities: ["cost predictability", "auditable rollout"],
    likelyObjections: ["budget timing"],
    responsiveness: 32,
    sentimentBias: -0.08,
  },
  {
    name: "M. Roze",
    role: "Sales Manager",
    seniority: "manager",
    influence: "evaluator",
    committeeRole: "technical-evaluator",
    communicationStyle: "analytical",
    personality: "curious",
    priorities: ["rep adoption", "stale-deal detection"],
    likelyObjections: ["change management"],
    responsiveness: 65,
    sentimentBias: 0.08,
  },
  {
    name: "Toms Liepa",
    role: "Account Executive",
    seniority: "individual-contributor",
    influence: "user",
    committeeRole: "end-user",
    communicationStyle: "direct",
    personality: "enthusiastic",
    priorities: ["faster follow-up", "less manual reporting"],
    likelyObjections: ["change management"],
    responsiveness: 70,
    sentimentBias: 0.15,
  },
];

const MESSY_ANCHOR_DEAL_STORY = {
  title: "CRM cleanup and pipeline visibility",
  need: "get the pipeline back to a state where the forecast can be trusted",
  urgencyReason: "the last forecast review was abandoned mid-meeting because the data was unreliable",
  winCondition: "pilot proves stale-deal detection on the messiest segment without requiring upfront cleanup",
  knownObjections: ["CRM data quality", "change management", "bandwidth for cleanup"],
  riskFactors: ["no clear cleanup owner", "duplicate contact records", "missing close dates make the deal hard to forecast itself"],
  value: 88_000,
};

const MESSY_ANCHOR_LEAD = {
  title: "pipeline hygiene diagnostic",
  source: "outbound" as const,
  label: "warm",
  value: 22_000,
  story: {
    intentSignal: "VP of Sales mentioned in a discovery call that half the pipeline records are unusable",
    campaignContext: "outbound CRM hygiene sequence",
    qualificationReason: "champion identified a concrete pain (forecast abandoned) and has air cover from the CRO",
    conversionRationale: "converted once the champion accepted a paid pilot rather than a free cleanup audit",
    repAssessment: "champion-driven; risk is no one owns the cleanup so the pilot might land on contested data",
  },
};

// Short vague note variants for messy CRM hygiene. These are the kind of notes that look like a
// rep ticked the activity-done box without leaving real context.
const MESSY_VAGUE_NOTES_DEAL_SUMMARY = [
  "ping",
  "n/a",
  "tbd",
  "left vm",
  "circled back",
  "no update",
  "see email",
  "follow up tbd",
  "spoke briefly",
  "ok",
  "see chat",
  "fyi",
  "wip",
  "deferred",
  "pending",
  "on hold",
  "asked again",
  "no reply",
  "no movement",
  "see notes",
  "?",
  "tbc",
  "open",
  "pushed",
  "not yet",
  "back next wk",
  "follow up",
  "active",
  "stalled",
  "tba",
];

const MESSY_VAGUE_ACTIVITY_NOTES = [
  "left vm",
  "no answer",
  "ping",
  "rescheduled",
  "no update",
  "tbd next",
  "covered briefly",
  "circling back",
  "missed",
  "rescheduled to next week",
  "no show",
  "vm again",
  "short call",
  "quick chat",
  "ran short",
  "moved to email",
  "covered partially",
  "follow up next call",
  "no agenda set",
  "ran over",
  "deferred to next week",
  "asked to reschedule",
  "got pulled away",
  "brief intro only",
  "skipped agenda",
  "covered the basics",
  "didn't get into specifics",
  "kept it light",
  "they cancelled",
  "they joined late",
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

function withTime(date: string, hours: number, minutes: number, seconds = 0): string {
  const d = new Date(date);
  d.setUTCHours(hours, minutes, seconds, 0);
  return d.toISOString();
}

function addMinutes(date: string, minutes: number): string {
  return new Date(new Date(date).getTime() + minutes * 60_000).toISOString();
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

function capitalizeSentence(text: string): string {
  const trimmed = trimSentence(text.trim());
  return `${trimmed.slice(0, 1).toUpperCase()}${trimmed.slice(1)}`;
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
    if (scenario.id === "expansion-after-won-pilot" && index === 0) {
      story.industry = EXPANSION_ORG_STORY.industry;
      story.sizeBand = EXPANSION_ORG_STORY.sizeBand;
      story.revenueBand = EXPANSION_ORG_STORY.revenueBand;
      story.growthStage = EXPANSION_ORG_STORY.growthStage;
      story.buyingStyle = EXPANSION_ORG_STORY.buyingStyle;
      story.crmHygiene = "clean";
      story.pains = [...EXPANSION_ORG_STORY.pains];
      story.buyingTrigger = EXPANSION_ORG_STORY.buyingTrigger;
      story.decisionPressure = EXPANSION_ORG_STORY.decisionPressure;
    }
    if (scenario.id === "committee-security-delay" && index === 0) {
      story.industry = COMMITTEE_ORG_STORY.industry;
      story.sizeBand = COMMITTEE_ORG_STORY.sizeBand;
      story.revenueBand = COMMITTEE_ORG_STORY.revenueBand;
      story.growthStage = COMMITTEE_ORG_STORY.growthStage;
      story.buyingStyle = COMMITTEE_ORG_STORY.buyingStyle;
      story.crmHygiene = COMMITTEE_ORG_STORY.crmHygiene;
      story.pains = [...COMMITTEE_ORG_STORY.pains];
      story.buyingTrigger = COMMITTEE_ORG_STORY.buyingTrigger;
      story.decisionPressure = COMMITTEE_ORG_STORY.decisionPressure;
    }
    if (scenario.id === "ghosted-high-value-opportunity" && index === 0) {
      story.industry = GHOSTED_ORG_STORY.industry;
      story.sizeBand = GHOSTED_ORG_STORY.sizeBand;
      story.revenueBand = GHOSTED_ORG_STORY.revenueBand;
      story.growthStage = GHOSTED_ORG_STORY.growthStage;
      story.buyingStyle = GHOSTED_ORG_STORY.buyingStyle;
      story.crmHygiene = GHOSTED_ORG_STORY.crmHygiene;
      story.pains = [...GHOSTED_ORG_STORY.pains];
      story.buyingTrigger = GHOSTED_ORG_STORY.buyingTrigger;
      story.decisionPressure = GHOSTED_ORG_STORY.decisionPressure;
    }
    if (scenario.id === "messy-crm-hygiene-account") {
      if (index === 0) {
        story.industry = MESSY_ANCHOR_ORG_STORY.industry;
        story.sizeBand = MESSY_ANCHOR_ORG_STORY.sizeBand;
        story.revenueBand = MESSY_ANCHOR_ORG_STORY.revenueBand;
        story.growthStage = MESSY_ANCHOR_ORG_STORY.growthStage;
        story.buyingStyle = MESSY_ANCHOR_ORG_STORY.buyingStyle;
        story.crmHygiene = MESSY_ANCHOR_ORG_STORY.crmHygiene;
        story.pains = [...MESSY_ANCHOR_ORG_STORY.pains];
        story.buyingTrigger = MESSY_ANCHOR_ORG_STORY.buyingTrigger;
        story.decisionPressure = MESSY_ANCHOR_ORG_STORY.decisionPressure;
      } else {
        // Push other orgs in the scenario toward messy / average hygiene so the
        // scenario as a whole reads as a data-quality stress test rather than just
        // one bad apple.
        story.crmHygiene = rng.weightedChoice([
          { value: "messy", weight: 55 },
          { value: "average", weight: 35 },
          { value: "clean", weight: 10 },
        ]);
      }
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

    const orgIndex = organizations.indexOf(org);
    const isMessyAnchorOrg = scenario.id === "messy-crm-hygiene-account" && orgIndex === 0;
    const isMessyScenario = scenario.id === "messy-crm-hygiene-account";
    for (let localIndex = 0; localIndex < count; localIndex++) {
      const index = contacts.length + 1;
      const useCommitteeProfile = scenario.id === "committee-security-delay" && orgIndex === 0;
      const useGhostedProfile = scenario.id === "ghosted-high-value-opportunity" && orgIndex === 0;
      const useMessyProfile = isMessyAnchorOrg;
      const profile = scenario.id === "single-organization-deal-lab"
        ? LAB_CONTACT_PROFILES[localIndex % LAB_CONTACT_PROFILES.length]
        : useCommitteeProfile
          ? COMMITTEE_CONTACT_PROFILES[localIndex % COMMITTEE_CONTACT_PROFILES.length]
          : useGhostedProfile
            ? GHOSTED_CONTACT_PROFILES[localIndex % GHOSTED_CONTACT_PROFILES.length]
            : useMessyProfile
              ? MESSY_CONTACT_PROFILES[localIndex % MESSY_CONTACT_PROFILES.length]
              : undefined;
      const name = profile?.name ?? `${rng.choice(FIRST_NAMES)} ${rng.choice(LAST_NAMES)}`;
      const traits = profile ?? contactTraits(rng, localIndex);
      const createdAt = addDays(org.createdAt, profile ? localIndex + 1 : rng.intBetween(0, 12));
      // Messy scenario: drop the baseline email-present rate from 0.94 to 0.60, and phone
      // from 0.82 to 0.50. On the anchor org we drop both further (every other contact missing
      // something) so the duplicate-like pair pattern is visibly under-documented.
      const emailPresentRate = isMessyAnchorOrg ? 0.50 : isMessyScenario ? 0.60 : 0.94;
      const phonePresentRate = isMessyAnchorOrg ? 0.40 : isMessyScenario ? 0.50 : 0.82;
      // Anchor-org profile contacts: keep email present for the named champion (first profile),
      // but let other profile-backed contacts roll dice so the messiness is visible.
      const forceEmailPresent = profile && !isMessyAnchorOrg;
      const contact: Contact = {
        id: id("con", index),
        createdAt,
        updatedAt: createdAt,
        organizationId: org.id,
        ownerId: org.ownerId,
        name,
        email: forceEmailPresent || rng.bool(emailPresentRate) ? `${slug(name)}@${slug(org.name)}.test` : undefined,
        phone: rng.bool(phonePresentRate) ? `+371 2${rng.intBetween(10_000_000, 99_999_999)}` : undefined,
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
  const labLeadTitles = [
    "DataHub pilot inquiry",
    "sales analytics rollout review",
    "forecast risk expansion request",
    "champion follow-up from sales leadership",
    "security checklist request",
  ];
  const labLeadValues = [38_000, 25_000, 85_000, 24_000, 18_000];
  const labLeadStories = [
    {
      intentSignal: "Marta asked whether stale high-intent leads could be spotted before the next board update",
      campaignContext: "missed-forecast outbound sequence",
      qualificationReason: "executive sponsor confirmed the forecast miss is visible to leadership",
      conversionRationale: "converted once Marta agreed to evaluate a paid pilot rather than a free workflow review",
      repAssessment: "strong executive pain, but value depends on proving stale-deal detection quickly",
    },
    {
      intentSignal: "Sofia requested a revenue-impact view before approving any broader rollout",
      campaignContext: "Q1 pipeline-risk campaign",
      qualificationReason: "finance joined early and asked for a rollout-sized business case",
      conversionRationale: "converted after finance moved the conversation from reporting interest to budget review",
      repAssessment: "commercial upside is real, but finance will block if the value case stays vague",
    },
    {
      intentSignal: "Maks asked for examples of forecast-risk reporting using imperfect CRM data",
      campaignContext: "RevOps workflow webinar",
      qualificationReason: "RevOps has a concrete reporting problem and access to CRM data",
      conversionRationale: "converted when RevOps tied the request to expansion scope for stalled-deal monitoring",
      repAssessment: "good technical fit, likely to stall without executive sponsor confirmation",
    },
    {
      intentSignal: "Rihards replied to a follow-up about missed rep handoffs",
      campaignContext: "sales leadership nurture stream",
      qualificationReason: "champion sees the workflow pain but has not pulled in budget owner yet",
      repAssessment: "keep warm until the sponsor asks for another pilot readout",
    },
    {
      intentSignal: "Noah asked for the shortest possible security checklist",
      campaignContext: "partner referral from a CRM consultant",
      qualificationReason: "security interest is real, but it is supporting an existing buying process",
      repAssessment: "useful stakeholder signal, not enough to create a separate opportunity",
    },
  ];

  return Array.from({ length: scenario.volume.leads }, (_, index) => {
    const isExpansionScenario = scenario.id === "expansion-after-won-pilot";
    const isExpansionPilotLead = isExpansionScenario && index === 0;
    const isExpansionExpansionLead = isExpansionScenario && index === 1;
    const isCommitteeLead = scenario.id === "committee-security-delay" && index === 0;
    const isGhostedLead = scenario.id === "ghosted-high-value-opportunity" && index === 0;
    const isMessyAnchorLead = scenario.id === "messy-crm-hygiene-account" && index === 0;
    // Force first 2 leads to org_001 (the expansion account); committee + ghosted + messy-anchor leads to org_001
    const organization = isExpansionPilotLead || isExpansionExpansionLead || isCommitteeLead || isGhostedLead || isMessyAnchorLead
      ? organizations[0]
      : organizations[index % organizations.length];
    const organizationContacts = byOrg.get(organization.id) ?? contacts;
    const labLeadRoles: BuyingCommitteeRole[] = ["executive-sponsor", "finance-approver", "technical-evaluator", "champion", "legal-security"];
    // For expansion scenario: pilot lead goes to champion, expansion lead goes to executive-sponsor (the CRO)
    const expansionLeadRoles: BuyingCommitteeRole[] = ["champion", "executive-sponsor"];
    const contact = scenario.id === "single-organization-deal-lab"
      ? organizationContacts.find((item) => item.committeeRole === labLeadRoles[index]) ?? organizationContacts[index % organizationContacts.length]
      : isExpansionPilotLead || isExpansionExpansionLead
        ? organizationContacts.find((item) => item.committeeRole === expansionLeadRoles[index]) ?? organizationContacts[index % organizationContacts.length]
        : isCommitteeLead
          ? organizationContacts.find((item) => item.committeeRole === "executive-sponsor") ?? organizationContacts[index % organizationContacts.length]
          : isGhostedLead
            ? organizationContacts.find((item) => item.committeeRole === "champion") ?? organizationContacts[index % organizationContacts.length]
            : isMessyAnchorLead
              ? organizationContacts.find((item) => item.committeeRole === "champion") ?? organizationContacts[index % organizationContacts.length]
              : rng.choice(organizationContacts);
    const leadWindowStart = maxDate(scenario.defaults.startDate, organization.createdAt, contact.createdAt);
    const latestLeadCreateOffset = Math.max(1, daysBetween(leadWindowStart, endDate) - 45);
    let createdAt = addDays(leadWindowStart, rng.intBetween(0, latestLeadCreateOffset));
    // Expansion scenario: force the pilot lead early (day 0-7) so the WON pilot can close at day ~70,
    // and force the expansion lead late (~day 80-90) so it follows the pilot win narratively.
    if (isExpansionPilotLead) {
      createdAt = addDays(leadWindowStart, rng.intBetween(0, 7));
    }
    if (isExpansionExpansionLead) {
      createdAt = maxDate(leadWindowStart, addDays(scenario.defaults.startDate, 80 + rng.intBetween(0, 10)));
    }
    // Committee scenario: force the committee lead early enough that the deal can age into stalled territory.
    if (isCommitteeLead) {
      createdAt = addDays(leadWindowStart, rng.intBetween(0, 10));
    }
    // Ghosted scenario: force the lead early so the deal can age into the ghosted pattern by simulation end.
    if (isGhostedLead) {
      createdAt = addDays(leadWindowStart, rng.intBetween(0, 10));
    }
    // Messy anchor lead: force early so the deal gets a meaningful aging window.
    if (isMessyAnchorLead) {
      createdAt = addDays(leadWindowStart, rng.intBetween(0, 10));
    }
    const status: LeadStatus = index < Math.floor(scenario.volume.leads * 0.62)
      ? "CONVERTED"
      : rng.weightedChoice([
          { value: "NEW", weight: 30 },
          { value: "QUALIFIED", weight: 45 },
          { value: "UNQUALIFIED", weight: 25 },
        ]);
    const labLeadStatuses: LeadStatus[] = ["CONVERTED", "CONVERTED", "CONVERTED", "NEW", "NEW"];
    const finalStatus: LeadStatus = scenario.id === "single-organization-deal-lab"
      ? labLeadStatuses[index] ?? status
      : isExpansionPilotLead || isExpansionExpansionLead || isCommitteeLead || isGhostedLead || isMessyAnchorLead
        ? "CONVERTED"
        : status;
    // Messy scenario: force every third lead to have no expectedCloseDate so the missing-data
    // pattern is deterministic across leads as well as deals.
    const forceLeadMissingCloseDate = scenario.id === "messy-crm-hygiene-account" && index % 3 === 0;
    const expectedCloseDate = forceLeadMissingCloseDate || rng.bool(scenario.messiness.missingCloseDateRate) ? undefined : addDays(createdAt, rng.intBetween(35, 100));
    const leadStory = scenario.id === "single-organization-deal-lab"
      ? labLeadStories[index] ?? {
          intentSignal: rng.choice(LEAD_INTENT_SIGNALS),
          campaignContext: rng.choice(CAMPAIGN_CONTEXTS),
          qualificationReason: `${contact.name} showed interest in ${organization.story.pains[0]}`,
          repAssessment: "needs discovery before there is enough context for a deal",
        }
      : isExpansionPilotLead
        ? { ...EXPANSION_LEAD_PILOT.story }
        : isExpansionExpansionLead
          ? { ...EXPANSION_LEAD_EXPANSION.story }
          : isCommitteeLead
            ? { ...COMMITTEE_LEAD.story }
            : isGhostedLead
              ? { ...GHOSTED_LEAD.story }
              : isMessyAnchorLead
                ? { ...MESSY_ANCHOR_LEAD.story }
                : {
              intentSignal: rng.choice(LEAD_INTENT_SIGNALS),
              campaignContext: rng.choice(CAMPAIGN_CONTEXTS),
              qualificationReason: `${contact.name} showed interest in ${rng.choice(organization.story.pains)}`,
              conversionRationale: finalStatus === "CONVERTED" ? "converted after the contact confirmed an active evaluation window" : undefined,
              disqualificationReason: finalStatus === "UNQUALIFIED" ? rng.choice(["no active project", "student/vendor inquiry", "budget owner not identified"]) : undefined,
              repAssessment: rng.choice([
                "needs discovery before there is enough context for a deal",
                "likely useful if the pain connects to forecast confidence",
                "good fit, but timing and owner authority are still unclear",
              ]),
            };

    // Build unified flags for title/source/label/value overrides
    const isCommitteeLeadOverride = isCommitteeLead;
    const isGhostedLeadOverride = isGhostedLead;
    const lead: Lead = {
      id: id("lead", index + 1),
      createdAt,
      updatedAt: addDays(createdAt, rng.intBetween(0, 18)),
      title: scenario.id === "single-organization-deal-lab"
        ? `${organization.name} ${labLeadTitles[index] ?? "CRM review"}`
        : isExpansionPilotLead
          ? `${organization.name} ${EXPANSION_LEAD_PILOT.title}`
          : isExpansionExpansionLead
            ? `${organization.name} ${EXPANSION_LEAD_EXPANSION.title}`
            : isCommitteeLeadOverride
              ? `${organization.name} ${COMMITTEE_LEAD.title}`
              : isGhostedLeadOverride
                ? `${organization.name} ${GHOSTED_LEAD.title}`
                : isMessyAnchorLead
                  ? `${organization.name} ${MESSY_ANCHOR_LEAD.title}`
                  : `${organization.name} ${rng.choice(["CRM review", "pipeline visibility", "forecast cleanup", "sales analytics"])} lead`,
      organizationId: organization.id,
      contactId: contact.id,
      ownerId: organization.ownerId,
      status: finalStatus,
      source: scenario.id === "single-organization-deal-lab"
        ? ["outbound", "paid campaign", "webinar", "outbound", "referral"][index] ?? rng.choice(SOURCES)
        : isExpansionPilotLead
          ? EXPANSION_LEAD_PILOT.source
          : isExpansionExpansionLead
            ? EXPANSION_LEAD_EXPANSION.source
            : isCommitteeLeadOverride
              ? COMMITTEE_LEAD.source
              : isGhostedLeadOverride
                ? GHOSTED_LEAD.source
                : isMessyAnchorLead
                  ? MESSY_ANCHOR_LEAD.source
                  : rng.choice(SOURCES),
      label: scenario.id === "single-organization-deal-lab"
        ? ["priority", "finance-review", "demo-request", "warm", "security-review"][index] ?? rng.choice(["warm", "demo-request", "nurture", "priority"])
        : isExpansionPilotLead
          ? EXPANSION_LEAD_PILOT.label
          : isExpansionExpansionLead
            ? EXPANSION_LEAD_EXPANSION.label
            : isCommitteeLeadOverride
              ? COMMITTEE_LEAD.label
              : isGhostedLeadOverride
                ? GHOSTED_LEAD.label
                : isMessyAnchorLead
                  ? MESSY_ANCHOR_LEAD.label
                  : rng.choice(["warm", "demo-request", "nurture", "priority"]),
      value: scenario.id === "single-organization-deal-lab"
        ? labLeadValues[index] ?? rng.intBetween(8, 90) * 1_000
        : isExpansionPilotLead
          ? EXPANSION_LEAD_PILOT.value
          : isExpansionExpansionLead
            ? EXPANSION_LEAD_EXPANSION.value
            : isCommitteeLeadOverride
              ? COMMITTEE_LEAD.value
              : isGhostedLeadOverride
                ? GHOSTED_LEAD.value
                : isMessyAnchorLead
                  ? MESSY_ANCHOR_LEAD.value
                  : rng.intBetween(8, 90) * 1_000,
      currency: scenario.defaults.currency,
      expectedCloseDate: expectedCloseDate && expectedCloseDate > endDate ? endDate : expectedCloseDate,
      lastActivityDate: addDays(createdAt, rng.intBetween(1, 24)),
      story: leadStory,
    };

    event(events, "lead.created", createdAt, "lead", lead.id, { source: lead.source, status: lead.status });
    return lead;
  });
}

type DealPlan = {
  statuses: DealStatus[];
  coldSlots: Set<number>;
  stalledSlots: Set<number>;
};

// Plan deal statuses upfront so the suite hits its win-rate target deterministically.
// Closed slots fill from the lowest non-forced indices so the cold/stalled designation
// (which assumes OPEN deals live at higher indices) stays coherent.
function planDealStatuses(scenario: ScenarioConfig): DealPlan {
  const N = scenario.volume.deals;
  const statuses: DealStatus[] = new Array(N).fill("OPEN");
  const forcedClosed = new Set<number>();
  const forcedOpen = new Set<number>();

  // Scenario-specific status overrides at fixed indices.
  // forcedClosed = "this index is WON or LOST, locked"
  // forcedOpen = "this index is OPEN AND protected from cold/stalled designation"
  // preDesignatedStalled = "this index is OPEN AND should be designated as a stalled deal"
  // preDesignatedCold = "this index is OPEN AND should be designated as a cold (ghosted) deal"
  const preDesignatedStalled = new Set<number>();
  const preDesignatedCold = new Set<number>();
  if (scenario.id === "single-organization-deal-lab") {
    statuses[0] = "WON"; forcedClosed.add(0);
    statuses[1] = "LOST"; forcedClosed.add(1);
    // index 2 stays OPEN by default and IS eligible to be the cold/stalled deal
  } else if (scenario.id === "expansion-after-won-pilot") {
    statuses[0] = "WON"; forcedClosed.add(0);    // the pilot
    statuses[1] = "OPEN"; forcedOpen.add(1);     // the expansion - active, protected from cold/stalled
  } else if (scenario.id === "committee-security-delay") {
    statuses[0] = "OPEN";
    preDesignatedStalled.add(0);  // the committee-stalled deal - drives the scenario premise
  } else if (scenario.id === "ghosted-high-value-opportunity") {
    statuses[0] = "OPEN";
    preDesignatedCold.add(0);  // the ghosted high-value deal - cold designation drives stale lastActivity
  } else if (scenario.id === "messy-crm-hygiene-account") {
    statuses[0] = "OPEN"; forcedOpen.add(0);  // the anchor messy deal stays OPEN as the in-progress messiness case study
  }

  // Plan the win/lost balance among closed slots.
  const targetClosed = Math.min(scenario.targets.minClosedDeals, N);
  const midRate = (scenario.targets.winRate.min + scenario.targets.winRate.max) / 2;
  const targetWon = Math.round(targetClosed * midRate);
  const targetLost = targetClosed - targetWon;

  let overrideWonCount = 0;
  let overrideLostCount = 0;
  for (const i of forcedClosed) {
    if (statuses[i] === "WON") overrideWonCount++;
    if (statuses[i] === "LOST") overrideLostCount++;
  }
  let wonStillNeeded = Math.max(0, targetWon - overrideWonCount);
  let lostStillNeeded = Math.max(0, targetLost - overrideLostCount);

  // Fill the earliest non-forced indices with the remaining closed statuses.
  for (let i = 0; i < N && (wonStillNeeded > 0 || lostStillNeeded > 0); i++) {
    if (forcedClosed.has(i) || forcedOpen.has(i) || preDesignatedStalled.has(i) || preDesignatedCold.has(i)) continue;
    if (wonStillNeeded > 0) {
      statuses[i] = "WON";
      wonStillNeeded--;
    } else if (lostStillNeeded > 0) {
      statuses[i] = "LOST";
      lostStillNeeded--;
    }
  }

  // Designate cold/stalled slots from the remaining eligible OPEN indices.
  // Eligible = OPEN AND not protected AND not already pre-designated.
  const eligibleOpenIndices: number[] = [];
  for (let i = 0; i < N; i++) {
    if (statuses[i] === "OPEN" && !forcedOpen.has(i) && !preDesignatedStalled.has(i) && !preDesignatedCold.has(i)) {
      eligibleOpenIndices.push(i);
    }
  }

  const coldSlots = new Set<number>(preDesignatedCold);
  const stalledSlots = new Set<number>(preDesignatedStalled);
  const coldStillNeeded = Math.max(0, scenario.targets.minColdDeals - preDesignatedCold.size);
  const minCold = Math.min(coldStillNeeded, eligibleOpenIndices.length);
  for (let i = 0; i < minCold; i++) coldSlots.add(eligibleOpenIndices[i]);

  const stalledStillNeeded = Math.max(0, scenario.targets.minStalledDeals - preDesignatedStalled.size);
  let stalledAssigned = 0;
  // First try to fill stalled from the next available open slots after cold.
  for (let i = minCold; i < eligibleOpenIndices.length && stalledAssigned < stalledStillNeeded; i++) {
    stalledSlots.add(eligibleOpenIndices[i]);
    stalledAssigned++;
  }
  // If there aren't enough open slots, overlap stalled onto cold ones.
  if (stalledAssigned < stalledStillNeeded) {
    for (let i = 0; i < minCold && stalledAssigned < stalledStillNeeded; i++) {
      stalledSlots.add(eligibleOpenIndices[i]);
      stalledAssigned++;
    }
  }

  return { statuses, coldSlots, stalledSlots };
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

function activitySubject(
  rng: Rng,
  activityType: ActivityType,
  moment: ActivityMoment,
  deal: Deal,
  contact: Contact,
  organization: Organization,
): string {
  const firstName = contact.name.split(" ")[0];
  const shortOrg = organization.name.split(" ")[0];
  const dealShortRaw = deal.title.replace(`${organization.name} - `, "").replace(`${organization.name}: `, "");
  const dealShort = dealShortRaw.charAt(0).toUpperCase() + dealShortRaw.slice(1);

  if (moment === "discovery") {
    return rng.choice([
      `Intro call - ${shortOrg}`,
      `Discovery: ${dealShort}`,
      `${firstName} / discovery`,
      `First call: ${shortOrg}`,
      `${firstName} - intro`,
      `${shortOrg} - first conversation`,
      `Kickoff w/ ${firstName}`,
      `Initial scoping - ${shortOrg}`,
    ]);
  }
  if (moment === "process_mapping") {
    return rng.choice([
      `Process walkthrough - ${shortOrg}`,
      `Workflow mapping w/ ${firstName}`,
      `How ${shortOrg} works today`,
      `Process map: ${firstName}`,
      `${shortOrg} - current motion`,
      `Day-to-day w/ ${firstName}`,
      `${firstName} workflow review`,
      `Mapping ${shortOrg}'s cadence`,
    ]);
  }
  if (moment === "data_quality_review") {
    return rng.choice([
      `CRM data check - ${shortOrg}`,
      `Data quality follow-up: ${firstName}`,
      `Hygiene review - ${shortOrg}`,
      `Pilot signals w/ ${firstName}`,
      `${shortOrg} data sampling`,
      `${firstName} - data scope conversation`,
      `Field completeness check - ${shortOrg}`,
      `CRM hygiene w/ ${firstName}`,
      `Records review - ${shortOrg}`,
      `${shortOrg} - field-fill audit`,
      `${firstName}: which data we can trust`,
      `Sampling ${shortOrg} records`,
      `${dealShort} - data signal vs noise`,
      `${firstName} on CRM completeness`,
      `${shortOrg} hygiene baseline`,
    ]);
  }
  if (moment === "pilot_scope") {
    return rng.choice([
      `Pilot scope - ${shortOrg}`,
      `Narrowing pilot w/ ${firstName}`,
      `Pilot plan: ${dealShort}`,
      `Scope conversation - ${firstName}`,
      `${shortOrg} - tightening pilot`,
      `Pilot framing w/ ${firstName}`,
      `${firstName} - pilot v2 draft`,
      `Locking pilot scope - ${shortOrg}`,
      `${dealShort} - pilot boundaries`,
      `${firstName}: what stays in pilot`,
      `${shortOrg} pilot: scope sign-off`,
      `Pilot framing v3 - ${firstName}`,
    ]);
  }
  if (moment === "finance_review") {
    return rng.choice([
      `Numbers for ${firstName}`,
      `Business case - ${shortOrg}`,
      `Finance review: ${dealShort}`,
      `Value walkthrough w/ ${firstName}`,
      `${firstName} - value model`,
      `${shortOrg} commercial framing`,
      `Pricing/rollout w/ ${firstName}`,
      `Revenue-at-risk math - ${shortOrg}`,
      `${dealShort} - cost & value`,
      `${firstName}: rollout economics`,
      `${shortOrg} budget framing`,
      `${dealShort}: ROI walkthrough`,
    ]);
  }
  if (moment === "security_review") {
    return rng.choice([
      `Security checklist - ${shortOrg}`,
      `${firstName} / security review`,
      `Pilot security: ${dealShort}`,
      `Implementation Q's for ${firstName}`,
      `${shortOrg} - data access review`,
      `Sec checkpoint w/ ${firstName}`,
      `Pilot footprint - ${firstName}`,
      `${firstName} sec walkthrough`,
    ]);
  }
  if (moment === "pilot_success") {
    return rng.choice([
      `Pilot results - ${shortOrg}`,
      `Proof point landed: ${dealShort}`,
      `Pilot read-out w/ ${firstName}`,
      `${shortOrg} pilot evidence`,
      `${firstName} - pilot worked`,
      `${dealShort} read-out`,
      `Results review w/ ${firstName}`,
      `${shortOrg} - moving to close`,
    ]);
  }
  if (moment === "close_confirmation") {
    return rng.choice([
      `Close confirmation - ${shortOrg}`,
      `Wrap up: ${dealShort}`,
      `${firstName} / signature path`,
      `Closing ${shortOrg}`,
      `${firstName} - final close call`,
      `${dealShort} - signing today`,
      `${shortOrg} signature notes`,
      `Confirming close w/ ${firstName}`,
    ]);
  }
  if (moment === "loss_review") {
    return rng.choice([
      `Wrap up: ${dealShort}`,
      `Closing out ${shortOrg}`,
      `${firstName} - final note`,
      `Marking lost: ${dealShort}`,
      `${shortOrg} debrief w/ ${firstName}`,
      `${dealShort} - post-mortem`,
      `${firstName} - thanks anyway`,
      `${shortOrg} - keeping warm`,
    ]);
  }
  if (moment === "ghosting_nudge") {
    return rng.choice([
      `Quick nudge - ${shortOrg}`,
      `Still on for ${dealShort}?`,
      `Hey ${firstName}`,
      `Bumping ${dealShort}`,
      `Touching base - ${firstName}`,
      `${firstName} - alive?`,
      `${shortOrg} - any movement?`,
      `Sanity check, ${firstName}`,
      `${dealShort} - park or push?`,
    ]);
  }

  if (activityType === "email") {
    return rng.choice([
      `Re: ${dealShort}`,
      `Follow up - ${firstName}`,
      `${shortOrg} - next step`,
      `Quick one for ${firstName}`,
      `${firstName}, brief update`,
      `${dealShort} - keeping it moving`,
      `Note for ${firstName}`,
    ]);
  }
  if (activityType === "meeting") {
    return rng.choice([
      `${firstName} / ${shortOrg}`,
      `Meeting: ${dealShort}`,
      `${shortOrg} sync`,
      `${firstName} chat`,
      `${shortOrg} - working session`,
      `${dealShort} - status meeting`,
      `${firstName} touchpoint`,
    ]);
  }
  if (activityType === "call") {
    return rng.choice([
      `Call - ${firstName}`,
      `${firstName} call`,
      `Quick call: ${shortOrg}`,
      `Catch up w/ ${firstName}`,
      `${shortOrg} - phone sync`,
      `${firstName} - status call`,
      `Check-in call, ${firstName}`,
    ]);
  }
  if (activityType === "deadline") {
    return rng.choice([
      `Deadline: ${dealShort}`,
      `${shortOrg} - close date check`,
      `${dealShort} deadline`,
      `${firstName} - close date review`,
      `${shortOrg} timeline check`,
    ]);
  }
  return rng.choice([
    `${dealShort} - admin`,
    `${shortOrg} task`,
    `Update CRM: ${dealShort}`,
    `${firstName} - internal followup`,
    `${dealShort} - housekeeping`,
  ]);
}

function activityDescription(
  rng: Rng,
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
  const nextStep = nextStepDate ? `Next: ${compactDate(nextStepDate)}.` : "";
  const riskLine = deal.story.riskFactors.length > 0 ? `Risk: ${deal.story.riskFactors.join(", ")}.` : "";
  const includeStateLine = rng.bool(0.45);
  const stateLine = includeStateLine
    ? rng.choice([
        `${contact.name.split(" ")[0]} read ${sentimentPhraseForState(buyerState)}, ${engagementPhraseForState(buyerState)}.`,
        `Vibe: ${sentimentPhraseForState(buyerState)}, ${engagementPhraseForState(buyerState)}.`,
        `${capitalizeSentence(frictionPhraseForState(buyerState))}.`,
        `${capitalizeSentence(sentimentPhraseForState(buyerState))} overall.`,
      ])
    : "";
  const joinParts = (...parts: string[]) => parts.filter((part) => part.length > 0).join(" ");

  const firstName = contact.name.split(" ")[0];

  if (moment === "discovery") {
    return joinParts(
      rng.choice([
        `Discovery with ${contact.name} - confirmed ${deal.story.need} ties to ${organization.story.buyingTrigger}.`,
        `${contact.name}: walked through ${deal.story.need}. Driver is ${organization.story.buyingTrigger}.`,
        `Opening call w/ ${contact.name}. They flagged ${deal.story.need} - root cause ${organization.story.buyingTrigger}.`,
        `First substantive conversation w/ ${firstName}. Pain on ${deal.story.need} is real.`,
        `${firstName} (${contact.role}) on discovery. ${capitalizeSentence(contact.priorities[0])} is the angle.`,
        `Kickoff conversation: ${firstName} flagged ${deal.story.need} as the recurring frustration.`,
        `Discovery session w/ ${firstName} at ${organization.name}. Use case is clear.`,
      ]),
      stateLine,
      nextStep,
    );
  }

  if (moment === "process_mapping") {
    return joinParts(
      rng.choice([
        `Mapped current sales motion w/ ${contact.name}. Focus: ${joinHuman(contact.priorities)}.`,
        `Process map session - ${contact.name} cares most about ${contact.priorities[0]}.`,
        `${contact.name} walked me through how the team works today. Asked how the pilot fits CRM habits.`,
        `Workflow walkthrough w/ ${firstName}. Current cadence can host the pilot with minimal disruption.`,
        `${firstName} described the daily flow. ${capitalizeSentence(contact.priorities[0])} is the bottleneck.`,
        `Process mapping: ${firstName} confirmed reps already touch the right CRM fields.`,
        `Mapping done w/ ${firstName}. The team can slot pilot work into existing rhythm.`,
      ]),
      stateLine,
      nextStep,
    );
  }

  if (moment === "data_quality_review") {
    return joinParts(
      rng.choice([
        `Data quality review w/ ${contact.name}. Main concern: ${deal.story.knownObjections[0]}.`,
        `${contact.name} pushed back on data assumptions. Risk surfaced: ${deal.story.riskFactors[0] ?? deal.story.knownObjections[0]}.`,
        `Looked at CRM hygiene with ${contact.name}. Open: ${deal.story.knownObjections[0]}.`,
        `Sampled records w/ ${firstName}. Pilot can work on existing data; rollout needs cleanup.`,
        `${firstName} ran through field-completeness gaps. Pilot path stays on the cleanest segments.`,
        `Data confidence conversation w/ ${firstName}. Friction on ${deal.story.knownObjections[0]} but pilot is viable.`,
        `${firstName} on CRM hygiene: uneven but enough signal for the narrow pilot.`,
      ]),
      stateLine,
      riskLine,
      nextStep,
    );
  }

  if (moment === "pilot_scope") {
    return joinParts(
      rng.choice([
        `Scoped pilot with ${contact.name}. Success measure: ${deal.story.winCondition}.`,
        `${contact.name} agreed the lightweight pilot should prove ${deal.story.winCondition}.`,
        `Pilot framing call - ${deal.story.winCondition} is the win bar.`,
        `${firstName} signed off on tight pilot scope. Nothing wider in v1.`,
        `Pilot scope locked w/ ${firstName}. ${capitalizeSentence(deal.story.winCondition)} only.`,
        `${firstName} pulled the pilot tighter than I had it. Better - cleaner narrative.`,
        `Scope conversation: ${firstName} pushed for minimum-viable proof. Aligned.`,
      ]),
      stateLine,
      nextStep,
    );
  }

  if (moment === "finance_review") {
    return joinParts(
      rng.choice([
        `Finance walkthrough w/ ${contact.name}. Tied ${deal.story.need} to revenue impact; ${deal.story.knownObjections[0]} still open.`,
        `${contact.name} (finance) wants the cost/value case in one place. Discussed ${deal.story.knownObjections[0]}.`,
        `Numbers conversation with ${contact.name}. Budget context: ${deal.story.knownObjections[0]}.`,
        `${firstName} pulled on rollout cost. Anchoring everything back to ${deal.story.winCondition}.`,
        `Value model w/ ${firstName}. Pilot ROI shows in next forecast cycle if proof holds.`,
        `${firstName} reviewed business case. Wants it in one slide for sponsor conversation.`,
        `Business case session w/ ${firstName}. ${capitalizeSentence(deal.story.knownObjections[0])} is the live blocker.`,
      ]),
      stateLine,
      nextStep,
    );
  }

  if (moment === "security_review") {
    return joinParts(
      rng.choice([
        `Security checkpoint with ${contact.name}. Covered ${deal.story.knownObjections.join(", ")}.`,
        `${contact.name} on the security/implementation side. Open items: ${deal.story.knownObjections.join(", ")}.`,
        `Security review w/ ${contact.name} - kept narrow per pilot scope.`,
        `${firstName} reviewed pilot data-access model. Comfortable with footprint.`,
        `Sec checkpoint: ${firstName} OK'd pilot, flagged rollout for full review later.`,
        `${firstName} walked through implementation. Lightweight enough.`,
        `${firstName} approved the pilot security checklist. Tight.`,
      ]),
      stateLine,
      nextStep,
    );
  }

  if (moment === "ghosting_nudge") {
    return joinParts(
      rng.choice([
        `Nudge to ${contact.name} - no reply since last touch.`,
        `Trying to revive ${deal.title}. ${contact.name} hasn't moved the next step.`,
        `Follow-up #2 to ${contact.name}. Quiet.`,
        `${firstName} silent through last two attempts.`,
        `Pinged ${firstName} again. No response.`,
        `${shortOrgName(organization)} ghost watch - ${firstName} not engaging.`,
        `Light touch nudge to ${firstName}. Last try before parking.`,
      ]),
      riskLine,
      stateLine,
    );
  }

  if (moment === "pilot_success") {
    return joinParts(
      rng.choice([
        `Pilot proof w/ ${contact.name}: evidence supports ${deal.story.winCondition}.`,
        `${contact.name} reviewed pilot results. ${deal.story.winCondition} - confirmed.`,
        `Walked ${contact.name} through pilot outcome. Holds up.`,
        `${firstName} signed off on pilot read-out. ${capitalizeSentence(deal.story.winCondition)} - data backs it.`,
        `Pilot numbers shared w/ ${firstName}. Cleaner than expected.`,
        `${firstName} pressure-tested the pilot results. They hold up.`,
      ]),
      stateLine,
      nextStep,
    );
  }

  if (moment === "close_confirmation") {
    return joinParts(
      rng.choice([
        `Closed ${deal.status} with ${contact.name}. Win proof: ${deal.story.winCondition}.`,
        `${contact.name} confirmed close (${deal.status}).`,
        `Final call w/ ${contact.name} - ${deal.status}.`,
        `${firstName} approved the close path. No surprises at signature.`,
        `${shortOrgName(organization)} ${deal.status}. ${firstName} closed cleanly.`,
        `Sign-off w/ ${firstName}. ${deal.status}.`,
      ]),
      stateLine,
    );
  }

  if (moment === "loss_review") {
    return joinParts(
      rng.choice([
        `Loss review w/ ${contact.name}. Blocker: ${deal.story.knownObjections[0]}.`,
        `${contact.name} on the post-mortem - ${joinHuman(deal.story.riskFactors)} got in the way.`,
        `Walked through what killed ${deal.title} with ${contact.name}.`,
        `${firstName} post-mortem: ${deal.lostReason ?? deal.story.knownObjections[0]} - not a no, just a not-now.`,
        `Closing-loop call w/ ${firstName}. ${capitalizeSentence(deal.lostReason ?? deal.story.knownObjections[0])}.`,
        `${firstName} debrief: ${deal.lostReason ?? "timing"} got in the way. Door open.`,
      ]),
      stateLine,
    );
  }

  if (activityType === "call") {
    return joinParts(
      rng.choice([
        `Call w/ ${contact.name} re: ${deal.story.need}.`,
        `Quick call - ${contact.name} on ${deal.story.need}.`,
        `Spoke to ${contact.name}, covered ${deal.story.need}.`,
        `Phone w/ ${firstName}. Stayed on ${deal.story.need}.`,
        `${firstName} call - ${deal.story.knownObjections[0]} is the open thread.`,
        `Quick check-in w/ ${firstName}. ${capitalizeSentence(deal.story.need)}.`,
      ]),
      stateLine,
      nextStep,
    );
  }

  if (activityType === "meeting") {
    return joinParts(
      rng.choice([
        `Meeting w/ ${organization.name}: ${deal.story.need}, ${stage.name}, win condition ${deal.story.winCondition}.`,
        `Met w/ ${contact.name}. Stage ${stage.name}. Objections discussed: ${deal.story.knownObjections.join(", ")}.`,
        `Recap: reviewed ${deal.story.need} at ${stage.name}.`,
        `${firstName} meeting - covered ${deal.story.need} and ${contact.priorities[0]}.`,
        `Sat with ${firstName}. Pulled the conversation toward ${deal.story.winCondition}.`,
        `${firstName} working session. ${capitalizeSentence(deal.story.need)} stayed center.`,
      ]),
      stateLine,
      nextStep,
    );
  }

  if (activityType === "email") {
    return joinParts(
      rng.choice([
        `Sent follow-up to ${contact.name} on ${deal.story.need}.`,
        `Email to ${contact.name} - urgency angle: ${deal.story.urgencyReason}.`,
        `${contact.name} email re: ${deal.story.need}.`,
        `Wrote ${firstName} - kept it short.`,
        `${firstName} note out. Anchored on ${deal.story.winCondition}.`,
        `Followup email to ${firstName}.`,
      ]),
      stateLine,
    );
  }

  if (activityType === "deadline") {
    return joinParts(
      rng.choice([
        `Deadline check for ${deal.title}. Close date: ${compactDate(deal.expectedCloseDate)}. Status: ${deal.status}.`,
        `${deal.title} deadline marker - ${compactDate(deal.expectedCloseDate)}.`,
        `${shortOrgName(organization)} close-date checkpoint.`,
        `${deal.title} timeline review. ${compactDate(deal.expectedCloseDate)}.`,
      ]),
      stateLine,
      riskLine,
    );
  }

  return joinParts(
    rng.choice([
      `Task: verify alignment, update CRM, confirm ${contact.name} owns next step for ${deal.title}.`,
      `Internal: ${deal.title} - check ${contact.name}'s next step.`,
      `Admin on ${deal.title}.`,
      `${shortOrgName(organization)} housekeeping.`,
      `Updating CRM for ${deal.title}.`,
    ]),
    stateLine,
    nextStep,
  );
}

function shortOrgName(organization: Organization): string {
  return organization.name.split(" ")[0];
}

function noteBody(rng: Rng, kind: "deal-summary" | "risk" | "close", deal: Deal, contact: Contact, organization: Organization, stage: Stage): string {
  const firstName = contact.name.split(" ")[0];
  const shortOrg = organization.name.split(" ")[0];

  // Messy CRM hygiene: half the time a deal-summary note from a messy org is just a
  // vague one-liner ("ping", "tbd", "n/a") - the kind of note that proves the data
  // quality complaint. We don't shortcut risk/close notes because those carry the
  // signal the rest of the system relies on.
  if (kind === "deal-summary" && organization.story.crmHygiene === "messy" && rng.bool(0.5)) {
    return rng.choice(MESSY_VAGUE_NOTES_DEAL_SUMMARY);
  }

  if (kind === "risk") {
    return rng.choice([
      `Risk on ${organization.name}: ${deal.story.riskFactors.join(", ")}. ${firstName} is ${contact.personality}; ${frictionPhrase(deal)}.`,
      `${organization.name} - flagging ${deal.story.riskFactors[0]}. Last signal from ${firstName}: ${deal.story.sentimentArc.at(-1)?.trigger ?? "no recent contact"}.`,
      `Heads up on ${deal.title}: ${deal.story.riskFactors.join(" + ")}. ${capitalizeSentence(frictionPhrase(deal))}.`,
      `${shortOrg} risk note - ${deal.story.riskFactors[0]} is the live concern. ${firstName} hasn't moved the needle in days.`,
      `Watching ${deal.title}: ${deal.story.riskFactors.join(" / ")}. ${firstName} is ${contact.personality} and that's part of the friction.`,
      `${deal.title} - escalating internally. Risks: ${joinHuman(deal.story.riskFactors)}.`,
      `${shortOrg} on the watch list. ${capitalizeSentence(deal.story.riskFactors[0])} is what kills this if we don't address it.`,
    ]);
  }

  if (kind === "close") {
    if (deal.status === "WON") {
      return rng.choice([
        `Closed-won ${organization.name}. Hit: ${deal.story.winCondition}. ${firstName} signed off.`,
        `${organization.name} - WON. Final proof: ${deal.story.winCondition}.`,
        `${deal.title} - done. ${firstName} on the close.`,
        `${shortOrg} signed. Final win bar: ${deal.story.winCondition}.`,
        `WON ${deal.title}. ${firstName} kept the scope tight at the close.`,
        `${shortOrg} closed-won. Rollout conversation now opens.`,
        `${deal.title} approved. Pilot scope held.`,
      ]);
    }

    return rng.choice([
      `Lost ${organization.name}. Reason: ${deal.lostReason ?? "no clear reason logged"}. Killers: ${deal.story.knownObjections.join(", ")}.`,
      `${deal.title} - LOST. ${deal.lostReason ?? deal.story.knownObjections[0]}.`,
      `Closed-lost. ${deal.lostReason ?? "unclear"}; objections that mattered: ${deal.story.knownObjections.join(", ")}.`,
      `${shortOrg} - LOST. ${capitalizeSentence(deal.lostReason ?? deal.story.knownObjections[0])}. Marked warm for next cycle.`,
      `${deal.title}: lost on ${deal.lostReason ?? deal.story.knownObjections[0]}. Not a product no, a timing no.`,
      `${shortOrg} closed-lost. Real reason: ${deal.lostReason ?? deal.story.knownObjections[0]}. Keeping the file warm.`,
      `Lost ${deal.title}. ${firstName} cited ${deal.lostReason ?? deal.story.knownObjections[0]} but the door is open.`,
    ]);
  }

  const valueContext = deal.story.valueExpansionReason && rng.bool(0.4) ? ` ${trimSentence(deal.story.valueExpansionReason)}.` : "";
  return rng.choice([
    `${organization.name} eval - ${deal.story.need}. Stage: ${stage.name}. Driver: ${organization.story.buyingTrigger}. Watch: ${deal.story.knownObjections[0]}.${valueContext}`,
    `${deal.title}: looking for ${deal.story.need}. ${trimSentence(deal.story.urgencyReason)} is the why-now. Top objection so far: ${deal.story.knownObjections[0]}.${valueContext}`,
    `Notes on ${organization.name} - ${deal.story.need}, currently ${stage.name}. Pushed by: ${organization.story.buyingTrigger}.${valueContext}`,
    `${shortOrg} status - need ${deal.story.need}; ${stage.name} stage. Decision pressure: ${organization.story.decisionPressure}.${valueContext}`,
    `${deal.title} working notes: ${firstName} (${contact.role}) leading from their side. Watch ${deal.story.knownObjections[0]}.${valueContext}`,
    `${shortOrg}: ${deal.story.need}. Stage ${stage.name}, ${firstName} primary. ${capitalizeSentence(deal.story.urgencyReason)} is the why-now.${valueContext}`,
    `Active deal ${deal.title}: ${firstName} on point. Open thread: ${deal.story.knownObjections[0]}.${valueContext}`,
    `${shortOrg} eval - ${deal.story.need}. Decision pressure: ${organization.story.decisionPressure}.${valueContext}`,
  ]);
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

function emailSubject(rng: Rng, deal: Deal, contact: Contact, organization: Organization, activity: Activity): string {
  const firstName = contact.name.split(" ")[0];
  const shortOrg = organization.name.split(" ")[0];
  const dealShortRaw = deal.title.replace(`${organization.name} - `, "").replace(`${organization.name}: `, "");
  const dealShort = dealShortRaw.charAt(0).toUpperCase() + dealShortRaw.slice(1);
  const need = deal.story.need;

  if (activity.moment === "discovery") {
    return rng.choice([
      `${shortOrg}: ${need}`,
      `Following up - ${firstName}`,
      `Intro: ${dealShort}`,
      `Notes from our call - ${firstName}`,
      `${firstName} - thanks for the time`,
      `Quick recap, ${firstName}`,
      `${shortOrg} discovery notes`,
      `Following Tuesday's call, ${firstName}`,
      `${firstName}: where I'd start`,
      `${shortOrg} - first pass on ${dealShort}`,
      `${firstName}, post-call notes`,
      `${dealShort} - opening thoughts`,
    ]);
  }
  if (activity.moment === "process_mapping") {
    return rng.choice([
      `Process notes - ${firstName}`,
      `Pilot shape after today - ${shortOrg}`,
      `${shortOrg}: pilot framing`,
      `Next step on ${dealShort}`,
      `${firstName} - mapping notes`,
      `How the pilot fits your motion - ${shortOrg}`,
      `${shortOrg} pilot, drafted`,
      `Tightening pilot scope, ${firstName}`,
      `${firstName}: workflow recap`,
      `${shortOrg} - where the pilot slots in`,
      `${dealShort} - process notes`,
    ]);
  }
  if (activity.moment === "data_quality_review") {
    return rng.choice([
      `CRM data - what's usable for ${shortOrg}`,
      `Re: data quality - ${firstName}`,
      `Pilot signals (vs cleanup) - ${shortOrg}`,
      `${firstName}: data scope`,
      `Working with the data we have - ${shortOrg}`,
      `${shortOrg}: pilot vs cleanup`,
      `${firstName} - separating the two`,
      `Data confidence, narrowed - ${shortOrg}`,
      `${dealShort}: scope on the data side`,
      `${firstName}, on CRM completeness`,
      `${shortOrg} field-fill sampling`,
      `${dealShort} - what the data can show`,
    ]);
  }
  if (activity.moment === "pilot_scope") {
    return rng.choice([
      `Pilot scope - tight version - ${shortOrg}`,
      `${dealShort}: narrow plan`,
      `Pilot scope for ${firstName}`,
      `Keeping pilot small - ${shortOrg}`,
      `${firstName}: pilot plan v2`,
      `Locked pilot scope - ${shortOrg}`,
      `Pilot path, tightened - ${firstName}`,
      `${dealShort} - one-page plan`,
      `${firstName} - pilot boundaries`,
      `${shortOrg} pilot: what's in / out`,
      `${dealShort}: signing off scope, ${firstName}`,
    ]);
  }
  if (activity.moment === "finance_review") {
    return rng.choice([
      `Business case - ${dealShort}`,
      `Numbers for ${firstName}`,
      `${shortOrg}: value walkthrough`,
      `Forecast impact framing - ${shortOrg}`,
      `${firstName} - value model`,
      `Revenue-at-risk math, ${shortOrg}`,
      `Tightened business case - ${shortOrg}`,
      `${dealShort}: cost & value, one slide`,
      `${firstName}, on the numbers`,
      `${shortOrg} ROI shape`,
      `${dealShort} - rollout economics`,
      `${firstName}: revenue impact math`,
    ]);
  }
  if (activity.moment === "security_review") {
    return rng.choice([
      `Security checklist - pilot only - ${shortOrg}`,
      `Implementation Q's - ${firstName}`,
      `${firstName}: security review`,
      `Pilot data + access - ${shortOrg}`,
      `${shortOrg}: pilot security scope`,
      `Data-access model for pilot - ${firstName}`,
      `Short security checklist, ${firstName}`,
      `Implementation footprint - ${shortOrg}`,
      `${firstName} - sec review summary`,
      `${dealShort} - access boundaries`,
      `${shortOrg}: rollout sec questions parked`,
    ]);
  }
  if (activity.moment === "pilot_success") {
    return rng.choice([
      `Pilot evidence landed - ${shortOrg}`,
      `Proof point: ${need}`,
      `${dealShort}: pilot results`,
      `Moving to close - ${shortOrg}`,
      `${firstName} - pilot worked`,
      `${shortOrg} pilot - the numbers`,
      `Pilot read-out attached - ${firstName}`,
      `Time to talk close, ${firstName}`,
      `${dealShort} - read-out summary`,
      `${shortOrg} pilot landed`,
    ]);
  }
  if (activity.moment === "close_confirmation") {
    return rng.choice([
      `Close path - ${dealShort}`,
      `Wrapping up ${shortOrg}`,
      `Signature notes - ${firstName}`,
      `Final scope - ${shortOrg}`,
      `${firstName} - close confirmed`,
      `${shortOrg}: signing today`,
      `Final pilot scope summary - ${shortOrg}`,
      `Closing notes for ${firstName}`,
      `${dealShort} - signature path`,
      `${shortOrg}: wrap-up details`,
    ]);
  }
  if (activity.moment === "loss_review") {
    return rng.choice([
      `Closing out ${dealShort}`,
      `Final note - ${firstName}`,
      `Marking lost - door open - ${shortOrg}`,
      `${shortOrg}: future timing`,
      `${firstName} - thanks for the candor`,
      `Closing the file, keeping warm - ${shortOrg}`,
      `${dealShort} - not now, but later`,
      `${shortOrg}: re-engaging on timing`,
      `${firstName}: parking ${dealShort} for now`,
      `${shortOrg} - door open for future`,
    ]);
  }
  if (activity.moment === "ghosting_nudge") {
    return rng.choice([
      `Quick nudge - ${dealShort}`,
      `Still on for ${shortOrg}?`,
      `Checking in - ${firstName}`,
      `${dealShort} - pause or proceed?`,
      `${firstName} - alive or parked?`,
      `Bumping ${dealShort}`,
      `Sanity check, ${firstName}`,
      `${shortOrg}: do we keep going?`,
      `One more attempt, ${firstName}`,
    ]);
  }

  return rng.choice([
    `${shortOrg}: ${need}`,
    `Re: ${dealShort}`,
    `Next step - ${firstName}`,
    `${firstName} / ${shortOrg}`,
    `${firstName}, quick one`,
    `${dealShort} - next move`,
  ]);
}

function activityMoment(deal: Deal, activity: Activity): BuyerState {
  return deal.story.sentimentArc.find((moment) => moment.occurredAt === activity.dueDate && moment.contactId === activity.contactId)?.buyerState ?? deal.buyerState;
}

function numericIdPart(value: string): number {
  return Number(value.replace(/\D+/g, "")) || 0;
}

function variantForActivity(activity: Activity, options: readonly string[]): string {
  const datePart = numericIdPart(activity.dueDate.slice(0, 10));
  return options[(numericIdPart(activity.id) + datePart) % options.length];
}

function stakeholderVoice(contact: Contact): string {
  if (contact.committeeRole === "finance-approver") return "Finance will look for measurable revenue impact and rollout cost";
  if (contact.committeeRole === "legal-security") return "Security will care about data access, implementation scope, and operational control";
  if (contact.committeeRole === "champion") return "Sales leadership wants a lightweight path reps will actually use";
  if (contact.committeeRole === "technical-evaluator" || contact.committeeRole === "crm-admin") return "RevOps will test whether the CRM data is good enough for useful insight";
  if (contact.committeeRole === "executive-sponsor") return "The sponsor needs a board-ready reason to prioritize this now";
  return `${contact.name} is focused on ${joinHuman(contact.priorities)}`;
}

function emailBodyForActivity(direction: Email["direction"], deal: Deal, contact: Contact, organization: Organization, activity: Activity, previousEmail?: Email): string {
  const state = activityMoment(deal, activity);
  const previousInbound = previousEmail?.direction === "inbound" ? previousEmail : undefined;
  const previousOutbound = previousEmail?.direction === "outbound" ? previousEmail : undefined;

  if (direction === "inbound") {
    if (activity.moment === "close_confirmation") {
      return `Confirmed from finance. The security and data-quality questions are acceptable for the pilot scope, as long as rollout stays narrow and the first success measure is ${deal.story.winCondition}.`;
    }

    if (previousOutbound && activity.moment !== "ghosting_nudge") {
      const styleOpeners: Record<CommunicationStyle, string[]> = {
        busy: ["Quick reply -", "Brief one -", "On the run, but -", "Short:", "From my phone -"],
        direct: ["", "Replying.", "Got it.", "OK.", "Acknowledged."],
        analytical: ["Thinking through this.", "On the data side -", "One thing first.", "Let me work through this.", "Going to push on one assumption."],
        warm: ["Thanks for the note.", "Appreciate the context.", "Good to hear from you.", "This was helpful.", "Thanks - useful."],
        skeptical: ["Need to push back a bit.", "Honestly,", "Not fully sold yet.", "Reading this twice.", "Hold on -"],
      };
      const openers = styleOpeners[contact.communicationStyle] ?? ["Thanks, that helps.", "OK -", "Fair enough."];
      const prefix = variantForActivity(activity, openers);
      const space = prefix.length > 0 ? " " : "";
      return variantForActivity(activity, [
        `${prefix}${space}${stakeholderVoice(contact)}. Still open for me: ${deal.story.knownObjections[0]}. Need the next step to prove ${deal.story.winCondition} without scope creep.`,
        `${prefix}${space}${stakeholderVoice(contact)}. I can keep this moving if the next step stays tied to ${deal.story.winCondition}.`,
        `${prefix}${space}${stakeholderVoice(contact)}. Before pulling more people in, need a clearer answer on ${deal.story.knownObjections[0]}.`,
        `${prefix}${space}${stakeholderVoice(contact)}. Going to need a sharper proof point on ${deal.story.knownObjections[0]} before this widens.`,
        `${prefix}${space}${stakeholderVoice(contact)}. The proof point matters more than the deck right now.`,
        `${prefix}${space}${stakeholderVoice(contact)}. Keeping pilot narrow is the only way this clears internal review.`,
        `${prefix}${space}${stakeholderVoice(contact)}. ${capitalizeSentence(deal.story.knownObjections[0])} is the conversation we need to close before scope grows.`,
      ]);
    }

    if (activity.moment === "discovery" || activity.moment === "process_mapping") {
      return variantForActivity(activity, [
        `This is worth exploring. Our main issue is still ${contact.priorities[0]}, but I need to see how it fits the way the team already works.`,
        `The use case makes sense. Before we widen it, I need the pilot path to stay close to ${contact.priorities[0]} and the current CRM workflow.`,
        `I can see the fit, especially around ${contact.priorities[0]}. Send the smallest version of the pilot plan so I can pressure-test it internally.`,
        `Useful framing. The team has been burned by tools that ask too much upfront - we need this to be the opposite.`,
        `Pain around ${contact.priorities[0]} is real. What I need from you: pilot scope so tight my team can't push back.`,
        `Worth a second conversation. Bring the narrowest version of pilot scope you can defend.`,
        `Helpful intro. ${capitalizeSentence(contact.priorities[0])} is what I'd want the first phase to prove. Send the pilot framing in writing so I can circulate it.`,
        `Following the thread. Realistically I can sponsor a 4-week test if it stays close to ${contact.priorities[0]} and avoids asking the team to change reporting habits.`,
        `Useful conversation. Before the next call, I want a one-pager: what the pilot does, what we measure, what we don't touch.`,
        `Honest answer - I'm interested, but my team has bandwidth for one new thing this quarter. Show me why this should be it.`,
        `Got the gist. ${capitalizeSentence(contact.priorities[0])} is real for us. The question is whether a pilot is faster than fixing this internally.`,
      ]);
    }

    if (activity.moment === "data_quality_review") {
      return variantForActivity(activity, [
        `The data-quality angle is the part I am worried about. If the pilot depends on perfectly clean CRM data, we will struggle to make it credible.`,
        `I checked a few sample records and the CRM is uneven. The pilot needs to show useful risk signals without pretending the data is perfect.`,
        `Data quality is still my main concern. Please separate what works today from what would require a cleanup project.`,
        `Honest read: our CRM has gaps. The pilot has to be useful despite that or the whole story falls over.`,
        `Looked at the sample. We can work with it for the pilot scope. Cleanup conversation stays separate.`,
        `Need the pilot to assume we won't do cleanup. If it still produces signal, we have something.`,
        `Pulled the field-completeness report this morning. It's bad. We can pilot on a subset, but I want it framed as "useful despite the data" not "useful once we clean the data".`,
        `I'm fine with the pilot scope working off existing CRM data, but flag clearly which segments are too messy to test on. Don't let us run the pilot where it'll fail.`,
        `Two things I need: a list of fields the pilot needs to be populated, and what happens to results when 20-30% of those fields are missing. Realistic case for us.`,
        `Talked to my RevOps lead. We can clean up two segments in advance if that lets the pilot avoid the worst data. Tell me which segments matter most.`,
        `OK on running the pilot on as-is data. Not OK on the pilot quietly failing because the data is bad. Want to agree what we do if signals are weak.`,
      ]);
    }

    if (activity.moment === "finance_review") {
      return variantForActivity(activity, [
        `I need the business case tightened before this goes wider. Please connect the pilot to revenue impact and what we can prove before the board update.`,
        `Finance will ask what changes in the forecast meeting. Tie the pilot back to missed follow-up and at-risk revenue, not just better reporting.`,
        `The value story is close, but I need the cost and rollout assumptions in one place before I can support it.`,
        `Finance won't approve a pilot framed as reporting. Has to be revenue-at-risk math, or we don't bring it to the committee.`,
        `Pricing scenarios attached are workable. Rollout tier is the one we'll fight over - not pilot.`,
        `Three things I need: pilot cost, rollout cost ceiling, and what success looks like in EUR. Today.`,
        `For finance approval I need this expressed as "X EUR of pipeline goes from at-risk to forecastable" - not as a reporting upgrade. Reframe and resend.`,
        `The CFO will only sign off if there's a numeric counterfactual: what's the cost of NOT doing this. Send that.`,
        `Pricing reads fine for pilot. Rollout pricing is where I need a ceiling, not a range - finance won't approve a range.`,
        `I want a single-page case before the next finance review. Three lines: cost, savings/uplift, and what we lose if we say no.`,
        `Tightened the numbers internally. Pilot cost is approvable. Rollout cost as-stated is not - need a structured discount conversation before that's on the table.`,
      ]);
    }

    if (activity.moment === "security_review") {
      return variantForActivity(activity, [
        `Security and implementation are still open items. Send the shortest checklist you have so I can see whether this is lightweight enough for us.`,
        `I can review a pilot checklist this week, but keep it narrow. A full rollout review will slow this down.`,
        `Please send the data-access summary and the implementation steps separately. I need to know where the real operational lift is.`,
        `Pilot footprint is fine if it stays as small as you described. Rollout will need a real audit.`,
        `Implementation cost has to stay near zero for pilot. Anything more and ops will block it.`,
        `Send the dataflow + minimum-fields list. If pilot avoids audit-heavy paths, we can move.`,
        `Our security policy treats this kind of integration as medium risk. Pilot scope is fine if we limit which records the system sees - send the data-access boundaries.`,
        `Got the checklist. Two open items: data residency confirmation and the audit log retention period. Clear those and we can sign off pilot.`,
        `Discussed with our CISO. Pilot is OK if it doesn't touch the dirty data segments (compliance flags). Rollout will need a full DPIA.`,
        `Implementation review next week. Send: who from your side connects to which system, what permissions they need, and how we revoke them.`,
        `Pilot security review is approvable. Rollout review will require us to involve infosec from week one - don't surprise them later.`,
      ]);
    }

    if (activity.moment === "pilot_success") {
      return variantForActivity(activity, [
        `The pilot evidence is useful. If RevOps agrees with the stale-deal view, I can support moving this to the next step.`,
        `Results read well. Want to bring this to the sponsor before we talk rollout.`,
        `Numbers hold up. The case for moving forward is clear if budget timing aligns.`,
        `Pilot did what it said. Setting up the close conversation next week.`,
        `Pilot data lines up with what we hoped. I'll position this to the sponsor as a pilot that proved its narrow case - not a green light for unlimited scope.`,
        `Results are credible. One thing the team flagged: the signal-to-noise on lower-value deals. Want to address that before rollout, not at rollout.`,
        `Showed the pilot read-out internally. People are convinced. The remaining question is rollout pacing, not whether we move.`,
        `Pilot evidence holds up under pushback. Moving this to commercial conversation. Standard procurement on our side, no surprises expected.`,
      ]);
    }

    if (activity.moment === "loss_review") {
      return variantForActivity(activity, [
        `I appreciate the follow-up. The need is real, but we are not going to move ahead right now. Final reason on our side: ${deal.lostReason ?? deal.story.knownObjections[0]}.`,
        `Thanks for the candor. Genuinely - timing didn't work, not the product. ${capitalizeSentence(deal.lostReason ?? deal.story.knownObjections[0])} is the real reason.`,
        `Honest answer: ${deal.lostReason ?? deal.story.knownObjections[0]}. Stay in touch.`,
        `Closing the loop on our side. ${capitalizeSentence(deal.lostReason ?? deal.story.knownObjections[0])} - might revisit next cycle.`,
        `It's a not-now, not a no. ${capitalizeSentence(deal.lostReason ?? deal.story.knownObjections[0])}. Reach back out in two quarters and we'll have a different conversation.`,
        `Real talk - team capacity for new tooling is gone for this year. ${capitalizeSentence(deal.lostReason ?? deal.story.knownObjections[0])}. Keep me on the list for the next cycle.`,
        `Decision came back as ${deal.lostReason ?? deal.story.knownObjections[0]}. Appreciate how you handled the process - direct, no pressure. Will remember that.`,
        `We went with a different path. ${capitalizeSentence(deal.lostReason ?? deal.story.knownObjections[0])} was the deciding factor, not the product itself.`,
      ]);
    }

    if (activity.moment === "ghosting_nudge") {
      return variantForActivity(activity, [
        `Sorry, this has slipped. I do not have enough internal alignment to move it forward this week.`,
        `I have not been able to get the sponsor conversation back on the calendar. It may need to wait unless the board update becomes urgent again.`,
        `No update from my side yet. The need is still there, but I cannot commit the team to another step right now.`,
        `Apologies for the silence. Buried in something else; this isn't dead, just paused.`,
        `Trying to clear my plate. Will come back on this within the next two weeks.`,
        `Honest: I dropped this. Not because it's wrong - because I haven't had bandwidth.`,
        `Replying so you don't have to wonder. The deal is paused on our side - not dead, but I can't push it this quarter. Will reach back out when timing changes.`,
        `Sorry for the radio silence. We had two leadership departures and this got pushed off. If you want to close the file for now, that's fair - I'll come back when I can drive it properly.`,
        `Appreciate you not giving up. Reality: my sponsor is preoccupied with something else and won't engage on this for at least 6 weeks. Park it.`,
        `Got pulled into something internal. Not a no on the product - a no on the timing. Re-engage me end of next quarter.`,
      ]);
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

  const firstName = contact.name.split(" ")[0];
  const repOpener = variantForActivity(activity, [
    `Hi ${firstName},`,
    `${firstName} -`,
    `Hey ${firstName},`,
    `${firstName},`,
  ]);

  if (previousInbound) {
    return variantForActivity(activity, [
      `${repOpener} thanks for the note. Main concern I heard: ${deal.story.knownObjections[0]}. Keeping the next step narrow around ${deal.story.winCondition}.`,
      `${repOpener} that makes sense. I'll keep this focused on ${deal.story.winCondition} and park ${deal.story.knownObjections[0]} for the rollout phase.`,
      `${repOpener} understood. Sending the shorter version - what proves ${deal.story.winCondition}, what needs your team, what waits.`,
      `${repOpener} appreciate the candor. Pulling the scope tighter so ${deal.story.knownObjections[0]} doesn't get tangled with the pilot decision.`,
      `${repOpener} hearing you on ${deal.story.knownObjections[0]}. Tightening the pilot ask so that becomes a rollout question, not a pilot blocker.`,
      `${repOpener} pulling the next step in tighter based on your feedback. Anchor stays ${deal.story.winCondition}, nothing wider.`,
      `${repOpener} clear on what you need. Sending a one-page version that holds the pilot to ${deal.story.winCondition} only.`,
      `${repOpener} got it. Restating: pilot proves ${deal.story.winCondition}, rollout questions wait until after.`,
    ]);
  }

  if (activity.moment === "discovery") {
    return variantForActivity(activity, [
      `${repOpener} thanks for the time. Captured ${contact.priorities[0]} as the first thing to prove - keeping next step light.`,
      `${repOpener} good first call. ${capitalizeSentence(contact.priorities[0])} is what I'll anchor the pilot around.`,
      `${repOpener} useful conversation. Pulling out ${contact.priorities[0]} as the proof point we should test first.`,
      `${repOpener} appreciate the openness on ${deal.story.need}. Going to come back with a tight pilot framing.`,
      `${repOpener} that was a strong first session. ${capitalizeSentence(contact.priorities[0])} reads as the right wedge.`,
      `${repOpener} captured the key things from today. Sending a short scope draft this week.`,
      `${repOpener} the pain on ${deal.story.need} is clear. Will keep the next step lightweight.`,
    ]);
  }

  if (activity.moment === "process_mapping") {
    return variantForActivity(activity, [
      `${repOpener} based on what you walked me through, I'm shaping the pilot around your current CRM motion - no behavior change required upfront. Next check: whether ${deal.story.winCondition}.`,
      `${repOpener} mapping looks clean. I want to fit this to how you work today, not the other way around. Test point: ${deal.story.winCondition}.`,
      `${repOpener} thanks for the walkthrough. The pilot won't ask the team to change habits before the proof lands. Anchor: ${deal.story.winCondition}.`,
      `${repOpener} mapping done. Pilot slots into your weekly cadence; no new tooling, no new fields.`,
      `${repOpener} draft of pilot motion attached. Designed so the team barely notices it until results show up.`,
      `${repOpener} workflow captured. Adoption risk is real but pilot scope avoids the heavy-lift parts.`,
      `${repOpener} appreciate the depth. Pulling the pilot framing tight around ${contact.priorities[0]}.`,
    ]);
  }

  if (activity.moment === "data_quality_review") {
    return variantForActivity(activity, [
      `${repOpener} fair point on data quality. Pilot will show what we can detect from CRM as-is, then we separate cleanup from the buying decision.`,
      `${repOpener} pulled the pilot scope back to fields the team already trusts. Should let us test risk detection without a cleanup project sneaking in.`,
      `${repOpener} the CRM isn't perfectly clean and that's fine. Real test: can we still surface stale risk from signals already there.`,
      `${repOpener} reframed pilot to work on the cleanest segments only. Cleanup question stays separate from the buying decision.`,
      `${repOpener} sampled a few records the way you suggested. Enough signal exists for the pilot bar.`,
      `${repOpener} accepting the data is uneven. Pilot is designed to be useful despite that, not pretend otherwise.`,
      `${repOpener} sending the data-confidence note we discussed. Pilot needs three field types; the rest can wait.`,
    ]);
  }

  if (activity.moment === "finance_review") {
    return variantForActivity(activity, [
      `${repOpener} tightened the business case around ${deal.story.need}. Cleanest proof point is still ${deal.story.winCondition}, value tied to ${contact.priorities[0]}.`,
      `${repOpener} reframed the pilot around revenue at risk + forecast confidence. Ask stays narrow - prove whether ${deal.story.winCondition}.`,
      `${repOpener} added the value assumptions we talked through. Pilot should show whether ${deal.story.need} moves the next forecast review measurably.`,
      `${repOpener} simplified the cost/value summary to one page. Anchor is ${deal.story.winCondition}; everything else is rollout phase.`,
      `${repOpener} pulled together the value-at-risk math. Pilot ROI shows up in the next forecast cycle if proof point holds.`,
      `${repOpener} business case tightened. ${capitalizeSentence(deal.story.knownObjections[0])} is the one to address before approval.`,
      `${repOpener} pricing scenarios attached. Pilot tier holds even if rollout debate stretches.`,
    ]);
  }

  if (activity.moment === "security_review") {
    return variantForActivity(activity, [
      `${repOpener} sending the implementation + security checklist. Pilot-scoped only - not turning this into a rollout review yet.`,
      `${repOpener} attaching the short version: data the pilot needs, who sees it, what happens if you say no.`,
      `${repOpener} separated pilot security questions from rollout requirements so you're reviewing the actual near-term risk.`,
      `${repOpener} data-access model attached. Pilot uses a subset only; rollout reopens this with full scope.`,
      `${repOpener} security checklist trimmed to pilot footprint. Less than a page.`,
      `${repOpener} implementation cost stays low for pilot. Sec review can be lightweight.`,
      `${repOpener} sent the dataflow diagram. Pilot avoids the audit-heavy paths entirely.`,
    ]);
  }

  if (activity.moment === "pilot_success") {
    return variantForActivity(activity, [
      `${repOpener} pilot is showing the risk pattern we wanted: ${deal.story.winCondition}. Want to use that as the basis for the close conversation.`,
      `${repOpener} proof point landed. ${capitalizeSentence(deal.story.winCondition)} - confirmed in the pilot data.`,
      `${repOpener} the pilot worked. Suggest we move to close on ${deal.story.winCondition}.`,
      `${repOpener} numbers from the pilot are in. ${capitalizeSentence(deal.story.winCondition)} - data backs it.`,
      `${repOpener} pilot delivered. Time to talk about expanding past pilot scope.`,
      `${repOpener} results attached. Read-out is ${deal.story.winCondition}; ready to talk close path.`,
      `${repOpener} proof point holds at the pilot bar. Close conversation makes sense as next step.`,
    ]);
  }

  if (activity.moment === "close_confirmation") {
    return variantForActivity(activity, [
      `${repOpener} confirming close path from our side. First step stays narrow, centered on ${deal.story.winCondition}, no extra reporting work for reps.`,
      `${repOpener} ready to close. Keeping rollout intentionally light - ${deal.story.winCondition} is the anchor.`,
      `${repOpener} sending the close summary. Pilot scope held, nothing reopened at signature.`,
      `${repOpener} final scope matches what we agreed - ${deal.story.winCondition}, nothing wider.`,
      `${repOpener} sending the signature path. Final tier matches the pilot framing.`,
      `${repOpener} close docs en route. Pilot scope preserved.`,
      `${repOpener} ready when you are. Pilot tier signed cleanly = next conversation is rollout, not pilot rescope.`,
    ]);
  }

  if (activity.moment === "loss_review") {
    return variantForActivity(activity, [
      `${repOpener} thanks for being direct. Closing this out cleanly - ${deal.lostReason ?? deal.story.knownObjections[0]} - keeping the notes for future timing.`,
      `${repOpener} appreciate the candor. Marking lost (${deal.lostReason ?? deal.story.knownObjections[0]}) but happy to re-open when things shift.`,
      `${repOpener} understood. Final note in the file: ${deal.lostReason ?? deal.story.knownObjections[0]}. Door stays open.`,
      `${repOpener} respecting the decision. Will re-engage when ${deal.lostReason ?? deal.story.knownObjections[0]} resolves.`,
      `${repOpener} marking the file lost - not a no, a not-now. Keeping you in the loop on product updates.`,
      `${repOpener} clear on why. Sending a polite goodbye, keeping the warm thread going for next cycle.`,
      `${repOpener} thanks for the time and the honesty. Reach out anytime if ${deal.lostReason ?? deal.story.knownObjections[0]} changes.`,
    ]);
  }

  if (activity.moment === "ghosting_nudge") {
    return variantForActivity(activity, [
      `${repOpener} quick nudge. Open item is still whether ${deal.story.winCondition}. Keep this alive or park it?`,
      `${repOpener} checking if this is still active. Next useful step: sponsor readout on ${deal.story.winCondition}.`,
      `${repOpener} pausing follow-up after this unless timing changed. Open question: whether ${deal.story.winCondition}.`,
      `${repOpener} no pressure but want to know whether ${deal.title} is still on. Easy to pause if it's not.`,
      `${repOpener} happy to step back if timing isn't right. Just need to know either way.`,
      `${repOpener} touching base one more time. ${capitalizeSentence(deal.story.winCondition)} - still the right test?`,
      `${repOpener} sanity check: is this still active in your head, or has it slipped?`,
      `${repOpener} dropping the cadence unless you want me to keep going. Easy to revive if priorities shift.`,
      `${repOpener} not trying to be a pest - one quick yes/no. ${capitalizeSentence(deal.title)} still on your list, or has it slipped behind other priorities?`,
      `${repOpener} ${state.friction >= 60 ? "I know things are loud on your side" : "I know the calendar has been full"}. Want to make this trivial: reply with one word - alive, paused, dead.`,
      `${repOpener} stepping back. If ${deal.story.winCondition} still matters in Q3, ping me and I'll re-open this cleanly. Otherwise marking the file inactive.`,
      `${repOpener} last attempt before I close the file for now. If the pain on ${deal.story.need} is still real, even a one-liner works.`,
      `${repOpener} sending a smaller ask: 10 minutes next week to decide alive or not. If that's also too much, totally fair - just say so.`,
      `${repOpener} this is the polite goodbye email unless you tell me otherwise. Door stays open whenever ${deal.story.knownObjections[0]} resolves.`,
      `${repOpener} I'll stop nudging after this. Genuine ask: is the timing wrong, or is the framing wrong? Either is useful for me to know.`,
      `${repOpener} parking this on my side unless I hear back. Not giving up - just respecting that other things are louder for you right now.`,
      `${repOpener} a 30-second reply works: "still on" or "drop it" - either is helpful. Trying to keep my pipeline honest.`,
      `${repOpener} circling back once more. If ${deal.story.winCondition} would still help this quarter, the pilot can start light. If not, I'll move on.`,
    ]);
  }

  if (state.friction >= 65) {
    return variantForActivity(activity, [
      `${repOpener} shortest version of where we are: ${organization.name} evaluating ${deal.story.need}, open concern is ${deal.story.knownObjections[0]}. Keeping next step on proof, not rollout.`,
      `${repOpener} cutting back to essentials. ${capitalizeSentence(deal.story.knownObjections[0])} is the blocker - want to address that before widening.`,
      `${repOpener} stripping this down to one question: does ${deal.story.winCondition} actually hold for your team?`,
      `${repOpener} reset attempt. Want to clear ${deal.story.knownObjections[0]} before anything else moves.`,
      `${repOpener} simpler ask: pilot only proves ${deal.story.winCondition}. ${capitalizeSentence(deal.story.knownObjections[0])} stays parked.`,
    ]);
  }

  if (state.engagement < 40) {
    return variantForActivity(activity, [
      `${repOpener} quick nudge on ${deal.story.need}. Kept this to the next practical step: confirm whether ${deal.story.winCondition} is still the right proof point.`,
      `${repOpener} I know it's been quiet. Want to know if ${deal.story.winCondition} still works as the test, or if we should reset.`,
      `${repOpener} dropping a low-friction option: 15 minutes next week to confirm whether this is still alive.`,
      `${repOpener} aware the team has been busy. Two-sentence ask: pilot? park? something else?`,
    ]);
  }

  return variantForActivity(activity, [
    `${repOpener} thanks for the conversation about ${deal.story.need}. ${capitalizeSentence(joinHuman(contact.priorities))} matter most - next step stays tied to ${deal.story.winCondition}.`,
    `${repOpener} following up on ${deal.story.need}. Anchored next step on ${deal.story.winCondition}.`,
    `${repOpener} sending the short version. Pilot anchored on ${deal.story.winCondition}.`,
    `${repOpener} brief follow-up - keeping the focus on ${deal.story.winCondition} and nothing wider.`,
  ]);
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
  const firstName = contact.name.split(" ")[0];
  const riskLine = deal.story.riskFactors.length > 0 ? `Risks: ${joinHuman(deal.story.riskFactors)}.` : "";
  const shortOrg = organization.name.split(" ")[0];

  // Messy CRM hygiene: ~50% of activity-notes for messy orgs are short throwaway lines
  // ("left vm", "no answer") - rep ticked the box without leaving substance. Deterministic
  // by activity id. We don't shortcut close_confirmation or pilot_success notes because
  // those still need to indicate the actual outcome.
  const messyShortNoteSelector = (numericIdPart(activity.id) + numericIdPart(activity.dueDate.slice(0, 10))) % 2;
  if (
    organization.story.crmHygiene === "messy"
    && activity.moment !== "close_confirmation"
    && activity.moment !== "pilot_success"
    && messyShortNoteSelector === 0
  ) {
    return variantForActivity(activity, MESSY_VAGUE_ACTIVITY_NOTES);
  }

  if (activity.moment === "discovery") {
    return variantForActivity(activity, [
      `Discovery w/ ${contact.name} (${contact.role}). ${deal.story.need} ties to ${contact.priorities[0]}. ${capitalizeSentence(sentimentPhraseForState(state))}; eng ${state.engagement}/100.`,
      `${firstName} opened up about ${contact.priorities[0]}. Connects cleanly to ${deal.story.need}.`,
      `Talked to ${firstName} - confirmed pain is ${deal.story.need}. ${contact.role} angle: ${contact.priorities[0]}.`,
      `First substantive call w/ ${firstName}. They flagged ${contact.priorities[0]} as the first thing to fix.`,
      `${firstName} walked me through how ${deal.story.need} shows up day-to-day. Pain is real.`,
      `Discovery notes: ${firstName} cares about ${contact.priorities[0]} more than ${contact.priorities[1] ?? "anything else"}. Eng ${state.engagement}.`,
      `${shortOrg}: discovery confirmed ${deal.story.need}. ${firstName} sounded ${sentimentPhraseForState(state)}.`,
      `${firstName} on the discovery call - the use case lands; concerns are about scope, not fit.`,
    ]);
  }

  if (activity.moment === "process_mapping") {
    return variantForActivity(activity, [
      `Process map w/ ${firstName}. Current workflow can host a small pilot; adoption risk remains. ${riskLine}`,
      `Walked the current motion w/ ${firstName}. Bottleneck: ${contact.priorities[0]}.`,
      `${firstName} sketched how they work today. The CRM habits aren't the blocker; ${contact.priorities[0]} is.`,
      `Mapped current state with ${firstName}. Reps already touch the right fields - signal extraction is the gap.`,
      `${firstName} ran me through the team's weekly cadence. Pilot fits as a sidecar, not a replacement.`,
      `Process review: ${firstName} confirmed the pilot won't ask reps to change behavior upfront.`,
      `${shortOrg} workflow walkthrough w/ ${firstName}. No major shifts needed for pilot to slot in.`,
      `${firstName} explained the daily flow. ${contact.priorities[0]} is what they want to fix first.`,
    ]);
  }

  if (activity.moment === "data_quality_review") {
    return variantForActivity(activity, [
      `Data quality review w/ ${firstName}. Questioned whether CRM hygiene supports insight. Friction ${state.friction}/100. ${riskLine}`,
      `CRM data check w/ ${firstName}: records uneven but enough for narrow pilot. Friction ${state.friction}/100. ${riskLine}`,
      `${firstName} on data confidence. Split: usable signals today vs cleanup later. Friction ${state.friction}/100. ${riskLine}`,
      `Sampled records with ${firstName}. Pilot can work on existing data quality; rollout might need cleanup.`,
      `${firstName} pushed on hygiene. Agreed pilot scope avoids the dirtiest segments.`,
      `Data hygiene conversation: ${firstName} wants ${deal.story.knownObjections[0]} addressed before widening.`,
      `${shortOrg} data review w/ ${firstName}. Friction ${state.friction}/100; usable signals exist.`,
      `${firstName} ran through the field-completeness gaps. Pilot path stays on the cleanest data.`,
    ]);
  }

  if (activity.moment === "pilot_scope") {
    return variantForActivity(activity, [
      `Pilot scope w/ ${firstName}: keep narrow around ${deal.story.winCondition}. Eng ${state.engagement}, urg ${state.urgency}.`,
      `${firstName} agreed the proof point is ${deal.story.winCondition}. Nothing wider in scope.`,
      `Narrowed pilot to ${deal.story.winCondition} after ${firstName}'s session. ${capitalizeSentence(sentimentPhraseForState(state))}.`,
      `${firstName} signed off on pilot framing. ${deal.story.winCondition} is the win bar.`,
      `Scope conversation: ${firstName} wants the proof tight. ${deal.story.winCondition} - nothing more.`,
      `Pilot definition locked w/ ${firstName}. Avoiding rollout-tier debates until proof lands.`,
      `${shortOrg} pilot framing: ${deal.story.winCondition} as the only metric that matters in phase one.`,
      `${firstName} reviewed pilot scope draft. Tight enough to ship, ambitious enough to prove value.`,
    ]);
  }

  if (activity.moment === "finance_review") {
    return variantForActivity(activity, [
      `Finance review w/ ${firstName}: case must tie ${deal.story.need} to revenue. Watch: ${deal.story.knownObjections[0]}.`,
      `Numbers check w/ ${firstName}. Pricing/rollout assumptions still sensitive. Anchor: ${deal.story.winCondition}.`,
      `Commercial framing w/ ${firstName}: pilot must read as forecast impact, not another report. Concern: ${deal.story.knownObjections[0]}.`,
      `${firstName} on the value case. Wants revenue-at-risk math, not feature comparison.`,
      `Finance conversation: ${firstName} pulled on rollout cost. Anchoring to ${deal.story.winCondition}.`,
      `Walked ${firstName} through the value model. ${deal.story.knownObjections[0]} is the live concern.`,
      `${shortOrg} business case session w/ ${firstName}. Math is clean; sponsorship is the variable.`,
      `${firstName} wants the value story in one slide. Tightening around ${deal.story.winCondition}.`,
    ]);
  }

  if (activity.moment === "security_review") {
    return variantForActivity(activity, [
      `Security w/ ${firstName}: pilot-scoped checklist. Open: ${joinHuman(deal.story.knownObjections)}.`,
      `${firstName} reviewed access/implementation. Keeping it lightweight.`,
      `Sec checkpoint - ${firstName} wants narrow review, not full audit yet.`,
      `${firstName} on the security side: pilot data scope is acceptable, rollout needs more rigor.`,
      `Implementation walkthrough w/ ${firstName}. No blockers for pilot stage.`,
      `${firstName} reviewed data-access model. Comfortable with pilot footprint.`,
      `${shortOrg} security checkpoint: ${firstName} cleared pilot scope, flagged rollout for later.`,
      `${firstName} kept the security review tight. ${deal.story.knownObjections[0]} parked for rollout.`,
    ]);
  }

  if (activity.moment === "pilot_success") {
    return variantForActivity(activity, [
      `Pilot success w/ ${firstName}. Evidence supports: ${deal.story.winCondition}. Sentiment ${state.sentiment.toFixed(2)}, eng ${state.engagement}.`,
      `${firstName} signed off on pilot results. ${deal.story.winCondition} - confirmed.`,
      `Pilot read-out landed. ${firstName} bought the proof: ${deal.story.winCondition}.`,
      `${firstName} reviewed the results. Pilot delivered on ${deal.story.winCondition}.`,
      `${shortOrg} pilot read-out: ${firstName} agreed the proof point holds.`,
      `Pilot data shared with ${firstName}. Numbers back ${deal.story.winCondition}.`,
      `${firstName} pressure-tested the pilot numbers. They hold up - moving to close.`,
      `Read-out call w/ ${firstName}: pilot proof point landed cleanly.`,
    ]);
  }

  if (activity.moment === "close_confirmation") {
    if (deal.status === "WON") {
      return variantForActivity(activity, [
        `Closed w/ ${firstName}: pilot approved, rollout narrow. Remaining items parked for implementation. Sent ${state.sentiment.toFixed(2)}, friction ${state.friction}.`,
        `WON w/ ${firstName}. Pilot signed; rollout planning to follow.`,
        `${firstName} confirmed close. Pilot scope held; nothing reopened at signature.`,
        `${shortOrg} closed-won. ${firstName} signed on the narrow pilot scope as discussed.`,
        `${firstName} approved the close path. Final scope matches the proposal.`,
        `Close confirmation: ${firstName} signed off. No surprises at signature.`,
        `WON. ${firstName} kept the scope discipline through the close call.`,
        `${shortOrg} signed. ${firstName} flagged implementation rhythm as the next conversation.`,
      ]);
    }
    return variantForActivity(activity, [
      `Close confirmation w/ ${firstName}: ${deal.status}. Final sentiment ${state.sentiment.toFixed(2)}, friction ${state.friction}.`,
      `${firstName} closed the loop. Outcome ${deal.status}.`,
      `${shortOrg} - ${deal.status}. ${firstName} closed cleanly from their side.`,
      `Final call w/ ${firstName}: ${deal.status} confirmed. No reopens.`,
    ]);
  }

  if (activity.moment === "loss_review") {
    return variantForActivity(activity, [
      `Loss review w/ ${firstName}. Final reason: ${deal.lostReason ?? deal.story.knownObjections[0]}. Underlying: ${deal.story.knownObjections[0]}. Keep account warm.`,
      `${firstName} on the post-mortem. ${deal.lostReason ?? deal.story.knownObjections[0]} is what killed it.`,
      `Lost. ${firstName} cited ${deal.lostReason ?? deal.story.knownObjections[0]} - leaves the door open if timing shifts.`,
      `${shortOrg} loss debrief w/ ${firstName}. ${deal.lostReason ?? "Timing"} got in the way - not the product.`,
      `${firstName} walked me through what stalled it. Real reason: ${deal.lostReason ?? deal.story.knownObjections[0]}.`,
      `Post-mortem w/ ${firstName}: ${deal.lostReason ?? deal.story.knownObjections[0]}. Marking warm for re-engagement next cycle.`,
      `${firstName} closed the loop on why. ${deal.lostReason ?? deal.story.knownObjections[0]} - not a no, just a not-now.`,
    ]);
  }

  if (activity.moment === "ghosting_nudge") {
    return variantForActivity(activity, [
      `Nudge to ${firstName} - no movement. Eng ${state.engagement}/100. ${riskLine}`,
      `${firstName} quiet again. Risk of fall-out increasing.`,
      `Followed up w/ ${firstName}. Still nothing.`,
      `${shortOrg} - ${firstName} hasn't replied since last touch. Risk surfacing.`,
      `Ghost watch on ${firstName}. Engagement down to ${state.engagement}/100.`,
      `${firstName} silent through the last two nudges. Considering pausing.`,
      `No reply from ${firstName}. Will give one more attempt before parking.`,
      `${firstName} hasn't moved this in ${Math.max(1, Math.round((Date.now() - new Date(deal.lastActivityDate ?? deal.createdAt).getTime()) / 86400000 / 2))} days. Pipeline drift risk.`,
    ]);
  }

  if (activity.type === "meeting") {
    return variantForActivity(activity, [
      `Meeting w/ ${firstName} at ${organization.name}. ${deal.story.need}. ${capitalizeSentence(sentimentPhraseForState(state))}; eng ${state.engagement}, friction ${state.friction}. Focus: ${joinHuman(contact.priorities)}.`,
      `Met ${firstName} - covered ${deal.story.need} and ${joinHuman(contact.priorities.slice(0, 2))}. Objections still on the table: ${joinHuman(deal.story.knownObjections)}.`,
      `${firstName} session at ${organization.name}. Talked ${deal.story.need}. Vibe: ${sentimentPhraseForState(state)}.`,
      `${firstName} meeting recap: stayed tight on ${deal.story.need}. ${capitalizeSentence(sentimentPhraseForState(state))} read overall.`,
      `${shortOrg} sync w/ ${firstName}. Covered ${contact.priorities[0]} and ${deal.story.winCondition}.`,
      `Sat down with ${firstName}. Pulled out ${deal.story.need} as the anchor for next step.`,
      `${firstName} meeting - ${capitalizeSentence(sentimentPhraseForState(state))}; ${frictionPhraseForState(state)}.`,
    ]);
  }

  if (activity.type === "call") {
    return variantForActivity(activity, [
      `Call w/ ${firstName} on ${deal.story.need}. ${capitalizeSentence(sentimentPhraseForState(state))}, ${engagementPhraseForState(state)}. Next concern: ${deal.story.knownObjections[0]}.`,
      `${firstName} call - stayed on ${deal.story.need}. Main thing they keep flagging: ${deal.story.knownObjections[0]}.`,
      `Spoke to ${firstName}. Tone: ${sentimentPhraseForState(state)}. Open: ${deal.story.knownObjections[0]}.`,
      `${firstName} on the phone. ${capitalizeSentence(deal.story.need)}; concerns: ${deal.story.knownObjections.join(", ")}.`,
      `Quick call with ${firstName}. Pushed on ${deal.story.winCondition} as proof point.`,
      `${shortOrg} call w/ ${firstName}. ${capitalizeSentence(sentimentPhraseForState(state))} on the value question.`,
      `${firstName} call notes: ${deal.story.need} still resonates; ${deal.story.knownObjections[0]} is the blocker.`,
    ]);
  }

  return variantForActivity(activity, [
    `${activity.type} note - ${firstName} still tied to ${deal.story.need}. Friction ${state.friction}, eng ${state.engagement}.`,
    `Internal: ${deal.title} - ${firstName} next step pending.`,
    `${shortOrg} admin - ${firstName} owns the next move.`,
    `Followed up on ${deal.title}. Waiting on ${firstName}.`,
  ]);
}

function valueExpansionReasonForDeal(
  dealIndex: number,
  leadValue: number | undefined,
  dealValue: number,
  organization: Organization,
  scenarioId: string,
): string {
  const leadValueText = leadValue ? `${leadValue.toLocaleString()} EUR` : "the original lead estimate";
  const dealValueText = `${dealValue.toLocaleString()} EUR`;
  const need = organization.story.pains[0] ?? "the buyer's stated need";
  const valueDelta = dealValue - (leadValue ?? 0);
  const isLargeJump = valueDelta >= 50_000;
  const isVeryLarge = dealValue >= 150_000;
  const isCommittee = organization.story.buyingStyle === "committee";
  const isMessy = organization.story.crmHygiene === "messy";

  // Scenario-aware templates: each scenario gets a couple of variants that fit its
  // premise. We fall back to the generic pool for other scenarios.
  if (scenarioId === "ghosted-high-value-opportunity" && isVeryLarge) {
    const ghosted = [
      `Lead was qualified at ${leadValueText} based on a single champion conversation about ${need}. Once the champion brought the executive sponsor in for a discovery walkthrough, the rep reforecast the opportunity to ${dealValueText} to reflect the wider scope under discussion.`,
      `Started at ${leadValueText} from a champion referral. The CRO confirmed the slipping enterprise deal was the second-largest of the year, and the opportunity was reforecast to ${dealValueText} to reflect what the champion is actually trying to solve.`,
      `Initial estimate of ${leadValueText} was the champion's lightweight pilot framing. The reforecast to ${dealValueText} reflects the enterprise rollout scope the CRO actually wants to fund - if the champion can re-engage the executive sponsor.`,
    ];
    return ghosted[Math.abs(dealIndex) % ghosted.length];
  }

  if (scenarioId === "committee-security-delay") {
    const committee = [
      `Initial lead was framed at ${leadValueText} as a workshop with the champion. Once the buying committee surfaced, the rep reforecast to ${dealValueText} to account for finance and security each needing their own pilot scope.`,
      `Lead value started at ${leadValueText}. After the first committee meeting, the rep updated the deal to ${dealValueText} to reflect the rollout scale the committee is actually evaluating, not the lightweight workshop the champion floated.`,
      `Original lead was ${leadValueText}, sized around the champion's view of the problem. The committee asked for a rollout-sized case during the second round of discovery and the value was updated to ${dealValueText}.`,
    ];
    return committee[Math.abs(dealIndex) % committee.length];
  }

  if (scenarioId === "messy-crm-hygiene-account" && isMessy) {
    const messy = [
      `Lead came in at ${leadValueText} for a hygiene diagnostic. The conversation widened to a paid pilot on stale-deal detection across the messiest segment, so the opportunity was reforecast to ${dealValueText}.`,
      `Initial scope at ${leadValueText} was a CRM cleanup audit. Champion pivoted the conversation to "pilot that works despite the messiness" and the deal was updated to ${dealValueText}.`,
      `Started at ${leadValueText}. Discovery surfaced that the CRO wanted a forecast-confidence pilot, not just a hygiene fix. Reforecast to ${dealValueText} to reflect that scope.`,
    ];
    return messy[Math.abs(dealIndex) % messy.length];
  }

  if (scenarioId === "expansion-after-won-pilot" && isLargeJump) {
    const expansion = [
      `Original lead was scoped at ${leadValueText} as a single-team pilot. The pilot's success widened the conversation to a full-team rollout and the deal was updated to ${dealValueText}.`,
      `Lead value of ${leadValueText} reflected the pilot scope. The opportunity was reforecast to ${dealValueText} once leadership asked for a rollout-sized plan based on pilot results.`,
    ];
    return expansion[Math.abs(dealIndex) % expansion.length];
  }

  // Generic templates - widened pool with topic variety.
  const generic = [
    `Initial lead was scoped at ${leadValueText} for a lightweight discovery engagement; the conversation widened into a paid pilot during qualification, and the opportunity was reforecast to ${dealValueText}.`,
    `Lead value started at ${leadValueText}, but finance asked for a rollout-sized business case after the pilot discussion. Rep updated the opportunity to ${dealValueText} once the committee scope was clearer.`,
    `Original lead value was ${leadValueText}; the expansion conversation added stalled-deal monitoring and forecast-risk reporting, moving the opportunity value to ${dealValueText}.`,
    `Lead came in at ${leadValueText} as a single-team request. Discovery surfaced that the buyer is solving for the whole sales org, so the deal was reforecast to ${dealValueText}.`,
    `Started at ${leadValueText}, sized around the champion's view. The buying committee widened the scope during the second meeting and the rep updated value to ${dealValueText}.`,
    `Initial estimate of ${leadValueText} reflected a workshop framing. Real scope emerged during process mapping (${need}) and the opportunity was reforecast to ${dealValueText}.`,
    `Lead value of ${leadValueText} was the buyer's first pass before they involved finance. After the value-walkthrough conversation, the deal was updated to ${dealValueText}.`,
    `Original ${leadValueText} lead was qualified around a single workflow. Once we mapped the dependencies, the deal expanded to ${dealValueText} to cover the actual problem surface.`,
    `Started small at ${leadValueText} - the champion wanted to keep the first conversation low-stakes. After the executive sponsor joined, the deal was updated to ${dealValueText}.`,
    `Lead value was ${leadValueText} based on the inbound form. Real conversation was a rollout, not a pilot, and the deal was reforecast to ${dealValueText} after discovery.`,
    `Initial ${leadValueText} reflected the rep's conservative first estimate. The deal was widened to ${dealValueText} once the buyer described what success would actually require.`,
    `Lead came in at ${leadValueText}. Three discovery calls later, the buyer's stated need (${need}) is materially bigger than the inbound suggested, so the deal was updated to ${dealValueText}.`,
  ];

  // Use isCommittee/dealValue to bias selection so deal index isn't the only key
  const offset = (isCommittee ? 1 : 0) + (isVeryLarge ? 2 : 0) + (isLargeJump ? 1 : 0);
  return generic[(Math.abs(dealIndex) + offset) % generic.length];
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

  const isExpansionScenario = scenario.id === "expansion-after-won-pilot";
  const isCommitteeScenario = scenario.id === "committee-security-delay";
  const isGhostedScenario = scenario.id === "ghosted-high-value-opportunity";
  const isMessyScenario = scenario.id === "messy-crm-hygiene-account";
  const plan = planDealStatuses(scenario);

  return Array.from({ length: scenario.volume.deals }, (_, index) => {
    const isExpansionPilotDeal = isExpansionScenario && index === 0;
    const isExpansionExpansionDeal = isExpansionScenario && index === 1;
    const isCommitteeDeal = isCommitteeScenario && index === 0;
    const isGhostedDeal = isGhostedScenario && index === 0;
    const isMessyAnchorDeal = isMessyScenario && index === 0;
    // Messy scenario: force at least every third deal to have no expectedCloseDate, so the
    // "high rate of missing close dates" premise is deterministic rather than knob-driven.
    const forceMissingCloseDate = isMessyScenario && index % 3 === 0;
    const sourceLead = convertedLeads[index];
    const organization = sourceLead ? organizations.find((item) => item.id === sourceLead.organizationId) ?? organizations[index % organizations.length] : organizations[index % organizations.length];
    const organizationContacts = byOrg.get(organization.id) ?? contacts;
    const contact = sourceLead ? contacts.find((item) => item.id === sourceLead.contactId) ?? rng.choice(organizationContacts) : rng.choice(organizationContacts);
    const ownerId = organization.ownerId;
    const dealWindowStart = maxDate(scenario.defaults.startDate, organization.createdAt, contact.createdAt, sourceLead?.createdAt ?? scenario.defaults.startDate);
    const daysAvailableForCreate = Math.max(1, daysBetween(dealWindowStart, endDate));
    const minCreateOffset = Math.min(sourceLead ? 2 : 8, daysAvailableForCreate);
    const maxCreateOffset = Math.max(minCreateOffset, Math.min(sourceLead ? 18 : 45, daysAvailableForCreate));
    let createdAt = addDays(dealWindowStart, rng.intBetween(minCreateOffset, maxCreateOffset));
    const labDealCreatedDates = ["2026-01-21T00:00:00.000Z", "2026-02-08T00:00:00.000Z", "2026-02-04T00:00:00.000Z"];
    if (scenario.id === "single-organization-deal-lab") {
      createdAt = maxDate(dealWindowStart, labDealCreatedDates[index] ?? createdAt);
    }
    if (isExpansionPilotDeal) {
      // Pilot created early - day 15-20 of simulation
      createdAt = maxDate(dealWindowStart, addDays(scenario.defaults.startDate, 18));
    }
    if (isExpansionExpansionDeal) {
      // Expansion deal born ~2 weeks after pilot won (day 95+)
      createdAt = maxDate(dealWindowStart, addDays(scenario.defaults.startDate, EXPANSION_PILOT_DEAL.expectedCloseOffsetDays + 14));
    }
    const status = plan.statuses[index];
    const isForcedCold = plan.coldSlots.has(index);
    const isForcedStalled = plan.stalledSlots.has(index);
    const labFinalStageOrders = [stages.length - 1, stages.length - 1, 2];
    const finalStage = scenario.id === "single-organization-deal-lab"
      ? stages[labFinalStageOrders[index] ?? 0]
      : isExpansionPilotDeal
        ? stages[stages.length - 1]
        : isExpansionExpansionDeal
          ? stages[3] // Negotiation - past proposal-sent, not yet closing
          : isCommitteeDeal
            ? stages[3] // Negotiation - committee has gotten past proposal, now stuck in security+finance review
            : isGhostedDeal
              ? stages[3] // Negotiation - the ghosted deal moved past proposal then went silent
              : isMessyAnchorDeal
                ? stages[2] // Proposal-sent - the anchor messy deal sits mid-pipeline with vague follow-up
                : status === "OPEN"
                  ? stages[isForcedCold || isForcedStalled ? rng.intBetween(1, stages.length - 2) : rng.intBetween(0, stages.length - 1)]
                  : stages[stages.length - 1];
    const labDealValues = [48_000, 76_000, 130_000];
    const baseValue = scenario.id === "single-organization-deal-lab"
      ? labDealValues[index] ?? rng.intBetween(12, 180) * 1_000
      : isExpansionPilotDeal
        ? EXPANSION_PILOT_DEAL.value
        : isExpansionExpansionDeal
          ? EXPANSION_EXPANSION_DEAL.value
          : isCommitteeDeal
            ? COMMITTEE_DEAL_STORY.value
            : isGhostedDeal
              ? GHOSTED_DEAL_STORY.value
              : isMessyAnchorDeal
                ? MESSY_ANCHOR_DEAL_STORY.value
                : rng.intBetween(12, 180) * 1_000;
    const daysUntilSimulationEnd = Math.max(1, daysBetween(createdAt, endDate));
    const earliestCloseOffset = Math.min(24, daysUntilSimulationEnd);
    const latestCloseOffset = Math.max(earliestCloseOffset, Math.min(130, daysUntilSimulationEnd));
    let closedAt = addDays(createdAt, rng.intBetween(earliestCloseOffset, latestCloseOffset));
    const labClosedDates = ["2026-03-18T00:00:00.000Z", "2026-04-19T00:00:00.000Z"];
    if (scenario.id === "single-organization-deal-lab" && status !== "OPEN") {
      closedAt = labClosedDates[index] ?? closedAt;
    }
    if (isExpansionPilotDeal) {
      // Pilot won at ~day 80 of simulation (so the expansion can be born after the win)
      closedAt = addDays(scenario.defaults.startDate, EXPANSION_PILOT_DEAL.expectedCloseOffsetDays);
    }
    let lastActivityDate = status === "OPEN" && (isForcedCold || isForcedStalled)
      ? addDays(endDate, -rng.intBetween(35, 80))
      : status === "OPEN"
        ? addDays(endDate, -rng.intBetween(1, 24))
        : addDays(closedAt, -rng.intBetween(0, 8));
    const labLastActivityDates = ["2026-03-18T00:00:00.000Z", "2026-04-19T00:00:00.000Z", "2026-03-04T00:00:00.000Z"];
    if (scenario.id === "single-organization-deal-lab") {
      lastActivityDate = labLastActivityDates[index] ?? lastActivityDate;
    }
    if (lastActivityDate < createdAt) {
      lastActivityDate = addDays(createdAt, Math.min(14, daysBetween(createdAt, endDate)));
    }
    const nextActivityDate = status === "OPEN" && !isForcedCold && !isForcedStalled ? addDays(endDate, -rng.intBetween(0, 5)) : undefined;
    const sentiment = contact.sentimentBias + (status === "WON" ? 0.45 : status === "LOST" ? -0.35 : isForcedCold ? -0.28 : 0);
    const frictionFloor = isForcedStalled || isForcedCold ? 58 : 0;
    const focusedDealNames = ["DataHub pilot", "sales analytics rollout", "forecast risk expansion"];
    const focusedNeeds = ["faster follow-up on high-intent leads", "a reliable sales operating rhythm", "better visibility into pipeline risk"];
    const focusedWinConditions = ["pilot proves stale-deal detection", "RevOps validates pipeline report", "executive sponsor confirms value"];
    const focusedObjections = [
      ["security review", "CRM data quality", "change management"],
      ["budget", "change management"],
      ["budget", "CRM data quality"],
    ];
    const dealTitle = scenario.id === "single-organization-deal-lab"
      ? `${organization.name} - ${focusedDealNames[index] ?? "CRM intelligence"}`
      : isExpansionPilotDeal
        ? `${organization.name} - ${EXPANSION_PILOT_DEAL.title}`
        : isExpansionExpansionDeal
          ? `${organization.name} - ${EXPANSION_EXPANSION_DEAL.title}`
          : isCommitteeDeal
            ? `${organization.name} - ${COMMITTEE_DEAL_STORY.title}`
            : isGhostedDeal
              ? `${organization.name} - ${GHOSTED_DEAL_STORY.title}`
              : isMessyAnchorDeal
                ? `${organization.name} - ${MESSY_ANCHOR_DEAL_STORY.title}`
                : `${organization.name} - ${rng.choice([
                    "DataHub rollout",
                    "CRM intelligence",
                    "sales analytics",
                    "pipeline audit",
                    "forecast workflow",
                    "deal-risk monitoring",
                    "stale-deal alerts",
                    "rep coaching insights",
                    "win-rate analytics",
                    "lead scoring upgrade",
                    "RevOps automation",
                    "GTM telemetry",
                    "revenue intelligence",
                    "sales motion review",
                    "pipeline hygiene rollout",
                    "forecast confidence pilot",
                    "deal velocity tracking",
                    "sales activity capture",
                    "stalled-deal detection",
                    "next-best-action workflow",
                  ])}`;
    const deal: MutableDeal = {
      id: id("deal", index + 1),
      createdAt,
      updatedAt: status === "OPEN" ? lastActivityDate : closedAt,
      title: dealTitle,
      organizationId: organization.id,
      contactId: contact.id,
      ownerId,
      pipelineId,
      stageId: finalStage.id,
      sourceLeadId: sourceLead?.id,
      status,
      value: baseValue,
      currency: scenario.defaults.currency,
      expectedCloseDate: forceMissingCloseDate || rng.bool(scenario.messiness.missingCloseDateRate) ? undefined : addDays(createdAt, rng.intBetween(45, 145)),
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
        friction: round(clamp(rng.normalish(status === "WON" ? 24 : status === "LOST" ? 76 : isForcedStalled || isForcedCold ? 68 : 38, 17), status === "WON" ? 14 : frictionFloor, status === "WON" ? 42 : 100), 0),
      },
      story: {
        need: scenario.id === "single-organization-deal-lab"
          ? focusedNeeds[index] ?? rng.choice(NEEDS)
          : isExpansionPilotDeal
            ? EXPANSION_PILOT_DEAL.need
            : isExpansionExpansionDeal
              ? EXPANSION_EXPANSION_DEAL.need
              : isCommitteeDeal
                ? COMMITTEE_DEAL_STORY.need
                : isGhostedDeal
                  ? GHOSTED_DEAL_STORY.need
                  : isMessyAnchorDeal
                    ? MESSY_ANCHOR_DEAL_STORY.need
                    : rng.choice(NEEDS),
        urgencyReason: isExpansionPilotDeal
          ? EXPANSION_PILOT_DEAL.urgencyReason
          : isExpansionExpansionDeal
            ? EXPANSION_EXPANSION_DEAL.urgencyReason
            : isCommitteeDeal
              ? COMMITTEE_DEAL_STORY.urgencyReason
              : isGhostedDeal
                ? GHOSTED_DEAL_STORY.urgencyReason
                : isMessyAnchorDeal
                  ? MESSY_ANCHOR_DEAL_STORY.urgencyReason
                  : rng.choice(["board reporting pressure", "new quarter planning", "missed forecast review", "recent campaign spike"]),
        knownObjections: scenario.id === "single-organization-deal-lab"
          ? focusedObjections[index] ?? pickMany(rng, ["budget", "implementation time", "CRM data quality", "security review", "change management"], rng.intBetween(1, 3))
          : isExpansionPilotDeal
            ? [...EXPANSION_PILOT_DEAL.knownObjections]
            : isExpansionExpansionDeal
              ? [...EXPANSION_EXPANSION_DEAL.knownObjections]
              : isCommitteeDeal
                ? [...COMMITTEE_DEAL_STORY.knownObjections]
                : isGhostedDeal
                  ? [...GHOSTED_DEAL_STORY.knownObjections]
                  : isMessyAnchorDeal
                    ? [...MESSY_ANCHOR_DEAL_STORY.knownObjections]
                    : pickMany(rng, ["budget", "implementation time", "CRM data quality", "security review", "change management"], rng.intBetween(1, 3)),
        winCondition: scenario.id === "single-organization-deal-lab"
          ? focusedWinConditions[index] ?? rng.choice(["executive sponsor confirms value", "RevOps validates pipeline report", "pilot proves stale-deal detection"])
          : isExpansionPilotDeal
            ? EXPANSION_PILOT_DEAL.winCondition
            : isExpansionExpansionDeal
              ? EXPANSION_EXPANSION_DEAL.winCondition
              : isCommitteeDeal
                ? COMMITTEE_DEAL_STORY.winCondition
                : isGhostedDeal
                  ? GHOSTED_DEAL_STORY.winCondition
                  : isMessyAnchorDeal
                    ? MESSY_ANCHOR_DEAL_STORY.winCondition
                    : rng.choice(["executive sponsor confirms value", "RevOps validates pipeline report", "pilot proves stale-deal detection"]),
        valueExpansionReason: isExpansionExpansionDeal
          ? `Pilot (deal_001) closed for ${EXPANSION_PILOT_DEAL.value.toLocaleString()} EUR proving stale-deal detection inside one sales team. This opportunity is the full-org rollout that follows: ${EXPANSION_EXPANSION_DEAL.value.toLocaleString()} EUR across the remaining reps and managers.`
          : sourceLead && Math.abs(baseValue - (sourceLead.value ?? 0)) >= 10_000
            ? valueExpansionReasonForDeal(index, sourceLead.value, baseValue, organization, scenario.id)
            : undefined,
        riskFactors: isExpansionPilotDeal
          ? [...EXPANSION_PILOT_DEAL.riskFactors]
          : isExpansionExpansionDeal
            ? [...EXPANSION_EXPANSION_DEAL.riskFactors]
            : isCommitteeDeal
              ? [...COMMITTEE_DEAL_STORY.riskFactors]
              : isGhostedDeal
                ? [...GHOSTED_DEAL_STORY.riskFactors]
                : isMessyAnchorDeal
                  ? [...MESSY_ANCHOR_DEAL_STORY.riskFactors]
                  : isForcedCold || isForcedStalled
                    ? ["low recent activity", "optimistic close date"]
                    : pickMany(rng, ["stakeholder alignment", "budget timing", "data quality"], 2),
        decisionProcess: isExpansionExpansionDeal
          ? `${organization.story.buyingStyle} evaluation following a successful pilot. ${contact.name} (${contact.role}) is sponsoring the rollout decision; ${organization.story.decisionPressure}. The committee is the same as the pilot - they already know the product and are now evaluating scope, not fit.`
          : isCommitteeDeal
            ? `Committee-driven evaluation. ${contact.name} (${contact.role}) is the executive sponsor. ${capitalizeSentence(organization.story.buyingTrigger)}. The champion and RevOps are pushing for a decision, but ${organization.story.decisionPressure} - finance and security have flagged unresolved review items and the deal is sitting in Negotiation past the original close date.`
            : isGhostedDeal
              ? `Champion-led evaluation that lost momentum. ${contact.name} (${contact.role}) drove the early conversation and brought strong engagement, but ${organization.story.decisionPressure}. The close date in CRM is still optimistic, but no real next step has been confirmed for weeks - this is the high-value opportunity that the CRO wants visibility on.`
              : isMessyAnchorDeal
                ? `Champion-led evaluation with visible CRM hygiene problems. ${contact.name} (${contact.role}) is sponsoring the pilot, but ${organization.story.decisionPressure}. The contact list itself has duplicates, multiple records are missing emails/phones, and the close date on this very deal was not set - reflecting the broader pattern.`
                : `${organization.story.buyingStyle} evaluation driven by ${organization.story.buyingTrigger}; ${organization.story.decisionPressure}. ${contact.name} is the ${stakeholderLabel(contact.committeeRole).toLowerCase()} and is focused on ${joinHuman(contact.priorities)}.`,
        stakeholders: dealStakeholderRoles(contact, organizationContacts),
        sentimentArc: [],
      },
    };

    if (deal.expectedCloseDate && deal.expectedCloseDate > endDate) {
      deal.expectedCloseDate = endDate;
    }
    if (scenario.id === "single-organization-deal-lab") {
      deal.expectedCloseDate = ["2026-03-18T00:00:00.000Z", "2026-04-30T00:00:00.000Z", "2026-04-26T00:00:00.000Z"][index] ?? deal.expectedCloseDate;
    }

    if (sourceLead) {
      sourceLead.convertedDealId = deal.id;
      sourceLead.updatedAt = createdAt;
      event(events, "lead.converted", createdAt, "lead", sourceLead.id, { dealId: deal.id });
    }

    event(events, "deal.created", createdAt, "deal", deal.id, { organizationId: organization.id, stageId: stages[0].id });
    if (finalStage.order > 0) {
      const stageChangeWindowEnd = status === "OPEN" ? lastActivityDate : closedAt;
      const maxStageOffset = Math.max(finalStage.order, daysBetween(createdAt, stageChangeWindowEnd) - 1);

      for (let stageIndex = 1; stageIndex <= finalStage.order; stageIndex++) {
        const offset = Math.max(stageIndex, Math.round((stageIndex * maxStageOffset) / finalStage.order));
        const changedAt = addDays(createdAt, offset);
        event(events, "deal.stage_changed", changedAt, "deal", deal.id, { stageId: stages[stageIndex].id });
      }
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
  moment: ActivityMoment,
  deal: Deal,
  contact: Contact,
  state: BuyerState,
  done: boolean,
  step: number,
  total: number,
): string {
  // Deterministic pick within a variant pool, based on dealId + step + contact.
  const hashSeed = numericIdPart(deal.id) + step * 13 + numericIdPart(contact.id) * 7;
  const pick = <T>(pool: readonly T[]): T => pool[hashSeed % pool.length];
  const name = contact.name;
  const priority = contact.priorities[0];
  const objection = deal.story.knownObjections[0];

  if (!done) {
    return pick([
      "rep scheduled a next step, but the buyer has not responded yet",
      "the next-step ask sat unread for several days",
      "follow-up was scheduled but the buyer never confirmed the slot",
      "rep waited on a reply that never came back",
      "the proposed next step went silent on the buyer side",
      "rep pushed for confirmation but the inbox stayed quiet",
    ]);
  }

  // First conversation - more openings
  if (step === 1) {
    return pick([
      `${name} confirmed that the priority around ${priority} matters enough to explore`,
      `${name} agreed the pain on ${priority} was real and worth a follow-up conversation`,
      `${name} validated the ${priority} hypothesis and asked for a more concrete next step`,
      `${name} acknowledged the timing on ${priority} and opened the door to a structured evaluation`,
      `${name} framed the conversation around ${priority} from the first call`,
      `${name} accepted the pitch on ${priority} but stayed cautious about scope`,
    ]);
  }

  // Win conditions met
  if (step >= total - 1 && deal.status === "WON") {
    return pick([
      `${name} agreed the win condition was met: ${deal.story.winCondition}`,
      `${name} signed off after the pilot showed ${deal.story.winCondition}`,
      `${name} confirmed the proof point landed - ${deal.story.winCondition}`,
      `${name} accepted the close framing with ${deal.story.winCondition} as the anchor`,
      `${name} approved the close after the pilot demonstrated ${deal.story.winCondition}`,
    ]);
  }
  if (step >= total - 1 && deal.status === "LOST") {
    return pick([
      `${name} could not get past ${objection}`,
      `${name} closed the loop - ${objection} was the deciding factor`,
      `${name} walked away citing ${objection} as the blocker`,
      `${name} confirmed the no, with ${objection} as the primary reason`,
      `${name} ended the conversation - ${objection} stayed unresolved`,
    ]);
  }
  if (step >= total - 1 && deal.status === "OPEN" && state.friction >= 55) {
    return pick([
      `${name} still liked the need, but ${objection} kept the deal from moving`,
      `${name} stayed warm on the need but ${objection} held up the next step`,
      `${name} confirmed interest but ${objection} kept the conversation in a holding pattern`,
      `${name} acknowledged the value but couldn't move past ${objection}`,
      `${name} kept the door open but ${objection} blocked any next step`,
    ]);
  }

  // Moment-driven variants - these are the bulk of mid-deal triggers
  if (moment === "process_mapping") {
    return pick([
      `${name} walked through the team's current motion and flagged ${priority} as the biggest gap`,
      `${name} mapped the existing workflow and confirmed the pilot could slot in without behavior change`,
      `${name} described how the team works today and pointed at ${priority} as the friction`,
      `${name} took the rep through their cadence and asked how the pilot would fit`,
      `${name} ran through the current process and identified ${priority} as the wedge`,
      `${name} explained the existing rhythm and the rep mapped pilot scope against it`,
    ]);
  }
  if (moment === "data_quality_review") {
    return pick([
      `${name} pushed on whether the CRM data was clean enough for a useful pilot`,
      `${name} questioned how the pilot would handle the messy segments of the CRM`,
      `${name} asked to see field-completeness samples before agreeing to the pilot`,
      `${name} raised data hygiene as the deciding factor and asked for a clear scope`,
      `${name} pressed on the difference between pilot signal and cleanup work`,
      `${name} requested examples of what the system flags when half the fields are blank`,
    ]);
  }
  if (moment === "pilot_scope") {
    return pick([
      `${name} pushed to keep the pilot scope tight and avoid rollout-tier debates`,
      `${name} asked the rep to narrow the pilot to one measurable proof point`,
      `${name} confirmed pilot scope was acceptable if it didn't expand without sign-off`,
      `${name} negotiated the pilot down to the minimum viable proof of ${deal.story.winCondition}`,
      `${name} signed off on pilot framing but asked to defer scope debates to post-pilot`,
      `${name} wanted the pilot small enough that internal review couldn't push back`,
    ]);
  }
  if (moment === "finance_review") {
    return pick([
      `${name} asked finance to weigh in on whether the pilot tied cleanly to revenue impact`,
      `${name} pulled on rollout cost ceiling before agreeing to the pilot scope`,
      `${name} wanted a single-page value case before involving the CFO`,
      `${name} asked how the pilot reads in EUR rather than as a reporting upgrade`,
      `${name} questioned whether finance would approve without revenue-at-risk math`,
      `${name} flagged budget timing as the determining factor on rollout pacing`,
    ]);
  }
  if (moment === "security_review") {
    return pick([
      `${name} pulled in security review and asked for a pilot-scoped checklist`,
      `${name} questioned data-access boundaries and asked for an explicit dataflow`,
      `${name} confirmed the pilot footprint was acceptable but flagged rollout audit work`,
      `${name} wanted infosec involved from week one of any rollout, not later`,
      `${name} asked which records the system actually sees during pilot phase`,
      `${name} agreed to pilot security scope only if rollout review stayed separate`,
    ]);
  }
  if (moment === "pilot_success") {
    return pick([
      `${name} read the pilot results and agreed the proof point held`,
      `${name} accepted the pilot evidence and started shaping the close path`,
      `${name} confirmed the pilot delivered what was promised on ${deal.story.winCondition}`,
      `${name} circulated the pilot read-out internally and got the sponsor's nod`,
      `${name} bought into the pilot results and asked about rollout timing`,
      `${name} validated the pilot evidence and moved the conversation to commercial`,
    ]);
  }
  if (moment === "close_confirmation") {
    return pick([
      `${name} confirmed the close on the agreed pilot scope without reopening earlier debates`,
      `${name} signed off on the close path with ${deal.story.winCondition} as the anchor`,
      `${name} approved the close terms and asked about implementation rhythm`,
      `${name} kept scope discipline through the close call`,
      `${name} closed the conversation cleanly - pilot scope held`,
    ]);
  }
  if (moment === "loss_review") {
    return pick([
      `${name} closed the loop respectfully - ${objection} was the unresolved blocker`,
      `${name} confirmed the no, citing ${objection}, but kept the file warm`,
      `${name} marked the deal lost on ${objection} and asked the rep to re-engage later`,
      `${name} ended the cycle on ${objection} but left the door open for next year`,
    ]);
  }
  if (moment === "ghosting_nudge") {
    return pick([
      `${name} did not reply to the most recent follow-up`,
      `${name} acknowledged the nudge but did not commit to a next step`,
      `${name} sent a thin reply after multiple follow-ups`,
      `${name} apologized for the silence but couldn't give a real status update`,
      `${name} indicated the deal was paused on their side without a clear restart trigger`,
      `${name} hinted that internal priorities had shifted away from this work`,
    ]);
  }

  // Mid-deal sentiment-driven variants (when no specific moment matched)
  if (activityType === "meeting" && state.sentiment >= 0.25) {
    return pick([
      `${name} saw a credible path to ${deal.story.winCondition}`,
      `${name} left the meeting visibly more confident about the pilot`,
      `${name} agreed the next step felt achievable inside their constraints`,
      `${name} sounded engaged and pulled the conversation deeper into specifics`,
    ]);
  }
  if (activityType === "meeting" && state.friction >= 60) {
    return pick([
      `${name} brought up ${objection} during the meeting`,
      `${name} surfaced ${objection} as a serious blocker mid-meeting`,
      `${name} pushed back on the rep's framing and flagged ${objection}`,
      `${name} left the meeting still uncertain because of ${objection}`,
    ]);
  }
  if (activityType === "call" && contact.personality === "time-poor") {
    return pick([
      `${name} kept the call short and asked for only the business impact`,
      `${name} truncated the call - wanted bullet points, not narrative`,
      `${name} cut the meeting to 15 minutes and asked for the EUR math first`,
      `${name} took the call between other things and asked the rep to send a summary`,
    ]);
  }
  if (activityType === "email" && state.engagement < 40) {
    return pick([
      `${name} gave a thin reply after several follow-ups`,
      `${name} replied late with a single line and no clear next step`,
      `${name} acknowledged the email but didn't open the substance`,
      `${name} sent a polite-but-vague response that didn't move the deal`,
    ]);
  }
  if (activityType === "deadline") {
    return pick([
      "the expected close date forced a pipeline hygiene check",
      "rep ran the close-date review and re-asked for sponsor commitment",
      "deadline cycle pulled the deal back into the rep's weekly forecast call",
      "close-date check forced a pause on optimism and a re-stating of the scope",
    ]);
  }

  // Personality-driven fallbacks
  if (contact.personality === "risk-averse") {
    return pick([
      `${name} asked for proof before widening the evaluation`,
      `${name} pushed for a smaller next step until the risk side was clearer`,
      `${name} asked for case studies before committing more time`,
      `${name} requested references from similar accounts`,
    ]);
  }
  if (contact.personality === "enthusiastic") {
    return pick([
      `${name} offered to pull another stakeholder into the conversation`,
      `${name} volunteered to help frame the internal pitch`,
      `${name} proactively shared the conversation with adjacent teams`,
      `${name} introduced the rep to two other interested colleagues`,
    ]);
  }
  if (contact.personality === "curious") {
    return pick([
      `${name} asked how this would work inside their current sales process`,
      `${name} asked unexpected questions about how the product behaves under edge cases`,
      `${name} probed into the data model and asked about extensibility`,
      `${name} dug into the integration surface and asked what's hardest to set up`,
    ]);
  }
  if (contact.personality === "political") {
    return pick([
      `${name} wanted to know who else needed to approve the pilot`,
      `${name} mapped the internal stakeholders before agreeing to any next step`,
      `${name} asked the rep to wait until the right approvers were in the room`,
      `${name} sequenced the next conversations based on who needed to be on board first`,
    ]);
  }
  if (contact.personality === "pragmatic") {
    return pick([
      `${name} pushed for a practical next step tied to ${priority}`,
      `${name} asked for the shortest path between today and a real proof point`,
      `${name} wanted a concrete deliverable, not a roadmap`,
      `${name} traded scope for speed and asked the rep to keep the next step tight`,
    ]);
  }
  return pick([
    `${name} kept the conversation focused on ${priority}`,
    `${name} steered the discussion back to ${priority} when it drifted`,
    `${name} stayed anchored on ${priority} as the question that mattered`,
    `${name} re-framed each topic against the ${priority} priority`,
  ]);
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

  // Position-based moments for the buyer-journey phases. These run BEFORE the
  // ghosting_nudge shortcut so an early not-done activity (rep scheduled but buyer
  // hasn't confirmed yet) gets the right phase label rather than being mislabeled
  // as a ghosting nudge.
  // The deadline-type short-circuit is gated to early phases so a deadline near
  // deal end doesn't override the close/ghost moments.
  if (progress <= 0.15) return "discovery";
  if (progress <= 0.3) return "process_mapping";
  if (activityType === "deadline" && progress <= 0.5) return "data_quality_review";
  if (progress <= 0.48) return "data_quality_review";
  if (progress <= 0.62) return contact.influence === "economic-buyer" ? "finance_review" : "pilot_scope";
  if (progress <= 0.78) {
    if (deal.story.knownObjections.some((objection) => objection.includes("security"))) return "security_review";
    return contact.influence === "economic-buyer" ? "finance_review" : "pilot_scope";
  }

  // Late phase: closure moments for WON/LOST deals
  if (deal.status === "WON") return step === total ? "close_confirmation" : "pilot_success";
  if (deal.status === "LOST") return step === total ? "loss_review" : "finance_review";

  // Open deal, late phase: this is when ghosting_nudge makes sense - rep is chasing
  // a non-responsive buyer late in the deal life. Also where a not-done late activity
  // legitimately indicates the buyer went silent.
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

function emailCapableContact(preferred: Contact, organizationContacts: readonly Contact[]): Contact {
  if (preferred.email) return preferred;

  const sameCommitteeRole = organizationContacts.find((contact) => contact.email && contact.committeeRole === preferred.committeeRole);
  if (sameCommitteeRole) return sameCommitteeRole;

  const sameInfluence = organizationContacts.find((contact) => contact.email && contact.influence === preferred.influence);
  if (sameInfluence) return sameInfluence;

  return organizationContacts.find((contact) => contact.email) ?? preferred;
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
    const activityCount = Math.min(count, Math.max(3, span));
    const targetBuyerState = deal.buyerState;
    const startingBuyerState = initialBuyerState(rng, contact, organization);
    const drafts: { dueDate: string; done: boolean; type: ActivityType; contact: Contact; moment: ActivityMoment }[] = [];
    let previousOffset = 0;

    for (let i = 0; i < activityCount; i++) {
      const isLastOpenActivity = deal.status === "OPEN" && i === activityCount - 1 && deal.nextActivityDate;
      const isLastStaleOpenActivity = deal.status === "OPEN" && i === activityCount - 1 && !deal.nextActivityDate;
      const isClosingActivity = deal.status !== "OPEN" && i === activityCount - 1;
      const idealOffset = Math.round(((i + 1) * span) / (activityCount + 1));
      const jitteredOffset = idealOffset + rng.intBetween(-2, 2);
      const latestOffsetWithRoom = Math.max(1, span - (activityCount - i - 1));
      const dueOffset = clamp(Math.max(previousOffset + 1, jitteredOffset), 1, latestOffsetWithRoom);
      const dueDate = isLastOpenActivity
        ? deal.nextActivityDate!
        : isLastStaleOpenActivity
          ? activityWindowEnd
        : isClosingActivity
          ? deal.wonTime ?? deal.lostTime ?? addDays(deal.createdAt, dueOffset)
          : addDays(deal.createdAt, dueOffset);
      const done = deal.status === "OPEN" ? !isLastOpenActivity && !rng.bool(scenario.messiness.missingActivityRate) : true;
      const initialType = rng.weightedChoice<ActivityType>([
        { value: "call", weight: 30 },
        { value: "email", weight: 34 },
        { value: "meeting", weight: 18 },
        { value: "task", weight: 14 },
        { value: "deadline", weight: 4 },
      ]);

      const moment = momentForActivity(initialType, deal, contact, i + 1, activityCount, done);
      const type = activityTypeForMoment(rng, moment, initialType);
      const stakeholderContact = stakeholderForActivity(rng, type, moment, deal, contact, organizationContacts, dueDate, i + 1, activityCount);
      const activityContact = type === "email" ? emailCapableContact(stakeholderContact, organizationContacts) : stakeholderContact;
      drafts.push({ dueDate, done, type, contact: activityContact, moment });
      previousOffset = dueOffset;
    }

    drafts.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    deal.story.sentimentArc = [];

    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      const activityIndex = activities.length + 1;
      const buyerState = interpolateBuyerState(rng, startingBuyerState, targetBuyerState, i + 1, drafts.length);
      const trigger = sentimentTrigger(draft.type, draft.moment, deal, draft.contact, buyerState, draft.done, i + 1, drafts.length);
      const nextStepDate = drafts.slice(i + 1).find((item) => item.dueDate > draft.dueDate)?.dueDate;
      deal.story.sentimentArc.push({
        occurredAt: draft.dueDate,
        contactId: draft.contact.id,
        trigger,
        buyerState,
      });

      const dueHour = rng.intBetween(8, 17);
      const dueMinute = rng.choice([0, 15, 30, 45]);
      const dueTimeStr = `${String(dueHour).padStart(2, "0")}:${String(dueMinute).padStart(2, "0")}`;

      let isDone = draft.done;
      if (deal.status !== "OPEN" && i < drafts.length - 1 && rng.bool(0.08)) {
        isDone = false;
      }

      let markedAsDoneTime: string | undefined;
      if (isDone) {
        const dueDateTime = withTime(draft.dueDate, dueHour, dueMinute);
        const completionPattern = rng.weightedChoice<"on-time" | "same-day-late" | "next-day" | "days-late">([
          { value: "on-time", weight: 55 },
          { value: "same-day-late", weight: 25 },
          { value: "next-day", weight: 15 },
          { value: "days-late", weight: 5 },
        ]);

        if (completionPattern === "on-time") {
          markedAsDoneTime = addMinutes(dueDateTime, rng.intBetween(-30, 60));
        } else if (completionPattern === "same-day-late") {
          markedAsDoneTime = addMinutes(dueDateTime, rng.intBetween(90, 240));
        } else if (completionPattern === "next-day") {
          markedAsDoneTime = withTime(addDays(draft.dueDate, 1), 8 + rng.intBetween(0, 3), rng.choice([0, 15, 30, 45]));
        } else {
          markedAsDoneTime = withTime(addDays(draft.dueDate, rng.intBetween(2, 3)), 9 + rng.intBetween(0, 8), rng.choice([0, 15, 30, 45]));
        }

        if (markedAsDoneTime > endDate) markedAsDoneTime = endDate;
      }

      const createdAt = withTime(
        addDays(deal.createdAt, Math.max(0, daysBetween(deal.createdAt, draft.dueDate) - rng.intBetween(0, 5))),
        rng.intBetween(8, 11),
        rng.choice([0, 15, 30, 45]),
      );

      const activity: Activity = {
        id: id("act", activityIndex),
        createdAt,
        updatedAt: isDone ? markedAsDoneTime ?? draft.dueDate : activityIndex % 2 === 0 ? draft.dueDate : createdAt,
        type: draft.type,
        moment: draft.moment,
        subject: activitySubject(rng, draft.type, draft.moment, deal, draft.contact, organization),
        description: activityDescription(rng, draft.type, draft.moment, deal, draft.contact, organization, stage, buyerState, trigger, nextStepDate),
        done: isDone,
        dueDate: draft.dueDate,
        dueTime: dueTimeStr,
        duration: draft.type === "meeting" || draft.type === "call" ? `${rng.choice([15, 30, 45, 60])}m` : undefined,
        dealId: deal.id,
        contactId: draft.contact.id,
        ownerId: deal.ownerId,
        markedAsDoneTime,
      };

      activities.push(activity);
      event(events, "activity.scheduled", activity.createdAt, "activity", activity.id, { dealId: deal.id, contactId: draft.contact.id, type: draft.type });
      if (isDone) event(events, "activity.completed", markedAsDoneTime ?? draft.dueDate, "activity", activity.id, { dealId: deal.id, contactId: draft.contact.id, buyerStateAfter: buyerState, trigger });
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

function stageForDealAt(deal: Deal, stages: readonly Stage[], events: readonly SimulationEvent[], at: string): Stage {
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));
  const createdEvent = events.find((event) => event.type === "deal.created" && event.entityId === deal.id);
  let currentStage = typeof createdEvent?.data.stageId === "string" ? stageById.get(createdEvent.data.stageId) : undefined;

  const stageChanges = events
    .filter((event) => event.type === "deal.stage_changed" && event.entityId === deal.id && event.occurredAt <= at)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id));

  for (const event of stageChanges) {
    if (typeof event.data.stageId === "string") currentStage = stageById.get(event.data.stageId) ?? currentStage;
  }

  return currentStage ?? stageById.get(deal.stageId) ?? stages[0];
}

function generateNotesAndEmails(
  rng: Rng,
  organizations: Organization[],
  contacts: Contact[],
  leads: Lead[],
  stages: Stage[],
  deals: Deal[],
  activities: Activity[],
  events: SimulationEvent[],
  simulationEnd: string,
): { notes: Note[]; emails: Email[] } {
  const endDate = simulationEnd;
  const notes: Note[] = [];
  const emails: Email[] = [];
  const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]));
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const activitiesByDeal = new Map<string, Activity[]>();
  const lastEmailByDeal = new Map<string, Email>();

  for (const activity of activities) {
    if (!activity.dealId) continue;
    activitiesByDeal.set(activity.dealId, [...(activitiesByDeal.get(activity.dealId) ?? []), activity]);
  }

  for (const deal of deals) {
    const organization = organizationById.get(deal.organizationId) ?? organizations[0];
    const contact = contactById.get(deal.contactId) ?? contacts[0];
    const stage = stageById.get(deal.stageId) ?? stages[0];
    const dealActivities = (activitiesByDeal.get(deal.id) ?? []).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const summaryDate = addDays(deal.createdAt, 1);
    const summaryStage = stageForDealAt(deal, stages, events, summaryDate);
    const summaryNote: Note = {
      id: id("note", notes.length + 1),
      createdAt: summaryDate,
      updatedAt: summaryDate,
      dealId: deal.id,
      contactId: contact.id,
      organizationId: organization.id,
      ownerId: deal.ownerId,
      body: noteBody(rng, "deal-summary", deal, contact, organization, summaryStage),
      source: "template",
    };

    notes.push(summaryNote);
    event(events, "note.created", summaryNote.createdAt, "note", summaryNote.id, { dealId: deal.id, source: summaryNote.source });

    const sourceLead = deal.sourceLeadId ? leadById.get(deal.sourceLeadId) : undefined;
    if (sourceLead) {
      const conversionNoteDate = addDays(deal.createdAt, 2);
      const conversionNote: Note = {
        id: id("note", notes.length + 1),
        createdAt: conversionNoteDate,
        updatedAt: conversionNoteDate,
        dealId: deal.id,
        contactId: sourceLead.contactId,
        organizationId: organization.id,
        ownerId: deal.ownerId,
        body: rng.choice([
          `Converted from ${sourceLead.source} (${sourceLead.story.campaignContext}). ${capitalizeSentence(sourceLead.story.conversionRationale ?? sourceLead.story.repAssessment)}.`,
          `Came in via ${sourceLead.source}. Signal: ${sourceLead.story.intentSignal}.`,
          `Lead-to-deal: ${sourceLead.story.qualificationReason}.`,
          `Source: ${sourceLead.source} / ${sourceLead.story.campaignContext}. ${capitalizeSentence(sourceLead.story.qualificationReason)}.`,
          `${capitalizeSentence(sourceLead.source)} channel - hooked on: ${sourceLead.story.intentSignal}.`,
          `Origin: ${sourceLead.story.campaignContext}. Why we qualified: ${sourceLead.story.qualificationReason}.`,
          `From ${sourceLead.source} (${sourceLead.story.campaignContext}). ${capitalizeSentence(sourceLead.story.intentSignal)}.`,
        ]),
        source: "template",
      };

      notes.push(conversionNote);
      event(events, "note.created", conversionNote.createdAt, "note", conversionNote.id, { dealId: deal.id, leadId: sourceLead.id, source: conversionNote.source });
    }

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
        body: noteBody(rng, "risk", deal, contact, organization, stage),
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
        body: noteBody(rng, "close", deal, contact, organization, stage),
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
        const previousEmail = activity.dealId ? lastEmailByDeal.get(activity.dealId) : undefined;
        const outboundSubject = emailSubject(rng, deal, activityContact, organization, activity);
        const [dueHour, dueMin] = (activity.dueTime ?? "10:00").split(":").map(Number);
        const outboundTimestamp = activity.markedAsDoneTime ?? withTime(activity.dueDate, dueHour, dueMin);
        const outbound: Email = {
          id: id("email", emails.length + 1),
          createdAt: outboundTimestamp,
          updatedAt: outboundTimestamp,
          dealId: deal.id,
          contactId: activityContact.id,
          ownerId: deal.ownerId,
          direction: "outbound",
          subject: outboundSubject,
          body: emailBodyForActivity("outbound", deal, activityContact, organization, activity, previousEmail),
          sentiment: "neutral",
          source: "template",
        };

        emails.push(outbound);
        if (activity.dealId) lastEmailByDeal.set(activity.dealId, outbound);
        event(events, "email.sent", outbound.createdAt, "email", outbound.id, { dealId: deal.id, contactId: activityContact.id, activityId: activity.id });

        const shouldReceiveReply = activity.done
          && activity.moment !== "ghosting_nudge"
          && rng.bool(clamp(0.25 + activityContact.responsiveness / 160, 0.25, 0.8));

        if (shouldReceiveReply) {
          // Inbound reply: 30 min to ~72 hr after outbound, capped to simulationEnd.
          const replyDelayMinutes = rng.intBetween(30, 72 * 60);
          let inboundDate = addMinutes(outboundTimestamp, replyDelayMinutes);
          if (inboundDate > endDate) inboundDate = endDate;
          const state = activityMoment(deal, activity);
          const replySubject = outboundSubject.startsWith("Re: ") ? outboundSubject : `Re: ${outboundSubject}`;
          const inbound: Email = {
            id: id("email", emails.length + 1),
            createdAt: inboundDate,
            updatedAt: inboundDate,
            dealId: deal.id,
            contactId: activityContact.id,
            ownerId: deal.ownerId,
            direction: "inbound",
            subject: replySubject,
            body: emailBodyForActivity("inbound", deal, activityContact, organization, activity, outbound),
            sentiment: state.sentiment > 0.25 ? "positive" : state.sentiment < -0.25 ? "negative" : "neutral",
            source: "template",
          };

          emails.push(inbound);
          if (activity.dealId) lastEmailByDeal.set(activity.dealId, inbound);
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
  const simulationEnd = withTime(addDays(simulationStart, scenario.defaults.simulationDays - 1), 23, 59, 59);
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
  const { notes, emails } = generateNotesAndEmails(rng, organizations, contacts, leads, stages, deals, activities, events, simulationEnd);

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
