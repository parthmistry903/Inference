/**
 * DEMO-ONLY · Builds the entire fixture: jobs, batches, resumes, scores.
 *
 * Everything is derived, not hand-written. Scores come from the production
 * formula (`./scoring.ts`), summaries from the evidence behind those scores
 * (`./summary.ts`), and HR decisions from a triage model that gets stricter the
 * older a batch is — so a batch opened yesterday is mostly still `pending`
 * while one from six weeks ago is fully worked through.
 */

import { DEMO_SEED, DEMO_USER } from './demoConfig';
import {
  ARCHETYPES,
  EMAIL_PROVIDERS,
  FAILURE_REASONS,
  FIRST_NAMES,
  HR_NOTES,
  JOBS,
  LAST_NAMES,
  REFERRERS,
  type Archetype,
  type ArchetypeKey,
  type JobSpec,
} from './catalog';
import { chance, float, int, makeRng, objectId, pick, sample, weighted, type Rng } from './rng';
import { computeScore, educationRank, matchedSkills } from './scoring';
import { writeSummary } from './summary';
import type { Batch, Job, Resume } from '../types';

const DAY = 24 * 60 * 60 * 1000;
const MODEL_ID = 'nvidia.nemotron-super-3-120b';
const PROMPT_VERSION = '2026-07-01.v1';

export interface DemoDataset {
  jobs: Job[];
  batches: Batch[];
  resumes: Resume[];
  /** Batch id that plays out the queued → processing → completed sequence. */
  liveBatchId: string | null;
}

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

function makeEmail(rng: Rng, first: string, last: string): string {
  const f = first.toLowerCase();
  const l = last.toLowerCase();
  const local = weighted(rng, [
    [`${f}.${l}`, 45],
    [`${f}${l}`, 20],
    [`${f[0]}${l}`, 20],
    [`${f}.${l[0]}${int(rng, 10, 99)}`, 15],
  ]);
  return `${local}@${pick(rng, EMAIL_PROVIDERS)}`;
}

function makeFileName(rng: Rng, first: string, last: string): string {
  return weighted(rng, [
    [`${first}_${last}_Resume.pdf`, 34],
    [`${first}${last}_CV.pdf`, 18],
    [`resume-${first.toLowerCase()}-${last.toLowerCase()}.pdf`, 16],
    [`${first} ${last} Resume.pdf`, 14],
    [`${first}_${last}_Resume_2026.pdf`, 10],
    [`CV_${last}_${first}.pdf`, 8],
  ]);
}

/**
 * Pick an education entry, biased toward the head or tail of the pool and
 * constrained so the timeline holds up: nobody has more years of experience
 * than have passed since their bachelor's degree (+1 for internship overlap).
 * Master's and PhD entries are exempt — people routinely go back to study
 * after several years of work.
 */
function pickEducation(rng: Rng, pool: string[], archetype: Archetype, years: number, now: number): string {
  const { educationBias: bias, maxCareerGap } = archetype;
  const currentYear = new Date(now).getFullYear();

  const gradYearOf = (entry: string) => Number(/(\d{4})\s*$/.exec(entry)?.[1] ?? 0);
  const notYetGraduated = (entry: string) => {
    const gradYear = gradYearOf(entry);
    return gradYear !== 0 && gradYear > currentYear - years + 1;
  };

  // Postgraduate degrees are exempt from both bounds: people go back to study
  // mid-career, so an MBA dated after several years of work is normal.
  const plausible = pool.filter((entry) => {
    if (educationRank(entry) >= 17) return true;
    if (notYetGraduated(entry)) return false;
    const gradYear = gradYearOf(entry);
    return gradYear === 0 || gradYear >= currentYear - years - maxCareerGap;
  });
  // Relax the career-gap bound before giving up entirely.
  const fallback = pool.filter((entry) => educationRank(entry) >= 17 || !notYetGraduated(entry));
  const usable = plausible.length > 0 ? plausible : fallback.length > 0 ? fallback : pool.slice(0, 1);

  if (bias === 'top' && chance(rng, 0.7)) return pick(rng, usable.slice(0, 3));
  if (bias === 'tail' && chance(rng, 0.6)) return pick(rng, usable.slice(-3));
  return pick(rng, usable);
}

/**
 * The candidate's self-reported skill list: a slice of the job's required
 * skills sized by archetype, plus unrelated extras that carry no score.
 */
