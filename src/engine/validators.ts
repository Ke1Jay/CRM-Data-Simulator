import type {
  CanonicalId,
  Deal,
  GeneratedWorld,
  SimulationEvent,
  ValidationIssue,
  ValidationReport,
  ValidationSeverity,
} from "./types.js";

function countBySeverity(issues: ValidationIssue[]): Record<ValidationSeverity, number> {
  return {
    fatal: issues.filter((issue) => issue.severity === "fatal").length,
    warning: issues.filter((issue) => issue.severity === "warning").length,
    info: issues.filter((issue) => issue.severity === "info").length,
  };
}

function issue(issue: ValidationIssue): ValidationIssue {
  return issue;
}

function uniqueIds<T extends { id: CanonicalId }>(items: readonly T[], entityType: string): ValidationIssue[] {
  const seen = new Set<CanonicalId>();
  const issues: ValidationIssue[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      issues.push(
        issue({
          severity: "fatal",
          code: "duplicate_id",
          message: `Duplicate ${entityType} id: ${item.id}`,
          entityType,
          entityId: item.id,
        }),
      );
    }

    seen.add(item.id);
  }

  return issues;
}

function isWithinRange(value: string | undefined, start: string, end: string): boolean {
  if (!value) return true;
  return value >= start && value <= end;
}

function validateContacts(world: GeneratedWorld, orgIds: Set<CanonicalId>, repIds: Set<CanonicalId>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const contact of world.contacts) {
    if (!orgIds.has(contact.organizationId)) {
      issues.push(missingReference("contact", contact, "organizationId", contact.organizationId));
    }

    if (!repIds.has(contact.ownerId)) {
      issues.push(missingReference("contact", contact, "ownerId", contact.ownerId));
    }
  }

  return issues;
}

function validateLeads(
  world: GeneratedWorld,
  orgIds: Set<CanonicalId>,
  contactIds: Set<CanonicalId>,
  repIds: Set<CanonicalId>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const lead of world.leads) {
    if (!orgIds.has(lead.organizationId)) issues.push(missingReference("lead", lead, "organizationId", lead.organizationId));
    if (!contactIds.has(lead.contactId)) issues.push(missingReference("lead", lead, "contactId", lead.contactId));
    if (!repIds.has(lead.ownerId)) issues.push(missingReference("lead", lead, "ownerId", lead.ownerId));

    validateDateRange(issues, "lead", lead, lead.createdAt, world);
    validateDateRange(issues, "lead", lead, lead.expectedCloseDate, world, "expectedCloseDate");
    validateDateRange(issues, "lead", lead, lead.lastActivityDate, world, "lastActivityDate");
    validateDateRange(issues, "lead", lead, lead.nextActivityDate, world, "nextActivityDate");
  }

  return issues;
}

function validateDeals(
  world: GeneratedWorld,
  orgIds: Set<CanonicalId>,
  contactIds: Set<CanonicalId>,
  repIds: Set<CanonicalId>,
  stageIds: Set<CanonicalId>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const deal of world.deals) {
    if (!orgIds.has(deal.organizationId)) issues.push(missingReference("deal", deal, "organizationId", deal.organizationId));
    if (!contactIds.has(deal.contactId)) issues.push(missingReference("deal", deal, "contactId", deal.contactId));
    if (!repIds.has(deal.ownerId)) issues.push(missingReference("deal", deal, "ownerId", deal.ownerId));
    if (!stageIds.has(deal.stageId)) issues.push(missingReference("deal", deal, "stageId", deal.stageId));
    if (deal.pipelineId !== world.pipeline.id) issues.push(missingReference("deal", deal, "pipelineId", deal.pipelineId));

    if (deal.status === "OPEN" && (deal.wonTime || deal.lostTime)) {
      issues.push({
        severity: "fatal",
        code: "open_deal_has_close_time",
        message: "Open deals cannot have wonTime or lostTime",
        entityType: "deal",
        entityId: deal.id,
      });
    }

    if (deal.status === "WON" && !deal.wonTime) {
      issues.push({ severity: "fatal", code: "won_deal_missing_won_time", message: "Won deal is missing wonTime", entityType: "deal", entityId: deal.id });
    }

    if (deal.status === "LOST" && !deal.lostTime) {
      issues.push({ severity: "fatal", code: "lost_deal_missing_lost_time", message: "Lost deal is missing lostTime", entityType: "deal", entityId: deal.id });
    }

    if (deal.buyerState.sentiment < -1 || deal.buyerState.sentiment > 1) {
      issues.push({ severity: "fatal", code: "sentiment_out_of_range", message: "Deal sentiment must be between -1 and 1", entityType: "deal", entityId: deal.id });
    }

    for (const metric of ["engagement", "urgency", "friction"] as const) {
      const value = deal.buyerState[metric];
      if (value < 0 || value > 100) {
        issues.push({ severity: "fatal", code: `${metric}_out_of_range`, message: `Deal ${metric} must be between 0 and 100`, entityType: "deal", entityId: deal.id });
      }
    }

    validateDateRange(issues, "deal", deal, deal.createdAt, world);
    validateDateRange(issues, "deal", deal, deal.expectedCloseDate, world, "expectedCloseDate");
    validateDateRange(issues, "deal", deal, deal.wonTime, world, "wonTime");
    validateDateRange(issues, "deal", deal, deal.lostTime, world, "lostTime");
  }

  return issues;
}

