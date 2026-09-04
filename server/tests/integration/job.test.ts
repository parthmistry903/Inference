import request from 'supertest';
import { app } from '../../src/app';
import { auth, clearTestDB, closeTestDB, connectTestDB, registerAndLogin } from './helpers';

const jobPayload = {
  title: 'Senior Frontend Engineer',
  description: 'Build premium UI with React and TypeScript.',
  requiredSkills: ['React', 'TypeScript'],
  minExperienceYears: 4,
  minEducation: 'bachelor',
};

describe('job routes', () => {
  beforeAll(connectTestDB);
  beforeEach(clearTestDB);
  afterAll(closeTestDB);

  it('creates, lists, updates, filters, and deletes a job', async () => {
    const { token } = await registerAndLogin();
    const created = await request(app).post('/api/v1/jobs').set('Authorization', auth(token)).send(jobPayload);
    expect(created.status).toBe(201);

    const listed = await request(app).get('/api/v1/jobs').set('Authorization', auth(token));
    expect(listed.body.data).toHaveLength(1);

    const filtered = await request(app).get('/api/v1/jobs?status=active').set('Authorization', auth(token));
    expect(filtered.body.data[0].status).toBe('active');

    const updated = await request(app)
      .put(`/api/v1/jobs/${created.body.data._id}`)
      .set('Authorization', auth(token))
      .send({ title: 'Principal Frontend Engineer' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe('Principal Frontend Engineer');

    const deleted = await request(app).delete(`/api/v1/jobs/${created.body.data._id}`).set('Authorization', auth(token));
    expect(deleted.status).toBe(200);

    const afterDelete = await request(app).get('/api/v1/jobs').set('Authorization', auth(token));
    expect(afterDelete.body.data).toHaveLength(0);
  });

  it('prevents access to another user job', async () => {
    const first = await registerAndLogin('first@example.com');
    const second = await registerAndLogin('second@example.com');
    const created = await request(app).post('/api/v1/jobs').set('Authorization', auth(first.token)).send(jobPayload);
    const response = await request(app).get(`/api/v1/jobs/${created.body.data._id}`).set('Authorization', auth(second.token));
    expect(response.status).toBe(404);
  });
});
