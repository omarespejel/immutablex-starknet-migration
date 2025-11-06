import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletDeploymentProcessor } from './wallet-deployment.processor';
import { PaymasterModule } from '../paymaster/paymaster.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'wallet-deployment',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
      settings: {
        stalledInterval: 30000,
        maxStalledCount: 1,
      },
    }),
    PaymasterModule,
  ],
  providers: [WalletService, WalletDeploymentProcessor],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
