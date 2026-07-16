import {
  cohortCardScript, localTimeScript, portableRequestScript, renderCohortCard,
} from './cohorts.mjs';
import { analyticsMarkup } from './analytics.mjs';
import { renderFeedbackWidget } from './feedback-widget.mjs';
import { renderSiteHeader } from './navigation.mjs';

export function renderHomePage({
  googleAnalyticsId = 'G-LF22TLDSBV', cohorts = [], status = 'all', auth = null,
  appUrl = 'http://localhost:3000',
} = {}) {
  const cards = cohorts.length
    ? cohorts.map((cohort) => renderCohortCard(cohort, { appUrl })).join('')
    : '<div class="empty-state"><h3>No cohorts in this view yet.</h3><p>Create the first one or choose another filter.</p></div>';
  const filter = (value, text) => `<a class="filter-link${status === value ? ' selected' : ''}" href="${value === 'all' ? '/#cohorts' : `/?status=${value}#cohorts`}"${status === value ? ' aria-current="page"' : ''}>${text}</a>`;
  return `<!doctype html><html lang="en"><head>${analyticsMarkup(googleAnalyticsId)}<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Cohort15 helps people form small, high-intent online groups around shared goals."><title>Cohort15 | Small, high-intent online groups</title><link rel="stylesheet" href="/assets/styles.css"></head><body>
    ${renderSiteHeader({ auth, currentPath: '/' })}
    <main><section class="shell hero" aria-labelledby="hero-title"><div><p class="eyebrow">Small groups. Clear intent.</p><h1 id="hero-title">Find a few people who will actually show up.</h1><p class="lede">Turn one focused goal into a small online group with a clear schedule and enough committed people to begin.</p><div class="example-cohorts" aria-labelledby="example-cohorts-title"><p class="example-label" id="example-cohorts-title">Example cohorts</p><ul><li>Interview practice</li><li>Language learning</li><li>Founder accountability</li><li>A focused book group</li></ul></div><div class="button-row"><a class="button-link" href="/cohorts/new">Create a cohort</a><a class="button-link secondary" href="#cohorts">Browse cohorts</a></div></div><aside class="foundation-card credit-explainer"><p class="eyebrow">Free to start</p><h2>Create your first cohort for free.</h2><p>New accounts get <strong>2 credits</strong>—enough to create one cohort or join two.</p><p>If a cohort doesn’t form, those credits come back.</p></aside></section>
    <section class="section"><div class="shell grid"><article><p class="step">1</p><h2>Propose a cohort</h2><p>Share a specific topic, schedule, quorum, and approved meeting link.</p></article><article><p class="step">2</p><h2>Gather interest</h2><p>People signal interest privately during the seven-day window.</p></article><article><p class="step">3</p><h2>Meet at quorum</h2><p>Once quorum is reached, the approved meeting link becomes public.</p></article></div></section>
    <section class="section listing-section" id="cohorts"><div class="shell"><div class="section-heading"><div><p class="eyebrow">Open directory</p><h2>Find your next cohort.</h2><p>All meeting times below are shown in your local timezone. Expired listings stay visible.</p></div><a class="button-link compact" href="/cohorts/new">Create a cohort</a></div><nav class="filters" aria-label="Filter cohorts">${filter('all', 'All')}${filter('active', 'Active')}${filter('expired', 'Expired')}</nav><div class="cohort-grid">${cards}</div></div></section></main>
    <footer><div class="shell">Cohort15 — small, high-intent online groups.</div></footer>${renderFeedbackWidget()}${localTimeScript()}${portableRequestScript()}${cohortCardScript()}</body></html>`;
}
