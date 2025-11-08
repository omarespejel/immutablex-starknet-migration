import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { GameController } from './game.controller';
import { TransactionBatchProcessor } from './transaction-batch.processor';
import { TransactionReceiptGuard } from './transaction-receipt.guard';
import { SessionModule } from '../session/session.module';
import { PaymasterModule } from '../paymaster/paymaster.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transactions',
    }),
    SessionModule,
    PaymasterModule,
  ],
  controllers: [GameController],
  providers: [TransactionBatchProcessor, TransactionReceiptGuard],
})
export class GameModule {}
