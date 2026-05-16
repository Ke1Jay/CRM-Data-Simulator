export type CanonicalId = string;
export type ISODateString = string;
export type CurrencyCode = "EUR" | "USD" | "GBP";

export type DealStatus = "OPEN" | "WON" | "LOST" | "DELETED";
export type LeadStatus = "NEW" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED";
export type ActivityType = "call" | "email" | "meeting" | "task" | "deadline";
export type ActivityMoment =
  | "discovery"
  | "process_mapping"
  | "data_quality_review"
  | "pilot_scope"
  | "finance_review"
  | "security_review"
  | "ghosting_nudge"
  | "pilot_success"
  | "close_confirmation"
  | "loss_review";
export type InsightType = "DEAL_COLD" | "PIPELINE_DIGEST" | "WIN_RATE_SHIFT" | "ACTIVITY_GAP" | "STALLED_DEAL";
export type Severity = "INFO" | "WARNING" | "CRITICAL";
export type ValidationSeverity = "fatal" | "warning" | "info";

export type BuyingStyle = "founder-led" | "committee" | "procurement-heavy" | "champion-led";
export type RepBehavior = "diligent" | "overloaded" | "inconsistent" | "strong-closer" | "weak-follow-up";
export type CommunicationStyle = "direct" | "analytical" | "warm" | "skeptical" | "busy";
export type ContactPersonality = "pragmatic" | "curious" | "risk-averse" | "time-poor" | "political" | "enthusiastic";
export type Seniority = "executive" | "director" | "manager" | "individual-contributor";
export type InfluenceLevel = "economic-buyer" | "champion" | "evaluator" | "blocker" | "user";
export type BuyingCommitteeRole =
  | "primary-buyer"
  | "executive-sponsor"
  | "champion"
  | "finance-approver"
  | "technical-evaluator"
  | "crm-admin"
  | "legal-security"
  | "end-user"
  | "blocker";

export type ScenarioConfig = {
  id: string;
  name: string;
  description: string;
  version: string;
  defaults: {
    currency: CurrencyCode;
    simulationDays: number;
    startDate: ISODateString;
  };
  volume: {
    reps: number;
    organizations: number;
    contactsPerOrganization: Range;
    leads: number;
    deals: number;
    activitiesPerDeal: Range;
  };
  targets: {
    minColdDeals: number;
    minStalledDeals: number;
    minClosedDeals: number;
    winRate: Range;
  };
  pipeline: {
    name: string;
    stages: ScenarioStage[];
  };
  messiness: {
    missingCloseDateRate: number;
    missingActivityRate: number;
    duplicateLikeContactRate: number;
  };
};

export type Range = {
  min: number;
  max: number;
};

export type ScenarioStage = {
  key: string;
  name: string;
  order: number;
  defaultWinProbability: number;
};

export type SimulationRunMetadata = {
  runId: string;
  scenarioId: string;
  scenarioVersion: string;
  seed: string;
  generatedAt: ISODateString;
  simulationStart: ISODateString;
  simulationEnd: ISODateString;
  simulatorVersion: string;
};

