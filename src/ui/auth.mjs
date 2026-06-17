import { APP_NAME } from '../domain/constants.mjs';
import { renderTopbar } from './home.mjs';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function userOptions(users) {
  return users.map((user) => (
    `<option value="${escapeHtml(user.id)}">${escapeHtml(user.displayName)}</option>`
  )).join('');
}

function errorNotice(error) {
  if (!error) {
    return '';
  }

  return `<section class="notice error" aria-live="polite">
    <h2>Sign in failed</h2>
    <p>${escapeHtml(error)}</p>
  </section>`;
}

function localSignInForm(users, returnTo) {
  return `<form class="form-grid auth-form" method="post" action="/auth/sign-in">
    <input name="returnTo" type="hidden" value="${escapeHtml(returnTo)}">
    <label>
      Account
      <select name="userId" required>
        ${userOptions(users)}
      </select>
    </label>
    <button type="submit">Sign in</button>
  </form>`;
}

function supabaseSignInForm(returnTo, enableMagicLink) {
  return `<section class="auth-actions" aria-label="Production sign in options">
    <a class="button-link" href="/auth/supabase/google?returnTo=${encodeURIComponent(returnTo)}">Continue with Google</a>
    <a class="button-link secondary" href="/auth/supabase/github?returnTo=${encodeURIComponent(returnTo)}">Continue with GitHub</a>
    ${enableMagicLink ? `<form class="form-grid auth-form" method="post" action="/auth/magic-link">
      <input name="returnTo" type="hidden" value="${escapeHtml(returnTo)}">
      <label>
        Email
        <input name="email" type="email" autocomplete="email" required>
      </label>
      <button type="submit">Email a sign-in link</button>
    </form>` : ''}
  </section>`;
}

export function renderSignInPage({
  users = [],
  currentUser,
  csrfToken,
  error,
  returnTo = '/',
  mode = 'local',
  enableMagicLink = false
} = {}) {
  const isProduction = mode === 'supabase';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sign in - ${APP_NAME} MVP</title>
    <link rel="stylesheet" href="/assets/styles.css">
  </head>
  <body>
    <main class="shell">
      ${renderTopbar({ currentUser, csrfToken })}

      <section class="page-heading" aria-labelledby="page-title">
        <p class="eyebrow">${isProduction ? 'Secure auth' : 'Local auth'}</p>
        <h1 id="page-title">Sign in</h1>
        <p class="lede">${isProduction
          ? 'Use a connected account to create cohorts, show interest, and view your dashboard.'
          : 'Choose a local development account to create cohorts, show interest, and view your dashboard.'}</p>
      </section>

      ${errorNotice(error)}
      ${isProduction ? supabaseSignInForm(returnTo, enableMagicLink) : localSignInForm(users, returnTo)}
    </main>
  </body>
</html>`;
}
