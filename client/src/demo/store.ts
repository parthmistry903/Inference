/**
 * DEMO-ONLY · Mutable state layered on top of the generated fixture.
 *
 * The fixture itself is regenerated from `DEMO_SEED` on every page load, using
 * the current clock, so "4 days ago" stays 4 days ago forever. Only what the
 * visitor changes is persisted: HR decisions, private notes, and how far the
 * live batch has processed. Clearing localStorage (or the in-app reset) puts
 * everything back.
 */

import { DEMO_STATE_KEY } from './demoConfig';
import { generateDataset, type DemoDataset } from './generate';
import { queryClient } from '../services/queryClient';
import type { Batch, Resume } from '../types';

interface DecisionOverride {
  hrStatus: Resume['hrStatus'];
  hrNote?: string;
  reviewedAt: string;
}

interface LiveOverride {
  status: Batch['status'];
  processedResumes: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface PersistedState {
  version: 1;
  decisions: Record<string, DecisionOverride>;
  live?: LiveOverride;
}

const EMPTY: PersistedState = { version: 1, decisions: {} };

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(DEMO_STATE_KEY);
    if (!raw) return { ...EMPTY, decisions: {} };
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed?.version !== 1 || typeof parsed.decisions !== 'object') return { ...EMPTY, decisions: {} };
    return parsed;
  } catch {
    return { ...EMPTY, decisions: {} };
  }
}

function save(state: PersistedState): void {
  try {
    localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
  } catch {
    // Private-browsing or a full quota: the demo still works, just forgetfully.
  }
}

let persisted = load();
let data: DemoDataset = generateDataset();

/** Index for O(1) lookups; rebuilt whenever the fixture is regenerated. */
let resumesById = new Map<string, Resume>();
let batchesById = new Map<string, Batch>();

function reindex(): void {
  resumesById = new Map(data.resumes.map((resume) => [resume._id, resume]));
  batchesById = new Map(data.batches.map((batch) => [batch._id, batch]));
}

function applyDecisions(): void {
  for (const [resumeId, override] of Object.entries(persisted.decisions)) {
    const resume = resumesById.get(resumeId);
    if (!resume) continue;
    resume.hrStatus = override.hrStatus;
    resume.hrNote = override.hrNote;
    resume.reviewedAt = override.reviewedAt;
  }
}

function applyLive(): void {
  const batch = data.liveBatchId ? batchesById.get(data.liveBatchId) : undefined;
  if (!batch || !persisted.live) return;

  Object.assign(batch, persisted.live);
  completeUpTo(batch, batch.processedResumes);
}

/** Flip the first `count` resumes of the live batch from queued to completed. */
function completeUpTo(batch: Batch, count: number): void {
  const members = data.resumes.filter((resume) => resume.batchId === batch._id);
  members.forEach((resume, index) => {
    resume.status = index < count ? 'completed' : 'queued';
  });
}

reindex();
applyDecisions();
applyLive();

// ---------------------------------------------------------------------------
// Live batch simulation
// ---------------------------------------------------------------------------

const LIVE_QUEUE_DELAY_MS = 2600;
const LIVE_TICK_MS = 1200;
let liveTimer: number | null = null;

function refreshViews(): void {
  void queryClient.invalidateQueries({ queryKey: ['jobs'] });
  void queryClient.invalidateQueries({ queryKey: ['batches'] });
  void queryClient.invalidateQueries({ queryKey: ['batch-progress'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboard-all-batches'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboard-resumes'] });
  void queryClient.invalidateQueries({ queryKey: ['resumes'] });
  void queryClient.invalidateQueries({ queryKey: ['analytics'] });
}

function persistLive(batch: Batch): void {
  persisted.live = {
    status: batch.status,
    processedResumes: batch.processedResumes,
    startedAt: batch.startedAt,
    completedAt: batch.completedAt,
  };
  save(persisted);
}

function stopLive(): void {
  if (liveTimer !== null) {
    window.clearInterval(liveTimer);
    liveTimer = null;
  }
}

/**
 * Walks the one `live` batch through queued → processing → completed so a
 * first-time visitor sees the async pipeline states the real worker produces.
 * Runs once; the finished state is persisted.
 */
export function startLiveBatch(): void {
  const batch = data.liveBatchId ? batchesById.get(data.liveBatchId) : undefined;
  if (!batch || batch.status === 'completed' || batch.status === 'partial' || liveTimer !== null) return;

  window.setTimeout(() => {
    if (batch.status !== 'queued') return;
    batch.status = 'processing';
    batch.startedAt = new Date().toISOString();
    batch.updatedAt = batch.startedAt;
    persistLive(batch);
    refreshViews();

    liveTimer = window.setInterval(() => {
      const step = batch.processedResumes % 2 === 0 ? 2 : 1;
      batch.processedResumes = Math.min(batch.totalResumes, batch.processedResumes + step);
      batch.updatedAt = new Date().toISOString();
      completeUpTo(batch, batch.processedResumes);

      if (batch.processedResumes >= batch.totalResumes) {
        batch.status = 'completed';
        batch.completedAt = new Date().toISOString();
        stopLive();
      }

      persistLive(batch);
      refreshViews();
    }, LIVE_TICK_MS);
  }, LIVE_QUEUE_DELAY_MS);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function getJobs() {
  return data.jobs;
}

export function getBatches() {
  return data.batches;
}

export function getResumes() {
  return data.resumes;
}

export function findBatch(batchId: string) {
  return batchesById.get(batchId);
}

export function findJob(jobId: string) {
  return data.jobs.find((job) => job._id === jobId);
}

export function findResume(resumeId: string) {
  return resumesById.get(resumeId);
}

// ---------------------------------------------------------------------------
// Writes the demo does allow
// ---------------------------------------------------------------------------

export function setDecision(resumeId: string, hrStatus: Resume['hrStatus'], hrNote?: string): Resume | undefined {
  const resume = resumesById.get(resumeId);
  if (!resume) return undefined;

  const reviewedAt = new Date().toISOString();
  const note = hrNote === undefined ? resume.hrNote : hrNote || undefined;

  resume.hrStatus = hrStatus;
  resume.hrNote = note;
  resume.reviewedAt = reviewedAt;

  persisted.decisions[resumeId] = { hrStatus, hrNote: note, reviewedAt };
  save(persisted);
  return resume;
}

export function setDecisions(resumeIds: string[], hrStatus: Resume['hrStatus']): number {
  let updated = 0;
  for (const id of resumeIds) {
    if (setDecision(id, hrStatus)) updated += 1;
  }
  return updated;
}

/** Wipes visitor edits and rebuilds the fixture from the seed. */
export function resetDemo(): void {
  stopLive();
  persisted = { version: 1, decisions: {} };
  save(persisted);
  data = generateDataset();
  reindex();
  queryClient.clear();
  startLiveBatch();
}
