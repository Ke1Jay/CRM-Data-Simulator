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

    if (lead.status === "CONVERTED" && !lead.story.conversionRationale) {
      issues.push({
        severity: "warning",
        code: "converted_lead_missing_rationale",
        message: `Converted lead ${lead.id} is missing a conversion rationale`,
        entityType: "lead",
        entityId: lead.id,
        path: "story.conversionRationale",
      });
    }

    if (lead.status === "UNQUALIFIED" && !lead.story.disqualificationReason) {
      issues.push({
        severity: "warning",
        code: "unqualified_lead_missing_reason",
        message: `Unqualified lead ${lead.id} is missing a disqualification reason`,
        entityType: "lead",
        entityId: lead.id,
        path: "story.disqualificationReason",
      });
    }
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
  const contactById = new Map(world.contacts.map((contact) => [contact.id, contact]));

  for (const email of world.emails) {
    if (email.dealId && !dealIds.has(email.dealId)) issues.push(missingReference("email", email, "dealId", email.dealId));
    if (!contactIds.has(email.contactId)) issues.push(missingReference("email", email, "contactId", email.contactId));
    if (!repIds.has(email.ownerId)) issues.push(missingReference("email", email, "ownerId", email.ownerId));
    if (contactById.get(email.contactId) && !contactById.get(email.contactId)?.email) {
      issues.push({
        severity: "fatal",
        code: "email_contact_missing_address",
        message: `Email ${email.id} is linked to contact ${email.contactId}, but that contact has no email address`,
        entityType: "email",
        entityId: email.id,
        path: "contactId",
      });
    }

    validateDateRange(issues, "email", email, email.createdAt, world);
    validateDateRange(issues, "email", email, email.updatedAt, world, "updatedAt");
  }

  return issues;
}

