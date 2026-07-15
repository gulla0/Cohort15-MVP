import { renderAuthNavigation } from './auth.mjs';

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function shell(title, auth, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} | Cohort15</title><link rel="stylesheet" href="/assets/styles.css"></head><body><header class="shell topbar"><a class="brand" href="/">Cohort15</a><nav class="site-nav" aria-label="Primary navigation"><a class="text-link" href="/#cohorts">Browse cohorts</a>${renderAuthNavigation(auth)}</nav></header><main class="shell auth-shell">${content}</main></body></html>`;
}

export function renderBuyCreditsPage({ auth = null, cancelled = false, returnTo = '/' } = {}) {
  const notice = cancelled ? '<div class="notice" role="status"><strong>Checkout was cancelled.</strong><p>No credits were added and you were not charged by Cohort15.</p></div>' : '';
  const action = auth
    ? `<form class="auth-form" method="post" action="/credits/checkout"><input type="hidden" name="csrf" value="${escapeHtml(auth.csrfToken)}"><input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}"><button class="button-link" type="submit">Buy 6 credits for $6</button></form>`
    : `<a class="button-link" href="/auth/sign-in?return_to=${encodeURIComponent(`/credits/buy?return_to=${encodeURIComponent(returnTo)}`)}">Sign in to buy credits</a>`;
  return shell('Buy credits', auth, `<section class="auth-card"><p class="eyebrow">One-time credit package</p><h1>6 credits for $6.</h1><p class="lede">Use credits to create cohorts (2 credits) or show interest (1 credit). Card processing happens securely on Stripe Checkout.</p>${notice}${action}<p class="field-note payment-note">One-time payment. No subscription.</p></section>`);
}

export function renderCheckoutCompletePage({ auth, state, returnTo = '/' } = {}) {
  const content = state === 'paid'
    ? '<p class="eyebrow">Payment complete</p><h1>Six credits were added.</h1><p>Your balance is ready for your next cohort action.</p>'
    : state === 'pending'
      ? '<p class="eyebrow">Payment processing</p><h1>We’re confirming your payment.</h1><p>No action is needed. Refresh this page in a moment.</p>'
      : '<p class="eyebrow">Payment not confirmed</p><h1>We could not add credits.</h1><p>Your payment could not be verified. Please return to the credit page and try again.</p>';
  return shell('Checkout result', auth, `<section class="auth-card">${content}<div class="button-row"><a class="button-link" href="${escapeHtml(returnTo)}">Continue</a><a class="button-link secondary" href="/credits/buy">Buy credits</a></div></section>`);
}
