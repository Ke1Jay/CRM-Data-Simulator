# MorrAI DataHub Context

This note captures the DataHub-specific knowledge the simulator needs while remaining a standalone project.

## Product Context

MorrAI DataHub is an AI-powered sales analytics and work hub for SME sales teams. It connects to Pipedrive, syncs CRM data, and provides dashboards, conversational analytics, proactive insights, and saved reports.

The simulator's job is to create CRM data that makes those experiences feel connected to a real sales organization.

## DataHub Entities To Feed

The local DataHub Prisma schema expects these synced CRM entities:

- Workspace
- Pipeline
- Stage
- Organization
- Contact
- Lead
- Deal
- Activity
- Insight

Reports and conversations are app-native and do not need to be generated in V1, except later benchmark fixtures may create conversations or saved reports.

## Required Deal Fields

Generated deals should map cleanly to:

- `pipedriveId`
- `title`
- `value`
- `currency`
- `stageId`
- `pipelineId`
- `status`: OPEN, WON, LOST, DELETED
- `ownerName`
- `ownerId`
- `contactId`
- `organizationId`
- `expectedCloseDate`
- `wonTime`
- `lostTime`
- `lostReason`
- `lastActivityDate`
- `nextActivityDate`
- `activitiesCount`
- `customFields`
- `addTime`
- `updateTime`

## Required Lead Fields

Generated leads should map cleanly to:

- `pipedriveId`
- `title`
- `value`
- `currency`
- `ownerName`
- `ownerId`
- `contactId`
- `organizationId`
- `status`: NEW, QUALIFIED, UNQUALIFIED, CONVERTED
- `source`
- `label`
- `expectedCloseDate`
- `lastActivityDate`
- `nextActivityDate`
- `addTime`
- `updateTime`

## Required Activity Fields

Generated activities should map cleanly to:

- `pipedriveId`
- `type`: call, email, meeting, task, deadline, etc.
- `subject`
- `done`
- `dueDate`
- `dueTime`
- `duration`
- `dealId`
- `contactId`
- `ownerName`
- `ownerId`
- `markedAsDoneTime`
- `addTime`
- `updateTime`

## DataHub Insights To Support

The simulator should intentionally create truth for these insight types:

- DEAL_COLD
- PIPELINE_DIGEST
- WIN_RATE_SHIFT
- ACTIVITY_GAP
- STALLED_DEAL

Truth reports should identify the exact generated records that should trigger each insight.

## Chat And Analytics Questions To Support

Generated truth should support questions like:

- Which deals are going cold?
- Which deals are stalled?
- Which rep has the highest-risk pipeline?
- Which rep has the strongest won revenue?
- What changed in win rate this month?
- Which lead source is producing the best opportunities?
- Which forecast is overstated by stale activity?
- Which accounts need attention today?

## Current DataHub Seed Baseline

DataHub currently has two simple seed paths:

- local Prisma seed: `prisma/seed.ts`
- Pipedrive sandbox seed: `scripts/seed-pipedrive.ts`

CRM Simulator should supersede these over time, but not require deleting or modifying them until parity is proven.

## Adapter Expectations

The simulator should produce canonical JSON first, then adapters should write to:

- local DataHub Prisma DB
- Pipedrive sandbox API
- CSV files
- raw JSON fixtures

Canonical IDs must stay separate from Prisma IDs and Pipedrive IDs. Import logs should preserve the mapping.
