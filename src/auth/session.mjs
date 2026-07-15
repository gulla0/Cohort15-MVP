import { createHash, randomBytes as nodeRandomBytes, timingSafeEqual } from 'node:crypto';
import { RepositoryNotFoundError } from '../persistence/repositories.mjs';

export const SESSION_COOKIE_NAME = 'cohort15_session';
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function parseCookies(header) {
  const result = new Map();
  for (const part of String(header ?? '').split(';')) {
    const index = part.indexOf('=');
    if (index <= 0) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name && !result.has(name)) result.set(name, value);
  }
  return result;
}

function equalDigest(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function cookieValue(token, csrfToken) {
  return `${token}.${csrfToken}`;
}

function readCookie(cookieHeader) {
  const value = parseCookies(cookieHeader).get(SESSION_COOKIE_NAME) ?? '';
  const separator = value.indexOf('.');
  if (separator < 1 || separator === value.length - 1) return null;
  return Object.freeze({ token: value.slice(0, separator), csrfToken: value.slice(separator + 1) });
}

export function safeReturnPath(value) {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/')
    || value.startsWith('//') || /[\\\u0000-\u001f\u007f]/u.test(value)) return '/';
  let decoded = value;
  try {
    for (let index = 0; index < 2; index += 1) decoded = decodeURIComponent(decoded);
  } catch {
    return '/';
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\')
    || /^\/(?:https?:)?\/\//iu.test(decoded)) return '/';
  return value;
}

export function createSessionService({
  repositories,
  isProduction = false,
  now = () => new Date(),
  randomBytes = nodeRandomBytes,
} = {}) {
  if (!repositories) throw new TypeError('repositories are required');
  const randomToken = () => Buffer.from(randomBytes(32)).toString('base64url');
  const cookieAttributes = ({ expiresAt } = {}) => [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProduction ? 'Secure' : '',
    expiresAt ? `Expires=${new Date(expiresAt).toUTCString()}` : '',
  ].filter(Boolean);

  return Object.freeze({
    async create(identity) {
      const provisioned = await repositories.provisionUser({
        supabaseSubject: identity.subject,
        email: identity.email,
      });
      const token = randomToken();
      const csrfToken = randomToken();
      const createdAt = new Date(now());
      const expiresAt = new Date(createdAt.valueOf() + SESSION_DURATION_MS);
      await repositories.createSession({
        userId: provisioned.user.id,
        tokenDigest: sha256(token),
        csrfDigest: sha256(csrfToken),
        expiresAt: expiresAt.toISOString(),
      }, { now: createdAt });
      return Object.freeze({
        user: provisioned.user,
        csrfToken,
        cookie: [
          `${SESSION_COOKIE_NAME}=${cookieValue(token, csrfToken)}`,
          ...cookieAttributes({ expiresAt }),
          `Max-Age=${SESSION_DURATION_MS / 1000}`,
        ].join('; '),
      });
    },

    async authenticate(cookieHeader) {
      const raw = readCookie(cookieHeader);
      if (!raw) return null;
      try {
        const session = await repositories.getSessionByTokenDigest(sha256(raw.token), { now: now() });
        if (!equalDigest(session.csrfDigest, sha256(raw.csrfToken))) return null;
        const balance = await repositories.getCreditBalance(session.user.id);
        return Object.freeze({ session, user: session.user, balance, csrfToken: raw.csrfToken });
      } catch (error) {
        if (error instanceof RepositoryNotFoundError) return null;
        throw error;
      }
    },

    verifyCsrf(auth, submittedToken) {
      return Boolean(auth && typeof submittedToken === 'string'
        && equalDigest(sha256(auth.csrfToken), sha256(submittedToken)));
    },

    async destroy(cookieHeader) {
      const raw = readCookie(cookieHeader);
      if (raw) await repositories.deleteSessionByTokenDigest(sha256(raw.token));
    },

    clearCookie() {
      return [...cookieAttributes({ expiresAt: new Date(0) }), 'Max-Age=0'].join('; ');
    },
  });
}
