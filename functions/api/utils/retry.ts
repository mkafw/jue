export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 2,
  onRetry: () => {},
  shouldRetry: () => true,
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxAttempts) break;
      if (!opts.shouldRetry(lastError)) throw lastError;

      opts.onRetry(attempt, lastError);
      await sleep(opts.delay * Math.pow(opts.backoff, attempt - 1));
    }
  }

  throw lastError!;
}

export function isRetryableError(error: Error): boolean {
  const retryableMessages = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'rate limit',
    'timeout',
    'network',
  ];

  const message = error.message.toLowerCase();
  return retryableMessages.some(m => message.includes(m.toLowerCase()));
}

export async function withGitHubRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(fn, {
    ...options,
    shouldRetry: (error) => {
      if (!isRetryableError(error)) return false;
      return options.shouldRetry ? options.shouldRetry(error) : true;
    },
  });
}
