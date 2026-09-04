import type { IResume } from '../models/Resume';

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  const str = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const csvHeaders = [
  'Rank',
  'Name',
  'Email',
  'Phone',
  'Total Score',
  'Skills Score',
  'Experience Score',
  'Education Score',
  'AI Fit Score',
  'Skills Found',
  'Experience Years',
  'Education',
  'Previous Companies',
  'AI Summary',
  'Status',
  'HR Notes',
].join(',') + '\n';

export function getCsvRow(resume: IResume, index: number): string {
  const d = resume.extractedData;
  const s = resume.scoreBreakdown;
  return [
    index + 1,
    escapeCsvValue(d?.candidateName),
    escapeCsvValue(d?.email),
    escapeCsvValue(d?.phone),
    s?.totalScore ?? '',
    s?.skillsScore ?? '',
    s?.experienceScore ?? '',
    s?.educationScore ?? '',
    s?.fitScore ?? '',
    escapeCsvValue(d?.skills?.join('; ')),
    d?.totalExperienceYears ?? '',
    escapeCsvValue(d?.highestEducation),
    escapeCsvValue(d?.previousCompanies?.join('; ')),
    escapeCsvValue(d?.aiSummary),
    resume.hrStatus,
    escapeCsvValue(resume.hrNote),
  ].join(',') + '\n';
}

export function generateCSV(resumes: IResume[], jobTitle?: string): string {
  void jobTitle;
  return (csvHeaders + resumes.map((resume, index) => getCsvRow(resume, index)).join('')).replace(/\n$/, '');
}