function validateActivities(
  world: GeneratedWorld,
  dealIds: Set<CanonicalId>,
  contactIds: Set<CanonicalId>,
  repIds: Set<CanonicalId>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const activity of world.activities) {
    if (activity.dealId && !dealIds.has(activity.dealId)) {
      issues.push(missingReference("activity", activity, "dealId", activity.dealId));
    }

    if (activity.contactId && !contactIds.has(activity.contactId)) {
      issues.push(missingReference("activity", activity, "contactId", activity.contactId));
    }

    if (!repIds.has(activity.ownerId)) {
      issues.push(missingReference("activity", activity, "ownerId", activity.ownerId));
    }

    validateDateRange(issues, "activity", activity, activity.dueDate, world, "dueDate");
    validateDateRange(issues, "activity", activity, activity.markedAsDoneTime, world, "markedAsDoneTime");
  }

  return issues;
}

function validateNotes(
  world: GeneratedWorld,
  dealIds: Set<CanonicalId>,
  contactIds: Set<CanonicalId>,
  orgIds: Set<CanonicalId>,
  repIds: Set<CanonicalId>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const note of world.notes) {
    if (note.dealId && !dealIds.has(note.dealId)) issues.push(missingReference("note", note, "dealId", note.dealId));
    if (note.contactId && !contactIds.has(note.contactId)) issues.push(missingReference("note", note, "contactId", note.contactId));
    if (note.organizationId && !orgIds.has(note.organizationId)) issues.push(missingReference("note", note, "organizationId", note.organizationId));
    if (!repIds.has(note.ownerId)) issues.push(missingReference("note", note, "ownerId", note.ownerId));

    validateDateRange(issues, "note", note, note.createdAt, world);
    validateDateRange(issues, "note", note, note.updatedAt, world, "updatedAt");
  }

  return issues;
}

function validateEmails(
  world: GeneratedWorld,
  dealIds: Set<CanonicalId>,
  contactIds: Set<CanonicalId>,
  repIds: Set<CanonicalId>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const email of world.emails) {
    if (email.dealId && !dealIds.has(email.dealId)) issues.push(missingReference("email", email, "dealId", email.dealId));
    if (!contactIds.has(email.contactId)) issues.push(missingReference("email", email, "contactId", email.contactId));
    if (!repIds.has(email.ownerId)) issues.push(missingReference("email", email, "ownerId", email.ownerId));

    validateDateRange(issues, "email", email, email.createdAt, world);
    validateDateRange(issues, "email", email, email.updatedAt, world, "updatedAt");
  }

  return issues;
}

