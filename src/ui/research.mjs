import { analyticsMarkup } from './analytics.mjs';

const ARTICLE_PATH = '/research/why-small-committed-groups';

export const RESEARCH_ENTRIES = Object.freeze([
  Object.freeze({
    type: 'Research',
    title: 'Why small, committed groups are worth building',
    summary: 'A synthesis of 20 public requests for serious peers, recurring accountability, and groups designed around a concrete goal.',
    publishedAt: '2026-06-20',
    href: ARTICLE_PATH,
  }),
]);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeEntryHref(entry) {
  const href = String(entry.href ?? '');
  if (entry.external) {
    let url;
    try { url = new URL(href); } catch { throw new TypeError('External research links must be valid URLs.'); }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new TypeError('External research links must use HTTP or HTTPS.');
    }
    return url.href;
  }
  if (!href.startsWith('/research/') || href.includes('\\')) {
    throw new TypeError('Internal research links must use a /research/ route.');
  }
  return href;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) throw new TypeError('Research entry dates must use YYYY-MM-DD.');
  return new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

function pageStart({ title, description, googleAnalyticsId, researchIndex = false }) {
  return `<!doctype html><html lang="en"><head>${analyticsMarkup(googleAnalyticsId)}<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><title>${escapeHtml(title)} | Cohort15</title><link rel="stylesheet" href="/assets/styles.css"></head><body>
    <header class="shell topbar"><a class="brand" href="/">Cohort15</a><nav class="site-nav" aria-label="Primary navigation"><a class="text-link" href="/#cohorts">Browse cohorts</a><a class="text-link" href="/research"${researchIndex ? ' aria-current="page"' : ''}>Research &amp; Field Notes</a><a class="button-link compact" href="/cohorts/new">Create a cohort</a></nav></header>`;
}

export function renderResearchCard(entry) {
  const href = escapeHtml(safeEntryHref(entry));
  const external = entry.external ? ' target="_blank" rel="noopener noreferrer"' : '';
  const action = entry.external ? 'Read external publication ↗' : 'Read on Cohort15 →';
  return `<article class="research-card">
    <div class="research-meta"><span class="status-pill">${escapeHtml(entry.type)}</span><time datetime="${escapeHtml(entry.publishedAt)}">${escapeHtml(formatDate(entry.publishedAt))}</time></div>
    <h2><a href="${href}"${external}>${escapeHtml(entry.title)}</a></h2>
    <p>${escapeHtml(entry.summary)}</p>
    <a class="text-link" href="${href}"${external}>${action}</a>
  </article>`;
}

export function renderResearchIndexPage({
  googleAnalyticsId = 'G-LF22TLDSBV', entries = RESEARCH_ENTRIES,
} = {}) {
  return `${pageStart({
    title: 'Research & Field Notes',
    description: 'Research, essays, field notes, and product updates shaping Cohort15.',
    googleAnalyticsId,
    researchIndex: true,
  })}<main>
    <section class="shell research-hero" aria-labelledby="research-title"><p class="eyebrow">Research &amp; Field Notes</p><h1 id="research-title">The thinking behind Cohort15.</h1><p class="lede">Research, product observations, and working ideas about helping a few serious people reliably show up around a concrete goal.</p></section>
    <section class="section research-lanes" aria-labelledby="collection-title"><div class="shell"><div class="section-heading"><div><p class="eyebrow">The collection</p><h2 id="collection-title">Evidence, ideas, and progress.</h2><p>Written work lives here. Product videos will include a useful written summary and a link to YouTube; selected external publications will be labeled clearly.</p></div></div><div class="editorial-lanes" aria-label="Content types"><span>Research</span><span>Essays</span><span>Field notes</span><span>Product updates</span><span>External publications</span></div></div></section>
    <section class="section listing-section" aria-labelledby="latest-title"><div class="shell"><div class="section-heading"><div><p class="eyebrow">Latest</p><h2 id="latest-title">Start with the evidence.</h2></div></div><div class="research-grid">${entries.map(renderResearchCard).join('')}</div></div></section>
  </main><footer><div class="shell">Cohort15 — small, high-intent online groups.</div></footer></body></html>`;
}

