import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../src/app';
import { Batch } from '../../src/models/Batch';
import { Job } from '../../src/models/Job';
import { Resume } from '../../src/models/Resume';
import { auth, clearTestDB, closeTestDB, connectTestDB, registerAndLogin } from './helpers';

describe('resume routes', () => {
  beforeAll(connectTestDB);
  beforeEach(clearTestDB);
  afterAll(closeTestDB);

  async function seedResumes() {
    const { token, userId } = await registerAndLogin();
    const createdBy = new mongoose.Types.ObjectId(userId);
    const job = await Job.create({
      title: 'Data Engineer',
      description: 'Build data pipelines.',
      requiredSkills: ['Python', 'Spark'],
      minExperienceYears: 3,
      minEducation: 'bachelor',
      createdBy,
    });
    const batch = await Batch.create({ jobId: job._id, createdBy, totalResumes: 20, processedResumes: 20, status: 'completed' });
    const docs = Array.from({ length: 20 }, (_, index) => ({
      batchId: batch._id,
      jobId: job._id,
      createdBy,
      s3Key: `resume-${index}`,
      originalFileName: `resume-${index}.pdf`,
      fileSizeBytes: 1000,
      status: 'completed',
      extractedData: {
        candidateName: `Candidate ${index}`,
        email: `candidate${index}@example.com`,
        phone: '555',
        skills: index % 2 === 0 ? ['Python'] : ['Spark'],
        totalExperienceYears: index,
        highestEducation: 'Bachelor',
        previousCompanies: ['Acme'],
        aiSummary: 'Good match.',
      },
      scoreBreakdown: {
        skillsScore: 20,
        experienceScore: 20,
        educationScore: 14,
        fitScore: index % 10,
        totalScore: index * 5,
      },
      hrStatus: 'pending',
    }));
    const resumes = await Resume.insertMany(docs);
    return { token, batch, resumes };
  }

  it('lists resumes sorted by score and filters by score/status', async () => {
    const { token, batch } = await seedResumes();
    const listed = await request(app).get(`/api/v1/resumes?batchId=${batch._id.toString()}&limit=25`).set('Authorization', auth(token));
    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(20);
    expect(listed.body.data[0].scoreBreakdown.totalScore).toBeGreaterThan(listed.body.data[1].scoreBreakdown.totalScore);

    const high = await request(app).get(`/api/v1/resumes?batchId=${batch._id.toString()}&minScore=80`).set('Authorization', auth(token));
    expect(high.body.data.every((resume: { scoreBreakdown: { totalScore: number } }) => resume.scoreBreakdown.totalScore >= 80)).toBe(true);

    const shortlisted = await request(app).get(`/api/v1/resumes?batchId=${batch._id.toString()}&hrStatus=shortlisted`).set('Authorization', auth(token));
    expect(shortlisted.body.data).toHaveLength(0);
  });

  it('updates individual and bulk HR status and exports CSV', async () => {
    const { token, batch, resumes } = await seedResumes();
    const updated = await request(app)
      .put(`/api/v1/resumes/${resumes[0]._id.toString()}/status`)
      .set('Authorization', auth(token))
      .send({ hrStatus: 'shortlisted' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.hrStatus).toBe('shortlisted');

    const bulk = await request(app)
      .patch('/api/v1/resumes/bulk-status')
      .set('Authorization', auth(token))
      .send({ resumeIds: resumes.slice(1, 4).map((resume) => resume._id.toString()), hrStatus: 'rejected' });
    expect(bulk.status).toBe(200);
    expect(bulk.body.data.updated).toBe(3);

    const csv = await request(app).get(`/api/v1/resumes/export?batchId=${batch._id.toString()}`).set('Authorization', auth(token));
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text).toContain('Rank,Name,Email');
  });
});
