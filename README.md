# CRM Simulator

CRM Simulator is a standalone TypeScript CLI project for generating realistic, continuous, validated CRM data for sales-intelligence products.

It was created for MorrAI DataHub, but it intentionally lives outside the DataHub app so the simulator can evolve as its own tool without coupling itself to one SaaS codebase.

## Core Principle

Code owns facts. AI only renders human language.

The simulator should deterministically generate organizations, contacts, leads, deals, activities, dates, stages, values, outcomes, sentiment state, and truth reports. Optional AI rendering may create email bodies, call notes, meeting summaries, and buyer phrasing, but AI output must never mutate canonical CRM state.

## First Goal

Generate a realistic local demo CRM with:

- 80+ organizations
- 150+ contacts
- 200+ leads/deals
- 700+ activities
- rep-level behavior differences
- cold and stalled deals
- won/lost history
- validation reports
- golden truth reports for AI evaluation

## Planned Commands

```bash
npm run crm:generate -- --scenario stale-pipeline-hidden-risk --seed 42
npm run crm:validate -- --run stale-pipeline-hidden-risk-seed-42
npm run crm:seed:local -- --run stale-pipeline-hidden-risk-seed-42
npm run crm:push:pipedrive -- --run stale-pipeline-hidden-risk-seed-42
npm run crm:advance -- --run stale-pipeline-hidden-risk-seed-42 --days 7
```

These commands are planned, not implemented yet.

## Docs

- `task-list.md` - full scoped backlog and build plan
- `docs/architecture.md` - simulator architecture and data flow
- docs/decisions.md - early project decisions
- docs/morrai-datahub-context.md - DataHub schema and integration context

## Relationship To MorrAI DataHub

MorrAI DataHub should consume generated data through adapters:

- local Prisma adapter
- Pipedrive sandbox adapter
- CSV/JSON exports

The canonical generated world should remain CRM Simulator's responsibility.

