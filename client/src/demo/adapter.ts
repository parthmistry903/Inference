/**
 * DEMO-ONLY · An axios adapter that answers the whole `/api/v1` surface from
 * memory.
 *
 * Mounted by `services/api.ts` when `DEMO_MODE` is true. Every route below
 * reproduces the real controller's response envelope, filtering, sorting,
 * pagination and error codes — including the `status: 'completed'` filter that
 * hides failed resumes from the results table, and the `rank` field the server
 * computes from a row's position in the page.
 *
 * Reads are all served. Writes split in two:
 *   • allowed  — HR decisions, private notes, CSV export
 *   • blocked  — anything that would need MongoDB, S3, SQS, Bedrock or Firebase
 */

import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import {
  DEMO_BLOCKED_MESSAGE,
  DEMO_CREDENTIALS,
  DEMO_LATENCY_MS,
  DEMO_USER,
} from './demoConfig';
import { buildCsv } from './csv';
import * as store from './store';
import type { BatchAnalytics, Resume } from '../types';

const SESSION_KEY = 'inference_demo_session_v1';
const DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Plumbing
// ---------------------------------------------------------------------------

function delay(): Promise<void> {
  const { min, max } = DEMO_LATENCY_MS;
  return new Promise((resolve) => window.setTimeout(resolve, min + Math.random() * (max - min)));
}

function respond<T>(config: AxiosRequestConfig, status: number, data: T, headers: Record<string, string> = {}): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : String(status),
    headers: new AxiosHeaders(headers),
    config: config as AxiosResponse['config'],
    request: null,
  };
}

function ok<T>(config: AxiosRequestConfig, data: T, meta?: unknown): AxiosResponse {
  return respond(config, 200, meta ? { success: true, data, meta } : { success: true, data });
}

function fail(config: AxiosRequestConfig, status: number, code: string, message: string): never {
  const body = { success: false, error: { code, message }, timestamp: new Date().toISOString() };
  throw new AxiosError(
    message,
    status === 401 ? 'ERR_BAD_REQUEST' : 'ERR_BAD_RESPONSE',
    config as AxiosError['config'],
    null,
    respond(config, status, body),
  );
}

/** Every write the public demo refuses, with one consistent message. */
function blocked(config: AxiosRequestConfig): never {
  return fail(config, 403, 'DEMO_READ_ONLY', DEMO_BLOCKED_MESSAGE);
}

