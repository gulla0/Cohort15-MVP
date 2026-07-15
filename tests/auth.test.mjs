import test from 'node:test';
import assert from 'node:assert/strict';

import { createSupabaseMagicLinkAuth, AuthProviderError } from '../src/auth/supabase.mjs';
import { createSessionService, safeReturnPath, SESSION_DURATION_MS } from '../src/auth/session.mjs';
import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

const config = Object.freeze({
  appEnv: 'test', isProduction: false, appUrl: 'http://localhost:3000', googleAnalyticsId: 'G-TEST',
});

function fixture(now = () => new Date('2026-07-15T12:00:00.000Z')) {
  let id = 0;
  const store = createLofiStore();
  const repositories = createLocalRepositories({
    store, now, randomUUID: () => `auth-${++id}`,
  });
  return { store, repositories };
}

function invoke(handler, {
  url = '/', method = 'GET', headers = {}, body = '',
} = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      url, method, headers,
      async *[Symbol.asyncIterator]() { if (body) yield Buffer.from(body); },
    };
    const response = {
      status: 0, headers: {}, body: '',
      writeHead(status, responseHeaders) { this.status = status; this.headers = responseHeaders; },
      end(value = '') { this.body = String(value); resolve(this); },
    };
    Promise.resolve(handler(req, response)).catch(reject);
  });
}

function postForm(handler, url, values, headers = {}) {
  return invoke(handler, {
    url, method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams(values).toString(),
  });
}

test('Supabase Auth adapter requests and verifies magic links without exposing provider failures', async () => {
  const calls = [];
  const auth = createSupabaseMagicLinkAuth({
    url: 'https://project.supabase.co/',
    anonKey: 'test-anon-key',
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      if (String(url).endsWith('/auth/v1/verify')) {
        return new Response(JSON.stringify({ user: { id: 'subject-1', email: ' Person@Example.com ' } }));
      }
      return new Response('{}');
    },
  });
  await auth.requestMagicLink({
    email: ' Person@Example.com ',
    redirectTo: 'https://cohort15.com/auth/callback?return_to=%2Fcohorts%2Fnew',
  });
  const identity = await auth.verifyCallback({ tokenHash: 'private-token-hash', type: 'email' });

  assert.deepEqual(identity, { subject: 'subject-1', email: 'person@example.com' });
  assert.match(calls[0].url, /\/auth\/v1\/otp\?redirect_to=/u);
  assert.deepEqual(JSON.parse(calls[0].options.body), { email: 'person@example.com', create_user: true });
  assert.equal(calls[0].options.headers.apikey, 'test-anon-key');
  assert.deepEqual(JSON.parse(calls[1].options.body), { token_hash: 'private-token-hash', type: 'email' });

  const failed = createSupabaseMagicLinkAuth({
    url: 'https://project.supabase.co', anonKey: 'test-key',
    fetchImpl: async () => new Response('private provider body', { status: 503 }),
  });
  await assert.rejects(
    failed.requestMagicLink({ email: 'person@example.com', redirectTo: 'https://cohort15.com/auth/callback' }),
    (error) => error instanceof AuthProviderError && !error.message.includes('private provider body'),
  );
});