export type EntityBase = {
  id: CanonicalId;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type Workspace = EntityBase & {
  name: string;
};

export type Pipeline = EntityBase & {
  name: string;
  active: boolean;
  order: number;
};

export type Stage = EntityBase & {
  pipelineId: CanonicalId;
  key: string;
  name: string;
  order: number;
  defaultWinProbability: number;
};

export type Rep = EntityBase & {
  externalOwnerId: number;
  name: string;
  email: string;
  segment: string;
  region: string;
  behavior: RepBehavior;
  quota: number;
};

export type OrganizationStory = {
  industry: string;
  region: string;
  sizeBand: string;
  revenueBand: string;
  growthStage: string;
  crmHygiene: "clean" | "average" | "messy";
  buyingStyle: BuyingStyle;
  pains: string[];
  buyingTrigger: string;
  decisionPressure: string;
};

export type Organization = EntityBase & {
  name: string;
  address?: string;
  ownerId: CanonicalId;
  story: OrganizationStory;
};

export type Contact = EntityBase & {
  organizationId: CanonicalId;
  ownerId: CanonicalId;
  name: string;
  email?: string;
  phone?: string;
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

export type Lead = EntityBase & {
  title: string;
  organizationId: CanonicalId;
  contactId: CanonicalId;
  ownerId: CanonicalId;
  status: LeadStatus;
  source: string;
  label?: string;
  value?: number;
  currency: CurrencyCode;
  expectedCloseDate?: ISODateString;
  lastActivityDate?: ISODateString;
  nextActivityDate?: ISODateString;
  convertedDealId?: CanonicalId;
  story: LeadStory;
};

export type LeadStory = {
  intentSignal: string;
  campaignContext: string;
  qualificationReason: string;
  conversionRationale?: string;
  disqualificationReason?: string;
  repAssessment: string;
};

export type BuyerState = {
  sentiment: number;
  engagement: number;
  urgency: number;
  friction: number;
};

export type Deal = EntityBase & {
  title: string;
  organizationId: CanonicalId;
  contactId: CanonicalId;
  ownerId: CanonicalId;
  pipelineId: CanonicalId;
  stageId: CanonicalId;
  sourceLeadId?: CanonicalId;
  status: DealStatus;
  value?: number;
  currency: CurrencyCode;
  expectedCloseDate?: ISODateString;
  wonTime?: ISODateString;
  lostTime?: ISODateString;
  lostReason?: string;
  lastActivityDate?: ISODateString;
  nextActivityDate?: ISODateString;
  activitiesCount: number;
  buyerState: BuyerState;
  story: DealStory;
};

export type DealStory = {
  need: string;
  urgencyReason: string;
  knownObjections: string[];
  winCondition: string;
  valueExpansionReason?: string;
  riskFactors: string[];
  decisionProcess: string;
  stakeholders: DealStakeholder[];
  sentimentArc: SentimentMoment[];
};

export type DealStakeholder = {
  contactId: CanonicalId;
  role: BuyingCommitteeRole;
  label: string;
};

export type SentimentMoment = {
  occurredAt: ISODateString;
  contactId: CanonicalId;
  trigger: string;
  buyerState: BuyerState;
};

export type Activity = EntityBase & {
  type: ActivityType;
  moment: ActivityMoment;
  subject: string;
  description?: string;
  done: boolean;
  dueDate: ISODateString;
  dueTime?: string;
  duration?: string;
  dealId?: CanonicalId;
  contactId?: CanonicalId;
  ownerId: CanonicalId;
  markedAsDoneTime?: ISODateString;
};

export type Note = EntityBase & {
  dealId?: CanonicalId;
  contactId?: CanonicalId;
  organizationId?: CanonicalId;
  ownerId: CanonicalId;
  body: string;
  source: "template" | "ai";
};

export type Email = EntityBase & {
  dealId?: CanonicalId;
  contactId: CanonicalId;
  ownerId: CanonicalId;
  direction: "inbound" | "outbound";
  subject: string;
  body: string;
  sentiment: "negative" | "neutral" | "positive";
  source: "template" | "ai";
};

export type SimulationEventType =
  | "workspace.created"
  | "pipeline.created"
  | "stage.created"
  | "rep.created"
  | "organization.created"
  | "contact.created"
  | "lead.created"
  | "lead.converted"
  | "deal.created"
  | "deal.stage_changed"
  | "deal.won"
  | "deal.lost"
  | "activity.scheduled"
  | "activity.completed"
  | "email.sent"
  | "email.received"
  | "note.created";

export type SimulationEvent = {
  id: CanonicalId;
  type: SimulationEventType;
  occurredAt: ISODateString;
  entityId: CanonicalId;
  entityType: "workspace" | "pipeline" | "stage" | "rep" | "organization" | "contact" | "lead" | "deal" | "activity" | "email" | "note";
  data: Record<string, unknown>;
};

export type GeneratedWorld = {
  metadata: SimulationRunMetadata;
  scenario: Pick<ScenarioConfig, "id" | "name" | "description" | "version">;
  workspace: Workspace;
  pipeline: Pipeline;
  stages: Stage[];
  reps: Rep[];
  organizations: Organization[];
  contacts: Contact[];
  leads: Lead[];
  deals: Deal[];
  activities: Activity[];
  notes: Note[];
  emails: Email[];
};

export type TruthReport = {
  runId: string;
  generatedAt: ISODateString;
  coldDealIds: CanonicalId[];
  stalledDealIds: CanonicalId[];
  activityGapDealIds: CanonicalId[];
  topRepByWonRevenue?: CanonicalId;
  topRepByOpenPipeline?: CanonicalId;
  winRateByWindow: Record<string, number>;
  pipelineValueByStage: Record<string, number>;
  expectedInsights: ExpectedInsight[];
  benchmarkQuestions: BenchmarkQuestion[];
};

export type ExpectedInsight = {
  type: InsightType;
  severity: Severity;
  title: string;
  entityIds: CanonicalId[];
};

export type BenchmarkQuestion = {
  id: string;
  question: string;
  expectedEntityIds?: CanonicalId[];
  expectedMetric?: number;
  notes?: string;
};

export type ValidationIssue = {
  severity: ValidationSeverity;
  code: string;
  message: string;
  entityType?: string;
  entityId?: CanonicalId;
  path?: string;
};

export type ValidationReport = {
  runId: string;
  generatedAt: ISODateString;
  issueCounts: Record<ValidationSeverity, number>;
  hasFatalErrors: boolean;
  issues: ValidationIssue[];
};

export type RunArtifacts = {
  world: GeneratedWorld;
  events: SimulationEvent[];
  truth?: TruthReport;
  validationReport?: ValidationReport;
};
