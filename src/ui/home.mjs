const APP_NAME = 'Cohort15';

function analyticsMarkup(measurementId) {
  if (!measurementId) {
    return '';
  }

  const safeId = String(measurementId).replaceAll(/[^A-Z0-9-]/gi, '');
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${safeId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${safeId}');
    </script>`;
}

export function renderHomePage({ googleAnalyticsId = 'G-LF22TLDSBV' } = {}) {
  return `<!doctype html>
<html lang="en">
  <head>
    ${analyticsMarkup(googleAnalyticsId)}
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Cohort15 helps people form small, high-intent online groups around shared goals.">
    <title>${APP_NAME} | Small, high-intent online groups</title>
    <link rel="stylesheet" href="/assets/styles.css">
  </head>
  <body>
    <header class="shell topbar">
      <a class="brand" href="/">${APP_NAME}</a>
      <span class="status-pill">Lofi MVP</span>
    </header>

    <main>
      <section class="shell hero" aria-labelledby="hero-title">
        <div>
          <p class="eyebrow">Small groups. Clear intent.</p>
          <h1 id="hero-title">Form small, high-intent online groups.</h1>
          <p class="lede">Propose a focused cohort, gather interest for seven days, and unlock the meeting when enough people are ready.</p>
          <div class="button-row" aria-label="Planned Cohort15 actions">
            <span class="button-link" aria-disabled="true">Create a cohort — coming soon</span>
            <span class="button-link secondary" aria-disabled="true">Browse cohorts — coming soon</span>
          </div>
        </div>

        <aside class="foundation-card" aria-labelledby="foundation-title">
          <p class="eyebrow">Foundation ready</p>
          <h2 id="foundation-title">The lofi build starts here.</h2>
          <p>The branch now contains only the application shell. Cohort creation, listings, interest, persistence, and email will be added as isolated tasks.</p>
        </aside>
      </section>

      <section class="section">
        <div class="shell grid" aria-label="How Cohort15 will work">
          <article>
            <p class="step">1</p>
            <h2>Propose a cohort</h2>
            <p>Share a specific topic, schedule, quorum, and approved meeting link.</p>
          </article>
          <article>
            <p class="step">2</p>
            <h2>Gather interest</h2>
            <p>People signal interest with an email during the seven-day window.</p>
          </article>
          <article>
            <p class="step">3</p>
            <h2>Meet at quorum</h2>
            <p>Once quorum is reached, the meeting details become public.</p>
          </article>
        </div>
      </section>
    </main>

    <footer>
      <div class="shell">Cohort15 — small, high-intent online groups.</div>
    </footer>
  </body>
</html>`;
}
