/**
 * ConnectivityLayer provides robust utilities for network-based tool interactions,
 * including retries, rate limiting, and timeout management.
 */

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatuses?: number[];
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

export class ConnectivityLayer {
  /**
   * Executes an async function with exponential backoff retries.
   */
  public static async withRetry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: any;
    let delay = opts.initialDelay;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        const isRetryable = this.isRetryableError(error, opts);
        if (!isRetryable || attempt === opts.maxRetries) {
          break;
        }

        console.warn(`[ConnectivityLayer] Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
      }
    }

    throw lastError;
  }

  private static isRetryableError(error: any, options: RetryOptions): boolean {
    // Check for network-level errors (e.g., fetch failure)
    if (error.message?.includes('network') || error.message?.includes('failed to fetch') || error.message?.includes('timeout')) {
      return true;
    }

    // Check for HTTP status codes if available
    const status = error.status || (error.message?.match(/HTTP Error: (\d+)/)?.[1]);
    if (status && options.retryableStatuses?.includes(Number(status))) {
      return true;
    }

    return false;
  }

  /**
   * Simple rate limiter to prevent API abuse.
   */
  private static rateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  public static async withRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<void> {
    const now = Date.now();
    const limitInfo = this.rateLimits.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > limitInfo.resetTime) {
      limitInfo.count = 0;
      limitInfo.resetTime = now + windowMs;
    }

    if (limitInfo.count >= limit) {
      const waitTime = limitInfo.resetTime - now;
      console.warn(`[ConnectivityLayer] Rate limit exceeded for ${key}. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.withRateLimit(key, limit, windowMs); // Recursively try again after waiting
    }

    limitInfo.count++;
    this.rateLimits.set(key, limitInfo);
  }
}
