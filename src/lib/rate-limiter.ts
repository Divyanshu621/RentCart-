/**
 * In-Memory Rate Limiter
 * 
 * Uses a sliding window approach with in-memory storage.
 * For production with multiple instances, replace with Redis-backed rate limiting.
 * 
 * Usage:
 *   const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 });
 *   const result = limiter.check('user-ip-or-id');
 *   if (result.limited) return rate limit response;
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  retryAfterMs: number;
  totalRequests: number;
}

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

// In-memory store (reset on server restart, acceptable for single-instance)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setTimeout(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      // Remove entries with no recent requests
      if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 3600000) {
        store.delete(key);
      }
    }
    cleanupScheduled = false;
  }, 60000); // Every minute
}

export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let entry = store.get(identifier);

    if (!entry) {
      entry = { timestamps: [] };
      store.set(identifier, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

    const totalRequests = entry.timestamps.length;
    const remaining = Math.max(0, this.maxRequests - totalRequests);
    const limited = totalRequests >= this.maxRequests;

    let retryAfterMs = 0;
    if (limited && entry.timestamps.length > 0) {
      const oldestInWindow = entry.timestamps[0];
      retryAfterMs = oldestInWindow + this.windowMs - now;
    }

    if (!limited) {
      entry.timestamps.push(now);
    }

    scheduleCleanup();

    return { limited, remaining, retryAfterMs, totalRequests };
  }

  /** Reset rate limit for a specific identifier */
  reset(identifier: string): void {
    store.delete(identifier);
  }
}

// Pre-configured limiters for common use cases
export const rateLimiters = {
  /** Login: 20 attempts per 15 minutes */
  auth: new RateLimiter({ maxRequests: 20, windowMs: 15 * 60 * 1000 }),
  /** Registration: 10 per hour */
  register: new RateLimiter({ maxRequests: 10, windowMs: 60 * 60 * 1000 }),
  /** Password reset: 10 per hour */
  passwordReset: new RateLimiter({ maxRequests: 10, windowMs: 60 * 60 * 1000 }),
  /** General API: 120 per minute */
  api: new RateLimiter({ maxRequests: 120, windowMs: 60 * 1000 }),
  /** Payment endpoints: 30 per minute */
  payment: new RateLimiter({ maxRequests: 30, windowMs: 60 * 1000 }),
  /** File upload: 20 per minute */
  upload: new RateLimiter({ maxRequests: 20, windowMs: 60 * 1000 }),
  /** Coupon validation: 30 per minute */
  coupon: new RateLimiter({ maxRequests: 30, windowMs: 60 * 1000 }),
  /** Admin API: 200 per minute */
  admin: new RateLimiter({ maxRequests: 200, windowMs: 60 * 1000 }),
  /** Search/listing: 60 per minute */
  search: new RateLimiter({ maxRequests: 60, windowMs: 60 * 1000 }),
};

/**
 * Extract client IP from request headers
 * Falls back to a hash of the origin header so that
 * different preview users get separate rate-limit buckets.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    // Use origin header as a fallback identifier so different
    // preview users aren't all lumped under "unknown"
    request.headers.get('origin') ||
    'unknown'
  );
}

/**
 * Create a rate-limit response (429 Too Many Requests)
 */
export function rateLimitResponse(retryAfterMs: number) {
  const retrySec = Math.ceil(retryAfterMs / 1000);
  const minutes = Math.floor(retrySec / 60);
  const seconds = retrySec % 60;
  let waitMsg = 'Please try again later.';
  if (minutes > 0) {
    waitMsg = `Please try again in ${minutes}m ${seconds}s.`;
  } else if (seconds > 0) {
    waitMsg = `Please try again in ${seconds}s.`;
  }

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: waitMsg,
      retryAfter: retrySec,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retrySec),
      },
    }
  );
}
