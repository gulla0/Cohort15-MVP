import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoRepositories } from '../src/persistence/seeds.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

const now = new Date('2026-06-17T12:00:00.000Z');

function productionRuntimeConfig() {
  return {
    appEnv: 'production',
    isProduction: true,
    appUrl: 'https://cohort15-mvp.onrender.com',
    host: '0.0.0.0',
    port: 3000,
    uploadMode: 'disabled',
    auth: {
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'anon-key',
      supabaseAuthCallbackPath: '/auth/callback',
      enableMagicLink: false
    },
    stripe: {},
    adminEmails: ['admin@example.com']
  };
}

function validCreateInput(overrides = {}) {
  return {
    title: 'Production CSRF Cohort',
    description: 'A cohort used to verify protected production mutations.',
    category: 'build',
    topic: 'Security',
    targetAudience: 'Builders preparing the MVP for launch.',
    targetSkillLevel: 'intermediate',
    minQuorum: '2',
    maxParticipants: '5',
    lockedEventLink: 'https://meet.google.com/production-csrf',
    firstMeetingAt: '2026-07-10T18:00',
    meetingDurationMinutes: '75',
    recurrence: 'weekly',
    meetingCount: '4',
    ...overrides
  };
}

async function invoke(handler, request) {
  const chunks = [];
  const res = {
    statusCode: 0,
    headers: {},
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body) {
      chunks.push(body ?? '');
    }
  };

  await handler(request, res);

  return {
    status: res.statusCode,
    headers: res.headers,
    body: chunks.join('')
  };
}

function extractCookie(response) {
  return response.headers['set-cookie'].split(';')[0];
}

function extractCsrfToken(html) {
  const match = html.match(/name="csrfToken" type="hidden" value="([^"]+)"/);
  assert.ok(match, 'expected page to include a CSRF token');
  return match[1];
}

function createProductionHandler(options = {}) {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state, {
    runtimeConfig: productionRuntimeConfig(),
    createSessionId: () => options.sessionId ?? 'production-session',
    createCsrfToken: () => options.csrfToken ?? 'csrf-secret',
    sessionNow: () => options.now?.() ?? now,
    now: () => now,
    supabaseAuthAdapter: {
      startOAuth() {
        throw new Error('not used');
      },
      async exchangeCodeForSession() {
        return {
          appUser: state.repositories.users.findById(options.userId ?? 'user-creator'),
          returnTo: options.returnTo ?? '/dashboard'
        };
      },
      verifyMagicLinkToken() {
        throw new Error('not used');
      },
      sendMagicLink() {
        throw new Error('not used');
      }
    }
  });

  return { state, handler };
}

async function signInThroughCallback(handler) {
  const response = await invoke(handler, {
    url: '/auth/callback?code=auth-code&state=oauth-state',
    method: 'GET'
  });

  assert.equal(response.status, 303);
  return response;
}

test('production sessions use secure expiring cookies and expose CSRF tokens only in signed-in forms', async () => {
  const { handler } = createProductionHandler();
  const callback = await signInThroughCallback(handler);

  assert.match(callback.headers['set-cookie'], /cohort15_session=production-session/);
  assert.match(callback.headers['set-cookie'], /HttpOnly/);
  assert.match(callback.headers['set-cookie'], /SameSite=Lax/);
  assert.match(callback.headers['set-cookie'], /Max-Age=28800/);
  assert.match(callback.headers['set-cookie'], /Expires=/);
  assert.match(callback.headers['set-cookie'], /Secure/);

  const form = await invoke(handler, {
    url: '/cohorts/new',
    method: 'GET',
    headers: { cookie: extractCookie(callback) }
  });

  assert.equal(form.status, 200);
  assert.match(form.body, /name="csrfToken" type="hidden" value="csrf-secret"/);
});

test('production protected mutations reject missing or invalid CSRF tokens', async () => {
  const { state, handler } = createProductionHandler();
  const callback = await signInThroughCallback(handler);
  const cookie = extractCookie(callback);

  const missingToken = await invoke(handler, {
    url: '/cohorts/new',
    method: 'POST',
    headers: { cookie },
    body: new URLSearchParams(validCreateInput()).toString()
  });
  assert.equal(missingToken.status, 403);
  assert.equal(state.repositories.events.list().length, 0);

  const invalidToken = await invoke(handler, {
    url: '/cohorts/new',
    method: 'POST',
    headers: { cookie },
    body: new URLSearchParams({
      ...validCreateInput(),
      csrfToken: 'not-the-session-token'
    }).toString()
  });
  assert.equal(invalidToken.status, 403);
  assert.equal(state.repositories.events.list().length, 0);

  const form = await invoke(handler, {
    url: '/cohorts/new',
    method: 'GET',
    headers: { cookie }
  });
  const csrfToken = extractCsrfToken(form.body);

  const valid = await invoke(handler, {
    url: '/cohorts/new',
    method: 'POST',
    headers: { cookie },
    body: new URLSearchParams({
      ...validCreateInput(),
      csrfToken
    }).toString()
  });
  assert.equal(valid.status, 201);
  assert.equal(state.repositories.events.list().length, 1);
});

test('production admin mutation endpoint fails closed until admin authorization is implemented', async () => {
  const { handler } = createProductionHandler();

  const response = await invoke(handler, {
    url: '/admin/expire-cohorts?now=2030-01-01T00%3A00%3A00.000Z',
    method: 'POST'
  });

  assert.equal(response.status, 403);
  assert.deepEqual(JSON.parse(response.body), {
    error: 'Admin operations require production admin authorization before launch.'
  });
});

test('production sign-out requires CSRF and invalidates the session', async () => {
  const { handler } = createProductionHandler();
  const callback = await signInThroughCallback(handler);
  const cookie = extractCookie(callback);

  const dashboard = await invoke(handler, {
    url: '/dashboard',
    method: 'GET',
    headers: { cookie }
  });
  assert.equal(dashboard.status, 200);
  const csrfToken = extractCsrfToken(dashboard.body);

  const missingToken = await invoke(handler, {
    url: '/auth/sign-out',
    method: 'POST',
    headers: { cookie },
    body: ''
  });
  assert.equal(missingToken.status, 403);

  const signedOut = await invoke(handler, {
    url: '/auth/sign-out',
    method: 'POST',
    headers: { cookie },
    body: new URLSearchParams({ csrfToken }).toString()
  });
  assert.equal(signedOut.status, 303);
  assert.match(signedOut.headers['set-cookie'], /Max-Age=0/);
  assert.match(signedOut.headers['set-cookie'], /Secure/);

  const afterSignOut = await invoke(handler, {
    url: '/dashboard',
    method: 'GET',
    headers: { cookie }
  });
  assert.equal(afterSignOut.status, 401);
});

test('expired sessions are rejected before protected routes render', async () => {
  let currentTime = new Date('2026-06-17T12:00:00.000Z');
  const { handler } = createProductionHandler({
    now: () => currentTime
  });
  const callback = await signInThroughCallback(handler);
  const cookie = extractCookie(callback);

  const beforeExpiry = await invoke(handler, {
    url: '/dashboard',
    method: 'GET',
    headers: { cookie }
  });
  assert.equal(beforeExpiry.status, 200);

  currentTime = new Date('2026-06-17T20:00:01.000Z');
  const afterExpiry = await invoke(handler, {
    url: '/dashboard',
    method: 'GET',
    headers: { cookie }
  });
  assert.equal(afterExpiry.status, 401);
});
