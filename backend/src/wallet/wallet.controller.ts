import { Controller, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(ThrottlerGuard)
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private walletService: WalletService) {}

  @Post('generate')
  generateWallet() {
    // POW-style: Returns private key for client storage
    return this.walletService.generateWallet();
  }

  @Post('create')
  async createWallet(@Body() body: { userId: string }) {
    this.logger.log(`Creating managed wallet for user: ${body.userId}`);
    // Backend-managed: Encrypts and stores key on backend
    return await this.walletService.createUserWallet(body.userId);
  }
}
