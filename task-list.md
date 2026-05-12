# CRM Simulator - Task List
**Created: 2026-05-11**
**Rechecked: 2026-05-11** after extraction into standalone repo

Status legend: `[ ]` To Do | `[~]` In Progress | `[x]` Done | `[-]` Cancelled

## Purpose

Build an internal-first CRM simulation engine that generates realistic, continuous, validated sales data for MorrAI DataHub.

The simulator should create believable CRM worlds with organizations, contacts, leads, deals, activities, notes, buyer sentiment, sales rep behavior, stage movement, messy CRM hygiene, and known analytical truths. It should feed local Prisma data, Pipedrive sandbox accounts, CSV/JSON exports, and eventually MorrAI AI evaluation benchmarks.

The core rule:

> Code owns facts. AI only renders human language.

AI may generate email text, meeting notes, call summaries, and buyer phrasing, but deterministic simulator state owns entity identity, dates, deal value, stage, sentiment score, outcome, owner, and timeline.

---

## Target Outcomes

- Generate demo data that feels like a real sales team's CRM, not random seed rows.
- Make MorrAI dashboards, chat, insights, and reports credible during demos.
- Create repeatable test worlds using deterministic seeds.
- Preserve continuity across each organization's, contact's, lead's, and deal's story.
- Validate data consistency before anything is imported into local DB or Pipedrive.
- Produce "golden truth" files that define what MorrAI should discover.
- Support a living CRM mode that advances an existing simulated world over time.
- Keep the first implementation cheap: CLI-first, local-first, no hosted product.

---

## Non-Goals For V1

- No hosted UI.
- No billing.
- No public SaaS product.
- No automatic customer data ingestion.
- No generic synthetic-data platform.
- No AI-generated canonical CRM facts.
- No support for every CRM in the first pass.

---

## Existing Baseline

- [x] Local seed exists at `prisma/seed.ts`
- [x] Pipedrive sandbox seed exists at `scripts/seed-pipedrive.ts`
- [ ] New simulator should eventually supersede both scripts, but not delete them until parity is proven.
- [ ] New simulator should reuse current Prisma schema and Pipedrive sync expectations.

---

## Proposed File Structure

```txt
src/
  cli.ts
  engine/
    rng.ts
    types.ts
    simulator.ts
    state-machine.ts
    sentiment.ts
    event-ledger.ts
    story-cards.ts
    truth.ts
    validators.ts
  adapters/
    json-adapter.ts
    prisma-adapter.ts
    pipedrive-adapter.ts
    csv-adapter.ts
  renderers/
    templates.ts
    ai-client.ts
    email-renderer.ts
    note-renderer.ts
scenarios/
  healthy-smb-saas.ts
  messy-founder-led-sales.ts
  enterprise-long-cycle.ts
  stale-pipeline-hidden-risk.ts
  post-campaign-lead-spike.ts
  rep-underperformance.ts
docs/
  architecture.md
  decisions.md
```

Generated runs should be written under:

```txt
generated/crm-runs/
  <scenario>-seed-<seed>/
    world.json
    events.json
    truth.json
    validation-report.json
    import-log.json
```

---

## Phase 0 - Design Lock

Goal: define the simulator contract before implementation.

- [x] Use TypeScript scenario files for V1 (documented in `docs/decisions.md`)
- [x] Ignore generated runs under `generated/crm-runs/` by default
- [ ] Define canonical entity types: Workspace, Rep, Organization, Contact, Lead, Deal, Activity, Note, Email, Event
- [ ] Define canonical event types
- [ ] Define stage state machine
- [ ] Define sentiment model
- [ ] Define validation severity levels: fatal, warning, info
- [ ] Define first MVP scenario implementation: `stale-pipeline-hidden-risk`
- [x] Add stub package scripts for future commands

Definition of done:

- [x] A minimal design note exists in `docs/architecture.md` and `docs/decisions.md`
- [ ] The first implementation task has clear input/output contracts

---

## Phase 1 - Deterministic Core Simulator

Goal: generate a complete CRM world without AI.

### 1.1 Seeded Randomness

