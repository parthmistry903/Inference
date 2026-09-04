# Inference

AI resume screening for people who hire in batches, not one CV at a time.

Upload a few hundred PDFs against a job posting. Inference presigns each upload
straight to S3, fans the work out to background workers over SQS, extracts the
text, scores every candidate against that posting's criteria with an LLM, and
gives you a ranked table you can triage and export.

**[▶ Live demo](#)** · sign in with `demo@inference.app` / `demo1234`

> The public demo runs entirely in your browser against a seeded dataset. There
> is no backend, no database and no API key behind it — see
> [Demo mode](#demo-mode) for what that means, and
> [Running it for real](#running-it-for-real) to stand up the whole system
> locally with your own credentials.

---

## What it does

| | |
|---|---|
| **Bulk intake** | Up to 500 PDFs per batch, uploaded browser → S3 directly via presigned URLs so resumes never transit the API server. |
| **Async scoring** | Each resume becomes an SQS message. Worker processes pull, extract text with `pdf-parse`, prompt the model, and write results back. A dead-letter queue catches poison messages. |
| **Deterministic rubric** | The LLM extracts evidence; the *scoring* is arithmetic the server controls — skills 0-40, experience 0-30, education 0-20, model-judged fit 0-10. The model cannot inflate its own score. |
| **Prompt-injection guard** | Resume text is passed inside a delimited untrusted block with explicit instructions not to obey it. |
| **Triage UI** | Ranked table, score/status/keyword filters, bulk shortlist and reject, per-candidate private notes, CSV export of everyone or just the shortlist. |
| **Per-batch analytics** | Score distribution, top skills detected, average score, pass rate, wall-clock processing time. |

### Scoring, exactly

```
skillsScore     = round(matchedRequiredSkills / totalRequiredSkills * 40)
experienceScore = round(min(years, minYears) / minYears * 30)      // 30 if no minimum
educationScore  = PhD 20 · Master/MBA 17 · Bachelor 14 · High school 8 · none 0
fitScore        = model's 0-10 judgement, clamped
totalScore      = the sum of the four
```

## Stack

**Client** — React 18, TypeScript, Vite, Tailwind, TanStack Query, Zustand,
React Hook Form + Zod, Recharts, Framer Motion.

**Server** — Node 20, Express 5, TypeScript, Mongoose, AWS SDK v3 (S3 + SQS),
Firebase Admin (live batch progress), an OpenAI-compatible client pointed at
AWS Bedrock, JWT auth with refresh rotation, Winston.

**Ops** — Jest + Supertest + `aws-sdk-client-mock`, Docker Compose, Nginx,
GitHub Actions.

```
codebase/
├── client/                 React SPA
│   └── src/
│       ├── pages/          Dashboard · Jobs · Job detail · Upload · Results
│       ├── components/     UI primitives, batch, jobs, resumes
│       ├── services/       axios instance + interceptors, query client
│       └── demo/           ← demo mode; delete this folder to go live
├── server/
│   └── src/
│       ├── controllers/    Route handlers
│       ├── services/       scoring · s3 · sqs · firebase · csv · batch lifecycle
│       ├── worker/         SQS consumer, PDF extraction, DLQ processor
│       └── models/         User · Job · Batch · Resume
└── seed/                   Synthetic resume PDF generator (Python)
```

---

## Demo mode

The deployed demo is the **real client**, unmodified, talking to a fake API.
`client/src/demo/adapter.ts` is an axios adapter that answers the entire
`/api/v1` surface from memory — same response envelopes, same filtering,
sorting, pagination and error codes as the Express controllers. Every page,
hook and query in the app is byte-for-byte the production code, and deleting
the demo folder restores the live client exactly.

**Why fake it at all?** Because a public demo wired to live infrastructure means
publishing an AWS key, a Mongo connection string and a model API key to anyone
who opens devtools. One curious visitor could empty the credit on all three.

### What the demo contains

Five job postings, twelve screening batches, 128 candidates. None of it is
hand-written — `client/src/demo/generate.ts` builds the whole dataset from a
seeded PRNG, then runs every candidate through the *production* scoring formula
(`client/src/demo/scoring.ts` is a direct port). So the numbers on screen are
the numbers the live system would produce for those resumes against those jobs.

The fixture is regenerated from the seed on each page load using the current
clock, so "4 days ago" stays 4 days ago. A few things worth noticing:

- Batch dates, HR decisions and score distributions all agree with each other —
  a batch opened yesterday is mostly still `pending`, one from six weeks ago is
  fully triaged, and decisions were made **down the ranked list**, the way a
  recruiter actually works.
- Three resumes failed to parse and are excluded from results and analytics,
  exactly as the real `status: 'completed'` filter does.
- The `Data Scientist` req is closed — that role got filled.
- Sign in and watch the newest Backend batch: it starts `queued`, moves to
  `processing`, and completes in front of you.
- Every candidate's AI summary is generated from their own evidence — the
  required skills they actually matched, the ones they are missing, their years
  against the posting's bar. No summary contradicts the score beside it.

### What works, and what doesn't

| Works | Disabled |
|---|---|
| Sign in / out, session persistence | Creating or editing a job posting |
| Browsing jobs, batches, results | Deleting jobs or batches |
| Filtering, search, sorting, pagination | Uploading resumes (needs S3 + SQS) |
| Shortlist / reject / review, bulk actions | Retrying a failed resume |
| Private notes | Registration, password change |
| CSV export (all + shortlisted) | |

Your changes persist to `localStorage`, so shortlist a few candidates and watch
the analytics move. The **Reset** pill in the bottom-right rebuilds the dataset.
Disabled actions still open their real form — they fail at the network boundary
with a clear message, so you can see the whole flow.

### Page-view analytics

The demo does report anonymous page views, so traffic to it can be measured.
`components/AnonymousPageAnalytics.tsx` posts `{ project, page_path, referrer,
anonymous_visitor_id }` — a random UUID held in the visitor's `localStorage`, no
IP, no fingerprint, nothing that identifies a person.

Because the demo is static with no API of its own, point it at a deployed
instance:

```ini
# client/.env
VITE_ANALYTICS_ENDPOINT=https://api.your-domain.example/api/_analytics/page-view
```

and allow that origin server-side:

```ini
# server/.env
CLIENT_ORIGIN=https://app.your-domain.example,https://your-demo.pages.dev
ANALYTICS_DATABASE_URL=postgresql://...   # server-side only, never a VITE_ var
```

Leave `VITE_ANALYTICS_ENDPOINT` unset and the beacon posts same-origin, which is
what a self-hosted deployment wants. Leave `ANALYTICS_DATABASE_URL` unset and
the endpoint accepts and discards — page views simply are not recorded.

---

## Running it for real

You need your own credentials. Nothing here ships with working keys.

### 1. Provision the services

| Service | What you need |
|---|---|
| **MongoDB Atlas** | A free M0 cluster. Copy the SRV connection string. |
| **AWS S3** | A **private** bucket for resume PDFs. |
| **AWS SQS** | One standard queue plus a dead-letter queue for failures. |
| **AWS IAM** | A user scoped to S3 `PutObject`/`GetObject` and SQS `SendMessage`, `ReceiveMessage`, `DeleteMessage`, `ChangeMessageVisibility`. Nothing wider. |
| **LLM endpoint** | Any OpenAI-compatible endpoint — AWS Bedrock, OpenAI, or a local server. You need a base URL, a key and a model id. |
| **Firebase** *(optional)* | Realtime Database for live batch progress. Without it, progress falls back to polling. |

The bucket must allow browser `PUT` from your frontend origin:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["http://localhost:5173", "https://your-domain.example"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

There is a helper for this: `cd server && npx tsx src/scripts/setup-cors.ts`.

### 2. Turn demo mode off

The demo is one folder plus fourteen fenced blocks across seven files — an
import and a use site in each. Every block looks like this, and deleting it
(markers included) always leaves valid, correct code behind. There are no
manual fix-ups.

```tsx
/* DEMO-ONLY:START */
import { DEMO_MODE } from '../demo/demoConfig';
/* DEMO-ONLY:END */
```

Delete the folder, then strip the blocks:

```bash
rm -rf client/src/demo
```

```bash
python3 - <<'EOF'
import pathlib, re
pat = re.compile(r'[ \t]*\{?/\* ?DEMO-ONLY:START.*?DEMO-ONLY:END ?\*/\}?\n?', re.S)
for f in pathlib.Path('client/src').rglob('*.ts*'):
    s = f.read_text()
    if 'DEMO-ONLY' in s:
        f.write_text(pat.sub('', s))
        print('cleaned', f)
EOF
```

Or open the seven files and delete the blocks by hand — `grep -rn "DEMO-ONLY"
client/src` lists them. Either way, confirm:

```bash
grep -rn "DEMO-ONLY\|demo/" client/src   # prints nothing
cd client && npx tsc --noEmit            # passes clean
```

That restores the axios adapter and every form to normal. The seven touch
points are `App.tsx`, `services/api.ts`, `pages/LoginPage.tsx`,
`pages/RegisterPage.tsx`, `pages/UploadPage.tsx`, `components/jobs/JobForm.tsx`
and `components/ui/ChangePasswordModal.tsx`.

### 3. Configure

```bash
cp .env.example server/.env          # then fill in every value
cp client/.env.example client/.env
```

`server/.env` needs:

```ini
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/inference

JWT_SECRET=<32+ random characters>
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=<a different 32+ random characters>
REFRESH_TOKEN_EXPIRES_IN=7d

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<your IAM key>
AWS_SECRET_ACCESS_KEY=<your IAM secret>
S3_BUCKET_NAME=<your private bucket>
SQS_QUEUE_URL=https://sqs.<region>.amazonaws.com/<account>/inference-resume-queue
SQS_DLQ_URL=https://sqs.<region>.amazonaws.com/<account>/inference-resume-dlq

OPENAI_API_KEY=<your model key>
OPENAI_BASE_URL=<your OpenAI-compatible base URL>
AI_MODEL_ID=<model id>

CLIENT_ORIGIN=http://localhost:5173
```

Generate the JWT secrets with `openssl rand -hex 32`. `server/.env` and
`client/.env` are both gitignored — keep it that way.

Firebase is optional. If you want live progress, add `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` and `FIREBASE_DATABASE_URL`, and
apply `database.rules.json`.

### 4. Run

```bash
cd server && npm install && cd ../client && npm install
```

Three processes, three terminals:

```bash
cd server && npm run dev          # API on :8080
```

```bash
cd server && npm run dev:worker   # SQS consumer
```

```bash
cd client && npm run dev          # SPA on :5173
```

Register an account at `http://localhost:5173/register`, create a job, and drop
some PDFs in. Need test resumes? `seed/generate_resumes.py` produces a few
hundred synthetic ones across five roles — same distributions the demo fixture
uses, so a local run looks like the same hiring pipeline:

```bash
pip install reportlab && python seed/generate_resumes.py
```

Output lands in `seed/resumes/` (gitignored).

Or use Docker for the API and worker together:

```bash
docker compose up --build
```

### 5. Tests

```bash
cd server && npm test
```

Integration tests need a reachable `MONGODB_URI`; the GitHub Actions workflow
starts MongoDB for you.

---

## API shape

Success:

```json
{ "success": true, "data": {} }
```

Paginated responses add `meta`:

```json
{ "meta": { "page": 1, "limit": 25, "total": 0, "totalPages": 0 } }
```

Errors:

```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "Readable message" },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## Deploying the demo yourself

The demo is a static bundle — no server, no environment variables.

```bash
cd client && npm run build     # → client/dist
```

On Cloudflare Pages: build command `npm run build`, build output `dist`, root
directory `client`. `public/_redirects` already contains the SPA fallback
(`/* /index.html 200`) so deep links survive a refresh. Netlify, Vercel and
GitHub Pages work the same way.

## License

MIT.
