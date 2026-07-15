import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import { createInjectedTestAuth } from '../src/auth/supabase.mjs';
import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

const NOW = new Date('2026-07-15T12:00:00.000Z');
const PRIVATE_EMAIL = 'launch-user@example.com';
const PRIVATE_TOKEN = 'local-magic-link-token';
const config = Object.freeze({
  appEnv: 'test',
  isProduction: false,
  appUrl: 'http://localhost:3000',
  googleAnalyticsId: 'G-TEST',
  stripePrice6Credits: 'price_local_six_credits',
  stripeWebhookSecret: 'whsec_local_launch_test',
});

function cohortSubmission(title) {
  return {
    website: '',
    title,
    description: 'Build and verify one small product increment with a focused peer cohort.',
    category: 'build',
    topic: 'Launch testing',
    targetAudience: 'Builders preparing a small product launch',
    targetSkillLevel: 'intermediate',
    additionalDetails: '',
    minQuorum: '3',
    meetingLink: 'https://meet.google.com/pie-test-room',
    creatorTimeZone: 'America/Detroit',
    firstMeetingLocal: '2099-07-30T18:00',
    meetingDurationMinutes: '60',
    recurrence: 'none',
    meetingCount: '1',
  };
}

function invoke(handler, {
  url = '/', method = 'GET', headers = {}, body = '',
} = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      url,
      method,
      headers,
      socket: { remoteAddress: '127.0.0.1' },
      async *[Symbol.asyncIterator]() { if (body) yield Buffer.from(body); },
    };
    const response = {
      status: 0,
      headers: {},
      body: '',
      writeHead(status, responseHeaders) { this.status = status; this.headers = responseHeaders; },
      end(value = '') { this.body = String(value); resolve(this); },
    };
    Promise.resolve(handler(req, response)).catch(reject);
  });
}

function postForm(handler, url, values, headers = {}) {
  return invoke(handler, {
    url,
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams(values).toString(),
  });
}