function buildSkills(rng: Rng, job: JobSpec, archetypeKey: ArchetypeKey): string[] {
  const archetype = ARCHETYPES[archetypeKey];
  const [minCov, maxCov] = archetype.coverage;
  const coverage = float(rng, minCov, maxCov, 2);
  const take = Math.max(1, Math.round(coverage * job.requiredSkills.length));

  const covered = sample(rng, job.requiredSkills, take);
  const extras = sample(rng, job.extraSkills, int(rng, archetype.extras[0], archetype.extras[1]));

  // Shuffled together so the table never reveals which entries were the match.
  return sample(rng, [...covered, ...extras], covered.length + extras.length);
}

type Decision = Resume['hrStatus'];

/** How far down a batch the recruiter has got, as a function of its age. */
function triageRate(daysAgo: number): number {
  if (daysAgo >= 30) return 1;
  if (daysAgo >= 14) return 0.88;
  if (daysAgo >= 7) return 0.72;
  if (daysAgo >= 3) return 0.55;
  return 0.4;
}

/**
 * Recruiters work down the ranked list, so a half-triaged batch has decisions
 * on its best candidates and `pending` on the tail — not a random scatter.
 * The 0.9/0.12 probabilities keep the boundary soft rather than a hard cliff.
 */
function isTriaged(rng: Rng, rankIndex: number, batchSize: number, rate: number): boolean {
  const reached = Math.round(rate * batchSize);
  return chance(rng, rankIndex < reached ? 0.9 : 0.12);
}

/** Decisions correlate with score, but humans overrule the model sometimes. */
function decide(rng: Rng, totalScore: number): Decision {
  if (totalScore >= 80) return weighted<Decision>(rng, [['shortlisted', 80], ['review', 14], ['rejected', 6]]);
  if (totalScore >= 68) return weighted<Decision>(rng, [['shortlisted', 28], ['review', 45], ['rejected', 27]]);
  if (totalScore >= 55) return weighted<Decision>(rng, [['review', 24], ['rejected', 76]]);
  return weighted<Decision>(rng, [['rejected', 96], ['review', 4]]);
}

function noteFor(rng: Rng, decision: Decision): string | undefined {
  if (decision === 'pending') return undefined;
  const template = pick(rng, HR_NOTES[decision]);
  return template.replace('{referrer}', pick(rng, REFERRERS));
}

