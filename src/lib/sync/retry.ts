export const MAX_RETRY_ATTEMPTS = 3;

export const INITIAL_RETRY_DELAY_MS = 1000;

export const MAX_RETRY_DELAY_MS = 30000;

export function getRetryDelay(attempt: number): number {
  const delay = INITIAL_RETRY_DELAY_MS * 2 ** attempt;
  return Math.min(delay, MAX_RETRY_DELAY_MS);
}

export function shouldRetry(attempt: number, maxAttempts: number = MAX_RETRY_ATTEMPTS): boolean {
  return attempt < maxAttempts;
}

export function formatRetryDelay(attempt: number): string {
  const ms = getRetryDelay(attempt);
  
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  if (ms < 60000) {
    return `${ms / 1000}s`;
  }
  
  const minutes = Math.floor(ms / 60000);
  const seconds = (ms % 60000) / 1000;
  
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: MAX_RETRY_ATTEMPTS,
  initialDelay: INITIAL_RETRY_DELAY_MS,
  maxDelay: MAX_RETRY_DELAY_MS,
  backoffMultiplier: 2,
};

export async function waitWithRetry(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): Promise<void> {
  const delay = Math.min(
    config.initialDelay * config.backoffMultiplier ** attempt,
    config.maxDelay
  );
  
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export function isRetryableError(error: unknown): boolean {
  if (!error) return false;
  
  if (error instanceof Error) {
    const retryableCodes = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "ENETUNREACH"];
    const message = error.message.toLowerCase();
    
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("fetch") ||
      retryableCodes.some((code) => message.includes(code.toLowerCase()))
    );
  }
  
  return true;
}