# Decisions

## 2026-05-11 - Standalone Repo

CRM Simulator lives in its own repo instead of inside MorrAI DataHub. This keeps the simulator independent, easier to open-source later, and safer to evolve without adding tool-specific complexity to the SaaS app.

## 2026-05-11 - TypeScript Scenario Files For V1

Use TypeScript scenario files first. YAML is easier for non-technical editing, but TypeScript avoids adding another parser and gives us type safety while the domain model is still changing.

YAML can be added later if scenario authoring becomes a non-developer workflow.

## 2026-05-11 - Generated Runs Ignored By Default

Generated CRM runs can become large and may include AI-rendered text. They should be gitignored by default. Curated fixtures can be committed later under a dedicated fixtures directory.

## 2026-05-11 - AI Rendering Is Optional

V1 must work without LLM calls. Deterministic templates are required. AI rendering is an enrichment pass, not a dependency for valid CRM data.

## 2026-05-11 - Canonical JSON Before CRM Writes

Every run emits canonical JSON before any local DB or Pipedrive writes. This makes runs reproducible, inspectable, and benchmarkable.

## 2026-05-11 - Pipedrive Adapter Comes After Local Reliability

The first working path is JSON generation and local Prisma seeding. Pipedrive sandbox seeding should come after validators, truth reports, and local data quality are strong enough.
