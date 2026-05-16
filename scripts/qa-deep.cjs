#!/usr/bin/env node
// Deep-dive QA: sentiment arcs, backwards moments, sample narratives, time-of-day spread.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RUNS = path.join(ROOT, "generated", "crm-runs");

const targets = [
  ["single-organization-deal-lab-seed-42", "deal_003"], // the cold/stalled focus deal
  ["expansion-after-won-pilot-seed-42", "deal_001"], // the pilot
  ["expansion-after-won-pilot-seed-42", "deal_002"], // the expansion
  ["committee-security-delay-seed-42", "deal_001"], // the committee deal
  ["ghosted-high-value-opportunity-seed-42", "deal_001"], // the ghosted deal
  ["messy-crm-hygiene-account-seed-42", "deal_001"], // the messy anchor deal
];

function loadWorld(name) {
  return JSON.parse(fs.readFileSync(path.join(RUNS, name, "world.json"), "utf8"));
}

function inspectDeal(w, dealId, scenarioName) {
  const deal = w.deals.find((d) => d.id === dealId);
  if (!deal) return console.log(`SKIP: ${dealId} not in ${scenarioName}`);
  const contact = w.contacts.find((c) => c.id === deal.contactId);
  const org = w.organizations.find((o) => o.id === deal.organizationId);
  const stage = w.stages.find((s) => s.id === deal.stageId);
  const activities = w.activities.filter((a) => a.dealId === dealId).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const notes = w.notes.filter((n) => n.dealId === dealId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const emails = w.emails.filter((e) => e.dealId === dealId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  console.log("=".repeat(78));
  console.log(`[${scenarioName}] ${dealId}: ${deal.title}`);
  console.log("=".repeat(78));
  console.log(`Status: ${deal.status} | Value: ${deal.value} | Stage: ${stage.name} | Friction: ${deal.buyerState.friction}/100`);
  console.log(`Contact: ${contact.name} (${contact.role}) | Org: ${org.name} (${org.story.crmHygiene}, ${org.story.buyingStyle})`);
  console.log(`Created: ${deal.createdAt.slice(0, 10)} | Last activity: ${deal.lastActivityDate?.slice(0, 10) ?? "—"} | Expected close: ${deal.expectedCloseDate?.slice(0, 10) ?? "NOT SET"}`);
  if (deal.wonTime) console.log(`WON at: ${deal.wonTime.slice(0, 10)}`);
  if (deal.lostTime) console.log(`LOST at: ${deal.lostTime.slice(0, 10)} (${deal.lostReason})`);
  console.log();
  console.log("Story.need:", deal.story.need);
  console.log("Story.urgencyReason:", deal.story.urgencyReason);
  console.log("Story.winCondition:", deal.story.winCondition);
  console.log("Story.knownObjections:", deal.story.knownObjections.join("; "));
  console.log("Story.riskFactors:", deal.story.riskFactors.join("; "));
  if (deal.story.valueExpansionReason) console.log("Story.valueExpansionReason:", deal.story.valueExpansionReason);
  console.log();
  console.log("Sentiment arc (" + (deal.story.sentimentArc?.length ?? 0) + " entries):");
  for (const e of (deal.story.sentimentArc ?? []).slice(0, 10)) {
    console.log(`  ${e.at?.slice(0, 10) ?? "?"} sent=${e.sentiment?.toFixed?.(2)} eng=${e.engagement} urg=${e.urgency} fric=${e.friction}  ${e.trigger?.slice(0, 100) ?? ""}`);
  }
  console.log();
  console.log(`Activities (${activities.length}):`);
  for (const a of activities) {
    console.log(`  ${a.dueDate.slice(0, 10)} ${a.dueTime ?? "—:—"} [${a.type}] ${a.moment ?? "—"} done=${a.done ? "Y" : "—"}  ${a.subject}`);
  }
  console.log();
  console.log(`Notes (${notes.length}):`);
  for (const n of notes.slice(0, 6)) {
    console.log(`  ${n.createdAt.slice(0, 10)}: ${n.body}`);
  }
  if (notes.length > 6) console.log(`  ... (${notes.length - 6} more)`);
  console.log();
  console.log(`Emails (${emails.length} = ${emails.filter((e) => e.direction === "outbound").length} out / ${emails.filter((e) => e.direction === "inbound").length} in):`);
  for (const e of emails.slice(0, 6)) {
    console.log(`  ${e.createdAt.slice(0, 16)} [${e.direction}] "${e.subject}" (sentiment: ${e.sentiment})`);
    console.log(`     ${e.body.slice(0, 160)}${e.body.length > 160 ? "..." : ""}`);
  }
  if (emails.length > 6) console.log(`  ... (${emails.length - 6} more)`);
  console.log();
}

for (const [scenario, dealId] of targets) {
  const w = loadWorld(scenario);
  inspectDeal(w, dealId, scenario);
}

// Backwards moments analysis (which scenarios have them, what's the pattern)
console.log();
console.log("=".repeat(78));
console.log("BACKWARDS MOMENTS — drill-in");
console.log("=".repeat(78));
const phaseOrder = {
  discovery: 0,
  process_mapping: 1,
  data_quality_review: 2,
  pilot_scope: 3,
  finance_review: 3,
  security_review: 3,
  pilot_success: 4,
  close_confirmation: 5,
  loss_review: 5,
  ghosting_nudge: 6,
};

const scenariosToScan = [
  "expansion-after-won-pilot-seed-42",
  "committee-security-delay-seed-42",
  "messy-crm-hygiene-account-seed-42",
];

for (const scenario of scenariosToScan) {
  const w = loadWorld(scenario);
  console.log(`\n[${scenario}]`);
  const byDeal = new Map();
  for (const a of w.activities) {
    if (!a.dealId) continue;
    if (!byDeal.has(a.dealId)) byDeal.set(a.dealId, []);
    byDeal.get(a.dealId).push(a);
  }
  let count = 0;
  for (const [dealId, acts] of byDeal) {
    acts.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    let maxPhase = -1;
    let backJumpAt = null;
    for (const a of acts) {
      const phase = phaseOrder[a.moment] ?? -1;
      if (phase < 0) continue;
      if (phase < maxPhase - 1) {
        backJumpAt = a;
        break;
      }
      maxPhase = Math.max(maxPhase, phase);
    }
    if (backJumpAt) {
      count++;
      if (count <= 3) {
        const deal = w.deals.find((d) => d.id === dealId);
        console.log(`  ${dealId} (${deal.status}): moments in order:`, acts.filter((a) => a.moment).map((a) => a.moment).slice(0, 12).join(" → "));
      }
    }
  }
  console.log(`  Total deals with backwards moments: ${count}/${w.deals.length}`);
}

// Time-of-day spread
console.log();
console.log("=".repeat(78));
console.log("ACTIVITY TIME-OF-DAY SPREAD (stale scenario)");
console.log("=".repeat(78));
const wstale = loadWorld("stale-pipeline-hidden-risk-seed-42");
const hourBins = new Map();
for (const a of wstale.activities) {
  const hour = a.dueTime ? Number(a.dueTime.split(":")[0]) : null;
  if (hour === null) continue;
  hourBins.set(hour, (hourBins.get(hour) ?? 0) + 1);
}
const sortedHours = [...hourBins.entries()].sort((a, b) => a[0] - b[0]);
console.log("Hour | Count");
for (const [h, n] of sortedHours) console.log(`  ${String(h).padStart(2)}:00  ${n}`);
