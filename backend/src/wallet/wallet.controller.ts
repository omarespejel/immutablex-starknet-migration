import { Controller, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(ThrottlerGuard)
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private walletService: WalletService) {}

  @Post('create')
  async createWallet(@Body() body: { userId: string }) {
    this.logger.log(`Creating wallet for user: ${body.userId}`);
    // Rate limited to 10 calls per minute
    return await this.walletService.createUserWallet(body.userId);
  }
}
