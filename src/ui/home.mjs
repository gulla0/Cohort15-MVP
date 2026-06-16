import { APP_NAME } from '../domain/constants.mjs';

export function renderTopbar() {
  return `<nav class="topbar">
        <a class="brand-link" href="/">${APP_NAME}</a>
        <div class="topbar-links">
          <a href="/cohorts">Cohorts</a>
          <a href="/cohorts/new">Create</a>
          <a href="/dashboard">Dashboard</a>
          <a class="nav-cta" href="/credits/buy">Buy Credits</a>
        </div>
      </nav>`;
}

export function renderHomePage() {
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
      ${renderTopbar()}

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

export function renderBuyCreditsPlaceholderPage() {
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
      ${renderTopbar()}

      <section class="page-heading" aria-labelledby="page-title">
        <p class="eyebrow">Credits</p>
        <h1 id="page-title">Buy Credits</h1>
        <p class="lede">Credit purchasing is not live yet. This page marks where checkout will be added when payment handling is implemented.</p>
      </section>

      <section class="notice">
        <h2>Checkout coming soon</h2>
        <p>No payment is collected here, and no credits are added from this placeholder.</p>
        <p class="button-row">
          <a class="button-link" href="/dashboard">View account credits</a>
          <a class="button-link secondary" href="/cohorts">Browse cohorts</a>
        </p>
      </section>
    </main>
  </body>
</html>`;
}
