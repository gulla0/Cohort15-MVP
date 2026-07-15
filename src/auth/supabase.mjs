import { normalizeEmail } from '../domain/validation.mjs';

export class AuthProviderError extends Error {
  constructor(code = 'auth_provider_error') {
    super(code);
    this.name = 'AuthProviderError';
    this.code = code;
  }
}

async function providerRequest(fetchImpl, url, options) {
  let response;
  try {
    response = await fetchImpl(url, options);
  } catch {
    throw new AuthProviderError('provider_unavailable');
  }
  if (!response.ok) throw new AuthProviderError('provider_rejected');
  try {
    return await response.json();
  } catch {
    throw new AuthProviderError('invalid_provider_response');
  }
}

export function createSupabaseMagicLinkAuth({ url, anonKey, fetchImpl = globalThis.fetch } = {}) {
  if (!url || !anonKey || typeof fetchImpl !== 'function') {
    throw new TypeError('Supabase Auth URL, anon key, and fetch implementation are required.');
  }
  const baseUrl = String(url).replace(/\/$/u, '');
  const headers = Object.freeze({
    apikey: anonKey,
    authorization: `Bearer ${anonKey}`,
    'content-type': 'application/json',
  });

  return Object.freeze({
    async requestMagicLink({ email, redirectTo }) {
      const endpoint = new URL(`${baseUrl}/auth/v1/otp`);
      endpoint.searchParams.set('redirect_to', redirectTo);
      await providerRequest(fetchImpl, endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: normalizeEmail(email), create_user: true }),
      });
    },

    async verifyCallback({ tokenHash, type }) {
      if (!tokenHash || !['email', 'magiclink'].includes(type)) {
        throw new AuthProviderError('invalid_callback');
      }
      const payload = await providerRequest(fetchImpl, `${baseUrl}/auth/v1/verify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ token_hash: tokenHash, type }),
      });
      const subject = payload?.user?.id;
      const email = payload?.user?.email;
      if (typeof subject !== 'string' || !subject || typeof email !== 'string') {
        throw new AuthProviderError('unverified_identity');
      }
      return Object.freeze({ subject, email: normalizeEmail(email) });
    },
  });
}

export function createInjectedTestAuth({ identities = {} } = {}) {
  const entries = new Map(Object.entries(identities));
  return Object.freeze({
    async requestMagicLink() {},
    async verifyCallback({ tokenHash }) {
      const identity = entries.get(tokenHash);
      if (!identity) throw new AuthProviderError('invalid_callback');
      return Object.freeze({
        subject: String(identity.subject),
        email: normalizeEmail(identity.email),
      });
    },
  });
}
