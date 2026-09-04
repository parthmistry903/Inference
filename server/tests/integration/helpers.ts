import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../src/app';

export async function connectTestDB(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export async function clearTestDB(): Promise<void> {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function closeTestDB(): Promise<void> {
  await mongoose.connection.close();
}

export async function registerAndLogin(email = 'hr@example.com'): Promise<{ token: string; userId: string; cookie: string[] }> {
  await request(app).post('/api/v1/auth/register').send({
    name: 'Inference HR',
    email,
    password: 'Password123',
  });
  const login = await request(app).post('/api/v1/auth/login').send({ email, password: 'Password123' });
  const cookieHeader = login.headers['set-cookie'];
  const cookie = Array.isArray(cookieHeader) ? cookieHeader : cookieHeader ? [cookieHeader] : [];
  return {
    token: login.body.data.accessToken as string,
    userId: login.body.data.user._id as string,
    cookie,
  };
}

export function auth(token: string): string {
  return `Bearer ${token}`;
}
