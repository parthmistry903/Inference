import { neon } from '@neondatabase/serverless';
import type { Response } from 'express';
import { Router } from 'express';
import { env } from '../config/env';

export const pageViewAnalyticsRouter = Router();

const sql = env.ANALYTICS_DATABASE_URL ? neon(env.ANALYTICS_DATABASE_URL) : null;
const MAX_BODY_BYTES = 4096;

function emptyResponse(res: Response): void {
  res.status(204).set('Cache-Control', 'no-store').end();
}

function cleanPagePath(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 512 || !trimmed.startsWith('/')) return null;

  try {
    return new URL(trimmed, 'https://local.invalid').pathname.slice(0, 512) || '/';
  } catch {
    return null;
  }
}

function cleanReferrer(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    return `${url.origin}${url.pathname}`.slice(0, 1024);
  } catch {
    return null;
  }
}

function cleanVisitorId(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(trimmed)
    ? trimmed
    : null;
}

function parseBody(value: unknown): Record<string, unknown> | null {
  try {
    if (Buffer.isBuffer(value)) {
      if (value.byteLength > MAX_BODY_BYTES) return null;
      return JSON.parse(value.toString('utf8') || '{}') as Record<string, unknown>;
    }

    if (typeof value === 'string') {
      if (Buffer.byteLength(value) > MAX_BODY_BYTES) return null;
      return JSON.parse(value || '{}') as Record<string, unknown>;
    }

    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

pageViewAnalyticsRouter.options('/', (_req, res) => {
  emptyResponse(res);
});

pageViewAnalyticsRouter.head('/', (_req, res) => {
  emptyResponse(res);
});

pageViewAnalyticsRouter.post('/', async (req, res) => {
  try {
    const body = parseBody(req.body);
    const pagePath = cleanPagePath(body?.page_path);
    const referrer = cleanReferrer(body?.referrer);
    const visitorId = cleanVisitorId(body?.anonymous_visitor_id);

    if (!pagePath || !visitorId || !sql) {
      emptyResponse(res);
      return;
    }

    await sql`
      INSERT INTO analytics_page_views (
        project_name,
        page_path,
        referrer,
        anonymous_visitor_id
      )
      VALUES (
        ${env.ANALYTICS_PROJECT_NAME},
        ${pagePath},
        ${referrer},
        ${visitorId}
      )
    `;
  } catch {
    
  }

  emptyResponse(res);
});
