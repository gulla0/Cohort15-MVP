import { APP_NAME } from '../domain/constants.mjs';

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
      <nav class="topbar">
        <a href="/">Cohort15</a>
        <a href="/cohorts">Cohorts</a>
        <a href="/cohorts/new">Create</a>
        <a href="/dashboard/creator">Creator dashboard</a>
        <a href="/dashboard/participant">Participant dashboard</a>
      </nav>

      <section class="hero" aria-labelledby="page-title">
        <p class="eyebrow">Online cohorts</p>
        <h1 id="page-title">${APP_NAME}</h1>
        <p class="lede">Start an online cohort with 2 tokens, show interest with 1 token, and unlock the private link when quorum is met.</p>
        <p class="button-row">
          <a class="button-link" href="/cohorts">Browse cohorts</a>
          <a class="button-link secondary" href="/cohorts/new">Create a cohort</a>
        </p>
      </section>

      <section class="grid" aria-label="MVP actions">
        <article>
          <h2>For creators</h2>
          <p>Publish a cohort, track quorum, and open your creator dashboard after launch.</p>
        </article>
        <article>
          <h2>For participants</h2>
          <p>Browse cohorts, use 1 token to show interest, and return to your participant dashboard.</p>
        </article>
        <article>
          <h2>Token return</h2>
          <p>If a cohort does not meet quorum before the two-week deadline, all tokens are returned.</p>
        </article>
      </section>
    </main>
  </body>
</html>`;
}
