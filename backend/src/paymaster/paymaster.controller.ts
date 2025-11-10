import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { PaymasterService } from './paymaster.service';

@Controller('paymaster')
export class PaymasterController {
  private readonly logger = new Logger(PaymasterController.name);

  constructor(private paymasterService: PaymasterService) {}

  @Get('test')
  async testPaymaster() {
    try {
      // Test health check
      const health = await this.paymasterService.checkHealth();

      // Test getting supported tokens
      const tokens = await this.paymasterService.getSupportedTokens();

      // Test sponsor activity
      const activity = await this.paymasterService.getSponsorActivity();

      return {
        status: 'success',
        health,
        supportedTokens: tokens,
        sponsorActivity: activity,
      };
    } catch (error: any) {
      this.logger.error(`Paymaster test failed: ${error.message}`);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }

  @Post('test-sponsor')
  async testSponsorTransaction(@Body() body: any) {
    const testTransaction = {
      userAddress: body.userAddress || '0x1234...',
      calls: [{
        contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        entrypoint: 'transfer',
        calldata: ['0x123', '1000', '0']
      }],
      gasTokenAddress: '0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080' // USDC
    };

    return await this.paymasterService.sponsorTransaction(testTransaction);
  }
}

