import { createHash, randomBytes, randomUUID } from 'node:crypto';

export const SUPABASE_AUTH_PROVIDERS = Object.freeze(['google', 'github']);

function base64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function createCodeVerifier() {
  return base64Url(randomBytes(32));
}

function createCodeChallenge(verifier) {
  return base64Url(createHash('sha256').update(verifier).digest());
}

function assertProvider(provider) {
  if (!SUPABASE_AUTH_PROVIDERS.includes(provider)) {
    throw new Error('Unsupported Supabase auth provider.');
  }
}

function displayNameForSupabaseUser(user) {
  return user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email
    || `Supabase user ${user.id}`;
}

function appUserIdForSupabaseUser(user) {
  return `supabase:${user.id}`;
}

function safeReturnTo(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '/';
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }

  return value;
}

function normalizeSupabaseUrl(value) {
  return String(value ?? '').replace(/\/+$/, '');
}

export function createSupabaseAuthAdapter({
  repositories,
  appUrl,
  callbackPath = '/auth/callback',
  supabaseUrl,
  supabaseAnonKey,
  fetchImpl = globalThis.fetch,
  createState = () => randomUUID(),
  createVerifier = createCodeVerifier
}) {
  if (!repositories) {
    throw new Error('Supabase auth adapter requires repositories.');
  }

  const pendingStates = new Map();
  const normalizedSupabaseUrl = normalizeSupabaseUrl(supabaseUrl);

  function callbackUrl() {
    return new URL(callbackPath, appUrl).toString();
  }

  function startOAuth(provider, returnTo = '/') {
    assertProvider(provider);

    if (!normalizedSupabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase Auth is not configured.');
    }

    const state = createState();
    const codeVerifier = createVerifier();
    pendingStates.set(state, {
      codeVerifier,
      provider,
      returnTo: safeReturnTo(returnTo)
    });

    const authorizeUrl = new URL(`${normalizedSupabaseUrl}/auth/v1/authorize`);
    authorizeUrl.searchParams.set('provider', provider);
    authorizeUrl.searchParams.set('redirect_to', callbackUrl());
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('code_challenge', createCodeChallenge(codeVerifier));
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');

    return authorizeUrl.toString();
  }

  function appUserFromSupabaseUser(supabaseUser) {
    if (!supabaseUser?.id) {
      throw new Error('Supabase did not return a user for the authenticated session.');
    }

    const appUserId = appUserIdForSupabaseUser(supabaseUser);
    let appUser = repositories.users.findById(appUserId);

    if (!appUser) {
      appUser = repositories.users.create({
        id: appUserId,
        displayName: displayNameForSupabaseUser(supabaseUser),
        email: supabaseUser.email,
        authProvider: 'supabase',
        authSubject: supabaseUser.id,
        createdAt: supabaseUser.created_at ? new Date(supabaseUser.created_at) : new Date()
      });
    }

    return appUser;
  }

  async function exchangeCodeForSession({ code, state }) {
    if (!code) {
      throw new Error('Supabase callback was missing an authorization code.');
    }

    const pending = pendingStates.get(state);
    if (!pending) {
      throw new Error('Supabase callback state was invalid or expired.');
    }
    pendingStates.delete(state);

    const response = await fetchImpl(`${normalizedSupabaseUrl}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${supabaseAnonKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        auth_code: code,
        code_verifier: pending.codeVerifier
      })
    });

    if (!response.ok) {
      throw new Error('Supabase authorization code exchange failed.');
    }

    const payload = await response.json();

    return {
      appUser: appUserFromSupabaseUser(payload.user),
      returnTo: pending.returnTo,
      supabaseUser: payload.user
    };
  }

  async function verifyMagicLinkToken({ tokenHash, type = 'email', returnTo = '/' }) {
    if (!tokenHash) {
      throw new Error('Supabase magic-link callback was missing a token hash.');
    }

    const response = await fetchImpl(`${normalizedSupabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${supabaseAnonKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        token_hash: tokenHash,
        type
      })
    });

    if (!response.ok) {
      throw new Error('Supabase magic-link verification failed.');
    }

    const payload = await response.json();
    return {
      appUser: appUserFromSupabaseUser(payload.user),
      returnTo: safeReturnTo(returnTo),
      supabaseUser: payload.user
    };
  }

  async function sendMagicLink({ email, returnTo = '/' }) {
    if (!email) {
      throw new Error('Email is required for magic-link sign-in.');
    }

    if (!normalizedSupabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase Auth is not configured.');
    }

    const response = await fetchImpl(`${normalizedSupabaseUrl}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${supabaseAnonKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        email,
        create_user: true,
        options: {
          email_redirect_to: `${callbackUrl()}?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`
        }
      })
    });

    if (!response.ok) {
      throw new Error('Supabase magic-link request failed.');
    }
  }

  return {
    callbackUrl,
    startOAuth,
    exchangeCodeForSession,
    verifyMagicLinkToken,
    sendMagicLink
  };
}