function validateScenarioPremise(world: GeneratedWorld): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const scenarioId = world.metadata.scenarioId;

  if (scenarioId === "ghosted-high-value-opportunity") {
    // Premise: at least one HIGH-VALUE OPEN deal that has gone quiet (stale lastActivityDate)
    // with at least one ghosting_nudge activity AND an expectedCloseDate that is still set.
    const highValueOpenDeals = world.deals.filter(
      (d) => d.status === "OPEN" && (d.value ?? 0) >= 100_000,
    );
    if (highValueOpenDeals.length === 0) {
      issues.push({
        severity: "fatal",
        code: "ghosted_premise_no_high_value_open_deal",
        message: `Scenario ${scenarioId} requires at least one OPEN deal with value >= 100,000, but none was found`,
        entityType: "scenario",
      });
    }

    // Of those, at least one must be ghosted: stale last activity AND at least one ghosting_nudge activity.
    const simulationEnd = world.metadata.simulationEnd;
    const DAY_MS = 86_400_000;
    const ghostedCutoff = new Date(new Date(simulationEnd).getTime() - 30 * DAY_MS).toISOString();
    let satisfied = false;
    for (const deal of highValueOpenDeals) {
      const lastTouch = deal.lastActivityDate ?? deal.createdAt;
      if (lastTouch > ghostedCutoff) continue; // not stale enough
      const dealActivities = world.activities.filter((a) => a.dealId === deal.id);
      const hasGhostingNudge = dealActivities.some((a) => a.moment === "ghosting_nudge");
      const hasOptimisticCloseDate = Boolean(deal.expectedCloseDate);
      if (hasGhostingNudge && hasOptimisticCloseDate) {
        satisfied = true;
        break;
      }
    }
    if (!satisfied && highValueOpenDeals.length > 0) {
      issues.push({
        severity: "fatal",
        code: "ghosted_premise_no_ghosted_deal",
        message: `Scenario ${scenarioId} requires a high-value OPEN deal with stale lastActivityDate (>30d before sim end), at least one ghosting_nudge activity, and an expectedCloseDate set - but none was found`,
        entityType: "scenario",
      });
    }
  }

  if (scenarioId === "committee-security-delay") {
    // Premise: at least one OPEN deal in a committee-style org with BOTH
    // security_review AND finance_review activities, and friction >= 55 (stalled).
    const committeeOrgs = world.organizations.filter((org) => org.story.buyingStyle === "committee");
    if (committeeOrgs.length === 0) {
      issues.push({
        severity: "fatal",
        code: "committee_premise_no_committee_org",
        message: `Scenario ${scenarioId} requires at least one organization with buyingStyle="committee", but none was found`,
        entityType: "scenario",
      });
    }

    const committeeOrgIds = new Set(committeeOrgs.map((o) => o.id));
    const candidateDeals = world.deals.filter((d) => committeeOrgIds.has(d.organizationId) && d.status === "OPEN");
    const stalledCommitteeDeals = candidateDeals.filter((d) => d.buyerState.friction >= 55);
    if (stalledCommitteeDeals.length === 0 && committeeOrgs.length > 0) {
      issues.push({
        severity: "fatal",
        code: "committee_premise_no_stalled_open_deal",
        message: `Scenario ${scenarioId} requires at least one OPEN deal in a committee org with friction>=55, but none was found`,
        entityType: "scenario",
      });
    }

    // Of the stalled committee deals, at least one must have BOTH security_review and finance_review activities.
    let satisfied = false;
    for (const deal of stalledCommitteeDeals) {
      const dealActivities = world.activities.filter((a) => a.dealId === deal.id);
      const hasSecurity = dealActivities.some((a) => a.moment === "security_review");
      const hasFinance = dealActivities.some((a) => a.moment === "finance_review");
      if (hasSecurity && hasFinance) {
        satisfied = true;
        break;
      }
    }
    if (!satisfied && stalledCommitteeDeals.length > 0) {
      issues.push({
        severity: "fatal",
        code: "committee_premise_missing_activities",
        message: `Scenario ${scenarioId} requires a stalled committee deal with BOTH security_review and finance_review activities, but no such deal was found`,
        entityType: "scenario",
      });
    }
  }

  if (scenarioId === "messy-crm-hygiene-account") {
    // Premise: this scenario must visibly show CRM hygiene problems. We assert four
    // structural patterns so the premise is enforced regardless of seed drift:
    //   (a) at least one organization with crmHygiene = "messy"
    //   (b) at least one pair of contacts in the messy org that share a first name
    //       (the duplicate-like pattern)
    //   (c) >= 25% of deals have no expectedCloseDate
    //   (d) >= 3 notes with a vague short body (length < 30 chars)
    const messyOrgs = world.organizations.filter((org) => org.story.crmHygiene === "messy");
    if (messyOrgs.length === 0) {
      issues.push({
        severity: "fatal",
        code: "messy_premise_no_messy_org",
        message: `Scenario ${scenarioId} requires at least one organization with crmHygiene="messy", but none was found`,
        entityType: "scenario",
      });
    }

    // (b) duplicate-like first-name pattern in at least one messy org.
    let foundDuplicateFirstNamePair = false;
    for (const org of messyOrgs) {
      const orgContacts = world.contacts.filter((c) => c.organizationId === org.id);
      const firstNameCounts = new Map<string, number>();
      for (const contact of orgContacts) {
        const firstName = contact.name.split(/\s+/)[0]?.replace(/\.$/, "").toLowerCase();
        if (!firstName) continue;
        firstNameCounts.set(firstName, (firstNameCounts.get(firstName) ?? 0) + 1);
      }
      for (const count of firstNameCounts.values()) {
        if (count >= 2) {
          foundDuplicateFirstNamePair = true;
          break;
        }
      }
      if (foundDuplicateFirstNamePair) break;
    }
    if (messyOrgs.length > 0 && !foundDuplicateFirstNamePair) {
      issues.push({
        severity: "fatal",
        code: "messy_premise_no_duplicate_like_contacts",
        message: `Scenario ${scenarioId} requires at least one messy organization with two or more contacts sharing a first name, but none was found`,
        entityType: "scenario",
      });
    }

    // (c) missing-close-date rate >= 25% of all deals.
    const dealsWithoutClose = world.deals.filter((d) => !d.expectedCloseDate);
    const missingRate = world.deals.length > 0 ? dealsWithoutClose.length / world.deals.length : 0;
    if (missingRate < 0.25) {
      issues.push({
        severity: "fatal",
        code: "messy_premise_missing_close_dates_too_low",
        message: `Scenario ${scenarioId} requires >= 25% of deals to have no expectedCloseDate, but only ${(missingRate * 100).toFixed(1)}% do`,
        entityType: "scenario",
      });
    }

    // (d) >= 3 vague short notes (length < 30 chars).
    const shortNotes = world.notes.filter((n) => n.body.length < 30);
    if (shortNotes.length < 3) {
      issues.push({
        severity: "fatal",
        code: "messy_premise_too_few_vague_notes",
        message: `Scenario ${scenarioId} requires at least 3 short/vague notes (body length < 30 chars), but only ${shortNotes.length} were found`,
        entityType: "scenario",
      });
    }
  }

  if (scenarioId === "stale-pipeline-hidden-risk") {
    // Premise: the pipeline LOOKS healthy at a glance, but a meaningful chunk of high-value
    // deals are quietly cold. The scenario name says "hidden risk in the pile". We assert
    // three structural patterns:
    //   (a) >= 3 cold deals with value >= 100,000 EUR (the hidden high-value risk)
    //   (b) >= 1 cold deal in a late stage (Negotiation or Closing) - late-funnel cold
    //       deals are what make the forecast misleading
    //   (c) >= 20% of total open-pipeline EUR is concentrated in cold deals - the forecast
    //       looks bigger than it really is
    // Cold designation: OPEN deal whose lastActivityDate (or createdAt fallback) is more
    // than 30 days before simulation end. This mirrors the truth.coldDealIds computation
    // in the simulator so validators stay self-contained.
    const DAY_MS = 86_400_000;
    const coldCutoff = new Date(new Date(world.metadata.simulationEnd).getTime() - 30 * DAY_MS).toISOString();
    const coldDeals = world.deals.filter(
      (d) => d.status === "OPEN" && (d.lastActivityDate ?? d.createdAt) <= coldCutoff,
    );
    const coldDealIds = new Set(coldDeals.map((d) => d.id));
    const stageOrderById = new Map(world.stages.map((s) => [s.id, s.order]));

    // (a) high-value cold deals
    const highValueColdDeals = coldDeals.filter((d) => (d.value ?? 0) >= 100_000);
    if (highValueColdDeals.length < 3) {
      issues.push({
        severity: "fatal",
        code: "stale_premise_too_few_high_value_cold",
        message: `Scenario ${scenarioId} requires >= 3 cold deals with value >= 100,000 EUR, but only ${highValueColdDeals.length} were found`,
        entityType: "scenario",
      });
    }

    // (b) late-stage cold deal (order >= 3 = Negotiation or Closing)
    const lateStageColdDeals = coldDeals.filter((d) => (stageOrderById.get(d.stageId) ?? 0) >= 3);
    if (lateStageColdDeals.length < 1) {
      issues.push({
        severity: "fatal",
        code: "stale_premise_no_late_stage_cold_deal",
        message: `Scenario ${scenarioId} requires at least one cold deal in a late stage (Negotiation or Closing), but none was found`,
        entityType: "scenario",
      });
    }

    // (c) >= 20% of open-pipeline EUR concentrated in cold deals
    const openDeals = world.deals.filter((d) => d.status === "OPEN");
    const openPipelineValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
    const coldOpenValue = openDeals
      .filter((d) => coldDealIds.has(d.id))
      .reduce((sum, d) => sum + (d.value ?? 0), 0);
    const coldShare = openPipelineValue > 0 ? coldOpenValue / openPipelineValue : 0;
    if (coldShare < 0.2) {
      issues.push({
        severity: "fatal",
        code: "stale_premise_cold_pipeline_share_too_low",
        message: `Scenario ${scenarioId} requires >= 20% of open-pipeline EUR to be in cold deals, but only ${(coldShare * 100).toFixed(1)}% is (cold open value: ${coldOpenValue} of ${openPipelineValue})`,
        entityType: "scenario",
      });
    }
  }

  if (scenarioId === "expansion-after-won-pilot") {
    // Premise: at least one organization must have BOTH a WON deal AND an OPEN deal
    // (the expansion deal lives in the same account as the won pilot).
    const statusesByOrg = new Map<string, Set<string>>();
    for (const deal of world.deals) {
      if (!statusesByOrg.has(deal.organizationId)) statusesByOrg.set(deal.organizationId, new Set());
      statusesByOrg.get(deal.organizationId)!.add(deal.status);
    }
    const orgsWithWonAndOpen = [...statusesByOrg.entries()].filter(([_, s]) => s.has("WON") && s.has("OPEN"));
    if (orgsWithWonAndOpen.length === 0) {
      issues.push({
        severity: "fatal",
        code: "expansion_premise_unsatisfied",
        message: `Scenario ${scenarioId} requires at least one organization with both a WON deal AND an OPEN deal, but none was found`,
        entityType: "scenario",
      });
    }

    // Stronger check: the expansion deal (OPEN) value should be larger than the pilot (WON)
    // to reflect "expansion after won pilot" semantics, when both live in the same org.
    for (const [orgId, _] of orgsWithWonAndOpen) {
      const orgDeals = world.deals.filter((d) => d.organizationId === orgId);
      const wonDeal = orgDeals.find((d) => d.status === "WON");
      const openDeal = orgDeals.find((d) => d.status === "OPEN");
      if (wonDeal && openDeal && wonDeal.value && openDeal.value && openDeal.value <= wonDeal.value) {
        issues.push({
          severity: "warning",
          code: "expansion_not_larger_than_pilot",
          message: `Org ${orgId}: expansion deal ${openDeal.id} (${openDeal.value}) is not larger than pilot ${wonDeal.id} (${wonDeal.value}) - expected expansion to be a bigger opportunity`,
          entityType: "deal",
          entityId: openDeal.id,
          path: "value",
        });
      }
    }
  }

  return issues;
}