- [x] Create deterministic RNG helper
- [ ] Support `--seed`
- [x] Support stable random helpers: choice, weightedChoice, intBetween, floatBetween, normal-ish distribution
- [ ] Add smoke test or CLI check proving same seed gives same output

Definition of done:

- [ ] Running the same scenario with the same seed produces identical canonical JSON

### 1.2 Core Types

- [x] Create TypeScript types for generated entities
- [x] Create TypeScript types for generated events
- [x] Create TypeScript types for scenario config
- [x] Create TypeScript types for validation results
- [x] Keep canonical IDs separate from Prisma IDs and Pipedrive IDs

Definition of done:

- [ ] Simulator can represent the full generated world without depending on Prisma

### 1.3 Scenario Loader

V1 uses TypeScript scenario files. YAML can come later if scenario editing becomes a non-developer workflow.

- [ ] Load scenario config from file
- [ ] Validate scenario config with Zod
- [ ] Provide defaults for common fields
- [ ] Fail clearly on invalid config

Definition of done:

- [ ] Invalid scenario config fails before generation starts

### 1.4 Organization Generation

- [ ] Generate organization names
- [ ] Generate industry, region, size, revenue band, growth stage
- [ ] Generate CRM hygiene profile
- [ ] Generate buying style: founder-led, committee, procurement-heavy, champion-led
- [ ] Generate business pains relevant to MorrAI

Definition of done:

- [ ] Organizations have durable story cards with stable traits

### 1.5 Contact Generation

- [ ] Generate contacts per organization
- [ ] Generate role, seniority, influence level, communication style
- [ ] Generate responsiveness and sentiment tendency
- [ ] Assign primary buyer/champion/economic buyer where appropriate
- [ ] Allow some missing emails/phones for CRM messiness

Definition of done:

- [ ] Contacts have plausible roles and relationships to organizations

### 1.6 Sales Rep Generation

- [ ] Generate sales reps
- [ ] Assign territories or segments
- [ ] Model rep behavior: diligent, overloaded, inconsistent, strong closer, weak follow-up
- [ ] Use rep behavior to affect activity cadence, stage movement, and outcomes

Definition of done:

- [ ] Rep-level performance differences emerge from simulation, not hardcoded dashboards

### 1.7 Lead And Deal Generation

- [ ] Generate leads from sources: inbound, outbound, referral, webinar, event, partner, paid campaign
- [ ] Convert a percentage of leads into deals
- [ ] Generate deal value based on org size, need, and scenario
- [ ] Generate expected close dates
- [ ] Assign owner, org, contact, pipeline, and initial stage
- [ ] Generate realistic lost reasons and win conditions

Definition of done:

- [ ] Generated deals have coherent origin, owner, buyer, value, and expected outcome

### 1.8 Event Ledger

- [ ] Create chronological event ledger
- [ ] Generate events day-by-day or event-by-event
- [ ] Support lead created, contact added, deal created, activity completed, activity scheduled, stage changed, email sent, email received, deal won, deal lost
- [ ] Ensure events update canonical entity state

Definition of done:

- [ ] Final entity state can be derived from event history

### 1.9 Stage State Machine

- [ ] Define allowed stage transitions
- [ ] Add scenario-specific stage probabilities
- [ ] Model stalled deals
- [ ] Model revived deals
- [ ] Model closed won/lost outcomes
- [ ] Prevent impossible transitions

Definition of done:

- [ ] Deal timelines follow valid sales flow

### 1.10 Sentiment And Engagement Model

- [ ] Track buyer sentiment from -1 to 1
- [ ] Track engagement from 0 to 100
- [ ] Track urgency from 0 to 100
- [ ] Track friction from 0 to 100
- [ ] Update scores based on events
- [ ] Generate sentiment curve per deal

Definition of done:

- [ ] Emails and notes can be rendered from a stable buyer state

---

## Phase 2 - Validation And Truth Reports

Goal: prevent bad CRM data before it reaches MorrAI or Pipedrive.

### 2.1 Structural Validators

- [ ] No duplicate canonical IDs
- [ ] No missing required references
- [ ] No deal without workspace, org, owner, and contact where required
- [ ] No activities pointing to missing deal/contact/org
- [ ] No leads/deals outside simulation date range

