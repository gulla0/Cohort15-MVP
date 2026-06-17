import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupabaseAuthAdapter } from '../src/auth/supabase.mjs';
import { createDemoRepositories } from '../src/persistence/seeds.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

function productionRuntimeConfig(overrides = {}) {
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
      enableMagicLink: false,
      ...(overrides.auth ?? {})
    },
    stripe: {},
    adminEmails: ['admin@example.com'],
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

test('supabase auth adapter starts PKCE OAuth and creates an app user after callback exchange', async () => {
  const state = createDemoRepositories();
  const fetchCalls = [];
  const adapter = createSupabaseAuthAdapter({
    repositories: state.repositories,
    appUrl: 'https://cohort15-mvp.onrender.com',
    callbackPath: '/auth/callback',
    supabaseUrl: 'https://project.supabase.co',
    supabaseAnonKey: 'anon-key',
    createState: () => 'oauth-state',
    createVerifier: () => 'oauth-code-verifier',
    fetchImpl: async (url, options) => {
      fetchCalls.push({ url, options });
      return {
        ok: true,
        async json() {
          return {
            user: {
              id: 'supabase-user-1',
              email: 'builder@example.com',
              created_at: '2026-06-17T12:00:00.000Z',
              user_metadata: {
                full_name: 'Supabase Builder'
              }
            }
          };
        }
      };
    }
  });

  const authorizeUrl = new URL(adapter.startOAuth('google', '/dashboard'));

  assert.equal(authorizeUrl.origin, 'https://project.supabase.co');
  assert.equal(authorizeUrl.pathname, '/auth/v1/authorize');
  assert.equal(authorizeUrl.searchParams.get('provider'), 'google');
  assert.equal(authorizeUrl.searchParams.get('redirect_to'), 'https://cohort15-mvp.onrender.com/auth/callback');
  assert.equal(authorizeUrl.searchParams.get('state'), 'oauth-state');
  assert.equal(authorizeUrl.searchParams.get('code_challenge_method'), 'S256');

  const result = await adapter.exchangeCodeForSession({
    code: 'supabase-auth-code',
    state: 'oauth-state'
  });

  assert.equal(result.returnTo, '/dashboard');
  assert.equal(result.appUser.id, 'supabase:supabase-user-1');
  assert.equal(result.appUser.email, 'builder@example.com');
  assert.equal(state.repositories.users.findById('supabase:supabase-user-1').displayName, 'Supabase Builder');
  assert.equal(fetchCalls[0].url, 'https://project.supabase.co/auth/v1/token?grant_type=pkce');
  assert.equal(fetchCalls[0].options.headers.apikey, 'anon-key');
  assert.deepEqual(JSON.parse(fetchCalls[0].options.body), {
    auth_code: 'supabase-auth-code',
    code_verifier: 'oauth-code-verifier'
  });
});

test('supabase auth adapter verifies magic-link token hashes when enabled', async () => {
  const state = createDemoRepositories();
  const fetchCalls = [];
  const adapter = createSupabaseAuthAdapter({
    repositories: state.repositories,
    appUrl: 'https://cohort15-mvp.onrender.com',
    callbackPath: '/auth/callback',
    supabaseUrl: 'https://project.supabase.co',
    supabaseAnonKey: 'anon-key',
    fetchImpl: async (url, options) => {
      fetchCalls.push({ url, options });
      return {
        ok: true,
        async json() {
          return {
            user: {
              id: 'magic-user-1',
              email: 'magic@example.com',
              created_at: '2026-06-17T12:00:00.000Z',
              user_metadata: {}
            }
          };
        }
      };
    }
  });

  const result = await adapter.verifyMagicLinkToken({
    tokenHash: 'hashed-token',
    type: 'email',
    returnTo: '/dashboard'
  });

  assert.equal(result.appUser.id, 'supabase:magic-user-1');
  assert.equal(result.returnTo, '/dashboard');
  assert.equal(fetchCalls[0].url, 'https://project.supabase.co/auth/v1/verify');
  assert.deepEqual(JSON.parse(fetchCalls[0].options.body), {
    token_hash: 'hashed-token',
    type: 'email'
  });
});

test('production sign-in renders Supabase providers and blocks seeded local sign-in', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state, {
    runtimeConfig: productionRuntimeConfig(),
    supabaseAuthAdapter: {
      startOAuth(provider, returnTo) {
        return `https://project.supabase.co/auth/v1/authorize?provider=${provider}&returnTo=${encodeURIComponent(returnTo)}`;
      },
      exchangeCodeForSession() {
        throw new Error('not used');
      },
      verifyMagicLinkToken() {
        throw new Error('not used');
      },
      sendMagicLink() {
        throw new Error('not used');
      }
    }
  });

  const signInPage = await invoke(handler, { url: '/auth/sign-in', method: 'GET' });
  assert.equal(signInPage.status, 200);
  assert.match(signInPage.body, /Continue with Google/);
  assert.match(signInPage.body, /Continue with GitHub/);
  assert.doesNotMatch(signInPage.body, /Demo Creator/);

  const localPost = await invoke(handler, {
    url: '/auth/sign-in',
    method: 'POST',
    body: new URLSearchParams({ userId: 'user-creator', returnTo: '/' }).toString()
  });
  assert.equal(localPost.status, 404);

  const oauthRedirect = await invoke(handler, {
    url: '/auth/supabase/google?returnTo=/dashboard',
    method: 'GET'
  });
  assert.equal(oauthRedirect.status, 303);
  assert.equal(oauthRedirect.headers.location, 'https://project.supabase.co/auth/v1/authorize?provider=google&returnTo=%2Fdashboard');
});

test('production callback exchanges Supabase identity into the protected app session', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state, {
    runtimeConfig: productionRuntimeConfig(),
    createSessionId: () => 'session-from-supabase',
    supabaseAuthAdapter: {
      startOAuth() {
        throw new Error('not used');
      },
      async exchangeCodeForSession({ code, state: callbackState }) {
        assert.equal(code, 'auth-code');
        assert.equal(callbackState, 'oauth-state');
        return {
          appUser: state.repositories.users.findById('user-creator'),
          returnTo: '/dashboard'
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

  const callback = await invoke(handler, {
    url: '/auth/callback?code=auth-code&state=oauth-state',
    method: 'GET'
  });

  assert.equal(callback.status, 303);
  assert.equal(callback.headers.location, '/dashboard');
  assert.match(callback.headers['set-cookie'], /cohort15_session=session-from-supabase/);

  const dashboard = await invoke(handler, {
    url: '/dashboard',
    method: 'GET',
    headers: {
      cookie: 'cohort15_session=session-from-supabase'
    }
  });
  assert.equal(dashboard.status, 200);
  assert.match(dashboard.body, /Account Credits/);
});
