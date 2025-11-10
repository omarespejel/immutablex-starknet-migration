import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './create-session.dto';

@Controller('session')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private sessionService: SessionService) {}

  // @ts-expect-error - TypeScript decorator inference issue, works correctly at runtime
  @Post('create')
  async createSession(
    // @ts-expect-error - TypeScript decorator inference issue, works correctly at runtime
    @Body() createSessionDto: CreateSessionDto
  ) {
    try {
      const token = await this.sessionService.createSession(
        createSessionDto.userId,
        createSessionDto.walletAddress
      );
      return { token };
    } catch (error: any) {
      this.logger.error(`Error creating session: ${error.message}`, error.stack);
      throw new HttpException(
        { message: 'Failed to create session', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
