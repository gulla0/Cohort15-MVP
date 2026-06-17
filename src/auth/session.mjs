import { randomUUID } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'cohort15_session';

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

function cookieForSession(sessionId) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function createSessionManager({ repositories, createSessionId = () => randomUUID() }) {
  const sessions = new Map();

  function sessionIdFromRequest(req) {
    const cookies = parseCookieHeader(req.headers?.cookie ?? req.headers?.Cookie);
    return cookies[SESSION_COOKIE_NAME];
  }

  function getCurrentUser(req) {
    const sessionId = sessionIdFromRequest(req);
    if (!sessionId) {
      return undefined;
    }

    const userId = sessions.get(sessionId);
    if (!userId) {
      return undefined;
    }

    return repositories.users.findById(userId);
  }

  function signInUser(user) {
    if (!user?.id) {
      throw new Error('User account was not found.');
    }

    const sessionId = createSessionId();
    sessions.set(sessionId, user.id);
    return {
      user,
      sessionId,
      cookie: cookieForSession(sessionId)
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
    getCurrentUser,
    signIn,
    signInUser,
    signOut
  };
}
