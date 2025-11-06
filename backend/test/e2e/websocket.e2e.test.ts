import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { io, Socket } from 'socket.io-client';

describe('WebSocket Gateway', () => {
  let socket: Socket;

  beforeAll((done) => {
    socket = io('http://localhost:3000', {
      transports: ['websocket'],
    });
    socket.on('connect', done);
  });

  afterAll(() => {
    socket.close();
  });

  test('should receive action confirmation', (done) => {
    socket.emit('gameAction', {
      sessionToken: 'mock_token',
      action: {
        id: 'test_action_1',
        method: 'game_action',
        parameters: { test: true },
      },
    });

    socket.on('actionConfirmed', (data) => {
      expect(data.actionId).toBe('test_action_1');
      expect(data.status).toBe('queued');
      done();
    });
  });
});
