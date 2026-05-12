# AGENTS.md - CRM Simulator

## Project Purpose

CRM Simulator generates realistic, continuous, validated sales CRM data for MorrAI DataHub and future sales-tech demos, QA, and AI evaluation.

This is a standalone repo. Do not assume MorrAI DataHub source files are available here unless explicitly copied or referenced.

## Core Rule

Code owns facts. AI only renders human language.

Deterministic code owns:

- entity identity
- organization/contact/deal relationships
- dates and timelines
- stages and status
- deal value and currency
- owner assignment
- sentiment and engagement state
- win/loss outcomes
- validation and truth reports

AI may only render:

- email copy
- call notes
- meeting summaries
- buyer objections in natural language
- CRM note phrasing

AI-rendered content must be structured, validated, and rejected or regenerated if it invents unsupported facts.

## Planned Stack

- TypeScript
- Node.js CLI
- Zod for config/output validation
- deterministic seeded RNG
- JSON canonical run artifacts
- optional CRM adapters for Prisma, Pipedrive, and CSV

## Planned Structure

```txt
src/
  cli.ts
  engine/
  adapters/
  renderers/
scenarios/
docs/
task-list.md
```

## Development Guidelines

- Keep the simulator independent from MorrAI DataHub internals.
- Model sales motion through events and state transitions, not random final rows.
- Always generate canonical JSON before pushing to any external system.
- Fatal validation failures must block imports.
- Generated CRM runs should be ignored by git unless intentionally promoted to fixtures.
- Pipedrive writes must default to sandbox-safe behavior with dry-run support.
- Do not store API tokens or customer CRM data in the repo.
