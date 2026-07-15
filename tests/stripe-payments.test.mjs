import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import { createStripeClient, verifyStripeSignature } from '../src/payments/stripe.mjs';
import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

const NOW = new Date('2026-07-15T12:00:00.000Z');
const config = Object.freeze({
  appEnv: 'test', isProduction: false, appUrl: 'http://localhost:3000', googleAnalyticsId: 'G-TEST',
  stripeSecretKey: 'sk_test_private', stripePrice6Credits: 'price_six', stripeWebhookSecret: 'whsec_private',
});

function invoke(handler, { url = '/', method = 'GET', headers = {}, body = '' } = {}) {
  return new Promise((resolve, reject) => {
    const req = { url, method, headers, async *[Symbol.asyncIterator]() { if (body) yield Buffer.from(body); } };
    const response = {
      status: 0, headers: {}, body: '',
      writeHead(status, responseHeaders) { this.status = status; this.headers = responseHeaders; },
      end(value = '') { this.body = String(value); resolve(this); },
    };
    Promise.resolve(handler(req, response)).catch(reject);
  });
}

function postForm(handler, url, values, headers = {}) {
  const body = new URLSearchParams(values).toString();
  return invoke(handler, { url, method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers }, body });
}

function signature(body, timestamp = Math.floor(NOW.valueOf() / 1000)) {
  const digest = createHmac('sha256', config.stripeWebhookSecret).update(`${timestamp}.${body}`).digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

test('Stripe adapter fixes package fields and uses server-owned metadata and idempotency', async () => {
  const calls = [];
  const stripe = createStripeClient({
    secretKey: config.stripeSecretKey,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ id: 'cs_test_1', url: 'https://checkout.stripe.test/session' }));
    },
  });
  await stripe.createCheckoutSession({
    priceId: 'price_six', purchaseId: 'purchase-1', userId: 'user-1',
    successUrl: 'https://cohort15.com/complete', cancelUrl: 'https://cohort15.com/cancel',
  });
  const body = new URLSearchParams(calls[0].options.body);
  assert.equal(body.get('line_items[0][price]'), 'price_six');
  assert.equal(body.get('line_items[0][quantity]'), '1');
  assert.equal(body.get('metadata[purchase_id]'), 'purchase-1');
  assert.equal(body.get('metadata[user_id]'), 'user-1');
  assert.equal(calls[0].options.headers['idempotency-key'], 'purchase-1');
  assert.doesNotMatch(calls[0].options.body, /sk_test_private/u);
});

test('Stripe signatures require exact HMAC and five-minute freshness', () => {
  const body = Buffer.from('{"id":"evt_1"}');
  const timestamp = Math.floor(NOW.valueOf() / 1000);
  assert.equal(verifyStripeSignature(body, signature(body), config.stripeWebhookSecret, { now: NOW }), true);
  assert.throws(() => verifyStripeSignature(body, `t=${timestamp},v1=${'0'.repeat(64)}`, config.stripeWebhookSecret, { now: NOW }), /invalid_signature/u);
  assert.throws(() => verifyStripeSignature(body, signature(body, timestamp - 301), config.stripeWebhookSecret, { now: NOW }), /invalid_signature/u);
});

test('checkout, webhook, and browser return share exact-once verified fulfillment', async () => {
  let id = 0;
  const repositories = createLocalRepositories({
    store: createLofiStore(), now: () => NOW, randomUUID: () => `payment-${++id}`,
  });
  let checkoutSession = null;
  const stripe = {
    async createCheckoutSession(input) {
      checkoutSession = {
        id: 'cs_test_paid', object: 'checkout.session', url: 'https://checkout.stripe.test/hosted',
        status: 'complete', payment_status: 'paid', amount_total: 600, currency: 'usd', payment_intent: 'pi_test_1',
        metadata: { purchase_id: input.purchaseId, user_id: input.userId },
      };
      return checkoutSession;
    },
    async retrieveCheckoutSession() { return checkoutSession; },
  };
  const handler = createRequestHandler({
    config, repositories, stripe, now: () => NOW, randomUUID: () => `route-${++id}`,
    authProvider: { async verifyCallback() { return { subject: 'subject-1', email: 'private@example.com' }; }, async requestMagicLink() {} },
  });
  const callback = await invoke(handler, { url: '/auth/callback?token_hash=fake&type=email' });
  const cookie = callback.headers['set-cookie'].split(';')[0];
  const home = await invoke(handler, { headers: { cookie } });
  const csrf = /name="csrf" value="([^"]+)"/u.exec(home.body)[1];

  assert.equal((await postForm(handler, '/credits/checkout', { csrf: 'wrong' }, { cookie })).status, 403);
  assert.equal((await postForm(handler, '/credits/checkout', { csrf })).status, 401);
  const checkout = await postForm(handler, '/credits/checkout', { csrf, returnTo: '/cohorts/new' }, { cookie });
  assert.equal(checkout.status, 303);
  assert.equal(checkout.headers.location, 'https://checkout.stripe.test/hosted');

  const event = JSON.stringify({ id: 'evt_paid', type: 'checkout.session.completed', data: { object: checkoutSession } });
  const webhookHeaders = { 'stripe-signature': signature(event), 'content-length': String(Buffer.byteLength(event)) };
  const results = await Promise.all([
    invoke(handler, { url: '/webhooks/stripe', method: 'POST', headers: webhookHeaders, body: event }),
    invoke(handler, { url: `/credits/checkout/complete?session_id=cs_test_paid&return_to=%2Fcohorts%2Fnew`, headers: { cookie } }),
  ]);
  assert.deepEqual(results.map(({ status }) => status).sort(), [200, 200]);
  const user = await repositories.getUserBySupabaseSubject('subject-1');
  assert.equal((await repositories.getCreditBalance(user.id)).available, 8);

  assert.equal((await invoke(handler, { url: '/webhooks/stripe', method: 'POST', headers: webhookHeaders, body: event })).status, 200);
  const complete = await invoke(handler, { url: '/credits/checkout/complete?session_id=cs_test_paid', headers: { cookie } });
  assert.match(complete.body, /Six credits were added/u);
  assert.equal((await repositories.getCreditBalance(user.id)).available, 8);
  assert.doesNotMatch(`${complete.body}${JSON.stringify(complete.headers)}`, /private@example\.com|sk_test_private|whsec_private|pi_test_1/u);
});

test('webhook rejects invalid signatures and safely ignores unknown events', async () => {
  const repositories = createLocalRepositories({ store: createLofiStore(), now: () => NOW });
  const purchases = {
    async handleEvent(event) { return { outcome: event.type === 'other.event' ? 'ignored' : 'unexpected' }; },
  };
  const handler = createRequestHandler({ config, repositories, purchases, now: () => NOW });
  const body = JSON.stringify({ id: 'evt_other', type: 'other.event', data: {} });
  assert.equal((await invoke(handler, { url: '/webhooks/stripe', method: 'POST', headers: { 'stripe-signature': 'bad' }, body })).status, 400);
  assert.equal((await invoke(handler, { url: '/webhooks/stripe', method: 'POST', headers: { 'stripe-signature': signature(body) }, body })).status, 200);
  assert.equal((await invoke(handler, { url: '/webhooks/stripe', method: 'POST', headers: { 'stripe-signature': signature(body), 'content-length': String(256 * 1024 + 1) }, body })).status, 413);
});

