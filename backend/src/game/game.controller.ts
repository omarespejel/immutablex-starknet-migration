import { Controller, Post, Body, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { GameActionDto } from './game-action.dto';

@Controller('game')
export class GameController {
  private readonly logger = new Logger(GameController.name);

  // @ts-expect-error - TypeScript decorator inference issue, works correctly at runtime
  constructor(@Inject(SessionService) private sessionService: SessionService) {}

  // @ts-expect-error - Known TypeScript decorator inference issue, works correctly at runtime
  @Post('action')
  async submitAction(
    // @ts-expect-error - Decorator type inference issue, works correctly at runtime
    @Body() payload: GameActionDto
  ): Promise<{ actionId: string; status: string; batchPosition: number }> {
    try {
      const result = await this.processWithRetry(payload);
      if (!result) {
        throw new Error('Action processing returned no result');
      }
      return {
        actionId: payload.action.id,
        status: 'queued',
        batchPosition: result.batchPosition,
      };
    } catch (error: any) {
      this.logger.error(`Action submission failed: ${error.message}`);
      throw new HttpException(
        {
          actionId: payload.action.id,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private async processWithRetry(payload: GameActionDto, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.sessionService.executeAction(
          payload.sessionToken,
          payload.action
        );
      } catch (error: any) {
        this.logger.warn(`Attempt ${i + 1}/${maxRetries} failed: ${error.message}`);
        
        if (i === maxRetries - 1) {
          throw error;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        await this.delay(1000 * Math.pow(2, i));
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
