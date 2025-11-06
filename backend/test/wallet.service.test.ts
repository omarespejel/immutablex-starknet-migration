import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { Test } from '@nestjs/testing';
import { WalletService } from '../src/wallet/wallet.service';
import { ConfigModule } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import { mockStarknetRpc, mockPaymaster, cleanupMocks } from './setup';

describe('WalletService', () => {
  let service: WalletService;

  beforeAll(async () => {
    mockStarknetRpc();
    mockPaymaster();

    const mockQueue = {
      add: async () => ({ id: 'test-job-id' }),
    };

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.example',
        }),
      ],
      providers: [
        WalletService,
        {
          provide: getQueueToken('wallet-deployment'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  afterAll(() => {
    cleanupMocks();
  });

  test('should create a new wallet', async () => {
    const userId = 'test_user_123';
    const wallet = await service.createUserWallet(userId);

    expect(wallet).toBeDefined();
    expect(wallet.address).toMatch(/^0x/);
    expect(wallet.publicKey).toBeDefined();
    expect(wallet.encryptedPrivateKey).toBeDefined();
    expect(wallet.deploymentStatus).toBe('queued');
  });

  test('should encrypt and decrypt keys correctly', () => {
    const userId = 'test_user';
    const privateKey = '0x1234567890abcdef';

    const encrypted = service['encryptKey'](privateKey, userId);
    const decrypted = service['decryptKey'](encrypted, userId);

    expect(decrypted).toBe(privateKey);
  });
});
