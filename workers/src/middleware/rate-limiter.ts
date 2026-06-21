/**
 * In-memory rate limiter using sliding window algorithm.
 * Since Workers instances are ephemeral, this provides
 * per-instance protection. For cross-instance enforcement,
 * Cloudflare WAF rate limiting rules should be configured
 * in the dashboard.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()
const WINDOW_MS = 60_000 // 1 minute

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const PRESETS = {
  /** General API requests per IP */
  general: { maxRequests: 100, windowMs: WINDOW_MS },
  /** Auth endpoints (nonce, verify) per IP */
  auth: { maxRequests: 10, windowMs: WINDOW_MS },
  /** Mutations (create vault, submit plan) per wallet */
  mutation: { maxRequests: 20, windowMs: WINDOW_MS },
  /** Image upload URLs per wallet */
  upload: { maxRequests: 5, windowMs: WINDOW_MS },
} as const

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = PRESETS.general,
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now()
  const cutoff = now - config.windowMs

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  if (entry.timestamps.length >= config.maxRequests) {
    const oldest = entry.timestamps[0]
    const resetMs = oldest + config.windowMs - now
    return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) }
  }

  entry.timestamps.push(now)
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetMs: config.windowMs,
  }
}

export function cleanupRateLimitStore(): void {
  const cutoff = Date.now() - WINDOW_MS * 2
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) {
      store.delete(key)
    }
  }
}

export function getRateLimitKey(
  request: Request,
  type: 'general' | 'auth' | 'mutation' | 'upload',
): string {
  if (type === 'general' || type === 'auth') {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown'
    return `${type}:${ip}`
  }
  const auth = request.headers.get('authorization') || ''
  const walletMatch = auth.match(/Bearer\s+(.+)/)
  if (walletMatch) {
    return `${type}:${walletMatch[1]}:${request.headers.get('cf-connecting-ip')}`
  }
  return `${type}:${request.headers.get('cf-connecting-ip') || 'unknown'}`
}

export const RateLimitPresets = PRESETS
