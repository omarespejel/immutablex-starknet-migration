import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transactions',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [SessionService],
  controllers: [SessionController],
  exports: [SessionService],
})
export class SessionModule {}
