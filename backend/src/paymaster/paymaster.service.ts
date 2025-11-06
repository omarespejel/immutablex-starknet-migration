import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { backOff } from 'exponential-backoff';
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

        const response = await fetch(`${this.getPaymasterUrl()}/sponsor`, {
          method: 'POST',
          headers,
          body: JSON.stringify(transaction),
        });

        let responseData: any;
        try {
          responseData = await response.json();
        } catch (e) {
          // If response is not JSON, use status text
          responseData = { error: response.statusText };
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
    // Similar to sponsorTransaction but for account deployment
    const headers = await this.getAuthHeaders();

    return await backOff(
      async () => {
        const response = await fetch(`${this.getPaymasterUrl()}/sponsor-account-deployment`, {
          method: 'POST',
          headers,
          body: JSON.stringify(deployPayload),
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
