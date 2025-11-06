import { Controller, Post, Body } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @Post('create')
  async createSession(@Body() body: { userId: string; walletAddress: string }) {
    const token = await this.sessionService.createSession(body.userId, body.walletAddress);
    return { token };
  }
}
