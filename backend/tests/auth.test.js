import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/auth.js';

const prisma = new PrismaClient();

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller - Login', () => {
  let testUser;

  beforeEach(async () => {
    // Clean up any existing test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'testuser@example.com'],
        },
      },
    });

    // Create a test user
    const passwordHash = await bcrypt.hash('testpassword123', 10);
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      },
    });
  });

  afterEach(async () => {
    // Clean up test user
    if (testUser) {
      await prisma.user.delete({
        where: { id: testUser.id },
      }).catch(() => {});
    }
  });

  it('should fail login with incorrect email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'testpassword123',
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  it('should fail login with incorrect password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  it('should fail login with missing email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        password: 'testpassword123',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email and password are required');
  });

  it('should fail login with missing password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email and password are required');
  });

  it('should succeed login with correct credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.user.name).toBe('Test User');
    expect(response.body.user.role).toBe('user');
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.length).toBeGreaterThan(0);
  });
});