### 2.2 Temporal Validators

- [ ] No activity before linked entity creation
- [ ] No stage change before deal creation
- [ ] No activity after closed won/lost unless explicitly allowed
- [ ] No future dates beyond simulation end
- [ ] `lastActivityDate` matches latest completed activity
- [ ] `nextActivityDate` matches next scheduled activity

### 2.3 Sales Logic Validators

- [ ] No invalid stage transitions
- [ ] No open deal with won/lost timestamp
- [ ] No won/lost deal without close timestamp
- [ ] No impossible expected close date
- [ ] No deal value outside scenario bounds unless allowed
- [ ] No sentiment outside valid range

### 2.4 Data Quality Validators

- [ ] Ensure enough cold deals for scenarios that require cold deals
- [ ] Ensure enough stalled deals for scenarios that require stalled deals
- [ ] Ensure enough won/lost history for win-rate analytics
- [ ] Ensure enough activities for activity analytics
- [ ] Warn when generated data is too clean
- [ ] Warn when generated data is too broken

### 2.5 Truth Report

- [ ] Generate known cold deal IDs
- [ ] Generate known stalled deal IDs
- [ ] Generate top reps by won revenue and open pipeline
- [ ] Generate win rate by time window
- [ ] Generate pipeline value by stage
- [ ] Generate forecast risk summary
- [ ] Generate expected insight candidates
- [ ] Generate benchmark prompt-answer pairs

Definition of done:

- [ ] Every run emits `validation-report.json` and `truth.json`
- [ ] Fatal validation failures block import

---

## Phase 3 - Local Prisma Adapter

Goal: seed the local MorrAI database from canonical generated data.

- [ ] Map canonical Workspace to Prisma Workspace
- [ ] Map canonical reps to ownerName/ownerId fields
- [ ] Map canonical organizations to Prisma Organization
- [ ] Map canonical contacts to Prisma Contact
- [ ] Map canonical leads to Prisma Lead
- [ ] Map canonical deals to Prisma Deal
- [ ] Map canonical activities to Prisma Activity
- [ ] Generate insights from truth report or run existing insights engine after seed
- [ ] Add safe reset option for demo workspace data
- [ ] Add import log with canonical ID to Prisma ID mapping

Definition of done:

- [ ] One command creates a local demo workspace with realistic data
- [ ] Existing dashboard, deals, leads, insights, reports, and chat routes work on generated data

Target command:

```bash
npm run crm:generate -- --scenario stale-pipeline-hidden-risk --seed 42
npm run crm:seed:local -- --run stale-pipeline-hidden-risk-seed-42
```

---

## Phase 4 - Pipedrive Adapter

Goal: push the generated world into a Pipedrive sandbox.

- [ ] Reuse current API-token flow from `scripts/seed-pipedrive.ts`
- [ ] Create or select pipeline
- [ ] Create stages
- [ ] Create organizations
- [ ] Create contacts
- [ ] Create deals
- [ ] Create leads
- [ ] Create activities
- [ ] Preserve canonical ID to Pipedrive ID mapping
- [ ] Handle Pipedrive rate limits
- [ ] Handle partial import failure with resumable import log
- [ ] Add dry-run mode
- [ ] Add sandbox safety confirmation

Definition of done:

- [ ] One command creates a realistic Pipedrive sandbox dataset
- [ ] MorrAI sync can pull the sandbox data back and match expected truth report closely

Target command:

```bash
npm run crm:push:pipedrive -- --run stale-pipeline-hidden-risk-seed-42
```

---

## Phase 5 - AI Text Rendering

Goal: make CRM activity text feel human without letting AI alter facts.

### 5.1 Template Renderer

- [x] Create deterministic fallback templates for emails
- [x] Create deterministic fallback templates for call notes
- [x] Create deterministic fallback templates for meeting notes
- [ ] Create deterministic fallback templates for lost reason notes

Definition of done:

- [x] Simulator works with zero LLM cost

### 5.2 AI Renderer Contract

