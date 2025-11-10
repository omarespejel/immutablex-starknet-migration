import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletDeploymentProcessor } from './wallet-deployment.processor';
import { PaymasterModule } from '../paymaster/paymaster.module';

@Module({
  imports: [
    // ADD CONDITIONAL CHECK like SessionModule and GameModule
    ...(process.env.SKIP_REDIS !== 'true' ? [
      BullModule.registerQueue({
        name: 'wallet-deployment',
      })
    ] : []),
    PaymasterModule,
  ],
  providers: [
    WalletService,
    // Only register processor when queue is available
    ...(process.env.SKIP_REDIS !== 'true' ? [WalletDeploymentProcessor] : []),
  ],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
