import { localTimeScript, renderCohortCard } from './cohorts.mjs';

function analyticsMarkup(measurementId) {
  if (!measurementId) return '';
  const safeId = String(measurementId).replaceAll(/[^A-Z0-9-]/gi, '');
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${safeId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${safeId}');</script>`;
}

export function renderHomePage({ googleAnalyticsId = 'G-LF22TLDSBV', cohorts = [], status = 'all' } = {}) {
  const cards = cohorts.length
    ? cohorts.map(renderCohortCard).join('')
    : '<div class="empty-state"><h3>No cohorts in this view yet.</h3><p>Create the first one or choose another filter.</p></div>';
  const filter = (value, text) => `<a class="filter-link${status === value ? ' selected' : ''}" href="${value === 'all' ? '/#cohorts' : `/?status=${value}#cohorts`}"${status === value ? ' aria-current="page"' : ''}>${text}</a>`;
  return `<!doctype html><html lang="en"><head>${analyticsMarkup(googleAnalyticsId)}<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Cohort15 helps people form small, high-intent online groups around shared goals."><title>Cohort15 | Small, high-intent online groups</title><link rel="stylesheet" href="/assets/styles.css"></head><body>
    <header class="shell topbar"><a class="brand" href="/">Cohort15</a><a class="text-link" href="#cohorts">Browse cohorts</a></header>
    <main><section class="shell hero" aria-labelledby="hero-title"><div><p class="eyebrow">Small groups. Clear intent.</p><h1 id="hero-title">Form small, high-intent online groups.</h1><p class="lede">Propose a focused cohort, gather interest for seven days, and unlock the meeting when enough people are ready.</p><div class="button-row"><a class="button-link" href="/cohorts/new">Create a cohort</a><a class="button-link secondary" href="#cohorts">Browse cohorts</a></div></div><aside class="foundation-card"><p class="eyebrow">How it works</p><h2>Make the group concrete.</h2><p>Set a topic, schedule, and quorum. People signal interest privately; the approved meeting link becomes public when the group is ready.</p></aside></section>
    <section class="section"><div class="shell grid"><article><p class="step">1</p><h2>Propose a cohort</h2><p>Share a specific topic, schedule, quorum, and approved meeting link.</p></article><article><p class="step">2</p><h2>Gather interest</h2><p>People signal interest privately during the seven-day window.</p></article><article><p class="step">3</p><h2>Meet at quorum</h2><p>Once quorum is reached, the approved meeting link becomes public.</p></article></div></section>
    <section class="section listing-section" id="cohorts"><div class="shell"><div class="section-heading"><div><p class="eyebrow">Open directory</p><h2>Find your next cohort.</h2><p>All meeting times below are shown in your local timezone. Expired listings stay visible.</p></div><a class="button-link compact" href="/cohorts/new">Create a cohort</a></div><nav class="filters" aria-label="Filter cohorts">${filter('all', 'All')}${filter('active', 'Active')}${filter('expired', 'Expired')}</nav><div class="cohort-grid">${cards}</div></div></section></main>
    <footer><div class="shell">Cohort15 — small, high-intent online groups.</div></footer>${localTimeScript()}</body></html>`;
}
