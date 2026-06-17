import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoRepositories } from '../src/persistence/seeds.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

const runtimeConfig = {
  appEnv: 'production',
  isProduction: true,
  appUrl: 'https://cohort15-mvp.onrender.com',
  auth: {
    supabaseUrl: 'https://project.supabase.co',
    supabaseAnonKey: 'anon-key',
    supabaseAuthCallbackPath: '/auth/callback',
    enableMagicLink: false
  },
  stripe: {},
  adminEmails: [' Creator@Example.Test ']
};

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
  return {
    status: res.statusCode,
    headers: res.headers,
    body: chunks.join('')
  };
}

function createFixture(userId) {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state, {
    runtimeConfig,
    createSessionId: () => `session-${userId}`,
    createCsrfToken: () => `csrf-${userId}`,
    supabaseAuthAdapter: {
      async exchangeCodeForSession() {
        return {
          appUser: state.repositories.users.findById(userId),
          returnTo: '/'
        };
      }
    }
  });
  return { state, handler };
}

async function signIn(handler, userId) {
  const response = await invoke(handler, {
    url: '/auth/callback?code=code&state=state',
    method: 'GET'
  });
  assert.equal(response.status, 303);
  return {
    cookie: response.headers['set-cookie'].split(';')[0],
    csrfToken: `csrf-${userId}`
  };
}

test('admin expiry rejects authenticated non-admin users', async () => {
  const { handler } = createFixture('user-participant');
  const { cookie, csrfToken } = await signIn(handler, 'user-participant');

  const response = await invoke(handler, {
    url: '/admin/expire-cohorts',
    method: 'POST',
    headers: { cookie },
    body: new URLSearchParams({ csrfToken }).toString()
  });

  assert.equal(response.status, 403);
  assert.deepEqual(JSON.parse(response.body), {
    error: 'Admin authorization is required for this operation.'
  });
});

test('admin expiry requires CSRF before invoking the operation', async () => {
  const { handler } = createFixture('user-creator');
  const { cookie } = await signIn(handler, 'user-creator');

  const response = await invoke(handler, {
    url: '/admin/expire-cohorts',
    method: 'POST',
    headers: { cookie },
    body: ''
  });

  assert.equal(response.status, 403);
  assert.equal(response.body, 'Invalid CSRF token.');
});

test('configured admin identity can invoke cohort expiry', async () => {
  const { handler } = createFixture('user-creator');
  const { cookie, csrfToken } = await signIn(handler, 'user-creator');

  const response = await invoke(handler, {
    url: '/admin/expire-cohorts?now=2030-01-01T00%3A00%3A00.000Z',
    method: 'POST',
    headers: { cookie },
    body: new URLSearchParams({ csrfToken }).toString()
  });

  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    processedAt: '2030-01-01T00:00:00.000Z',
    expiredCount: 0,
    expiredEventIds: []
  });
});
