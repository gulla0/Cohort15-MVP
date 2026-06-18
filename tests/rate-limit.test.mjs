import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clientIpFromRequest, createRollingWindowLimiter, RateLimitExceededError,
} from '../src/services/rate-limit.mjs';

test('rolling limiter counts successful operations only and resets after its window', async () => {
  let now = 1_000;
  const limiter = createRollingWindowLimiter({ limit: 2, windowMs: 10_000, now: () => now });

  await assert.rejects(limiter.run('192.0.2.10', async () => { throw new Error('failed write'); }), /failed write/);
  assert.equal(await limiter.run('192.0.2.10', async () => 'first'), 'first');
  assert.equal(await limiter.run('192.0.2.10', async () => 'second'), 'second');
  await assert.rejects(
    limiter.run('192.0.2.10', async () => 'third'),
    (error) => error instanceof RateLimitExceededError && error.retryAfterSeconds === 10,
  );

  now += 10_001;
  assert.equal(await limiter.run('192.0.2.10', async () => 'after window'), 'after window');
});

test('client IP trusts Render forwarding only in production', () => {
  const req = {
    headers: { 'x-forwarded-for': '203.0.113.8, 10.0.0.1' },
    socket: { remoteAddress: '::ffff:127.0.0.1' },
  };
  assert.equal(clientIpFromRequest(req, { isProduction: true }), '203.0.113.8');
  assert.equal(clientIpFromRequest(req, { isProduction: false }), '127.0.0.1');
});