function validateEvents(world: GeneratedWorld, events: readonly SimulationEvent[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const entityIds = new Set<CanonicalId>([
    world.workspace.id,
    world.pipeline.id,
    ...world.stages.map((item) => item.id),
    ...world.reps.map((item) => item.id),
    ...world.organizations.map((item) => item.id),
    ...world.contacts.map((item) => item.id),
    ...world.leads.map((item) => item.id),
    ...world.deals.map((item) => item.id),
    ...world.activities.map((item) => item.id),
    ...world.notes.map((item) => item.id),
    ...world.emails.map((item) => item.id),
  ]);

  issues.push(...uniqueIds(events, "event"));

  for (const event of events) {
    if (!entityIds.has(event.entityId)) {
      issues.push({
        severity: "fatal",
        code: "event_missing_entity",
        message: `Event points to missing entity id: ${event.entityId}`,
        entityType: "event",
        entityId: event.id,
        path: "entityId",
      });
    }

    validateDateRange(issues, "event", event, event.occurredAt, world, "occurredAt");
  }

  return issues;
}

function beforeIssue(entityType: string, entityId: CanonicalId, path: string, parentType: string): ValidationIssue {
  return {
    severity: "fatal",
    code: "date_before_parent_created",
    message: `${entityType} ${entityId} has ${path} before linked ${parentType} was created`,
    entityType,
    entityId,
    path,
  };
}

function validateTemporalConsistency(world: GeneratedWorld): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const orgById = new Map(world.organizations.map((item) => [item.id, item]));
  const contactById = new Map(world.contacts.map((item) => [item.id, item]));
  const leadById = new Map(world.leads.map((item) => [item.id, item]));
  const dealById = new Map(world.deals.map((item) => [item.id, item]));
  const dealsBySourceLead = new Map<CanonicalId, Deal[]>();

  for (const lead of world.leads) {
    const organization = orgById.get(lead.organizationId);
    const contact = contactById.get(lead.contactId);

    if (organization && lead.createdAt < organization.createdAt) issues.push(beforeIssue("lead", lead.id, "createdAt", "organization"));
    if (contact && lead.createdAt < contact.createdAt) issues.push(beforeIssue("lead", lead.id, "createdAt", "contact"));
  }

  for (const deal of world.deals) {
    const organization = orgById.get(deal.organizationId);
    const contact = contactById.get(deal.contactId);
    const sourceLead = deal.sourceLeadId ? leadById.get(deal.sourceLeadId) : undefined;

    if (organization && deal.createdAt < organization.createdAt) issues.push(beforeIssue("deal", deal.id, "createdAt", "organization"));
    if (contact && deal.createdAt < contact.createdAt) issues.push(beforeIssue("deal", deal.id, "createdAt", "contact"));
    if (sourceLead && deal.createdAt < sourceLead.createdAt) issues.push(beforeIssue("deal", deal.id, "createdAt", "lead"));

    if (deal.sourceLeadId) {
      dealsBySourceLead.set(deal.sourceLeadId, [...(dealsBySourceLead.get(deal.sourceLeadId) ?? []), deal]);

      if (sourceLead?.convertedDealId !== deal.id) {
        issues.push({
          severity: "fatal",
          code: "lead_deal_conversion_mismatch",
          message: `Deal ${deal.id} sourceLeadId does not match the lead convertedDealId`,
          entityType: "deal",
          entityId: deal.id,
          path: "sourceLeadId",
        });
      }
    }
  }

  for (const [leadId, deals] of dealsBySourceLead) {
    if (deals.length > 1) {
      issues.push({
        severity: "fatal",
        code: "lead_converted_to_multiple_deals",
        message: `Lead ${leadId} is used as source for multiple deals: ${deals.map((deal) => deal.id).join(", ")}`,
        entityType: "lead",
        entityId: leadId,
        path: "convertedDealId",
      });
    }
  }

  for (const activity of world.activities) {
    const deal = activity.dealId ? dealById.get(activity.dealId) : undefined;
    const contact = activity.contactId ? contactById.get(activity.contactId) : undefined;
    const closeTime = deal?.wonTime ?? deal?.lostTime;

    if (deal && activity.dueDate < deal.createdAt) issues.push(beforeIssue("activity", activity.id, "dueDate", "deal"));
    if (contact && activity.dueDate < contact.createdAt) issues.push(beforeIssue("activity", activity.id, "dueDate", "contact"));

    if (closeTime && activity.dueDate > closeTime) {
      issues.push({
        severity: "fatal",
        code: "activity_after_deal_closed",
        message: `Activity ${activity.id} is scheduled after linked deal ${deal?.id} closed`,
        entityType: "activity",
        entityId: activity.id,
        path: "dueDate",
      });
    }
  }

  for (const note of world.notes) {
    const deal = note.dealId ? dealById.get(note.dealId) : undefined;
    const contact = note.contactId ? contactById.get(note.contactId) : undefined;
    const organization = note.organizationId ? orgById.get(note.organizationId) : undefined;

    if (deal && note.createdAt < deal.createdAt) issues.push(beforeIssue("note", note.id, "createdAt", "deal"));
    if (contact && note.createdAt < contact.createdAt) issues.push(beforeIssue("note", note.id, "createdAt", "contact"));
    if (organization && note.createdAt < organization.createdAt) issues.push(beforeIssue("note", note.id, "createdAt", "organization"));
  }

  for (const email of world.emails) {
    const deal = email.dealId ? dealById.get(email.dealId) : undefined;
    const contact = contactById.get(email.contactId);

    if (deal && email.createdAt < deal.createdAt) issues.push(beforeIssue("email", email.id, "createdAt", "deal"));
    if (contact && email.createdAt < contact.createdAt) issues.push(beforeIssue("email", email.id, "createdAt", "contact"));
  }

  return issues;
}

