import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoRepositories } from '../src/persistence/seeds.mjs';
import { createRequestHandler } from '../src/server/app.mjs';
import { createPurchaseCreditsService } from '../src/services/purchase-credits.mjs';

const runtimeConfig = Object.freeze({
  appEnv: 'test',
  isProduction: false,
  appUrl: 'http://localhost:3000',
  uploadMode: 'local',
  auth: Object.freeze({
    supabaseAuthCallbackPath: '/auth/callback',
    enableMagicLink: false
  }),
  stripe: Object.freeze({
    checkoutEnabled: true,
    price6Credits: 'price_6',
    price14Credits: 'price_14',
    webhookPath: '/stripe/webhook'
  }),
  adminEmails: Object.freeze([])
});

function paidSession(overrides = {}) {
  return {
    id: 'cs_test_paid',
    url: 'https://checkout.stripe.com/c/pay/test',
    client_reference_id: 'user-creator',
    metadata: {
      purchase_id: 'purchase-fixed',
      user_id: 'user-creator'
    },
    amount_total: 600,
    currency: 'usd',
    status: 'complete',
    payment_status: 'paid',
    payment_intent: 'pi_test_paid',
    ...overrides
  };
}

function createFixture(session = paidSession()) {
  const state = createDemoRepositories();
  const calls = [];
  const stripeCheckout = {
    async createSession(input) {
      calls.push({ operation: 'create', input });
      return { id: session.id, url: session.url };
    },
    async retrieveSession(sessionId) {
      calls.push({ operation: 'retrieve', sessionId });
      return session;
    }
  };
  const service = createPurchaseCreditsService({
    ...state,
    stripeCheckout,
    stripeConfig: runtimeConfig.stripe,
    appUrl: runtimeConfig.appUrl,
    now: () => new Date('2026-06-17T20:00:00.000Z'),
    createId: () => 'fixed'
  });
  return { state, calls, stripeCheckout, service };
}

async function invoke(handler, request) {
  const chunks = [];
  const res = {
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body) {
      chunks.push(body ?? '');
    }
  };
  await handler(request, res);
  return { status: res.statusCode, headers: res.headers, body: chunks.join('') };
}

async function signIn(handler) {
  const response = await invoke(handler, {
    url: '/auth/sign-in',
    method: 'POST',
    body: new URLSearchParams({ userId: 'user-creator', returnTo: '/credits/buy' }).toString()
  });
  return response.headers['set-cookie'].split(';')[0];
}

test('both configured MVP packages create Stripe Checkout sessions and pending purchase records', async () => {
  for (const [packageId, expected] of [['6', [6, 600, 'price_6']], ['14', [14, 1200, 'price_14']]]) {
    const { state, calls, service } = createFixture();
    const result = await service.startCheckout({
      user: state.repositories.users.findById('user-creator'),
      packageId
    });
    const purchase = state.repositories.purchases.findById('purchase-fixed');

    assert.equal(result.checkoutUrl, 'https://checkout.stripe.com/c/pay/test');
    assert.deepEqual([purchase.packageCredits, purchase.amountCents, calls[0].input.priceId], expected);
    assert.equal(purchase.status, 'pending');
    assert.match(calls[0].input.successUrl, /session_id=\{CHECKOUT_SESSION_ID\}$/);
  }
});

test('verified paid Checkout Session grants auditable credits exactly once on repeated returns', async () => {
  const { state, service } = createFixture();
  await service.startCheckout({
    user: state.repositories.users.findById('user-creator'),
    packageId: '6'
  });
  const before = state.ledger.balanceForUser('user-creator').available;

  const first = await service.completeCheckout({ userId: 'user-creator', sessionId: 'cs_test_paid' });
  const second = await service.completeCheckout({ userId: 'user-creator', sessionId: 'cs_test_paid' });
  const purchases = state.repositories.creditTransactions.listByUser('user-creator')
    .filter((transaction) => transaction.type === 'purchase');

  assert.equal(first.purchase.status, 'paid');
  assert.equal(second.alreadyCompleted, true);
  assert.equal(state.ledger.balanceForUser('user-creator').available, before + 6);
  assert.equal(purchases.length, 1);
  assert.equal(purchases[0].source, 'stripe_checkout:cs_test_paid');
});

test('unpaid, mismatched, and cancelled Checkout states never grant credits', async () => {
  for (const session of [
    paidSession({ payment_status: 'unpaid', status: 'open' }),
    paidSession({ amount_total: 1200 }),
    paidSession({ status: 'expired', payment_status: 'unpaid' })
  ]) {
    const { state, service } = createFixture(session);
    await service.startCheckout({
      user: state.repositories.users.findById('user-creator'),
      packageId: '6'
    });
    await assert.rejects(
      service.completeCheckout({ userId: 'user-creator', sessionId: 'cs_test_paid' }),
      /not complete|did not match/
    );
    assert.equal(state.repositories.creditTransactions.listByUser('user-creator')
      .filter((transaction) => transaction.type === 'purchase').length, 0);
  }
});

test('authenticated buy route renders both packages and redirects checkout to Stripe', async () => {
  const { state, stripeCheckout } = createFixture();
  const handler = createRequestHandler(state, {
    runtimeConfig,
    stripeCheckoutAdapter: stripeCheckout,
    createPurchaseId: () => 'fixed',
    purchaseNow: () => new Date('2026-06-17T20:00:00.000Z')
  });
  const cookie = await signIn(handler);
  const page = await invoke(handler, { url: '/credits/buy', method: 'GET', headers: { cookie } });
  assert.match(page.body, /Buy 6 credits/);
  assert.match(page.body, /Buy 14 credits/);

  const checkout = await invoke(handler, {
    url: '/credits/checkout',
    method: 'POST',
    headers: { cookie },
    body: new URLSearchParams({ packageId: '6' }).toString()
  });
  assert.equal(checkout.status, 303);
  assert.equal(checkout.headers.location, 'https://checkout.stripe.com/c/pay/test');
});

test('buy and checkout routes require authentication', async () => {
  const { state, stripeCheckout } = createFixture();
  const handler = createRequestHandler(state, { runtimeConfig, stripeCheckoutAdapter: stripeCheckout });
  const page = await invoke(handler, { url: '/credits/buy', method: 'GET' });
  assert.match(page.body, /Sign in to buy credits/);

  const checkout = await invoke(handler, {
    url: '/credits/checkout',
    method: 'POST',
    body: new URLSearchParams({ packageId: '6' }).toString()
  });
  assert.equal(checkout.status, 401);
});
