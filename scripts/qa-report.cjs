#!/usr/bin/env node
// QA report: cross-scenario stats and red flags. Reads generated/crm-runs/*/world.json + truth.json.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RUNS = path.join(ROOT, "generated", "crm-runs");
const SCENARIO_ORDER = [
  "single-organization-deal-lab-seed-42",
  "expansion-after-won-pilot-seed-42",
  "committee-security-delay-seed-42",
  "ghosted-high-value-opportunity-seed-42",
  "messy-crm-hygiene-account-seed-42",
  "stale-pipeline-hidden-risk-seed-42",
];

function loadRun(name) {
  return {
    name,
    world: JSON.parse(fs.readFileSync(path.join(RUNS, name, "world.json"), "utf8")),
    truth: JSON.parse(fs.readFileSync(path.join(RUNS, name, "truth.json"), "utf8")),
    events: JSON.parse(fs.readFileSync(path.join(RUNS, name, "events.json"), "utf8")),
    report: JSON.parse(fs.readFileSync(path.join(RUNS, name, "validation-report.json"), "utf8")),
  };
}

function pct(n, d) {
  return d === 0 ? "0.0" : ((n / d) * 100).toFixed(1);
}

function reportScenario(run, scenario) {
  const { world, truth } = run;
  const flags = [];

  // Win rate
  const won = world.deals.filter((d) => d.status === "WON").length;
  const lost = world.deals.filter((d) => d.status === "LOST").length;
  const closed = won + lost;
  const winRate = closed > 0 ? won / closed : 0;
  const scn = scenario;
  const inRange = winRate >= scn.targets.winRate.min && winRate <= scn.targets.winRate.max;
  if (!inRange && closed >= scn.targets.minClosedDeals) {
    flags.push(`WIN_RATE_OUT_OF_RANGE: ${(winRate * 100).toFixed(1)}% not in [${scn.targets.winRate.min * 100}%, ${scn.targets.winRate.max * 100}%]`);
  }

  // Closed deals minimum
  if (closed < scn.targets.minClosedDeals) {
    flags.push(`UNDER_MIN_CLOSED: ${closed} < ${scn.targets.minClosedDeals}`);
  }

  // Cold/stalled counts
  if (truth.coldDealIds.length < scn.targets.minColdDeals) {
    flags.push(`UNDER_MIN_COLD: ${truth.coldDealIds.length} < ${scn.targets.minColdDeals}`);
  }
  if (truth.stalledDealIds.length < scn.targets.minStalledDeals) {
    flags.push(`UNDER_MIN_STALLED: ${truth.stalledDealIds.length} < ${scn.targets.minStalledDeals}`);
  }

  // Email body uniqueness
  const emailBodyCount = new Map();
  for (const e of world.emails) emailBodyCount.set(e.body, (emailBodyCount.get(e.body) ?? 0) + 1);
  const repeatedEmailBodies = [...emailBodyCount.entries()].filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]);
  if (repeatedEmailBodies.length > 0) {
    flags.push(`REPEATED_EMAIL_BODIES: ${repeatedEmailBodies.length} bodies repeated >=4x (top: "${repeatedEmailBodies[0][0].slice(0, 60)}..." ×${repeatedEmailBodies[0][1]})`);
  }

  // Email subject uniqueness
  const subjCount = new Map();
  for (const e of world.emails) subjCount.set(e.subject, (subjCount.get(e.subject) ?? 0) + 1);
  const repeatedSubjects = [...subjCount.entries()].filter(([s, n]) => n >= 5 && !s.startsWith("Re: ")).sort((a, b) => b[1] - a[1]);
  if (repeatedSubjects.length > 0) {
    flags.push(`REPEATED_EMAIL_SUBJECTS: top: "${repeatedSubjects[0][0]}" ×${repeatedSubjects[0][1]}`);
  }

  // Note body uniqueness
  const noteBodyCount = new Map();
  for (const n of world.notes) noteBodyCount.set(n.body, (noteBodyCount.get(n.body) ?? 0) + 1);
  const repeatedNoteBodies = [...noteBodyCount.entries()].filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]);
  if (repeatedNoteBodies.length > 0) {
    flags.push(`REPEATED_NOTE_BODIES: top: "${repeatedNoteBodies[0][0].slice(0, 60)}..." ×${repeatedNoteBodies[0][1]}`);
  }

  // Activity subject uniqueness
  const actSubjCount = new Map();
  for (const a of world.activities) actSubjCount.set(a.subject, (actSubjCount.get(a.subject) ?? 0) + 1);
  const repeatedActSubj = [...actSubjCount.entries()].filter(([, n]) => n >= 10).sort((a, b) => b[1] - a[1]);
  if (repeatedActSubj.length > 0) {
    flags.push(`REPEATED_ACTIVITY_SUBJECTS: top: "${repeatedActSubj[0][0]}" ×${repeatedActSubj[0][1]}`);
  }

  // Contact surname diversity
  const lastNames = new Set();
  for (const c of world.contacts) {
    const parts = c.name.split(/\s+/);
    const surname = parts[parts.length - 1].replace(/\.$/, "").toLowerCase();
    lastNames.add(surname);
  }
  const surnameRatio = lastNames.size / Math.max(1, world.contacts.length);
  if (surnameRatio < 0.4 && world.contacts.length >= 10) {
    flags.push(`LOW_SURNAME_DIVERSITY: ${lastNames.size} unique / ${world.contacts.length} contacts (${(surnameRatio * 100).toFixed(0)}%)`);
  }

  // Deal sentiment arc presence
  const dealsWithArc = world.deals.filter((d) => Array.isArray(d.story.sentimentArc) && d.story.sentimentArc.length >= 2);
  if (dealsWithArc.length / world.deals.length < 0.5) {
    flags.push(`THIN_SENTIMENT_ARCS: only ${dealsWithArc.length}/${world.deals.length} deals have arc length>=2`);
  }

  // Threading sanity: every email-type activity (done) should produce 1 outbound email at least
  const emailActivities = world.activities.filter((a) => a.type === "email" && a.done);
  const outboundCount = world.emails.filter((e) => e.direction === "outbound").length;
  if (outboundCount < emailActivities.length) {
    flags.push(`EMAIL_OUTBOUND_MISMATCH: ${outboundCount} outbound emails for ${emailActivities.length} done email activities`);
  }

  // Inbound reply threading: subject should start with "Re: " for inbounds where matched
  const badThreaded = world.emails.filter((e) => e.direction === "inbound" && !e.subject.startsWith("Re: "));
  if (badThreaded.length > 0) {
    flags.push(`INBOUND_NO_RE_PREFIX: ${badThreaded.length} inbound emails not threaded as Re:`);
  }

  // Activity moment progression: for each deal, moments should generally be non-decreasing in
  // their phase order (discovery -> mapping -> data -> finance/security/pilot -> success -> close).
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
  let dealsWithBackwardsMoments = 0;
  const activitiesByDeal = new Map();
  for (const a of world.activities) {
    if (!a.dealId) continue;
    if (!activitiesByDeal.has(a.dealId)) activitiesByDeal.set(a.dealId, []);
    activitiesByDeal.get(a.dealId).push(a);
  }
  for (const [, acts] of activitiesByDeal) {
    acts.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    let maxPhase = -1;
    let backwards = false;
    for (const a of acts) {
      const phase = phaseOrder[a.moment] ?? -1;
      if (phase < 0) continue;
      // Only flag when we go back more than 2 phases - finance/security/pilot in any order ok
      if (phase < maxPhase - 1) backwards = true;
      maxPhase = Math.max(maxPhase, phase);
    }
    if (backwards) dealsWithBackwardsMoments++;
  }
  if (dealsWithBackwardsMoments / world.deals.length > 0.15) {
    flags.push(`BACKWARDS_MOMENTS: ${dealsWithBackwardsMoments}/${world.deals.length} deals have moment phases going backwards >1 step`);
  }

  // Activity done rate sanity (some should be done, some should be future open)
  const doneCount = world.activities.filter((a) => a.done).length;
  const doneRate = doneCount / world.activities.length;
  if (doneRate < 0.4 || doneRate > 0.95) {
    flags.push(`ACTIVITY_DONE_RATE: ${(doneRate * 100).toFixed(1)}% done (${doneCount}/${world.activities.length})`);
  }

  // Sentiment arc for at least closed deals — they should end clearly positive/negative
  for (const d of world.deals.filter((d) => d.status === "WON")) {
    const arc = d.story.sentimentArc;
    if (!arc || arc.length < 2) continue;
    const final = arc[arc.length - 1].sentiment;
    if (final < 0.2) {
      flags.push(`WON_DEAL_LOW_FINAL_SENTIMENT: ${d.id} final sentiment ${final.toFixed(2)}`);
      break;
    }
  }
  for (const d of world.deals.filter((d) => d.status === "LOST")) {
    const arc = d.story.sentimentArc;
    if (!arc || arc.length < 2) continue;
    const final = arc[arc.length - 1].sentiment;
    if (final > 0.0) {
      flags.push(`LOST_DEAL_HIGH_FINAL_SENTIMENT: ${d.id} final sentiment ${final.toFixed(2)}`);
      break;
    }
  }

  // Note body length distribution
  const noteLengths = world.notes.map((n) => n.body.length);
  const avgNoteLen = noteLengths.reduce((s, x) => s + x, 0) / noteLengths.length;
  const veryShort = noteLengths.filter((l) => l < 30).length;
  const stats = {
    closed,
    winRate: (winRate * 100).toFixed(1) + "%",
    coldCount: truth.coldDealIds.length,
    stalledCount: truth.stalledDealIds.length,
    avgNoteLen: avgNoteLen.toFixed(0),
    shortNotes: veryShort,
    emails: world.emails.length,
    outboundEmails: outboundCount,
    inboundEmails: world.emails.filter((e) => e.direction === "inbound").length,
    notes: world.notes.length,
    activities: world.activities.length,
    contacts: world.contacts.length,
    uniqueSurnames: lastNames.size,
    repeatedEmailBodies: repeatedEmailBodies.length,
  };

  return { stats, flags };
}

