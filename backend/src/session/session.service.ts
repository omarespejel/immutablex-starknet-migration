import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JwtService } from '@nestjs/jwt';
import { ec, stark } from 'starknet';
import * as crypto from 'crypto';

interface SessionKey {
  sessionPrivateKey: string;
  sessionPublicKey: string;
  masterAddress: string;
  expiry: number;
  maxGasPerTx: string;
  allowedMethods: string[];
  userId: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private activeSessions = new Map<string, SessionKey>();

  constructor(
    @InjectQueue('transactions') private txQueue: Queue,
    private jwtService: JwtService,
  ) {}

  async createSession(userId: string, walletAddress: string): Promise<string> {
    // Generate session keys
    const sessionPrivateKey = stark.randomAddress();
    const sessionPublicKey = ec.starkCurve.getStarkKey(sessionPrivateKey);

    const session: SessionKey = {
      sessionPrivateKey,
      sessionPublicKey,
      masterAddress: walletAddress,
      expiry: Date.now() + (24 * 60 * 60 * 1000),
      maxGasPerTx: '0.001',
      allowedMethods: ['game_action', 'claim_reward', 'update_score', 'buy_upgrade'],
      userId,
    };

    const sessionId = crypto.randomBytes(16).toString('hex');
    this.activeSessions.set(sessionId, session);

    const token = this.jwtService.sign({
      sessionId,
      sessionPublicKey,
      expiry: session.expiry,
    });

    this.logger.log(`Session created for user ${userId}`);
    return token;
  }

  async executeAction(sessionToken: string, action: any) {
    const decoded = this.jwtService.verify(sessionToken) as { sessionId: string; sessionPublicKey: string; expiry: number };
    const session = this.activeSessions.get(decoded.sessionId);

    if (!session) throw new Error('Invalid session');
    if (Date.now() > session.expiry) throw new Error('Session expired');
    if (!session.allowedMethods.includes(action.method)) throw new Error('Method not allowed');

    await this.txQueue.add('batch-action', {
      sessionId: decoded.sessionId,
      userId: session.userId,
      action,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: 'Action queued',
      batchPosition: await this.txQueue.count(),
    };
  }

  getSession(sessionId: string): SessionKey {
    return this.activeSessions.get(sessionId);
  }
}
