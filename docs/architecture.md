# Architecture

## Data Flow

```txt
scenario config
  -> deterministic simulator
  -> event ledger
  -> canonical world state
  -> validators
  -> truth report
  -> adapters
  -> local Prisma / Pipedrive sandbox / CSV / JSON
```

## Canonical State

The simulator produces canonical JSON first. External systems are destinations, not sources of truth.

Canonical run files should include:

```txt
world.json
entities.json
events.json
truth.json
validation-report.json
import-log.json
```

## Simulation Model

The simulator should create durable story cards for:

- organizations
- contacts
- leads
- deals
- reps

Events update story state over time. Examples:

- lead created
- contact added
- deal created
- activity scheduled
- activity completed
- email sent
- email received
- stage changed
- deal won
- deal lost

Final CRM records should be derivable from the event ledger.

## Sentiment Model

Buyer state should be numeric and deterministic:

- sentiment: -1 to 1
- engagement: 0 to 100
- urgency: 0 to 100
- friction: 0 to 100

Text renderers use this state to produce different tones, but they do not decide the state.

## Hallucination Control

AI rendering is optional and downstream. It receives allowed facts and forbidden facts, returns strict JSON, and passes validators before being saved.

Validation should reject:

- unknown entity names
- invented stakeholders
- unsupported dates
- unsupported amounts
- unsupported competitors
- invalid stages
- text contradicting canonical state

If AI output fails validation, retry once with validation errors. If it fails again, use deterministic templates.

## Adapter Rule

Adapters translate canonical state into destination-specific records. They should preserve ID mappings and write import logs.

The first adapter should be local JSON. The second should be local Prisma. Pipedrive comes after validation and local seeding are reliable.
