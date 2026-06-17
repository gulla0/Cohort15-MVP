import { APP_NAME } from '../domain/constants.mjs';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderTopbar({ currentUser, csrfToken } = {}) {
  return `<nav class="topbar">
        <a class="brand-link" href="/">${APP_NAME}</a>
        <div class="topbar-links">
          <a href="/cohorts">Cohorts</a>
          <a href="/cohorts/new">Create</a>
          <a href="/dashboard">Dashboard</a>
          <a class="nav-cta" href="/credits/buy">Buy Credits</a>
          ${currentUser ? `<span class="nav-user">${escapeHtml(currentUser.displayName)}</span>
          <form class="nav-form" method="post" action="/auth/sign-out">
            ${csrfToken ? `<input name="csrfToken" type="hidden" value="${escapeHtml(csrfToken)}">` : ''}
            <button type="submit">Sign out</button>
          </form>` : '<a href="/auth/sign-in">Sign in</a>'}
        </div>
      </nav>`;
}

export function renderHomePage({ currentUser, csrfToken } = {}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${APP_NAME} MVP</title>
    <link rel="stylesheet" href="/assets/styles.css">
  </head>
  <body>
    <main class="shell">
      ${renderTopbar({ currentUser, csrfToken })}

      <section class="hero" aria-labelledby="page-title">
        <p class="eyebrow">Online cohorts</p>
        <h1 id="page-title">${APP_NAME}</h1>
        <p class="lede">Start an online cohort with 2 credits, show interest with 1 credit, and unlock the private link when quorum is met.</p>
        <p class="button-row">
          <a class="button-link" href="/cohorts">Browse cohorts</a>
          <a class="button-link secondary" href="/cohorts/new">Create a cohort</a>
        </p>
      </section>

      <section class="grid" aria-label="MVP actions">
        <article>
          <h2>For creators</h2>
          <p>Publish a cohort, track quorum, and follow created cohorts from your dashboard.</p>
        </article>
        <article>
          <h2>For participants</h2>
          <p>Browse cohorts, use 1 credit to show interest, and follow your events from your dashboard.</p>
        </article>
        <article>
          <h2>Credit return</h2>
          <p>If a cohort does not meet quorum before the two-week deadline, all credits are returned.</p>
        </article>
      </section>
    </main>
  </body>
</html>`;
}

export function renderBuyCreditsPage({ currentUser, csrfToken, checkoutEnabled = false, cancelled = false, error } = {}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Buy Credits - ${APP_NAME} MVP</title>
    <link rel="stylesheet" href="/assets/styles.css">
  </head>
  <body>
    <main class="shell">
      ${renderTopbar({ currentUser, csrfToken })}

      <section class="page-heading" aria-labelledby="page-title">
        <p class="eyebrow">Credits</p>
        <h1 id="page-title">Buy Credits</h1>
        <p class="lede">Choose a one-time credit package and pay securely on Stripe Checkout.</p>
      </section>

      ${cancelled ? '<section class="notice"><h2>Checkout cancelled</h2><p>No payment was completed and no credits were added.</p></section>' : ''}
      ${error ? `<section class="error-summary"><h2>Checkout could not start</h2><p>${escapeHtml(error)}</p></section>` : ''}
      ${!currentUser ? `<section class="notice"><h2>Sign in to buy credits</h2><p>Credit purchases are attached to your Cohort15 account.</p><a class="button-link" href="/auth/sign-in?returnTo=%2Fcredits%2Fbuy">Sign in</a></section>` : `
      <section class="grid" aria-label="Credit packages">
        <article>
          <p class="eyebrow">Starter</p>
          <h2>6 credits</h2>
          <p class="lede">$6 one-time</p>
          <form method="post" action="/credits/checkout">
            <input name="packageId" type="hidden" value="6">
            ${csrfToken ? `<input name="csrfToken" type="hidden" value="${escapeHtml(csrfToken)}">` : ''}
            <button type="submit"${checkoutEnabled ? '' : ' disabled'}>Buy 6 credits</button>
          </form>
        </article>
        <article>
          <p class="eyebrow">Best value</p>
          <h2>14 credits</h2>
          <p class="lede">$12 one-time</p>
          <form method="post" action="/credits/checkout">
            <input name="packageId" type="hidden" value="14">
            ${csrfToken ? `<input name="csrfToken" type="hidden" value="${escapeHtml(csrfToken)}">` : ''}
            <button type="submit"${checkoutEnabled ? '' : ' disabled'}>Buy 14 credits</button>
          </form>
        </article>
      </section>
      ${checkoutEnabled ? '' : '<section class="notice"><h2>Checkout unavailable</h2><p>Stripe checkout has not been configured for this environment. No payment can be collected.</p></section>'}`}
    </main>
  </body>
</html>`;
}

export function renderPurchaseCompletePage({ currentUser, csrfToken, purchase }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Credits Added - ${APP_NAME} MVP</title>
    <link rel="stylesheet" href="/assets/styles.css">
  </head>
  <body>
    <main class="shell">
      ${renderTopbar({ currentUser, csrfToken })}
      <section class="page-heading" aria-labelledby="page-title">
        <p class="eyebrow">Payment complete</p>
        <h1 id="page-title">${escapeHtml(purchase.packageCredits)} credits added</h1>
        <p class="lede">Stripe verified the payment and the purchase was recorded in your credit ledger.</p>
        <p class="button-row"><a class="button-link" href="/dashboard">View account credits</a></p>
      </section>
    </main>
  </body>
</html>`;
}
