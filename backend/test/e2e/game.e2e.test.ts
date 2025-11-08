import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { mockStarknetRpc, mockPaymaster, cleanupMocks } from '../setup';

describe('Game API (e2e)', () => {
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

  test('/game/action (POST)', async () => {
    // First create a session
    const sessionResponse = await request(app.getHttpServer())
      .post('/session/create')
      .send({
        userId: 'test_user',
        walletAddress: '0x123',
      })
      .expect(201);

    const sessionToken = sessionResponse.body.token;

    // Then submit a game action
    const response = await request(app.getHttpServer())
      .post('/game/action')
      .send({
        sessionToken,
        action: {
          id: 'test_action_1',
          method: 'game_action',
          parameters: { test: true },
        },
      })
      .expect(201);

    expect(response.body).toHaveProperty('actionId', 'test_action_1');
    expect(response.body).toHaveProperty('status', 'queued');
    expect(response.body).toHaveProperty('batchPosition');
  });
});
