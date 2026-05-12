import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GeneratedWorld, RunArtifacts, SimulationEvent, TruthReport, ValidationReport } from "../engine/types.js";

export type JsonAdapterOptions = {
  rootDir?: string;
};

const DEFAULT_RUNS_DIR = path.join("generated", "crm-runs");

function getRunsRoot(options: JsonAdapterOptions = {}): string {
  return options.rootDir ?? DEFAULT_RUNS_DIR;
}

export function getRunDirectory(runId: string, options: JsonAdapterOptions = {}): string {
  return path.join(getRunsRoot(options), runId);
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJson<T>(filePath: string): Promise<T> {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text) as T;
}

export async function writeRunArtifacts(artifacts: RunArtifacts, options: JsonAdapterOptions = {}): Promise<string> {
  const runDir = getRunDirectory(artifacts.world.metadata.runId, options);

  await writeJson(path.join(runDir, "world.json"), artifacts.world);
  await writeJson(path.join(runDir, "events.json"), artifacts.events);

  if (artifacts.truth) {
    await writeJson(path.join(runDir, "truth.json"), artifacts.truth);
  }

  if (artifacts.validationReport) {
    await writeJson(path.join(runDir, "validation-report.json"), artifacts.validationReport);
  }

  return runDir;
}

export async function readWorld(runId: string, options: JsonAdapterOptions = {}): Promise<GeneratedWorld> {
  return readJson<GeneratedWorld>(path.join(getRunDirectory(runId, options), "world.json"));
}

export async function readEvents(runId: string, options: JsonAdapterOptions = {}): Promise<SimulationEvent[]> {
  return readJson<SimulationEvent[]>(path.join(getRunDirectory(runId, options), "events.json"));
}

export async function readTruth(runId: string, options: JsonAdapterOptions = {}): Promise<TruthReport> {
  return readJson<TruthReport>(path.join(getRunDirectory(runId, options), "truth.json"));
}

export async function readValidationReport(runId: string, options: JsonAdapterOptions = {}): Promise<ValidationReport> {
  return readJson<ValidationReport>(path.join(getRunDirectory(runId, options), "validation-report.json"));
}
