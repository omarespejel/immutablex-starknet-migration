import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { backOff } from 'exponential-backoff';
import { validateAndParseAddress } from 'starknet';
import * as crypto from 'crypto';

interface PaymasterCache {
  headers: Record<string, string>;
  expiresAt: number;
}

@Injectable()
export class PaymasterService {
  private readonly logger = new Logger(PaymasterService.name);
  private paymasterUrl: string | null = null;
  private apiKey: string | null = null;
  private authCache: PaymasterCache | null = null;
  private requestQueue: Promise<any>[] = [];
  private readonly MAX_CONCURRENT = 10;

  constructor(private configService: ConfigService) {}

  private getPaymasterUrl(): string {
    if (!this.paymasterUrl) {
      this.paymasterUrl = this.configService.get('AVNU_PAYMASTER_URL') || 'https://sepolia.paymaster.avnu.fi';
    }
    return this.paymasterUrl;
  }

  private getApiKey(): string {
    if (!this.apiKey) {
      this.apiKey = this.configService.get('AVNU_API_KEY') || '';
    }
    return this.apiKey;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    // Cache auth headers for 1 hour
    if (this.authCache && this.authCache.expiresAt > Date.now()) {
      return this.authCache.headers;
    }

    const headers = {
      'Content-Type': 'application/json',
      'API-Key': this.getApiKey(),
      'X-Request-ID': crypto.randomUUID(),
    };

    this.authCache = {
      headers,
      expiresAt: Date.now() + 3600000, // 1 hour
    };

    return headers;
  }

  async sponsorTransaction(transaction: any): Promise<any> {
    return await backOff(
      async () => {
        const headers = await this.getAuthHeaders();

        // VALIDATE ADDRESS FORMAT (must be 66 chars: 0x + 64 hex)
        let validUserAddress: string;
        try {
          validUserAddress = validateAndParseAddress(transaction.userAddress);
        } catch (error: any) {
          throw new Error(`Invalid user address format: ${error.message}. Address must be 66 characters (0x + 64 hex)`);
        }

        // Clean payload - remove undefined fields (AVNU doesn't like them)
        const payload: any = {
          userAddress: validUserAddress, // Now guaranteed to be 0x + 64 hex chars
          calls: transaction.calls.map((call: any) => {
            // Support both field name formats (to/contractAddress, entrypoint/selector)
            const contractAddr = call.contractAddress || call.to;
            const entrypoint = call.entrypoint || call.selector;
            
            // Validate contract address
            let validContractAddr: string;
            try {
              validContractAddr = validateAndParseAddress(contractAddr);
            } catch (error: any) {
              throw new Error(`Invalid contract address format: ${error.message}`);
            }

            return {
              to: validContractAddr,
              contractAddress: validContractAddr, // Support both
              entrypoint: entrypoint,
              selector: entrypoint, // Support both
              calldata: call.calldata || [],
            };
          }),
        };

        // Only add optional fields if they exist
        if (transaction.gasTokenAddress) {
          payload.gasTokenAddress = transaction.gasTokenAddress;
        }
        if (transaction.maxGasTokenAmount) {
          payload.maxGasTokenAmount = transaction.maxGasTokenAmount;
        }

        // Use correct AVNU endpoint: /api/v1/paymaster/build (REST API, not JSON-RPC)
        const response = await fetch(`${this.getPaymasterUrl()}/api/v1/paymaster/build`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        let responseData: any;
        try {
          responseData = await response.json();
        } catch (e) {
          // If response is not JSON, use status text
          responseData = { error: response.statusText };
        }

        // Check for JSON-RPC error format (shouldn't happen with REST API)
        if (responseData.error?.code === -32700) {
          throw new Error('Payload format error - check AVNU documentation. Possible issues: invalid addresses, missing credits, or rate limiting');
        }

        // Handle specific error codes
        if (!response.ok) {
          const error = this.parsePaymasterError(response.status, responseData);

          // Determine if error is retryable
          if (error.retryable) {
            throw new Error(`Retryable error: ${error.message}`);
          } else {
            throw new Error(`Non-retryable error: ${error.message}`);
          }
        }

        return responseData;
      },
      {
        numOfAttempts: 5,
        startingDelay: 1000,
        timeMultiple: 2,
        maxDelay: 30000,
        retry: (error) => {
          return error.message.includes('Retryable');
        },
      }
    );
  }

  async sponsorAccountDeployment(deployPayload: any): Promise<any> {
    // Use build endpoint for account deployment as well
    const headers = await this.getAuthHeaders();

    return await backOff(
      async () => {
        // Convert deployment payload to build format
        const buildPayload = {
          userAddress: deployPayload.contractAddress,
          calls: [{
            contractAddress: deployPayload.classHash,
            entrypoint: 'deploy_account',
            calldata: deployPayload.constructorCalldata || [],
          }],
        };

        const response = await fetch(`${this.getPaymasterUrl()}/api/v1/paymaster/build`, {
          method: 'POST',
          headers,
          body: JSON.stringify(buildPayload),
        });

        if (!response.ok) {
          let errorData: any;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { error: response.statusText };
          }
          const error = this.parsePaymasterError(response.status, errorData);

          if (error.retryable) {
            throw new Error(`Retryable: ${error.message}`);
          }
          throw new Error(`Fatal: ${error.message}`);
        }

        try {
          return await response.json();
        } catch (e) {
          return { transaction_hash: 'unknown', success: true };
        }
      },
      {
        numOfAttempts: 3,
        startingDelay: 2000,
      }
    );
  }

  async checkHealth(): Promise<any> {
    const response = await fetch(`${this.getPaymasterUrl()}/health`);
    return await response.json();
  }

  async getSupportedTokens(): Promise<any> {
    // Gas tokens endpoint is not publicly documented in AVNU API
    // Return empty array or contact AVNU for supported tokens
    this.logger.warn('Gas tokens endpoint not publicly available. Contact AVNU for supported tokens.');
    return [];
  }

  async getSponsorActivity(): Promise<any> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const headers = await this.getAuthHeaders();
    // Correct endpoint: /api/v1/paymaster/activity (not /sponsor/activity)
    const response = await fetch(
      `${this.getPaymasterUrl()}/api/v1/paymaster/activity?` +
      `startDate=${weekAgo.toISOString().split('T')[0]}&` +
      `endDate=${today.toISOString().split('T')[0]}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get activity: ${response.statusText}`);
    }

    return await response.json();
  }

  private parsePaymasterError(status: number, data: any) {
    const errorMap: Record<number, { message: string; retryable: boolean }> = {
      429: { message: 'Rate limit exceeded', retryable: true },
      503: { message: 'Service temporarily unavailable', retryable: true },
      502: { message: 'Bad gateway', retryable: true },
      500: { message: 'Internal server error', retryable: true },
      401: { message: 'Invalid API key', retryable: false },
      400: { message: `Bad request: ${data.error || 'Invalid data'}`, retryable: false },
      402: { message: 'Insufficient credits', retryable: false },
    };

    return errorMap[status] || {
      message: `Unknown error: ${status}`,
      retryable: status >= 500,
    };
  }
}
