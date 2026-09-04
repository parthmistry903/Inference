/**
 * DEMO-ONLY · Writes each candidate's AI summary.
 *
 * In production this string comes back from the LLM (see `buildPrompt()` in
 * `server/src/services/scoring.service.ts`, which asks for "2-3 sentences on
 * candidate fit for this specific role"). The demo composes it from the same
 * evidence the model would have been handed — matched and missing required
 * skills, years against the posting's bar, the parsed degree, and the final
 * score — so no summary ever contradicts the numbers beside it.
 */

import { pick, chance, type Rng } from './rng';
import type { Archetype } from './catalog';

interface SummaryInput {
  rng: Rng;
  firstName: string;
  role: string;
  archetype: Archetype;
  years: number;
  minYears: number;
  company: string;
  priorTitle: string;
  matched: string[];
  missing: string[];
  requiredCount: number;
  educationScore: number;
  education: string;
  totalScore: number;
}

/** "under a year" reads better than "0.4 years". */
function yearsPhrase(years: number): string {
  if (years < 1) return 'under a year of professional experience';
  if (years < 2) return 'just over a year of experience';
  return `${years} years of experience`;
}

function list(items: string[], limit = 4): string {
  const shown = items.slice(0, limit);
  const rest = items.length - shown.length;
  const joined =
    shown.length <= 1
      ? shown.join('')
      : `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`;
  return rest > 0 ? `${joined} (+${rest} more)` : joined;
}

function opener(input: SummaryInput): string {
  const { rng, firstName, role, archetype, years, company, priorTitle } = input;
  const seniority = archetype.seniority.toLowerCase();
  const lower = role.toLowerCase();

  return pick(rng, [
    `${firstName} is a ${seniority} ${lower} with ${yearsPhrase(years)}, most recently as ${indefinite(priorTitle)} at ${company}.`,
    `${firstName} brings ${yearsPhrase(years)} across ${lower} roles, the latest stretch at ${company}.`,
    `A ${seniority} ${lower} with ${yearsPhrase(years)}; last position was ${priorTitle} at ${company}.`,
    `${firstName} has ${yearsPhrase(years)}, working as ${indefinite(priorTitle)} at ${company}.`,
  ]);
}

function indefinite(noun: string): string {
  return /^[aeiou]/i.test(noun) ? `an ${noun}` : `a ${noun}`;
}

function skillsSentence(input: SummaryInput): string {
  const { rng, matched, requiredCount } = input;
  const count = matched.length;

  if (count === 0) {
    return `None of the ${requiredCount} required skills appear anywhere in the resume.`;
  }
  if (count === requiredCount) {
    return pick(rng, [
      `Every required skill on the posting is evidenced, including ${list(matched, 3)}.`,
      `Full coverage of all ${requiredCount} required skills — ${list(matched, 4)}.`,
    ]);
  }
  return pick(rng, [
    `Covers ${count} of ${requiredCount} required skills — ${list(matched)}.`,
    `${count} of ${requiredCount} listed requirements are evidenced: ${list(matched)}.`,
    `Skills match is ${count}/${requiredCount}, carried by ${list(matched)}.`,
    `The resume supports ${count} of the ${requiredCount} required skills, notably ${list(matched)}.`,
  ]);
}

function gapClause(input: SummaryInput): string | null {
  const { rng, missing, years, minYears, educationScore, education } = input;
  const clauses: string[] = [];

  if (missing.length > 0) {
    clauses.push(
      pick(rng, [
        `No evidence of ${list(missing, 3)}.`,
        `${list(missing, 3)} ${missing.length === 1 ? 'is' : 'are'} missing entirely.`,
        `Nothing in the resume touches ${list(missing, 3)}.`,
      ]),
    );
  }

  if (years + 0.05 < minYears) {
    const shortfall = Math.round((minYears - years) * 10) / 10;
    clauses.push(
      pick(rng, [
        `Experience is ${shortfall} ${shortfall === 1 ? 'year' : 'years'} short of the ${minYears}-year requirement.`,
        `Falls under the ${minYears}-year bar for this req.`,
      ]),
    );
  } else if (chance(rng, 0.45)) {
    clauses.push(
      pick(rng, [
        `Experience clears the ${minYears}-year bar comfortably.`,
        `Years of experience are above the ${minYears}-year requirement.`,
      ]),
    );
  }

  if (educationScore === 0) {
    clauses.push(
      pick(rng, [
        `Education is listed as "${education}" — no recognised degree was parsed, which zeroes the education component.`,
        `No formal degree could be parsed from the education section, so that component scores nothing.`,
      ]),
    );
  }

  if (clauses.length === 0) return null;
  return clauses.slice(0, 2).join(' ');
}

function verdict(input: SummaryInput): string {
  const { rng, totalScore } = input;

  if (totalScore >= 82) {
    return pick(rng, [
      'Recommend advancing straight to a technical screen.',
      'Clear shortlist for this role.',
      'Among the strongest matches in the batch — worth prioritising.',
    ]);
  }
  if (totalScore >= 70) {
    return pick(rng, [
      'Worth a screening call to probe the gaps.',
      'Solid enough to advance if the top of the batch thins out.',
      'Recommend a screen call before committing to a full loop.',
    ]);
  }
  if (totalScore >= 55) {
    return pick(rng, [
      'Reasonable backup rather than a first-round candidate.',
      'Hold as a maybe; the gaps are real but coachable.',
      'Would need a strong mentor on the team to be viable.',
    ]);
  }
  return pick(rng, [
    'Not a fit for this requisition as written.',
    'Too far from the requirements to advance.',
    'Recommend passing — the gap is structural, not a matter of framing.',
  ]);
}

export function writeSummary(input: SummaryInput): string {
  const parts = [opener(input), skillsSentence(input), gapClause(input), verdict(input)];
  return parts.filter(Boolean).join(' ');
}
