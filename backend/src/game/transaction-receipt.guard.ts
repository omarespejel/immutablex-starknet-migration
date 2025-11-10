import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RpcProvider } from 'starknet';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TransactionReceiptGuard {
  private readonly logger = new Logger(TransactionReceiptGuard.name);
  private provider: RpcProvider | null = null;
  private pendingTransactions = new Map<string, any>();

  constructor(
    private configService: ConfigService,
    @Optional() @InjectQueue('transactions') private txQueue?: Queue,
  ) {
    // Only start monitoring if queue is available
    if (this.txQueue) {
      setInterval(() => this.checkPendingTransactions(), 10000);
    }
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

  async trackTransaction(txHash: string, originalData: any) {
    this.pendingTransactions.set(txHash, {
      ...originalData,
      attempts: 0,
      submittedAt: Date.now(),
    });
  }

  private async checkPendingTransactions() {
    const provider = this.getProvider();
    for (const [txHash, data] of this.pendingTransactions.entries()) {
      try {
        const receipt = await provider.getTransactionReceipt(txHash);

        if (receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1') {
          this.logger.log(`Transaction confirmed: ${txHash}`);
          this.pendingTransactions.delete(txHash);
        } else if (receipt.status === 'REJECTED') {
          this.logger.warn(`Transaction rejected, requeuing: ${txHash}`);
          await this.requeueTransaction(data);
          this.pendingTransactions.delete(txHash);
        }
      } catch (error: any) {
        // Transaction not found yet, check timeout
        if (Date.now() - data.submittedAt > 300000) { // 5 minutes timeout
          this.logger.error(`Transaction timeout, requeuing: ${txHash}`);
          await this.requeueTransaction(data);
          this.pendingTransactions.delete(txHash);
        }
      }
    }
  }

  private async requeueTransaction(data: any) {
    if (!this.txQueue) {
      this.logger.error('Cannot requeue - no queue available');
      return;
    }

    if (data.attempts < 3) {
      await this.txQueue.add('batch-action', {
        ...data,
        attempts: data.attempts + 1,
        requeued: true,
      }, {
        delay: 5000 * (data.attempts + 1), // Exponential delay
      });
    } else {
      this.logger.error(`Max retries exceeded for transaction`);
      // Store in dead letter queue or alert
    }
  }
}
