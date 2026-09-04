/**
 * DEMO-ONLY · Port of the real scoring rules.
 *
 * These functions are a line-for-line mirror of `deterministicScores()` in
 * `server/src/services/scoring.service.ts`. The demo runs candidates through
 * the *same* arithmetic the production worker uses, so every number on screen
 * — skills 0-40, experience 0-30, education 0-20, AI fit 0-10 — is the number
 * the live system would have produced for that resume against that job.
 *
 * Only `fitScore` differs: in production it comes back from the LLM. Here it is
 * synthesised from the candidate archetype (see `generate.ts`).
 */

import type { Job, ScoreBreakdown } from '../types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** PhD 20 · Master/MBA 17 · Bachelor 14 · High school 8 · unrecognised 0. */
export function educationRank(text: string): number {
  const normalized = text.toLowerCase();
  if (/\b(phd|ph\.d|doctorate)\b/.test(normalized)) return 20;
  if (/\b(master|masters|m\.s\.|ms|mtech|m\.tech|mba)\b/.test(normalized)) return 17;
  if (/\b(bachelor|bachelors|b\.s\.|bs|btech|b\.tech|be|b\.e\.)\b/.test(normalized)) return 14;
  if (/\b(high school|secondary|hsc)\b/.test(normalized)) return 8;
  return 0;
}

/** Required skills the candidate demonstrably has, matched whole-word. */
export function matchedSkills(requiredSkills: string[], candidateSkills: string[]): string[] {
  const evidence = candidateSkills.join(' ').toLowerCase();
  return requiredSkills
    .map((skill) => skill.trim())
    .filter(Boolean)
    .filter((skill) => new RegExp(`\\b${escapeRegExp(skill.toLowerCase())}\\b`, 'i').test(evidence));
}

interface ScoreInput {
  job: Pick<Job, 'requiredSkills' | 'minExperienceYears' | 'minEducation'>;
  candidateSkills: string[];
  totalExperienceYears: number;
  highestEducation: string;
  fitScore: number;
}

export function computeScore({
  job,
  candidateSkills,
  totalExperienceYears,
  highestEducation,
  fitScore,
}: ScoreInput): ScoreBreakdown {
  const required = job.requiredSkills.map((skill) => skill.trim()).filter(Boolean);
  const matched = matchedSkills(required, candidateSkills);
  const skillsScore = required.length > 0 ? clamp((matched.length / required.length) * 40, 0, 40) : 0;

  const experienceScore =
    job.minExperienceYears <= 0
      ? 30
      : totalExperienceYears <= 0
        ? 0
        : clamp((Math.min(totalExperienceYears, job.minExperienceYears) / job.minExperienceYears) * 30, 0, 30);

  const rank = educationRank(highestEducation);
  const educationScore = job.minEducation === 'any' && rank > 0 ? 14 : rank;

  const fit = clamp(fitScore, 0, 10);

  return {
    skillsScore,
    experienceScore,
    educationScore,
    fitScore: fit,
    totalScore: skillsScore + experienceScore + educationScore + fit,
  };
}
