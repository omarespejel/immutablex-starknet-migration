import { Controller, Get, Post, Body, Logger, UseGuards, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './create-wallet.dto';

@Controller('wallet')
@UseGuards(ThrottlerGuard)
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(@Inject(WalletService) private walletService: WalletService) {}

  @Get('generate')
  generateWallet() {
    try {
      // POW-style: Returns private key for client storage
      // GET is more RESTful since this doesn't modify server state
      return this.walletService.generateWallet();
    } catch (error: any) {
      this.logger.error(`Error generating wallet: ${error.message}`, error.stack);
      throw new HttpException(
        { message: 'Failed to generate wallet', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('create')
  async createWallet(@Body() createWalletDto: CreateWalletDto) {
    try {
      this.logger.log(`Creating managed wallet for user: ${createWalletDto.userId}`);
      // Backend-managed: Encrypts and stores key on backend
      return await this.walletService.createUserWallet(createWalletDto.userId);
    } catch (error: any) {
      this.logger.error(`Error creating wallet: ${error.message}`, error.stack);
      throw new HttpException(
        { message: 'Failed to create wallet', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
