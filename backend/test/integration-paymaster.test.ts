import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { mockPaymaster, cleanupMocks } from './setup';

describe('Paymaster Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    mockPaymaster();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    cleanupMocks();
    if (app) {
      await app.close();
    }
  });

  test('should check paymaster health', async () => {
    const response = await request(app.getHttpServer())
      .get('/paymaster/test')
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.supportedTokens).toBeDefined();
  });

  test('should sponsor a test transaction', async () => {
    const response = await request(app.getHttpServer())
      .post('/paymaster/test-sponsor')
      .send({
        userAddress: '0x0000000000000000000000000000000000000000000000000000000000000001'
      })
      .expect(200);

    expect(response.body).toBeDefined();
    // Will fail if no credits, but structure should be valid
  });
});