export function generateDataset(now = Date.now()): DemoDataset {
  const rng = makeRng(DEMO_SEED);

  const jobs: Job[] = [];
  const batches: Batch[] = [];
  const resumes: Resume[] = [];
  const usedNames = new Set<string>();
  let liveBatchId: string | null = null;

  for (const spec of JOBS) {
    const jobId = objectId(rng);
    const jobCreatedAt = now - spec.createdDaysAgo * DAY;

    jobs.push({
      _id: jobId,
      title: spec.title,
      description: spec.description,
      requiredSkills: spec.requiredSkills,
      minExperienceYears: spec.minExperienceYears,
      minEducation: spec.minEducation,
      createdBy: DEMO_USER._id,
      status: spec.status,
      isDeleted: false,
      createdAt: iso(jobCreatedAt),
      updatedAt: iso(jobCreatedAt + int(rng, 1, 6) * 60 * 60 * 1000),
    });

    for (const batchSpec of spec.batches) {
      const batchId = objectId(rng);
      const batchCreatedAt = now - batchSpec.daysAgo * DAY;
      const startedAt = batchCreatedAt + int(rng, 8, 40) * 1000;
      // ~18-26s of wall clock per resume once worker concurrency is factored in.
      const processingMs = batchSpec.total * int(rng, 18, 26) * 1000;
      const isLive = batchSpec.mode === 'live';
      const processed = batchSpec.total - batchSpec.failed;

      if (isLive) liveBatchId = batchId;

      batches.push({
        _id: batchId,
        jobId,
        createdBy: DEMO_USER._id,
        totalResumes: batchSpec.total,
        processedResumes: isLive ? 0 : processed,
        failedResumes: isLive ? 0 : batchSpec.failed,
        status: isLive ? 'queued' : batchSpec.failed > 0 ? 'partial' : 'completed',
        startedAt: isLive ? null : iso(startedAt),
        completedAt: isLive ? null : iso(startedAt + processingMs),
        createdAt: iso(batchCreatedAt),
        updatedAt: iso(isLive ? batchCreatedAt : startedAt + processingMs),
      });

      // Which slots in this batch failed to parse.
      const failedSlots = new Set(
        sample(rng, Array.from({ length: batchSpec.total }, (_, i) => i), batchSpec.failed),
      );
      const rate = triageRate(batchSpec.daysAgo);
      /** Successfully scored resumes in this batch, pending triage below. */
      const scored: Resume[] = [];

      for (let slot = 0; slot < batchSpec.total; slot += 1) {
        const archetypeKey = weighted(rng, spec.archetypes);
        const archetype = ARCHETYPES[archetypeKey];

        let first = pick(rng, FIRST_NAMES);
        let last = pick(rng, LAST_NAMES);
        for (let attempt = 0; attempt < 12 && usedNames.has(`${first} ${last}`); attempt += 1) {
          first = pick(rng, FIRST_NAMES);
          last = pick(rng, LAST_NAMES);
        }
        usedNames.add(`${first} ${last}`);
        const candidateName = `${first} ${last}`;

        const resumeId = objectId(rng);
        const fileName = makeFileName(rng, first, last);
        const resumeCreatedAt = batchCreatedAt + slot * int(rng, 200, 900);
        const base: Pick<Resume, '_id' | 'batchId' | 'jobId' | 'createdBy' | 's3Key' | 'originalFileName' | 'fileSizeBytes' | 'createdAt'> = {
          _id: resumeId,
          batchId,
          jobId,
          createdBy: DEMO_USER._id,
          s3Key: `resumes/${DEMO_USER._id}/${batchId}/${resumeId}.pdf`,
          originalFileName: fileName,
          fileSizeBytes: int(rng, 88_000, 480_000),
          createdAt: iso(resumeCreatedAt),
        };

        if (failedSlots.has(slot)) {
          // A failed resume never reaches the scorer, so it is never triaged.
          resumes.push({
            ...base,
            status: 'failed',
            failureReason: pick(rng, FAILURE_REASONS),
            hrStatus: 'pending',
          });
          continue;
        }

        const years = float(rng, archetype.years[0], archetype.years[1], 1);
        const skills = buildSkills(rng, spec, archetypeKey);
        const education = pickEducation(rng, spec.education, archetype, years, now);
        const fit = int(rng, archetype.fit[0], archetype.fit[1]);

        const scoreBreakdown = computeScore({
          job: spec,
          candidateSkills: skills,
          totalExperienceYears: years,
          highestEducation: education,
          fitScore: fit,
        });

        // Derived from the final skill list, so the prose can never disagree
        // with the number the scorer produced.
        const matched = matchedSkills(spec.requiredSkills, skills);
        const missing = spec.requiredSkills.filter((skill) => !matched.includes(skill));

        const companyCount = years >= 4 ? 2 : chance(rng, 0.45) ? 2 : 1;
        const previousCompanies = sample(rng, spec.companies, companyCount);
        const priorTitle = pick(rng, spec.priorTitles);

        const aiSummary = writeSummary({
          rng,
          firstName: first,
          role: spec.role,
          archetype,
          years,
          minYears: spec.minExperienceYears,
          company: previousCompanies[0],
          priorTitle,
          matched,
          missing,
          requiredCount: spec.requiredSkills.length,
          educationScore: scoreBreakdown.educationScore,
          education,
          totalScore: scoreBreakdown.totalScore,
        });

        const processedAt = startedAt + Math.round(((slot + 1) / batchSpec.total) * processingMs);

        scored.push({
          ...base,
          status: isLive ? 'queued' : 'completed',
          extractedData: {
            candidateName,
            email: makeEmail(rng, first, last),
            phone: `+91 ${int(rng, 70000, 99999)} ${int(rng, 10000, 99999)}`,
            skills,
            totalExperienceYears: years,
            highestEducation: education,
            previousCompanies,
            aiSummary,
          },
          scoreBreakdown,
          scoringMetadata: {
            modelId: MODEL_ID,
            promptVersion: PROMPT_VERSION,
            scoredAt: iso(processedAt),
            isStale: false,
            jobSnapshot: {
              title: spec.title,
              description: spec.description,
              requiredSkills: spec.requiredSkills,
              minExperienceYears: spec.minExperienceYears,
              minEducation: spec.minEducation,
            },
          },
          hrStatus: 'pending',
          processedAt: iso(processedAt),
        });
      }

      // Decisions are assigned in score order, not upload order, so a batch
      // that is only half worked through has its top candidates resolved.
      const ranked = scored
        .slice()
        .sort((a, b) => (b.scoreBreakdown?.totalScore ?? 0) - (a.scoreBreakdown?.totalScore ?? 0));

      ranked.forEach((resume, rankIndex) => {
        if (isLive || !isTriaged(rng, rankIndex, ranked.length, rate)) return;
        const decision = decide(rng, resume.scoreBreakdown?.totalScore ?? 0);
        resume.hrStatus = decision;
        resume.reviewedAt = iso(new Date(resume.createdAt).getTime() + int(rng, 4, 40) * 60 * 60 * 1000);
        if (chance(rng, 0.26)) resume.hrNote = noteFor(rng, decision);
      });

      resumes.push(...scored);
    }
  }

  return { jobs, batches, resumes, liveBatchId };
}
