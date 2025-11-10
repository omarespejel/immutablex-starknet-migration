import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcProvider, hash } from 'starknet';
import { backOff } from 'exponential-backoff';
import { PaymasterService } from '../paymaster/paymaster.service';

@Processor('wallet-deployment')
export class WalletDeploymentProcessor {
  private readonly logger = new Logger(WalletDeploymentProcessor.name);
  private provider: RpcProvider | null = null;

  constructor(
    private configService: ConfigService,
    private paymasterService: PaymasterService,
  ) {}

  private getProvider(): RpcProvider {
    if (!this.provider) {
      // Updated for v0.9 RPC compatibility
      this.provider = new RpcProvider({
        nodeUrl: this.configService.get('STARKNET_RPC') || 'https://starknet-sepolia.public.blastapi.io',
        headers: {
          'Content-Type': 'application/json',
        },
        specVersion: '0.9.0',
      });
    }
    return this.provider;
  }

  // @ts-expect-error - Bull decorator type inference issue, works correctly at runtime
  @Process('deploy-account')
  async handleDeployAccount(job: Job<any>): Promise<any> {
    const { userWallet } = job.data;

    try {
      // Deploy with exponential backoff
      const result = await backOff(
        () => this.deployAccountWithPaymaster(userWallet),
        {
          numOfAttempts: 5,
          startingDelay: 1000,
          timeMultiple: 2,
          maxDelay: 30000,
          jitter: 'full',
          retry: (error, attemptNumber) => {
            this.logger.warn(`Deploy attempt ${attemptNumber} failed: ${error.message}`);
            // Retry on network errors, not on invalid data
            return !error.message.includes('invalid') && !error.message.includes('rejected');
          },
        }
      );

      // Get transaction hash from paymaster response (handle both formats)
      const txHash = result.transaction_hash || result.transactionHash || result.hash;
      if (!txHash) {
        throw new Error('Paymaster response missing transaction hash');
      }

      // Poll for receipt confirmation
      const receipt = await this.pollTransactionReceipt(txHash);

      this.logger.log(`Account deployed successfully: ${userWallet.address}, tx: ${txHash}`);
      return receipt;
    } catch (error: any) {
      this.logger.error(`Failed to deploy account after all retries: ${error?.message || String(error)}`);
      throw error;
    }
  }

  private async deployAccountWithPaymaster(userWallet: any) {
    const accountClassHash = this.configService.get('ACCOUNT_CLASS_HASH') || '0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f';
    const deployAccountPayload = {
      classHash: accountClassHash,
      constructorCalldata: [userWallet.publicKey],
      contractAddress: userWallet.address,
      addressSalt: userWallet.publicKey,
    };

    return await this.paymasterService.sponsorAccountDeployment(deployAccountPayload);
  }

  private async pollTransactionReceipt(txHash: string, maxAttempts = 60) {
    const provider = this.getProvider();
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const receipt = await provider.getTransactionReceipt(txHash) as any;

        // v8 uses status field (not finality_status)
        if (receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1') {
          return receipt;
        }

        // Check execution_status for rejections/reverts
        if (receipt.execution_status === 'REVERTED') {
          throw new Error(`Transaction reverted: ${txHash}, reason: ${receipt.revert_reason || 'unknown'}`);
        }
      } catch (error: any) {
        if (!error.message?.includes('Transaction not found')) {
          throw error;
        }
      }

      // Wait 2 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error(`Transaction receipt timeout: ${txHash}`);
  }
}
