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
      <section class="hero" aria-labelledby="page-title">
        <p class="eyebrow">MVP foundation</p>
        <h1 id="page-title">${APP_NAME}</h1>
        <p class="lede">Online cohort events where creators and participants stake tokens until quorum unlocks the private link.</p>
      </section>

      <section class="grid" aria-label="Implementation areas">
        <article>
          <h2>Domain</h2>
          <p>Event, interest, token ledger, and social outbox rules land here.</p>
        </article>
        <article>
          <h2>Persistence</h2>
          <p>Database schema, repositories, seed data, and ledger helpers land here.</p>
        </article>
        <article>
          <h2>Interface</h2>
          <p>Create, feed, detail, interest, and dashboard surfaces land here.</p>
        </article>
      </section>
    </main>
  </body>
</html>`;
}
