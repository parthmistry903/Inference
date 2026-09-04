import { mockClient } from 'aws-sdk-client-mock';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import request from 'supertest';
import { app } from '../../src/app';
import { Job } from '../../src/models/Job';
import { auth, clearTestDB, closeTestDB, connectTestDB, registerAndLogin } from './helpers';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://example.com/presigned.pdf'),
}));

const s3Mock = mockClient(S3Client);
const sqsMock = mockClient(SQSClient);

const jobPayload = {
  title: 'Backend Engineer',
  description: 'Build APIs.',
  requiredSkills: ['Node'],
  minExperienceYears: 3,
  minEducation: 'bachelor',
};

describe('upload routes', () => {
  beforeAll(connectTestDB);
  beforeEach(async () => {
    await clearTestDB();
    s3Mock.reset();
    sqsMock.reset();
    s3Mock.on(HeadObjectCommand).callsFake((input) => {
      const key = String(input.Key ?? '');
      const sizes = new Map([
        ['one.pdf', 1000],
        ['two.pdf', 2000],
        ['three.pdf', 3000],
      ]);
      const fileName = Array.from(sizes.keys()).find((name) => key.endsWith(`_${name}`));
      return { ContentLength: fileName ? sizes.get(fileName) : 1000, ContentType: 'application/pdf' };
    });
    sqsMock.on(SendMessageCommand).resolves({});
  });
  afterAll(closeTestDB);

  it('creates presigned URLs and confirms SQS messages', async () => {
    const { token } = await registerAndLogin();
    const job = await request(app).post('/api/v1/jobs').set('Authorization', auth(token)).send(jobPayload);
    const presigned = await request(app)
      .post('/api/v1/upload/presigned')
      .set('Authorization', auth(token))
      .send({
        jobId: job.body.data._id,
        files: [
          { name: 'one.pdf', size: 1000, mimeType: 'application/pdf' },
          { name: 'two.pdf', size: 2000, mimeType: 'application/pdf' },
          { name: 'three.pdf', size: 3000, mimeType: 'application/pdf' },
        ],
      });
    expect(presigned.status).toBe(200);
    expect(presigned.body.data.files).toHaveLength(3);

    const confirmed = await request(app)
      .post('/api/v1/upload/confirm')
      .set('Authorization', auth(token))
      .send({ batchId: presigned.body.data.batchId });
    expect(confirmed.status).toBe(200);
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(3);
    const message = sqsMock.commandCalls(SendMessageCommand)[0].args[0].input.MessageBody;
    expect(JSON.parse(message as string)).toEqual({ resumeId: expect.any(String), attempt: 1 });
  });

  it('rejects confirm when uploaded S3 objects are missing', async () => {
    s3Mock.reset();
    s3Mock.on(HeadObjectCommand).rejects(new Error('not found'));
    const { token } = await registerAndLogin();
    const job = await request(app).post('/api/v1/jobs').set('Authorization', auth(token)).send(jobPayload);
    const presigned = await request(app)
      .post('/api/v1/upload/presigned')
      .set('Authorization', auth(token))
      .send({
        jobId: job.body.data._id,
        files: [{ name: 'one.pdf', size: 1000, mimeType: 'application/pdf' }],
      });

    const confirmed = await request(app)
      .post('/api/v1/upload/confirm')
      .set('Authorization', auth(token))
      .send({ batchId: presigned.body.data.batchId });

    expect(confirmed.status).toBe(400);
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(0);
  });

  it('rejects invalid file counts, file types, sizes, and closed jobs', async () => {
    const { token } = await registerAndLogin();
    const job = await request(app).post('/api/v1/jobs').set('Authorization', auth(token)).send(jobPayload);
    const tooMany = await request(app)
      .post('/api/v1/upload/presigned')
      .set('Authorization', auth(token))
      .send({ jobId: job.body.data._id, files: Array.from({ length: 501 }, (_, i) => ({ name: `${i}.pdf`, size: 1000, mimeType: 'application/pdf' })) });
    expect(tooMany.status).toBe(400);

    const badType = await request(app)
      .post('/api/v1/upload/presigned')
      .set('Authorization', auth(token))
      .send({ jobId: job.body.data._id, files: [{ name: 'image.png', size: 1000, mimeType: 'image/png' }] });
    expect(badType.status).toBe(400);

    const tooLarge = await request(app)
      .post('/api/v1/upload/presigned')
      .set('Authorization', auth(token))
      .send({ jobId: job.body.data._id, files: [{ name: 'big.pdf', size: 11 * 1024 * 1024, mimeType: 'application/pdf' }] });
    expect(tooLarge.status).toBe(400);

    await Job.findByIdAndUpdate(job.body.data._id, { status: 'closed' });
    const closed = await request(app)
      .post('/api/v1/upload/presigned')
      .set('Authorization', auth(token))
      .send({ jobId: job.body.data._id, files: [{ name: 'ok.pdf', size: 1000, mimeType: 'application/pdf' }] });
    expect(closed.status).toBe(400);
  });
});