- [ ] Define strict JSON schema for email output
- [ ] Define strict JSON schema for call note output
- [ ] Define strict JSON schema for meeting note output
- [ ] Pass only allowed facts to AI
- [ ] Pass forbidden facts to AI
- [ ] Require AI to return structured output only

Definition of done:

- [ ] AI output can be validated mechanically

### 5.3 AI Hallucination Guards

- [ ] Reject unapproved entity names
- [ ] Reject unapproved dates
- [ ] Reject unapproved amounts
- [ ] Reject unapproved competitors
- [ ] Reject unsupported stage names
- [ ] Reject invented stakeholders
- [ ] Retry once with validation errors
- [ ] Fall back to deterministic template after repeated failure

Definition of done:

- [ ] AI cannot corrupt canonical CRM state

### 5.4 Sentiment-Aware Copy

- [ ] Render positive buyer emails
- [ ] Render skeptical buyer emails
- [ ] Render ghosting/no-response patterns
- [ ] Render procurement-heavy language
- [ ] Render confused evaluator language
- [ ] Render champion-without-authority language
- [ ] Render executive sponsor language

Definition of done:

- [x] Notes and emails differ by buyer state and scenario

---

## Phase 6 - Living CRM Mode

Goal: advance an existing simulated CRM world over time.

- [ ] Load prior `world.json` and `events.json`
- [ ] Advance simulation by N days
- [ ] Add new leads
- [ ] Add new activities
- [ ] Move some deals forward
- [ ] Let some deals go cold
- [ ] Revive some cold deals
- [ ] Close some won/lost deals
- [ ] Generate new forecast risk
- [ ] Preserve old canonical IDs and story continuity
- [ ] Emit delta import file
- [ ] Support local DB incremental update
- [ ] Support Pipedrive incremental update

Definition of done:

- [ ] A generated CRM can evolve weekly without losing continuity

Target command:

```bash
npm run crm:advance -- --run stale-pipeline-hidden-risk-seed-42 --days 7
```

---

## Phase 7 - Scenario Pack

Goal: create high-value MorrAI demo and QA worlds.

### 7.1 `healthy-smb-saas`

- [ ] Normal-ish sales motion
- [ ] Balanced rep performance
- [ ] Clean enough CRM hygiene
- [ ] Good for baseline demos

### 7.2 `stale-pipeline-hidden-risk`

- [ ] Large open pipeline
- [ ] Many aged deals
- [ ] Low recent activity
- [ ] Risk hidden behind optimistic close dates
- [ ] Good for proactive insight demos

### 7.3 `messy-founder-led-sales`

- [ ] Inconsistent activity logging
- [ ] Missing close dates
- [ ] Duplicate-ish contacts
- [ ] Founder or senior seller owns too much pipeline
- [ ] Good for messy CRM intelligence demos

### 7.4 `enterprise-long-cycle`

- [ ] Longer sales cycles
- [ ] Multiple stakeholders
- [ ] Procurement friction
- [ ] Larger deal values
- [ ] Good for forecast and account-level questions

### 7.5 `post-campaign-lead-spike`

- [ ] Sudden lead volume increase
- [ ] Follow-up SLA problems
- [ ] Lead quality differences by source
- [ ] Good for lead and rep workload analytics

### 7.6 `rep-underperformance`

- [ ] One rep has weak follow-up and lower conversion
- [ ] Another rep has stronger stage progression
- [ ] Good for leaderboard and coaching insights

Definition of done:

- [ ] Each scenario has a clear story, validation requirements, and truth report expectations

---

## Phase 8 - MorrAI Evaluation Pack

Goal: use simulated data to verify MorrAI's intelligence.

- [ ] Generate benchmark questions per scenario
- [ ] Generate expected answers from `truth.json`
- [ ] Add chat benchmark fixtures
- [ ] Add dashboard metric snapshots
- [ ] Add insight engine regression fixtures
- [ ] Add report-generation prompts
- [ ] Compare MorrAI answer against truth report for core metrics
- [ ] Track pass/fail manually first, automate later

Example benchmark questions:

```txt
Which deals are going cold?
Which rep has the highest-risk pipeline?
What changed in win rate this month?
Which deals should I focus on today?
Which lead source is creating the best opportunities?
Where is pipeline value overstated?
```

