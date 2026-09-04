import { generateCSV } from '../../src/services/csv.service';
import type { IResume } from '../../src/models/Resume';

function mockResume(name: string, score: number, note: string): IResume {
  return {
    extractedData: {
      candidateName: name,
      email: `${name.toLowerCase()}@example.com`,
      phone: '555-0100',
      skills: ['React', 'Node'],
      totalExperienceYears: 4,
      highestEducation: 'Bachelor',
      previousCompanies: ['Acme', 'Globex'],
      aiSummary: 'Strong candidate, high relevance',
    },
    scoreBreakdown: {
      totalScore: score,
      skillsScore: 35,
      experienceScore: 25,
      educationScore: 14,
      fitScore: 8,
    },
    hrStatus: 'pending',
    hrNote: note,
  } as IResume;
}

describe('generateCSV', () => {
  it('generates headers and one row per resume', () => {
    const csv = generateCSV([mockResume('Ada', 82, ''), mockResume('Grace', 75, ''), mockResume('Linus', 63, '')], 'Engineer');
    const rows = csv.split('\n');
    expect(rows).toHaveLength(4);
    expect(rows[0].startsWith('Rank,Name,Email,Phone,Total Score')).toBe(true);
  });

  it('uses sequential ranks and joins arrays with semicolons', () => {
    const csv = generateCSV([mockResume('Ada', 82, ''), mockResume('Grace', 75, '')], 'Engineer');
    expect(csv).toContain('1,Ada');
    expect(csv).toContain('2,Grace');
    expect(csv).toContain('React; Node');
    expect(csv).toContain('Acme; Globex');
  });

  it('quotes commas and escapes double quotes', () => {
    const csv = generateCSV([mockResume('Ada', 82, 'Said "yes"')], 'Engineer');
    expect(csv).toContain('"Strong candidate, high relevance"');
    expect(csv).toContain('"Said ""yes"""');
  });
});
