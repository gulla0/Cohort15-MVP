function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function renderAuthNavigation(auth) {
  if (!auth) return '<a class="button-link compact" href="/auth/sign-in">Sign in</a>';
  return `<span class="credit-count" aria-label="Available credits">${auth.balance.available} credits</span><a class="text-link" href="/credits/buy">Buy credits</a><form class="inline-form" method="post" action="/auth/sign-out"><input type="hidden" name="csrf" value="${escapeHtml(auth.csrfToken)}"><button class="text-button" type="submit">Sign out</button></form>`;
}

export function renderSignInPage({ auth = null, returnTo = '/', requested = false, error = false } = {}) {
  const safeReturn = escapeHtml(returnTo);
  const content = auth
    ? `<div class="auth-card"><p class="eyebrow">Signed in</p><h1>You’re ready to form a cohort.</h1><p>You have <strong>${auth.balance.available} available credits</strong>.</p><div class="button-row"><a class="button-link" href="${safeReturn}">Continue</a><a class="button-link secondary" href="/credits/buy">Buy credits</a></div></div>`
    : `<div class="auth-card"><p class="eyebrow">Email magic link</p><h1>Sign in to Cohort15.</h1><p class="lede">We’ll email you a one-time link. New accounts receive two credits.</p>${requested ? '<div class="notice" role="status"><strong>Check your email.</strong><p>If the address can receive a sign-in link, it will arrive shortly.</p></div>' : ''}${error ? '<div class="form-error" role="alert"><strong>That sign-in link could not be verified.</strong><br>Request a new link and try again.</div>' : ''}<form class="auth-form" method="post" action="/auth/magic-link"><input type="hidden" name="returnTo" value="${safeReturn}"><label>Email <input type="email" name="email" maxlength="254" required autocomplete="email"></label><button type="submit">Email me a sign-in link</button></form>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sign in | Cohort15</title><link rel="stylesheet" href="/assets/styles.css"></head><body><header class="shell topbar"><a class="brand" href="/">Cohort15</a><nav class="site-nav" aria-label="Primary navigation"><a class="text-link" href="/#cohorts">Browse cohorts</a><a class="text-link" href="/research">Research &amp; Field Notes</a></nav></header><main class="shell auth-shell">${content}</main></body></html>`;
}
