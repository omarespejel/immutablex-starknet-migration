import { Module, Logger } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { WalletModule } from './wallet/wallet.module';
import { SessionModule } from './session/session.module';
import { GameModule } from './game/game.module';
import { PaymasterModule } from './paymaster/paymaster.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 10,  // 10 requests per minute
    }]),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT!) || 6379,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            console.log(`Redis connection attempt ${times}`);
            if (times > 3) {
              console.error('Redis connection failed after 3 attempts');
              // Don't throw - let app start without Redis
              return null;
            }
            return Math.min(times * 1000, 3000);
          },
          connectTimeout: 5000,
          lazyConnect: true, // Defer connection to avoid blocking module initialization
          enableReadyCheck: false, // Disable ready check to prevent blocking
        },
      }),
    }),
    SessionModule,
    WalletModule,
    GameModule,
    PaymasterModule,
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  onModuleInit() {
    this.logger.log('All modules initialized successfully!');
  }
}
