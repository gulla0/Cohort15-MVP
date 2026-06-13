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

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  }).format(value);
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
        <a class="brand-link" href="/">${APP_NAME}</a>
        <div class="topbar-links">
          <a href="/cohorts">Cohorts</a>
          <a href="/cohorts/new">Create</a>
          <a href="/dashboard">Dashboard</a>
        </div>
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

function balancePanel(balance, label = '') {
  return `<section class="dashboard-summary">
    ${label ? `<h2>${escapeHtml(label)}</h2>` : ''}
    <article>
      <h2>Available</h2>
      <p>${escapeHtml(balance.available)} credit(s)</p>
    </article>
    <article>
      <h2>In use</h2>
      <p>${escapeHtml(balance.held)} credit(s)</p>
    </article>
    <article>
      <h2>Used</h2>
      <p>${escapeHtml(balance.consumed)} credit(s)</p>
    </article>
  </section>`;
}

function dashboardPanel({ title, description, children }) {
  return `<section class="dashboard-panel" aria-labelledby="${escapeHtml(title.toLowerCase().replaceAll(' ', '-'))}">
    <div class="dashboard-panel-heading">
      <h2 id="${escapeHtml(title.toLowerCase().replaceAll(' ', '-'))}">${escapeHtml(title)}</h2>
      <p>${escapeHtml(description)}</p>
    </div>
    ${children}
  </section>`;
}

function interestStatusText(status) {
  if (status === 'active') {
    return 'Interest recorded';
  }

  if (status === 'consumed') {
    return 'Seat confirmed';
  }

  if (status === 'refunded') {
    return 'Credits returned';
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

function eventMeta(event) {
  return `<dl class="meta-grid dashboard-meta">
    <div>
      <dt>Topic</dt>
      <dd>${escapeHtml(event.topic)}</dd>
    </div>
    <div>
      <dt>First meeting</dt>
      <dd>${escapeHtml(formatDateTime(event.firstMeetingAt))}</dd>
    </div>
    <div>
      <dt>Quorum</dt>
      <dd>${escapeHtml(event.minQuorum)} needed</dd>
    </div>
  </dl>`;
}

function creatorCohortRow(item) {
  return `<article class="dashboard-row">
    <img class="dashboard-event-image" src="${escapeHtml(item.event.imageUrl)}" alt="${escapeHtml(item.event.title)} cohort image">
    <div class="event-card-header">
      ${statusBadge(item.event.status)}
      <span>${escapeHtml(item.interestCount)} participant interest(s)</span>
    </div>
    <h2><a href="/cohorts/${encodeURIComponent(item.event.id)}?viewerId=${encodeURIComponent(item.event.creatorId)}">${escapeHtml(item.event.title)}</a></h2>
    ${eventMeta(item.event)}
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
    ${eventMeta(item.event)}
    ${privateLink(item.event)}
  </article>`;
}

function activeScheduleItems({ creatorDashboard, participantDashboard }) {
  const items = new Map();

  for (const cohort of creatorDashboard.cohorts) {
    if (cohort.event.status === 'active') {
      items.set(`created-${cohort.event.id}`, {
        event: cohort.event,
        userId: cohort.event.creatorId,
        context: `${creatorDashboard.user.displayName} started this cohort`
      });
    }
  }

  for (const interest of participantDashboard.interests) {
    if (interest.event.status === 'active') {
      items.set(`interested-${interest.event.id}`, {
        event: interest.event,
        userId: interest.interest.userId,
        context: `${participantDashboard.user.displayName} has a confirmed seat`
      });
    }
  }

  return [...items.values()]
    .sort((left, right) => left.event.firstMeetingAt.getTime() - right.event.firstMeetingAt.getTime());
}

function scheduleRow(item) {
  return `<article class="dashboard-row schedule-row">
    <div class="event-card-header">
      ${statusBadge(item.event.status)}
      <span>${escapeHtml(formatDateTime(item.event.firstMeetingAt))}</span>
    </div>
    <h2><a href="/cohorts/${encodeURIComponent(item.event.id)}?viewerId=${encodeURIComponent(item.userId)}">${escapeHtml(item.event.title)}</a></h2>
    <p>${escapeHtml(item.context)}</p>
    ${privateLink(item.event)}
  </article>`;
}

export function renderCreatorDashboardPage({ dashboard }) {
  return pageShell({
    title: 'My Cohorts',
    eyebrow: 'Dashboard',
    heading: 'My Cohorts',
    lede: `${dashboard.user.displayName} cohorts, status, schedule, and unlocked links.`,
    body: `${balancePanel(dashboard.balance, 'My Credits')}
      ${dashboard.cohorts.length === 0
        ? emptyState('Create a cohort to see your cohorts here.')
        : `<section class="event-list">${dashboard.cohorts.map(creatorCohortRow).join('')}</section>`}`
  });
}

export function renderParticipantDashboardPage({ dashboard }) {
  return pageShell({
    title: 'My Events',
    eyebrow: 'Dashboard',
    heading: 'My Events',
    lede: `${dashboard.user.displayName} cohorts with interest, seat status, schedule, and access.`,
    body: `${balancePanel(dashboard.balance, 'My Credits')}
      ${dashboard.interests.length === 0
        ? emptyState('Show interest in a cohort to see your events here.')
        : `<section class="event-list">${dashboard.interests.map(participantInterestRow).join('')}</section>`}`
  });
}

export function renderDashboardPage({ creatorDashboard, participantDashboard, accountBalance }) {
  const scheduleItems = activeScheduleItems({ creatorDashboard, participantDashboard });

  return pageShell({
    title: 'Dashboard',
    eyebrow: 'Dashboard',
    heading: 'My Cohorts & Events',
    lede: 'A single place to check credit availability, upcoming active cohorts, created cohorts, and events with interest.',
    body: `<div class="dashboard-grid">
      ${dashboardPanel({
        title: 'Account Credits',
        description: 'Available credits can be used now. In use credits are waiting on quorum. Used credits belong to active cohorts.',
        children: balancePanel(accountBalance)
      })}
      ${dashboardPanel({
        title: 'Active Cohorts & Schedule',
        description: 'Time-sensitive cohorts with confirmed access appear first.',
        children: scheduleItems.length === 0
          ? emptyState('Active cohorts will appear here when quorum is met.')
          : `<section class="event-list">${scheduleItems.map(scheduleRow).join('')}</section>`
      })}
      ${dashboardPanel({
        title: 'Created Cohorts',
        description: `${creatorDashboard.user.displayName} cohorts, quorum state, and access links.`,
        children: `${creatorDashboard.cohorts.length === 0
            ? emptyState('Create a cohort to see it here.')
            : `<section class="event-list">${creatorDashboard.cohorts.map(creatorCohortRow).join('')}</section>`}`
      })}
      ${dashboardPanel({
        title: 'Interested Cohorts',
        description: `${participantDashboard.user.displayName} events with interest, seat status, and access links.`,
        children: `${participantDashboard.interests.length === 0
            ? emptyState('Show interest in a cohort to see it here.')
            : `<section class="event-list">${participantDashboard.interests.map(participantInterestRow).join('')}</section>`}`
      })}
    </div>`
  });
}