const scenarioFiles = {
  "single-organization-deal-lab-seed-42": "single-organization-deal-lab.ts",
  "expansion-after-won-pilot-seed-42": "expansion-after-won-pilot.ts",
  "committee-security-delay-seed-42": "committee-security-delay.ts",
  "ghosted-high-value-opportunity-seed-42": "ghosted-high-value-opportunity.ts",
  "messy-crm-hygiene-account-seed-42": "messy-crm-hygiene-account.ts",
  "stale-pipeline-hidden-risk-seed-42": "stale-pipeline-hidden-risk.ts",
};

// Crude scenario config extraction by tsx
const { execSync } = require("child_process");

console.log("=".repeat(78));
console.log("CRM SIMULATOR — CROSS-SCENARIO QA REPORT");
console.log("=".repeat(78));

const scenarioConfigs = JSON.parse(
  execSync(
    `npx tsx -e "import('./scenarios/${scenarioFiles["single-organization-deal-lab-seed-42"]}').then(m => process.stdout.write(JSON.stringify(m.default)))"`,
    { cwd: ROOT, stdio: ["pipe", "pipe", "ignore"] },
  ).toString(),
);
// fetch all
const cfgByRun = {};
for (const run of SCENARIO_ORDER) {
  const file = scenarioFiles[run];
  cfgByRun[run] = JSON.parse(
    execSync(
      `npx tsx -e "import('./scenarios/${file}').then(m => process.stdout.write(JSON.stringify(m.default)))"`,
      { cwd: ROOT, stdio: ["pipe", "pipe", "ignore"] },
    ).toString(),
  );
}

