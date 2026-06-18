import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

export class RateLimitExceededError extends Error {
  constructor(retryAfterSeconds) {
    super('Rate limit exceeded');
    this.name = 'RateLimitExceededError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function normalizeClientIp(value) {
  const normalized = String(value ?? '').trim();
  if (normalized.startsWith('::ffff:') && isIP(normalized.slice(7)) === 4) {
    return normalized.slice(7);
  }
  return isIP(normalized) ? normalized : 'unknown';
}

function digestIp(value) {
  return createHash('sha256').update(normalizeClientIp(value)).digest('hex');
}

export function clientIpFromRequest(req, { isProduction = false } = {}) {
  if (isProduction) {
    const forwarded = String(req.headers?.['x-forwarded-for'] ?? '').split(',')[0].trim();
    if (isIP(forwarded)) return normalizeClientIp(forwarded);
  }
  return normalizeClientIp(req.socket?.remoteAddress);
}

export function createRollingWindowLimiter({ limit, windowMs, now = () => Date.now() }) {
  if (!Number.isInteger(limit) || limit < 1) throw new TypeError('limit must be a positive integer');
  if (!Number.isFinite(windowMs) || windowMs <= 0) throw new TypeError('windowMs must be positive');

  const acceptedByDigest = new Map();
  const locks = new Map();

  async function withLock(key, operation) {
    const prior = locks.get(key) ?? Promise.resolve();
    let release;
    const current = new Promise((resolve) => { release = resolve; });
    const queued = prior.then(() => current);
    locks.set(key, queued);
    await prior;
    try {
      return await operation();
    } finally {
      release();
      if (locks.get(key) === queued) locks.delete(key);
    }
  }

  return Object.freeze({
    async run(clientIp, operation) {
      const key = digestIp(clientIp);
      return withLock(key, async () => {
        const currentTime = Number(now());
        const cutoff = currentTime - windowMs;
        const accepted = (acceptedByDigest.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
        if (accepted.length >= limit) {
          const retryAfterSeconds = Math.max(1, Math.ceil((accepted[0] + windowMs - currentTime) / 1000));
          throw new RateLimitExceededError(retryAfterSeconds);
        }

        const result = await operation();
        accepted.push(currentTime);
        acceptedByDigest.set(key, accepted);
        return result;
      });
    },
  });
}