function validatePlausibility(world: GeneratedWorld, events: readonly SimulationEvent[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const leadById = new Map(world.leads.map((lead) => [lead.id, lead]));
  const stageById = new Map(world.stages.map((stage) => [stage.id, stage]));
  const dealEvents = events.filter((event) => event.entityType === "deal");
  const emailBodyCounts = new Map<string, number>();

  for (const email of world.emails) {
    emailBodyCounts.set(email.body, (emailBodyCounts.get(email.body) ?? 0) + 1);
  }

  for (const [body, count] of emailBodyCounts) {
    const repeatedBodyWarningThreshold = world.deals.length <= 5 ? 3 : world.deals.length <= 10 ? 4 : Number.POSITIVE_INFINITY;
    if (count >= repeatedBodyWarningThreshold) {
      issues.push({
        severity: "warning",
        code: "repeated_email_body",
        message: `The same email body appears ${count} times: ${body.slice(0, 90)}...`,
        entityType: "email",
        path: "body",
      });
    }
  }

  for (const deal of world.deals) {
    const sourceLead = deal.sourceLeadId ? leadById.get(deal.sourceLeadId) : undefined;
    const valueDelta = sourceLead?.value && deal.value ? Math.abs(deal.value - sourceLead.value) : 0;

    if (valueDelta >= 10_000 && !deal.story.valueExpansionReason) {
      issues.push({
        severity: "warning",
        code: "deal_value_change_missing_reason",
        message: `Deal ${deal.id} value differs from source lead ${sourceLead?.id} by ${valueDelta}, but no valueExpansionReason was recorded`,
        entityType: "deal",
        entityId: deal.id,
        path: "story.valueExpansionReason",
      });
    }

    const finalStage = stageById.get(deal.stageId);
    const createdEvent = dealEvents.find((event) => event.entityId === deal.id && event.type === "deal.created");
    const createdStageId = createdEvent?.data.stageId;
    const createdStage = typeof createdStageId === "string" ? stageById.get(createdStageId) : undefined;
    const stageChangeEvents = dealEvents.filter((event) => event.entityId === deal.id && event.type === "deal.stage_changed");

    if (finalStage && finalStage.order > 0 && createdStage?.id === finalStage.id) {
      issues.push({
        severity: "warning",
        code: "deal_created_at_final_stage",
        message: `Deal ${deal.id} was created directly in final stage ${finalStage.name}`,
        entityType: "deal",
        entityId: deal.id,
        path: "events.deal.created.data.stageId",
      });
    }

    if (finalStage && finalStage.order > 1 && stageChangeEvents.length < finalStage.order) {
      issues.push({
        severity: "warning",
        code: "deal_missing_stage_progression",
        message: `Deal ${deal.id} is in ${finalStage.name}, but only has ${stageChangeEvents.length} stage progression event(s)`,
        entityType: "deal",
        entityId: deal.id,
        path: "events",
      });
    }

    if (deal.status === "WON" && deal.buyerState.friction > 50) {
      issues.push({
        severity: "warning",
        code: "won_deal_high_final_friction",
        message: `Won deal ${deal.id} ended with high friction (${deal.buyerState.friction}/100)`,
        entityType: "deal",
        entityId: deal.id,
        path: "buyerState.friction",
      });
    }
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
    ...validatePlausibility(world, events),
    ...validateScenarioPremise(world),
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