for (const name of SCENARIO_ORDER) {
  const run = loadRun(name);
  const { stats, flags } = reportScenario(run, cfgByRun[name]);
  console.log();
  console.log("-".repeat(78));
  console.log(`Scenario: ${name}`);
  console.log("-".repeat(78));
  console.log("Volume:");
  console.log(`  ${run.world.deals.length} deals (${stats.closed} closed, ${run.world.deals.filter((d) => d.status === "OPEN").length} open)`);
  console.log(`  ${stats.contacts} contacts (${stats.uniqueSurnames} unique surnames)`);
  console.log(`  ${stats.activities} activities, ${stats.notes} notes, ${stats.emails} emails (out=${stats.outboundEmails} in=${stats.inboundEmails})`);
  console.log("Health:");
  console.log(`  Win rate: ${stats.winRate} (target ${cfgByRun[name].targets.winRate.min}-${cfgByRun[name].targets.winRate.max})`);
  console.log(`  Cold: ${stats.coldCount}, Stalled: ${stats.stalledCount}`);
  console.log(`  Validation: fatal=${run.report.issueCounts.fatal}, warn=${run.report.issueCounts.warning}, info=${run.report.issueCounts.info}`);
  console.log("Quality:");
  console.log(`  Avg note length: ${stats.avgNoteLen} chars (${stats.shortNotes} notes <30 chars)`);
  console.log(`  Repeated email bodies >=4x: ${stats.repeatedEmailBodies}`);
  if (flags.length === 0) {
    console.log("FLAGS: none");
  } else {
    console.log("FLAGS:");
    for (const f of flags) console.log(`  ⚠ ${f}`);
  }
}
console.log();
console.log("=".repeat(78));
