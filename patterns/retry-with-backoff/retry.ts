// Self-contained transient-failure handling: exponential backoff + FULL JITTER, plus a minimal
// circuit breaker. Two distinct controls — retry handles a single call's blip; the breaker stops
// hammering a dependency that's actually down.

export type RetryOptions = {
  retries?: number; // max attempts AFTER the first
  baseMs?: number; // base backoff window
  maxMs?: number; // cap on the window
  retryable?: (err: unknown) => boolean; // which errors are worth retrying
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { retries = 3, baseMs = 100, maxMs = 2000, retryable = () => true } = opts;
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      // Stop if out of attempts OR the error isn't worth retrying (auth, validation, 4xx...).
      if (attempt >= retries || !retryable(err)) throw err;
      // Full jitter: random point in [0, capped exponential window]. Spreads a fleet's retries
      // so they don't synchronize and stampede the dependency the moment it recovers.
      const window = Math.min(maxMs, baseMs * 2 ** attempt);
      await sleep(Math.random() * window);
      attempt++;
    }
  }
}

// Minimal circuit breaker: after `threshold` consecutive failures it opens (fails fast without
// calling), then half-opens after `cooldownMs` to probe recovery. Success closes it.
export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  constructor(private threshold = 5, private cooldownMs = 10_000) {}

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const isOpen = this.failures >= this.threshold && now - this.openedAt < this.cooldownMs;
    if (isOpen) throw new Error("circuit open: dependency unhealthy, failing fast");

    try {
      const out = await fn();
      this.failures = 0; // success closes the breaker
      return out;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.threshold) this.openedAt = now; // (re)open
      throw err;
    }
  }
}

// --- Worked usage -------------------------------------------------------------------------
// const breaker = new CircuitBreaker();
// const data = await breaker.exec(() =>
//   withRetry(() => fetchJson(url), {
//     retries: 4,
//     retryable: (e) => e instanceof NetworkError || (e as any)?.status >= 500,
//   }),
// );
