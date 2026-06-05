import { Logger } from '@nestjs/common';

const BACKOFF_DELAYS = [1000, 5000, 25000]; // 1s, 5s, 25s

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  logger?: Logger,
  label = 'operation',
): Promise<{ result: T; intentos: number }> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return { result, intentos: attempt };
    } catch (err) {
      lastError = err as Error;
      logger?.warn(`${label} — intento ${attempt}/${maxAttempts} fallido: ${lastError.message}`);

      if (attempt < maxAttempts) {
        const delay = BACKOFF_DELAYS[attempt - 1] ?? 25000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}