function stripeSignature(body) {
  const timestamp = Math.floor(NOW.valueOf() / 1000);
  const digest = createHmac('sha256', config.stripeWebhookSecret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

test('Piece of Pie launches locally from sign-in through replay-safe purchase and purchased-credit use', async () => {
  let id = 0;
  let checkoutSession;
  const store = createLofiStore();
  const repositories = createLocalRepositories({
    store,
    now: () => NOW,
    randomUUID: () => `launch-${++id}`,
  });
  const stripe = {
    async createCheckoutSession(input) {
      checkoutSession = Object.freeze({
        id: 'cs_local_verified',
        object: 'checkout.session',
        url: 'https://checkout.stripe.test/local-verified',
        status: 'complete',
        payment_status: 'paid',
        amount_total: 600,
        currency: 'usd',
        payment_intent: 'pi_local_verified',
        metadata: { purchase_id: input.purchaseId, user_id: input.userId },
      });
      return checkoutSession;
    },
    async retrieveCheckoutSession(sessionId) {
      assert.equal(sessionId, checkoutSession.id);
      return checkoutSession;
    },
  };
  const authProvider = createInjectedTestAuth({
    identities: {
      [PRIVATE_TOKEN]: { subject: 'subject-local-launch', email: PRIVATE_EMAIL },
    },
  });
  const handler = createRequestHandler({
    config,
    repositories,
    authProvider,
    stripe,
    now: () => NOW,
    randomUUID: () => `route-${++id}`,
    randomBytes: (length) => Buffer.alloc(length, ++id),
    emailProvider: { async send() {} },
  });

  const magicLink = await postForm(handler, '/auth/magic-link', {
    email: PRIVATE_EMAIL,
    returnTo: '/cohorts/new',
  });
  assert.equal(magicLink.status, 303);
  assert.equal(magicLink.headers.location, '/auth/sign-in?requested=1&return_to=%2Fcohorts%2Fnew');
  assert.doesNotMatch(`${JSON.stringify(magicLink.headers)}${magicLink.body}`, /launch-user@example\.com/u);

  const callbacks = await Promise.all([
    invoke(handler, { url: `/auth/callback?token_hash=${PRIVATE_TOKEN}&type=email&return_to=%2Fcohorts%2Fnew` }),
    invoke(handler, { url: `/auth/callback?token_hash=${PRIVATE_TOKEN}&type=email&return_to=%2Fcohorts%2Fnew` }),
  ]);
  assert.deepEqual(callbacks.map(({ status }) => status), [303, 303]);
  assert.deepEqual(callbacks.map(({ headers }) => headers.location), ['/cohorts/new', '/cohorts/new']);
  const cookie = callbacks[0].headers['set-cookie'].split(';')[0];
  const user = await repositories.getUserBySupabaseSubject('subject-local-launch');
  let transactions = await repositories.listCreditTransactionsByUserId(user.id);
  assert.equal(transactions.filter(({ type }) => type === 'grant').length, 1);
  assert.deepEqual(await repositories.getCreditBalance(user.id), {
    funded: 2, available: 2, held: 0, consumed: 0, refunded: 0,
  });

  const home = await invoke(handler, { headers: { cookie } });
  const csrf = /name="csrf" value="([^"]+)"/u.exec(home.body)?.[1];
  assert.ok(csrf);
  assert.match(home.body, /2 credits/u);
  assert.doesNotMatch(home.body, new RegExp(`${PRIVATE_EMAIL}|${PRIVATE_TOKEN}`, 'u'));

  const firstCreate = await postForm(handler, '/cohorts', {
    ...cohortSubmission('Free-credit launch cohort'), csrf,
  }, { cookie });
  assert.equal(firstCreate.status, 303);
  assert.equal(store.listCohorts().length, 1);
  assert.equal((await repositories.getCreditBalance(user.id)).available, 0);

  const gatedCreate = await postForm(handler, '/cohorts', {
    ...cohortSubmission('Blocked before purchase'), csrf,
  }, { cookie });
  assert.equal(gatedCreate.status, 402);
  assert.match(gatedCreate.body, /Creating a cohort costs 2 credits/u);
  assert.match(gatedCreate.body, /You have 0 available/u);
  assert.match(gatedCreate.body, /href="\/credits\/buy">Buy credits/u);
  assert.equal(store.listCohorts().length, 1);
  assert.doesNotMatch(gatedCreate.body, new RegExp(`${PRIVATE_EMAIL}|${PRIVATE_TOKEN}`, 'u'));

  const checkout = await postForm(handler, '/credits/checkout', {
    csrf,
    returnTo: '/cohorts/new',
    price: 'attacker-controlled-price',
    credits: '999',
  }, { cookie });
  assert.equal(checkout.status, 303);
  assert.equal(checkout.headers.location, 'https://checkout.stripe.test/local-verified');

  const event = JSON.stringify({
    id: 'evt_local_verified',
    type: 'checkout.session.completed',
    data: { object: checkoutSession },
  });
  const webhookHeaders = {
    'stripe-signature': stripeSignature(event),
    'content-length': String(Buffer.byteLength(event)),
  };
  assert.equal((await invoke(handler, {
    url: '/webhooks/stripe', method: 'POST', headers: webhookHeaders, body: event,
  })).status, 200);
  assert.equal((await invoke(handler, {
    url: '/webhooks/stripe', method: 'POST', headers: webhookHeaders, body: event,
  })).status, 200);

  transactions = await repositories.listCreditTransactionsByUserId(user.id);
  assert.equal(transactions.filter(({ type }) => type === 'purchase').length, 1);
  assert.equal(transactions.find(({ type }) => type === 'purchase')?.amount, 6);
  assert.deepEqual(await repositories.getCreditBalance(user.id), {
    funded: 8, available: 6, held: 2, consumed: 0, refunded: 0,
  });

  const purchasedCreate = await postForm(handler, '/cohorts', {
    ...cohortSubmission('Purchased-credit launch cohort'), csrf,
  }, { cookie });
  assert.equal(purchasedCreate.status, 303);
  assert.equal(store.listCohorts().length, 2);
  assert.deepEqual(await repositories.getCreditBalance(user.id), {
    funded: 8, available: 4, held: 4, consumed: 0, refunded: 0,
  });

  const publicPage = await invoke(handler, { url: purchasedCreate.headers.location });
  assert.equal(publicPage.status, 200);
  assert.match(publicPage.body, /Purchased-credit launch cohort/u);
  assert.doesNotMatch(publicPage.body, /launch-user@example\.com|pi_local_verified|local-magic-link-token/u);
  assert.ok(transactions.every((transaction) => !JSON.stringify(transaction).includes(PRIVATE_EMAIL)));
});
