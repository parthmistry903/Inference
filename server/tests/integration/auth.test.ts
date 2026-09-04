import request from 'supertest';
import { app } from '../../src/app';
import { clearTestDB, closeTestDB, connectTestDB } from './helpers';

describe('auth routes', () => {
  beforeAll(connectTestDB);
  beforeEach(clearTestDB);
  afterAll(closeTestDB);

  it('registers a user without exposing passwordHash', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Inference HR',
      email: 'hr@example.com',
      password: 'Password123',
    });
    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe('hr@example.com');
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects duplicate and invalid registrations', async () => {
    const payload = { name: 'Inference HR', email: 'hr@example.com', password: 'Password123' };
    await request(app).post('/api/v1/auth/register').send(payload);
    const duplicate = await request(app).post('/api/v1/auth/register').send(payload);
    const invalid = await request(app).post('/api/v1/auth/register').send({ ...payload, email: 'bad' });
    expect(duplicate.status).toBe(409);
    expect(invalid.status).toBe(400);
  });

  it('logs in, reads me, refreshes, and logs out', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Inference HR',
      email: 'hr@example.com',
      password: 'Password123',
    });
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'hr@example.com', password: 'Password123' });
    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toEqual(expect.any(String));
    expect(login.headers['set-cookie']).toBeDefined();

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(me.status).toBe(200);

    const noToken = await request(app).get('/api/v1/auth/me');
    expect(noToken.status).toBe(401);

    const refresh = await request(app).post('/api/v1/auth/refresh').set('Cookie', login.headers['set-cookie']);
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.accessToken).toEqual(expect.any(String));

    const logout = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(logout.status).toBe(200);
  });

  it('rejects wrong login password', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Inference HR',
      email: 'hr@example.com',
      password: 'Password123',
    });
    const response = await request(app).post('/api/v1/auth/login').send({ email: 'hr@example.com', password: 'wrong' });
    expect(response.status).toBe(401);
  });

  it('does not reset passwords from name and email alone', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Inference HR',
      email: 'hr@example.com',
      password: 'Password123',
    });

    const reset = await request(app).post('/api/v1/auth/forgot-password').send({
      name: 'Inference HR',
      email: 'hr@example.com',
      newPassword: 'Attacker123',
    });
    expect(reset.status).toBe(501);

    const oldPassword = await request(app).post('/api/v1/auth/login').send({ email: 'hr@example.com', password: 'Password123' });
    expect(oldPassword.status).toBe(200);

    const newPassword = await request(app).post('/api/v1/auth/login').send({ email: 'hr@example.com', password: 'Attacker123' });
    expect(newPassword.status).toBe(401);
  });
});
