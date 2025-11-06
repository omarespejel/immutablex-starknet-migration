import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { mockStarknetRpc, mockPaymaster, cleanupMocks } from '../setup';

describe('Wallet API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    mockStarknetRpc();
    mockPaymaster();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    cleanupMocks();
    await app.close();
  });

  test('/wallet/create (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/wallet/create')
      .send({ userId: 'test_user' })
      .expect(201);

    expect(response.body).toHaveProperty('address');
    expect(response.body).toHaveProperty('publicKey');
    expect(response.body.deploymentStatus).toBe('queued');
  });

  test('should rate limit wallet creation', async () => {
    const server = app.getHttpServer();

    // Make 10 requests (should succeed)
    for (let i = 0; i < 10; i++) {
      await request(server)
        .post('/wallet/create')
        .send({ userId: `user_${i}` })
        .expect(201);
    }

    // 11th request should be rate limited
    await request(server)
      .post('/wallet/create')
      .send({ userId: 'user_11' })
      .expect(429); // Too Many Requests
  });
});
