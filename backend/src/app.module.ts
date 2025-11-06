import { Module } from '@nestjs/common';
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
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    WalletModule,
    SessionModule,
    GameModule,
    PaymasterModule,
  ],
})
export class AppModule {}
