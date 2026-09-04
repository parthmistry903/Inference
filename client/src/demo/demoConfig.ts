/**
 * ============================================================================
 * DEMO-ONLY  ·  Delete this entire `src/demo/` folder to restore the live app.
 * ============================================================================
 *
 * Inference ships a public, backend-free demo so the UI can be explored without
 * exposing MongoDB Atlas, AWS S3/SQS, Bedrock or Firebase credentials.
 *
 * When DEMO_MODE is true, `services/api.ts` swaps the axios HTTP adapter for an
 * in-memory adapter (`./adapter.ts`). Every page, hook and React Query call in
 * the app stays byte-for-byte identical — they just talk to a deterministic
 * fixture instead of a network.
 *
 * See README.md → "Turning the demo off" for the removal checklist.
 */

export const DEMO_MODE = true;

/** The single account the public demo accepts. */
export const DEMO_CREDENTIALS = {
  email: 'demo@inference.app',
  password: 'demo1234',
} as const;

export const DEMO_USER = {
  _id: '65f0a1b2c3d4e5f600000001',
  name: 'Demo Recruiter',
  email: DEMO_CREDENTIALS.email,
  role: 'hr' as const,
  isActive: true,
  /** Account age drives nothing, but a stable date keeps the fixture honest. */
  createdAtDaysAgo: 96,
};

/**
 * Seed for the deterministic PRNG. Change it to reshuffle every candidate,
 * score and review decision in the fixture; keep it to get identical data on
 * every page load, in every browser, forever.
 */
export const DEMO_SEED = 20260215;

/** localStorage key holding the visitor's own edits (HR decisions + notes). */
export const DEMO_STATE_KEY = 'inference_demo_state_v1';

/** Latency, in ms, faked on every request so loading states are visible. */
export const DEMO_LATENCY_MS = { min: 140, max: 320 };

/**
 * Writes the demo refuses, and the message shown when a visitor tries one.
 * Everything else — HR decisions, private notes, filters, CSV export — is
 * fully interactive and persists to localStorage.
 */
export const DEMO_BLOCKED_MESSAGE =
  'Demo mode — this action is disabled. Clone the repo and add your own API keys to run it for real.';