function hasSession(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function setSession(active: boolean): void {
  try {
    if (active) localStorage.setItem(SESSION_KEY, '1');
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Session simply will not survive a reload; the demo still works.
  }
}

const demoUser = {
  _id: DEMO_USER._id,
  name: DEMO_USER.name,
  email: DEMO_USER.email,
  role: DEMO_USER.role,
  isActive: DEMO_USER.isActive,
  createdAt: new Date(Date.now() - DEMO_USER.createdAtDaysAgo * DAY).toISOString(),
};

function num(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key);
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

function listResumesFor(batchId: string, params: URLSearchParams) {
  const page = Math.max(1, num(params, 'page', 1));
  const limit = Math.max(1, num(params, 'limit', 25));
  const minScore = num(params, 'minScore', 0);
  const maxScore = num(params, 'maxScore', 100);
  const hrStatus = params.get('hrStatus') ?? '';
  const search = (params.get('search') ?? '').trim().toLowerCase();
  const sort = params.get('sort') ?? 'score';
  const order = params.get('order') === 'asc' ? 1 : -1;

  // The real controller only ever returns successfully scored resumes.
  let rows = store.getResumes().filter((resume) => resume.batchId === batchId && resume.status === 'completed');

  if (hrStatus) rows = rows.filter((resume) => resume.hrStatus === hrStatus);
  rows = rows.filter((resume) => {
    const score = resume.scoreBreakdown?.totalScore ?? 0;
    return score >= minScore && score <= maxScore;
  });
  if (search) {
    rows = rows.filter((resume) => {
      const data = resume.extractedData;
      return (
        (data?.candidateName ?? '').toLowerCase().includes(search) ||
        (data?.email ?? '').toLowerCase().includes(search)
      );
    });
  }

  rows = rows.slice().sort((a, b) => {
    if (sort === 'name') {
      return (a.extractedData?.candidateName ?? '').localeCompare(b.extractedData?.candidateName ?? '');
    }
    if (sort === 'experience') {
      return ((a.extractedData?.totalExperienceYears ?? 0) - (b.extractedData?.totalExperienceYears ?? 0)) * order;
    }
    return ((a.scoreBreakdown?.totalScore ?? 0) - (b.scoreBreakdown?.totalScore ?? 0)) * order;
  });

  const total = rows.length;
  const start = (page - 1) * limit;
  const data = rows.slice(start, start + limit).map((resume, index) => ({ ...resume, rank: start + index + 1 }));

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

const BUCKETS: [number, number, string][] = [
  [0, 21, '0-20'],
  [21, 41, '21-40'],
  [41, 61, '41-60'],
  [61, 81, '61-80'],
  [81, 101, '81-100'],
];

function analyticsFor(batchId: string): BatchAnalytics {
  const batch = store.findBatch(batchId);
  const rows = store.getResumes().filter((resume) => resume.batchId === batchId && resume.status === 'completed');

  const scoreDistribution = BUCKETS.map(([low, high, range]) => ({
    range,
    count: rows.filter((resume) => {
      const score = resume.scoreBreakdown?.totalScore ?? 0;
      return score >= low && score < high;
    }).length,
  }));

  const skillCounts = new Map<string, number>();
  for (const resume of rows) {
    for (const skill of resume.extractedData?.skills ?? []) {
      skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
    }
  }
  const topSkills = Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  const averageScore = rows.length
    ? Math.round(rows.reduce((sum, resume) => sum + (resume.scoreBreakdown?.totalScore ?? 0), 0) / rows.length)
    : 0;
  const passed = rows.filter((resume) => (resume.scoreBreakdown?.totalScore ?? 0) >= 80).length;
  const passRate = rows.length ? Math.round((passed / rows.length) * 100) : 0;

  const processingTimeMs =
    batch?.startedAt && batch?.completedAt
      ? new Date(batch.completedAt).getTime() - new Date(batch.startedAt).getTime()
      : 0;

  return { scoreDistribution, topSkills, averageScore, passRate, processingTimeMs };
}

function exportCsv(config: AxiosRequestConfig, params: URLSearchParams): AxiosResponse {
  const batchId = params.get('batchId') ?? '';
  const filter = params.get('filter') ?? 'all';
  const batch = store.findBatch(batchId);
  if (!batch) fail(config, 404, 'BATCH_NOT_FOUND', 'Batch not found');

  const job = store.findJob(batch.jobId);
  if (!job) fail(config, 404, 'JOB_NOT_FOUND', 'Job not found');

  const rows = store
    .getResumes()
    .filter((resume) => resume.batchId === batchId && resume.status === 'completed')
    .filter((resume) => (filter === 'shortlisted' ? resume.hrStatus === 'shortlisted' : true))
    .sort((a, b) => (b.scoreBreakdown?.totalScore ?? 0) - (a.scoreBreakdown?.totalScore ?? 0));

  const date = new Date().toISOString().split('T')[0];
  const filename = `Inference_${job.title.replace(/\s+/g, '_')}_${batchId}_${date}.csv`;
  const blob = new Blob([buildCsv(rows)], { type: 'text/csv;charset=utf-8' });

  return respond(config, 200, blob, {
    'content-type': 'text/csv',
    'content-disposition': `attachment; filename="${filename}"`,
  });
}

// ---------------------------------------------------------------------------
// The adapter
// ---------------------------------------------------------------------------

export const demoAdapter: AxiosAdapter = async (config) => {
  await delay();

  const method = (config.method ?? 'get').toLowerCase();
  // `config.url` may or may not already carry the baseURL depending on axios
  // internals, so resolve it against a dummy origin and strip the prefix.
  const url = new URL(config.url ?? '', 'http://demo.local');
  const path = url.pathname.replace(/^\/api\/v1/, '').replace(/\/+$/, '') || '/';
  const params = url.searchParams;
  for (const [key, value] of Object.entries(config.params ?? {})) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const body = typeof config.data === 'string' ? (JSON.parse(config.data || '{}') as Record<string, unknown>) : {};

  // --- auth ---------------------------------------------------------------
  if (path === '/auth/login' && method === 'post') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    if (email !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
      fail(config, 401, 'INVALID_CREDENTIALS', 'Invalid email or password. Use the demo credentials shown on this page.');
    }
    setSession(true);
    store.startLiveBatch();
    return ok(config, { accessToken: 'demo-access-token', user: demoUser });
  }

  if (path === '/auth/refresh' && method === 'post') {
    if (!hasSession()) fail(config, 401, 'NO_SESSION', 'No active session');
    store.startLiveBatch();
    return ok(config, { accessToken: 'demo-access-token' });
  }

  if (path === '/auth/me' && method === 'get') {
    if (!hasSession()) fail(config, 401, 'NO_SESSION', 'No active session');
    return ok(config, { user: demoUser });
  }

  if (path === '/auth/logout' && method === 'post') {
    setSession(false);
    return ok(config, { message: 'Logged out' });
  }

  if (path === '/auth/register' || path === '/auth/change-password') blocked(config);

  // --- jobs ---------------------------------------------------------------
  if (path === '/jobs' && method === 'get') {
    const status = params.get('status');
    const page = Math.max(1, num(params, 'page', 1));
    const limit = Math.max(1, num(params, 'limit', 20));
    const all = store
      .getJobs()
      .filter((job) => !job.isDeleted && (!status || job.status === status))
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const batches = store.getBatches();
    const resumes = store.getResumes();
    const data = all.slice((page - 1) * limit, page * limit).map((job) => ({
      ...job,
      batchCount: batches.filter((batch) => batch.jobId === job._id).length,
      totalCandidates: resumes.filter((resume) => resume.jobId === job._id).length,
    }));

    return ok(config, data, { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) });
  }

  const jobMatch = /^\/jobs\/([^/]+)$/.exec(path);
  if (jobMatch && method === 'get') {
    const job = store.findJob(jobMatch[1]);
    if (!job) fail(config, 404, 'JOB_NOT_FOUND', 'Job not found');
    return ok(config, {
      ...job,
      batchCount: store.getBatches().filter((batch) => batch.jobId === job._id).length,
      totalCandidates: store.getResumes().filter((resume) => resume.jobId === job._id).length,
    });
  }
  if (path === '/jobs' && method === 'post') blocked(config);
  if (jobMatch && (method === 'put' || method === 'patch' || method === 'delete')) blocked(config);

  // --- batches ------------------------------------------------------------
  if (path === '/batches' && method === 'get') {
    const jobId = params.get('jobId');
    const limit = Math.max(1, num(params, 'limit', 20));
    const data = store
      .getBatches()
      .filter((batch) => !jobId || batch.jobId === jobId)
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    return ok(config, data, { page: 1, limit, total: data.length, totalPages: 1 });
  }

  const batchMatch = /^\/batches\/([^/]+)$/.exec(path);
  if (batchMatch && method === 'get') {
    const batch = store.findBatch(batchMatch[1]);
    if (!batch) fail(config, 404, 'BATCH_NOT_FOUND', 'Batch not found');
    return ok(config, batch);
  }
  if (batchMatch && method === 'delete') blocked(config);

  // --- resumes ------------------------------------------------------------
  if (path === '/resumes/export' && method === 'get') {
    return exportCsv(config, params);
  }

  if (path === '/resumes' && method === 'get') {
    const batchId = params.get('batchId');
    if (!batchId) fail(config, 400, 'VALIDATION_ERROR', 'batchId is required');
    const { data, meta } = listResumesFor(batchId, params);
    return ok(config, data, meta);
  }

  if (path === '/resumes/bulk-status' && method === 'patch') {
    const ids = Array.isArray(body.resumeIds) ? (body.resumeIds as string[]) : [];
    const updated = store.setDecisions(ids, body.hrStatus as Resume['hrStatus']);
    return ok(config, { updated });
  }

  const statusMatch = /^\/resumes\/([^/]+)\/status$/.exec(path);
  if (statusMatch && (method === 'put' || method === 'patch')) {
    const updated = store.setDecision(
      statusMatch[1],
      body.hrStatus as Resume['hrStatus'],
      body.hrNote as string | undefined,
    );
    if (!updated) fail(config, 404, 'RESUME_NOT_FOUND', 'Resume not found');
    return ok(config, updated);
  }

  if (/^\/resumes\/[^/]+\/retry$/.test(path)) blocked(config);

  // --- analytics ----------------------------------------------------------
  const analyticsMatch = /^\/analytics\/([^/]+)$/.exec(path);
  if (analyticsMatch && method === 'get') {
    if (!store.findBatch(analyticsMatch[1])) fail(config, 404, 'BATCH_NOT_FOUND', 'Batch not found');
    return ok(config, analyticsFor(analyticsMatch[1]));
  }

  // --- upload (S3 presign + SQS enqueue) ----------------------------------
  if (path.startsWith('/upload')) blocked(config);

  return fail(config, 404, 'NOT_FOUND', `No demo handler for ${method.toUpperCase()} ${path}`);
};
