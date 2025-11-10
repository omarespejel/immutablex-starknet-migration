import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
// @ts-expect-error - Queue must be runtime import for decorator, despite verbatimModuleSyntax
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { Account, ec, stark, RpcProvider, hash, Contract } from 'starknet';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private provider: RpcProvider | null = null;

  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    // Make queue OPTIONAL so it doesn't break when SKIP_REDIS=true
    @Optional()
    // @ts-expect-error - Known TypeScript decorator inference issue with Bull, works correctly at runtime
    @InjectQueue('wallet-deployment') private deploymentQueue?: Queue,
  ) {
    // RpcProvider initialization moved to lazy getter to avoid connection issues
  }

  private getProvider(): RpcProvider {
    if (!this.provider) {
      // Updated for v0.9 RPC compatibility
      this.provider = new RpcProvider({
        nodeUrl: this.configService.get('STARKNET_RPC') || 'https://starknet-sepolia.public.blastapi.io',
        headers: {
          'Content-Type': 'application/json',
        },
        specVersion: '0.9.0',
      });
    }
    return this.provider;
  }

  // POW-style: Generate wallet and return private key for client storage
  generateWallet() {
    this.logger.log('[WALLET] Generating POW-style wallet');

    const privateKey = stark.randomAddress();
    const publicKey = ec.starkCurve.getStarkKey(privateKey);

    // Calculate account address
    const accountClassHash = this.configService.get('ACCOUNT_CLASS_HASH') || '0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f';
    const accountAddress = hash.calculateContractAddressFromHash(
      publicKey,
      accountClassHash,
      [publicKey],
      0
    );

    this.logger.log(`[WALLET] Generated wallet: ${accountAddress.substring(0, 10)}...`);

    // Return private key for Unity to store on device
    return {
      privateKey,
      address: accountAddress,
      publicKey,
    };
  }

  // Backend-managed: Encrypt and store key on backend
  async createUserWallet(userId: string) {
    this.logger.log(`[WALLET] Creating managed wallet for user: ${userId}`);

    // Generate keys
    const privateKey = stark.randomAddress();
    const publicKey = ec.starkCurve.getStarkKey(privateKey);

    // Calculate account address
    const accountClassHash = this.configService.get('ACCOUNT_CLASS_HASH') || '0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f';
    const accountAddress = hash.calculateContractAddressFromHash(
      publicKey,
      accountClassHash,
      [publicKey],
      0
    );

    // Encrypt private key
    const encryptedKey = this.encryptKey(privateKey, userId);

    // Check if queue exists before using it
    if (this.deploymentQueue) {
      // Queue deployment instead of doing it synchronously
      await this.deploymentQueue.add('deploy-account', {
        userWallet: {
          address: accountAddress,
          publicKey,
          userId,
        },
      }, {
        delay: 5000, // Wait 5 seconds before deployment
        priority: 1,
      });

      this.logger.log(`[WALLET] User ${userId} created wallet: ${accountAddress.substring(0, 10)}...`);

      return {
        address: accountAddress,
        publicKey,
        encryptedPrivateKey: encryptedKey,
        deploymentStatus: 'queued',
      };
    } else {
      // Queue not available - return without queuing
      this.logger.warn('Deployment queue not available - skipping deployment');
      return {
        address: accountAddress,
        publicKey,
        encryptedPrivateKey: encryptedKey,
        deploymentStatus: 'not_queued',
      };
    }
  }

  private encryptKey(privateKey: string, userId: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(userId, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  decryptKey(encryptedKey: string, userId: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(userId, 'salt', 32);
    const parts = encryptedKey.split(':');
    
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('Invalid encrypted key format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
