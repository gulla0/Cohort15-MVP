import { APP_NAME } from '../domain/constants.mjs';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatEnum(value) {
  return escapeHtml(String(value ?? '').replaceAll('_', ' '));
}

function pageShell({ title, eyebrow, heading, lede, body }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)} - ${APP_NAME} MVP</title>
    <link rel="stylesheet" href="/assets/styles.css">
  </head>
  <body>
    <main class="shell">
      <nav class="topbar">
        <a href="/">${APP_NAME}</a>
        <a href="/cohorts">Cohorts</a>
        <a href="/cohorts/new">Create</a>
        <a href="/dashboard/creator">Creator dashboard</a>
        <a href="/dashboard/participant">Participant dashboard</a>
      </nav>

      <section class="page-heading" aria-labelledby="page-title">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1 id="page-title">${escapeHtml(heading)}</h1>
        <p class="lede">${escapeHtml(lede)}</p>
      </section>

      ${body}
    </main>
  </body>
</html>`;
}

function statusBadge(status) {
  return `<span class="status status-${escapeHtml(status)}">${formatEnum(status)}</span>`;
}

function balancePanel(balance) {
  return `<section class="dashboard-summary">
    <article>
      <h2>Available</h2>
      <p>${escapeHtml(balance.available)} token(s)</p>
    </article>
    <article>
      <h2>In use</h2>
      <p>${escapeHtml(balance.held)} token(s)</p>
    </article>
    <article>
      <h2>Used</h2>
      <p>${escapeHtml(balance.consumed)} token(s)</p>
    </article>
    <article>
      <h2>Returned</h2>
      <p>${escapeHtml(balance.refunded)} token(s)</p>
    </article>
  </section>`;
}

function tokenText(summary) {
  return `${summary.held} in use / ${summary.consumed} used / ${summary.refunded} returned`;
}

function interestStatusText(status) {
  if (status === 'active') {
    return 'Interest recorded';
  }

  if (status === 'consumed') {
    return 'Seat confirmed';
  }

  if (status === 'refunded') {
    return 'Tokens returned';
  }

  return formatEnum(status);
}

function privateLink(event) {
  if (!event.lockedEventLink) {
    return '<p>Private link hidden.</p>';
  }

  return `<p><a href="${escapeHtml(event.lockedEventLink)}">${escapeHtml(event.lockedEventLink)}</a></p>`;
}

function emptyState(copy) {
  return `<section class="notice">
    <h2>Nothing to show yet</h2>
    <p>${escapeHtml(copy)}</p>
  </section>`;
}

function creatorCohortRow(item) {
  return `<article class="dashboard-row">
    <img class="dashboard-event-image" src="${escapeHtml(item.event.imageUrl)}" alt="${escapeHtml(item.event.title)} cohort image">
    <div class="event-card-header">
      ${statusBadge(item.event.status)}
      <span>${escapeHtml(item.interestCount)} participant interest(s)</span>
    </div>
    <h2><a href="/cohorts/${encodeURIComponent(item.event.id)}?viewerId=${encodeURIComponent(item.event.creatorId)}">${escapeHtml(item.event.title)}</a></h2>
    <p>${escapeHtml(item.event.topic)} - creator tokens: ${escapeHtml(tokenText(item.tokenSummary))}</p>
    ${privateLink(item.event)}
  </article>`;
}

function participantInterestRow(item) {
  return `<article class="dashboard-row">
    <img class="dashboard-event-image" src="${escapeHtml(item.event.imageUrl)}" alt="${escapeHtml(item.event.title)} cohort image">
    <div class="event-card-header">
      ${statusBadge(item.event.status)}
      <span>${escapeHtml(interestStatusText(item.interest.status))}</span>
    </div>
    <h2><a href="/cohorts/${encodeURIComponent(item.event.id)}?viewerId=${encodeURIComponent(item.interest.userId)}">${escapeHtml(item.event.title)}</a></h2>
    <p>${escapeHtml(item.event.topic)} - participant tokens: ${escapeHtml(tokenText(item.tokenSummary))}</p>
    ${privateLink(item.event)}
  </article>`;
}

export function renderCreatorDashboardPage({ dashboard }) {
  return pageShell({
    title: 'Creator dashboard',
    eyebrow: 'Creator dashboard',
    heading: dashboard.user.displayName,
    lede: 'Owned cohorts, status, token summaries, and unlocked cohort links.',
    body: `${balancePanel(dashboard.balance)}
      ${dashboard.cohorts.length === 0
        ? emptyState('Create a cohort to see creator activity here.')
        : `<section class="event-list">${dashboard.cohorts.map(creatorCohortRow).join('')}</section>`}`
  });
}

export function renderParticipantDashboardPage({ dashboard }) {
  return pageShell({
    title: 'Participant dashboard',
    eyebrow: 'Participant dashboard',
    heading: dashboard.user.displayName,
    lede: 'Cohorts where this user showed interest, with token and access status.',
    body: `${balancePanel(dashboard.balance)}
      ${dashboard.interests.length === 0
        ? emptyState('Show interest in a cohort to see participant activity here.')
        : `<section class="event-list">${dashboard.interests.map(participantInterestRow).join('')}</section>`}`
  });
}
