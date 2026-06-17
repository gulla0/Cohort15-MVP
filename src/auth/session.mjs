import { randomUUID } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'cohort15_session';
export const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function parseCookieHeader(header) {
  if (!header) {
    return {};
  }

  return Object.fromEntries(String(header)
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const separatorIndex = pair.indexOf('=');
      if (separatorIndex === -1) {
        return [pair, ''];
      }

      return [
        decodeURIComponent(pair.slice(0, separatorIndex)),
        decodeURIComponent(pair.slice(separatorIndex + 1))
      ];
    }));
}

function formatCookieExpires(now, maxAgeSeconds) {
  return new Date(now.getTime() + maxAgeSeconds * 1000).toUTCString();
}

function cookieForSession(sessionId, options) {
  const now = options.now();
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${options.maxAgeSeconds}`,
    `Expires=${formatCookieExpires(now, options.maxAgeSeconds)}`
  ];

  if (options.secureCookies) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function clearSessionCookie({ secureCookies = false } = {}) {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];

  if (secureCookies) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function createSessionManager({
  repositories,
  createSessionId = () => randomUUID(),
  createCsrfToken = () => randomUUID(),
  now = () => new Date(),
  secureCookies = false,
  maxAgeSeconds = DEFAULT_SESSION_MAX_AGE_SECONDS
}) {
  const sessions = new Map();
  const options = {
    now,
    secureCookies,
    maxAgeSeconds
  };

  function sessionIdFromRequest(req) {
    const cookies = parseCookieHeader(req.headers?.cookie ?? req.headers?.Cookie);
    return cookies[SESSION_COOKIE_NAME];
  }

  function getCurrentUser(req) {
    const sessionId = sessionIdFromRequest(req);
    if (!sessionId) {
      return undefined;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return undefined;
    }

    if (session.expiresAt <= now()) {
      sessions.delete(sessionId);
      return undefined;
    }

    return repositories.users.findById(session.userId);
  }

  function csrfTokenForRequest(req) {
    const sessionId = sessionIdFromRequest(req);
    if (!sessionId) {
      return undefined;
    }

    const session = sessions.get(sessionId);
    if (!session || session.expiresAt <= now()) {
      if (session) {
        sessions.delete(sessionId);
      }
      return undefined;
    }

    return session.csrfToken;
  }

  function verifyCsrfToken(req, token) {
    const expected = csrfTokenForRequest(req);
    return Boolean(expected && token && token === expected);
  }

  function signInUser(user) {
    if (!user?.id) {
      throw new Error('User account was not found.');
    }

    const sessionId = createSessionId();
    sessions.set(sessionId, {
      userId: user.id,
      csrfToken: createCsrfToken(),
      expiresAt: new Date(now().getTime() + maxAgeSeconds * 1000)
    });
    return {
      user,
      sessionId,
      cookie: cookieForSession(sessionId, options)
    };
  }

  function signIn(userId) {
    const user = repositories.users.findById(userId);
    if (!user) {
      throw new Error('User account was not found.');
    }

    return signInUser(user);
  }

  function signOut(req) {
    const sessionId = sessionIdFromRequest(req);
    if (sessionId) {
      sessions.delete(sessionId);
    }
  }

  return {
    csrfTokenForRequest,
    getCurrentUser,
    signIn,
    signInUser,
    signOut,
    verifyCsrfToken
  };
}