Definition of done:

- [ ] Simulator creates testable truth, not just plausible data

---

## Phase 9 - Documentation And Extraction Readiness

Goal: make the simulator usable by us first, then optionally public later.

- [ ] Add README for internal usage
- [ ] Document scenarios
- [ ] Document commands
- [ ] Document validation failures
- [ ] Document Pipedrive sandbox setup
- [ ] Document cost controls for AI text generation
- [ ] Add examples of generated output
- [ ] Keep public extraction path in mind, but do not optimize for it yet

Definition of done:

- [ ] A new developer can generate local and Pipedrive demo data from docs alone

---

## Package Scripts Stubbed

```json
{
  "crm:generate": "tsx src/cli.ts generate",
  "crm:validate": "tsx src/cli.ts validate",
  "crm:seed:local": "tsx src/cli.ts seed-local",
  "crm:push:pipedrive": "tsx src/cli.ts push-pipedrive",
  "crm:advance": "tsx src/cli.ts advance"
}
```

---

## MVP Build Slice

This is the smallest useful version we should build first.

- [x] Create standalone repo structure
- [x] Implement deterministic RNG
- [x] Implement core types
- [x] Implement one scenario config placeholder: `stale-pipeline-hidden-risk`
- [x] Generate reps, organizations, contacts, leads, deals, and activities
- [x] Generate event ledger
- [x] Generate sentiment and engagement state
- [x] Generate `world.json`
- [x] Generate `events.json`
- [x] Generate `truth.json`
- [x] Generate `validation-report.json`
- [ ] Add local Prisma adapter
- [x] Add package scripts
- [ ] Run local seed
- [ ] Verify dashboard and chat against generated data

MVP acceptance criteria:

- [x] 80+ organizations
- [x] 150+ contacts
- [x] 200+ leads/deals combined
- [x] 700+ activities
- [x] 5+ reps with visibly different behavior
- [x] At least 10 cold deals
- [x] At least 8 stalled deals
- [x] At least 30 closed won/lost deals
- [x] Validation report has zero fatal errors
- [x] Truth report lists expected cold deals, stalled deals, top reps, win rates, and pipeline value by stage
- [ ] MorrAI dashboard looks credible
- [ ] MorrAI chat can answer at least five truth-backed questions

---

## Immediate Next Tasks

### Task A - Scaffold Simulator Skeleton

- [x] Create folders under `src/`, `scenarios/`, and `docs/`
- [x] Add `src/cli.ts`
- [x] Add `engine/rng.ts`
- [x] Add `engine/types.ts`
- [x] Add `engine/validators.ts`
- [x] Add `adapters/json-adapter.ts`
- [x] Add first scenario placeholder
- [x] Add package scripts
- [x] Run `npm install` in the standalone repo

### Task B - Implement Deterministic World Generation

- [x] Generate reps
- [x] Generate organizations
- [x] Generate contacts
- [x] Generate leads
- [x] Generate deals
- [x] Generate activities
- [x] Emit `world.json`

### Task C - Add Event Ledger And State Machine

- [ ] Generate chronological events
- [ ] Apply events to deal state
- [ ] Validate stage transitions
- [ ] Derive final fields from events

### Task D - Add Validation And Truth Report

- [x] Implement fatal validators
- [ ] Implement warnings
- [x] Emit validation report
- [x] Emit truth report

### Task E - Seed Local Prisma

- [ ] Map generated world to Prisma
- [ ] Reset demo workspace safely
- [ ] Import generated data
- [ ] Run existing app against seeded data

---

## Open Questions

- [x] Scenario configs use TypeScript for V1; YAML can be added later if needed.
- [x] Generated run files are ignored by default; curated fixtures can be committed later.
- [x] AI-rendered emails should be a second optional enrichment step, with deterministic templates as fallback.
- [ ] Should Pipedrive sandbox seeding include destructive cleanup, or only additive/resumable import? V1 should start with dry-run/additive behavior.
- [ ] Should living CRM mode be driven by CLI only, or also by a local cron/dev helper later?
- [ ] Should truth reports become automated benchmark tests in `benchmarks/`?