test('session service creates digest-backed eight-hour cookies and fails closed', async () => {
  let now = new Date('2026-07-15T12:00:00.000Z');
  let byte = 0;
  const { repositories } = fixture(() => now);
  const sessions = createSessionService({
    repositories,
    isProduction: true,
    now: () => now,
    randomBytes: (length) => Buffer.alloc(length, ++byte),
  });
  const created = await sessions.create({ subject: 'subject-1', email: 'person@example.com' });

  assert.match(created.cookie, /^cohort15_session=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+;/u);
  assert.match(created.cookie, /HttpOnly/u);
  assert.match(created.cookie, /Secure/u);
  assert.match(created.cookie, /SameSite=Lax/u);
  assert.match(created.cookie, /Path=\//u);
  assert.match(created.cookie, new RegExp(`Max-Age=${SESSION_DURATION_MS / 1000}`, 'u'));
  const authenticated = await sessions.authenticate(created.cookie.split(';')[0]);
  assert.equal(authenticated.user.id, created.user.id);
  assert.equal(authenticated.balance.available, 2);
  assert.equal(sessions.verifyCsrf(authenticated, authenticated.csrfToken), true);
  assert.equal(sessions.verifyCsrf(authenticated, 'wrong-token'), false);

  now = new Date('2026-07-15T20:00:00.000Z');
  assert.equal(await sessions.authenticate(created.cookie.split(';')[0]), null);
  assert.equal(await sessions.authenticate('cohort15_session=unknown.invalid'), null);
  assert.match(sessions.clearCookie(), /Max-Age=0/u);
});

test('safe return validation rejects external, encoded, malformed, and protocol-relative targets', () => {
  assert.equal(safeReturnPath('/cohorts/new?source=auth'), '/cohorts/new?source=auth');
  for (const unsafe of [
    'https://evil.example', '//evil.example', '/https%3A%2F%2Fevil.example',
    '/%2F%2Fevil.example', '/%255C%255Cevil.example', '/bad%ZZ', '/bad\\path',
  ]) assert.equal(safeReturnPath(unsafe), '/', unsafe);
});

test('auth routes grant once under callback replay, render private navigation, and sign out with CSRF', async () => {
  let now = new Date('2026-07-15T12:00:00.000Z');
  let byte = 0;
  const { repositories } = fixture(() => now);
  const requested = [];
  const authProvider = {
    async requestMagicLink(input) { requested.push(input); },
    async verifyCallback() { return { subject: 'subject-1', email: 'private@example.com' }; },
  };
  const handler = createRequestHandler({
    config, repositories, authProvider, now: () => now,
    randomBytes: (length) => Buffer.alloc(length, ++byte),
  });

  const request = await postForm(handler, '/auth/magic-link', {
    email: 'private@example.com', returnTo: 'https://evil.example/private',
  });
  assert.equal(request.status, 303);
  assert.equal(request.headers.location, '/auth/sign-in?requested=1&return_to=%2F');
  assert.equal(requested.length, 1);
  assert.match(requested[0].redirectTo, /\/auth\/callback\?return_to=%2F$/u);
  assert.doesNotMatch(`${JSON.stringify(request.headers)}${request.body}`, /private@example\.com/u);

  const callbacks = await Promise.all([
    invoke(handler, { url: '/auth/callback?token_hash=first&type=email&return_to=%2Fcohorts%2Fnew' }),
    invoke(handler, { url: '/auth/callback?token_hash=replay&type=email&return_to=%2Fcohorts%2Fnew' }),
  ]);
  assert.equal(callbacks[0].status, 303);
  assert.equal(callbacks[0].headers.location, '/cohorts/new');
  assert.equal(callbacks[1].status, 303);
  const cookie = callbacks[0].headers['set-cookie'].split(';')[0];
  const user = await repositories.getUserBySupabaseSubject('subject-1');
  assert.deepEqual(await repositories.getCreditBalance(user.id), {
    funded: 2, available: 2, held: 0, consumed: 0, refunded: 0,
  });

  const home = await invoke(handler, { headers: { cookie } });
  assert.match(home.body, /2 credits/u);
  assert.match(home.body, /Buy credits/u);
  assert.match(home.body, /Sign out/u);
  assert.doesNotMatch(home.body, /private@example\.com|token_hash|private-token-value/u);
  const csrf = /name="csrf" value="([^"]+)"/u.exec(home.body)?.[1];
  assert.ok(csrf);

  assert.equal((await postForm(handler, '/auth/sign-out', { csrf: 'invalid' }, { cookie })).status, 403);
  const signedOut = await postForm(handler, '/auth/sign-out', { csrf }, { cookie });
  assert.equal(signedOut.status, 303);
  assert.equal(signedOut.headers.location, '/');
  assert.match(signedOut.headers['set-cookie'], /Max-Age=0/u);
  assert.match((await invoke(handler, { headers: { cookie } })).body, /Sign in/u);

  now = new Date('2026-07-16T00:00:00.000Z');
});

test('magic-link request and callback failures use generic privacy-safe responses', async () => {
  const { repositories } = fixture();
  const handler = createRequestHandler({
    config, repositories,
    authProvider: {
      async requestMagicLink() { throw new Error('provider body private@example.com'); },
      async verifyCallback() { throw new Error('token private-token-value'); },
    },
  });
  const requested = await postForm(handler, '/auth/magic-link', {
    email: 'private@example.com', returnTo: '/cohorts/new',
  });
  assert.equal(requested.status, 303);
  assert.doesNotMatch(`${JSON.stringify(requested.headers)}${requested.body}`, /private@example\.com|provider body/u);
  const callback = await invoke(handler, {
    url: '/auth/callback?token_hash=private-token-value&type=email&return_to=https%3A%2F%2Fevil.example',
  });
  assert.equal(callback.status, 303);
  assert.equal(callback.headers.location, '/auth/sign-in?error=1&return_to=%2F');
  assert.doesNotMatch(`${JSON.stringify(callback.headers)}${callback.body}`, /private-token-value|evil\.example/u);
});
