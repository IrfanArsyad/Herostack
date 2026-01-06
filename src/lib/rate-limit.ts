/**
 * Simple in-memory rate limiter for authentication endpoints
 * Limits requests per IP/identifier to prevent brute force attacks
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxAttempts: number; // Maximum attempts allowed
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // Seconds until reset
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, email)
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and metadata
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // No existing entry or entry has expired
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxAttempts - 1,
      resetIn: Math.ceil(config.windowMs / 1000),
    };
  }

  // Entry exists and is still valid
  if (entry.count >= config.maxAttempts) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  // Increment count
  entry.count++;
  rateLimitMap.set(identifier, entry);

  return {
    success: true,
    remaining: config.maxAttempts - entry.count,
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}

/**
 * Get rate limit status without incrementing counter
 * @param identifier - Unique identifier to check
 * @param config - Rate limit configuration
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || entry.resetAt < now) {
    return {
      success: true,
      remaining: config.maxAttempts,
      resetIn: 0,
    };
  }

  return {
    success: entry.count < config.maxAttempts,
    remaining: Math.max(0, config.maxAttempts - entry.count),
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}
