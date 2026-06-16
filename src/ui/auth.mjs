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

export function renderSignInPage({ users = [], currentUser, error, returnTo = '/' } = {}) {
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
      ${renderTopbar({ currentUser })}

      <section class="page-heading" aria-labelledby="page-title">
        <p class="eyebrow">Local auth</p>
        <h1 id="page-title">Sign in</h1>
        <p class="lede">Choose a local development account to create cohorts, show interest, and view your dashboard.</p>
      </section>

      ${errorNotice(error)}

      <form class="form-grid auth-form" method="post" action="/auth/sign-in">
        <input name="returnTo" type="hidden" value="${escapeHtml(returnTo)}">
        <label>
          Account
          <select name="userId" required>
            ${userOptions(users)}
          </select>
        </label>
        <button type="submit">Sign in</button>
      </form>
    </main>
  </body>
</html>`;
}