function missingReference(entityType: string, entity: { id: CanonicalId }, field: string, value: CanonicalId): ValidationIssue {
  return {
    severity: "fatal",
    code: "missing_reference",
    message: `${entityType} ${entity.id} references missing ${field}: ${value}`,
    entityType,
    entityId: entity.id,
    path: field,
  };
}

function validateDateRange(
  issues: ValidationIssue[],
  entityType: string,
  entity: { id: CanonicalId },
  value: string | undefined,
  world: GeneratedWorld,
  path = "createdAt",
): void {
  if (!isWithinRange(value, world.metadata.simulationStart, world.metadata.simulationEnd)) {
    issues.push({
      severity: "fatal",
      code: "date_out_of_simulation_range",
      message: `${entityType} ${entity.id} has ${path} outside the simulation range`,
      entityType,
      entityId: entity.id,
      path,
    });
  }
}

export function validateWorld(world: GeneratedWorld, events: readonly SimulationEvent[] = []): ValidationReport {
  const orgIds = new Set(world.organizations.map((item) => item.id));
  const contactIds = new Set(world.contacts.map((item) => item.id));
  const dealIds = new Set(world.deals.map((item) => item.id));
  const repIds = new Set(world.reps.map((item) => item.id));
  const stageIds = new Set(world.stages.map((item) => item.id));

  const issues: ValidationIssue[] = [
    ...uniqueIds([world.workspace], "workspace"),
    ...uniqueIds([world.pipeline], "pipeline"),
    ...uniqueIds(world.stages, "stage"),
    ...uniqueIds(world.reps, "rep"),
    ...uniqueIds(world.organizations, "organization"),
    ...uniqueIds(world.contacts, "contact"),
    ...uniqueIds(world.leads, "lead"),
    ...uniqueIds(world.deals, "deal"),
    ...uniqueIds(world.activities, "activity"),
    ...uniqueIds(world.notes, "note"),
    ...uniqueIds(world.emails, "email"),
    ...validateContacts(world, orgIds, repIds),
    ...validateLeads(world, orgIds, contactIds, repIds),
    ...validateDeals(world, orgIds, contactIds, repIds, stageIds),
    ...validateActivities(world, dealIds, contactIds, repIds),
    ...validateNotes(world, dealIds, contactIds, orgIds, repIds),
    ...validateEmails(world, dealIds, contactIds, repIds),
    ...validateTemporalConsistency(world),
    ...validateEvents(world, events),
  ];

  const issueCounts = countBySeverity(issues);

  return {
    runId: world.metadata.runId,
    generatedAt: new Date().toISOString(),
    issueCounts,
    hasFatalErrors: issueCounts.fatal > 0,
    issues,
  };
}

export function assertValidForImport(report: ValidationReport): void {
  if (!report.hasFatalErrors) return;

  const summary = report.issues
    .filter((item) => item.severity === "fatal")
    .slice(0, 5)
    .map((item) => `${item.code}: ${item.message}`)
    .join("\n");

  throw new Error(`Validation failed with ${report.issueCounts.fatal} fatal issue(s):\n${summary}`);
}
