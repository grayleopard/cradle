/**
 * Simple rate limiting utility for Vercel serverless functions
 *
 * NOTE: This uses in-memory storage which doesn't persist across function instances.
 * For production at scale, upgrade to Upstash Redis or similar.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets when function cold-starts)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs?: number;  // Time window in milliseconds (default: 60000 = 1 minute)
  maxRequests?: number;  // Max requests per window (default: 10)
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;  // Seconds until reset
}

export function checkRateLimit(
  identifier: string,  // Usually IP address or user ID
  options: RateLimitOptions = {}
): RateLimitResult {
  const { windowMs = 60000, maxRequests = 10 } = options;
  const now = Date.now();

  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    cleanupExpired();
  }

  const entry = rateLimitStore.get(identifier);

  // No existing entry or expired
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetIn: Math.ceil(windowMs / 1000)
    };
  }

  // Existing entry within window
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000)
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000)
  };
}

function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client IP from Vercel request headers (Node.js IncomingMessage style)
 */
export function getClientIP(headers: Record<string, string | string[] | undefined>): string {
  // Vercel provides the real IP in x-forwarded-for
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ip.split(',')[0].trim();
  }

  // Fallback to x-real-ip
  const realIP = headers['x-real-ip'];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }

  return 'unknown';
}
