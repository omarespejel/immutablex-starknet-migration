import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PaymasterService } from '../paymaster/paymaster.service';
import { TransactionReceiptGuard } from './transaction-receipt.guard';

@Processor('transactions')
export class TransactionBatchProcessor {
  private readonly logger = new Logger(TransactionBatchProcessor.name);
  private actionBatch: any[] = [];
  private readonly BATCH_SIZE = 100;

  constructor(
    private paymasterService: PaymasterService,
    private receiptGuard: TransactionReceiptGuard,
  ) {}

  @Process('batch-action')
  async handleBatchAction(job: Job) {
    this.actionBatch.push(job.data);

    if (this.actionBatch.length >= this.BATCH_SIZE) {
      await this.submitBatch();
    }
  }

  private async submitBatch() {
    if (this.actionBatch.length === 0) return;

    this.logger.log(`Submitting batch of ${this.actionBatch.length} actions`);

    try {
      // Group by user and submit
      const userActions = this.groupByUser(this.actionBatch);

      for (const [userId, actions] of Object.entries(userActions)) {
        await this.submitUserBatch(userId, actions);
      }

      this.actionBatch = [];
      this.logger.log('Batch submitted successfully');
    } catch (error) {
      this.logger.error('Batch submission failed', error);
    }
  }

  private groupByUser(actions: any[]): Record<string, any[]> {
    return actions.reduce((groups, action) => {
      const userId = action.userId;
      if (!groups[userId]) groups[userId] = [];
      groups[userId].push(action);
      return groups;
    }, {});
  }

  private async submitUserBatch(userId: string, actions: any[]) {
    // Submit with paymaster
    const sponsored = await this.paymasterService.sponsorTransaction({
      userId,
      actions,
    });

    // Track transaction for receipt monitoring
    if (sponsored.transaction_hash || sponsored.transactionHash) {
      const txHash = sponsored.transaction_hash || sponsored.transactionHash;
      await this.receiptGuard.trackTransaction(txHash, {
        userId,
        actions,
      });
    }

    this.logger.log(`Batch sponsored: ${sponsored.transaction_hash || sponsored.transactionHash}`);
    return sponsored;
  }
}