export function renderDemandResearchArticle({ googleAnalyticsId = 'G-LF22TLDSBV' } = {}) {
  return `${pageStart({
    title: 'Why small, committed groups are worth building',
    description: 'What 20 public requests for serious peers reveal about small, structured, goal-oriented groups.',
    googleAnalyticsId,
  })}<main class="shell article-shell">
    <a class="text-link" href="/research">← All research &amp; field notes</a>
    <header class="article-header"><p class="eyebrow">Research</p><h1>Why small, committed groups are worth building</h1><p class="lede">What 20 public requests for serious peers reveal about accountability, group size, and the limits of broad online communities.</p><div class="article-byline"><span>By Cohort15</span><time datetime="2026-06-20">June 20, 2026</time><span>8 min read</span></div></header>
    <article class="article-body">
      <p class="article-intro">People are not simply asking for more community. They are asking for a few serious people who share a goal, agree on a cadence, and reliably show up.</p>

      <h2>The question behind the research</h2>
      <p>Cohort15 is built around a simple premise: a small group becomes useful when its purpose, schedule, and minimum commitment are concrete. We wanted to test whether people already describe this need in public, without prompting from us.</p>
      <p>The research focused on requests for study partners, accountability groups, founder circles, practice squads, and other recurring small-group formats. The aim was not to estimate the total market. It was to look for repeated language, constraints, and frustrations that could confirm—or weaken—the product thesis.</p>

      <h2>Methodology</h2>
      <p>We reviewed 20 relevant public posts and comments across Reddit, Indie Hackers, and Hacker News. Fourteen were recent at the time of review; six older examples were included because they described the desired structure unusually clearly.</p>
      <p>Each item was examined for the goal people wanted to pursue, preferred group size, expected cadence, commitment language, and the failure mode of existing options. Public usernames, outreach notes, internal rankings, and research-system citation markers have intentionally been excluded from this article.</p>

      <h2>The strongest pattern: commitment density</h2>
      <p>Across technical learning, job searching, solo building, writing, and gaming, people repeatedly asked for a small number of reliable peers. Their language was practical: serious, consistent, committed, weekly check-ins, regular communication, and people who actually show up.</p>
      <p>This is better understood as a search for <strong>commitment density</strong> than a search for community size. A large server can contain thousands of relevant people while still making it difficult to know who shares your timeline, schedule, and willingness to participate.</p>

      <blockquote><p>The recurring request is not “give me more people.” It is “help me find the few people who will do this with me.”</p></blockquote>

      <h2>People are already writing the group specification</h2>
      <p>Many requests included enough detail to define a cohort: a specific skill or outcome, a timezone, a recurring meeting rhythm, a preferred number of participants, and a threshold for seriousness. Examples included multiple weekly coding check-ins, Sunday interview practice, weekly chapter targets, and fixed progress reviews for founders.</p>
      <p>That matters because Cohort15 does not need to invent a new social behavior. The product can formalize behavior people already attempt manually: state the goal, make the schedule visible, gather a minimum number of committed people, and begin when the group is viable.</p>

      <h2>Where existing options break down</h2>
      <p>The repeated complaints were not about a lack of content or public communities. They were about follow-through in the social layer:</p>
      <ul>
        <li>one-to-one partners disappear or turn out to be a poor fit;</li>
        <li>large Discord and Slack communities become noisy or passive;</li>
        <li>groups start without a clear cadence or participation threshold;</li>
        <li>time-zone and availability mismatches appear after people join;</li>
        <li>there is no clear moment when interest becomes a real commitment.</li>
      </ul>
      <p>A useful product response is therefore structural, not motivational. The group needs a concrete purpose, public schedule, small scope, and clear start condition.</p>

      <h2>The clearest early use cases</h2>
      <p>Technical learning and career preparation produced the most concentrated evidence. DSA and interview practice, beginner programming, AI project learning, and job-search accountability all combine measurable goals with recurring work. They are natural candidates for short, focused cohorts.</p>
      <p>Founder accountability also showed strong demand, especially around isolation and maintaining momentum. Writing and reliable gaming squads suggest the same structure can travel beyond work and education, but they should be tested rather than assumed to behave identically.</p>

      <h2>What this means for Cohort15</h2>
      <ol>
        <li><strong>Keep groups small and specific.</strong> Relevance and reliability matter more than reach.</li>
        <li><strong>Make cadence visible before joining.</strong> Schedule is part of the match, not an administrative detail.</li>
        <li><strong>Use a clear start condition.</strong> A quorum turns vague interest into an actionable group.</li>
        <li><strong>Favor time-bounded experiments.</strong> A defined run is easier to commit to and evaluate.</li>
        <li><strong>Measure attendance and continuation.</strong> Sign-ups alone cannot validate whether the group is useful.</li>
      </ol>

      <h2>Limitations</h2>
      <p>This was directional demand research, not a representative survey. Public posts overrepresent people comfortable asking online, and Reddit was easier to search than LinkedIn, X, YouTube comments, or private communities. Some examples requested one partner rather than a group, and stated intent does not prove that participants will attend.</p>
      <p>The findings support testing the product thesis; they do not settle group size, matching quality, retention, or willingness to pay. Those questions require live cohort experiments and direct participant feedback.</p>

      <section class="article-cta" aria-labelledby="article-cta-title"><p class="eyebrow">Put the idea to work</p><h2 id="article-cta-title">Make the group you wish existed.</h2><p>Choose a concrete goal, set the schedule and quorum, and let interested people decide with the full commitment in view.</p><div class="button-row"><a class="button-link" href="/cohorts/new">Create a cohort</a><a class="button-link secondary" href="/#cohorts">Browse cohorts</a></div></section>
    </article>
  </main><footer><div class="shell">Cohort15 — small, high-intent online groups.</div></footer></body></html>`;
}

export { ARTICLE_PATH };
