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

function localTime(value) {
  const isoValue = value.toISOString();
  return `<time datetime="${escapeHtml(isoValue)}" data-local-time>${escapeHtml(formatDateTime(value))} UTC</time>`;
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
    <script>
      for (const timeElement of document.querySelectorAll('[data-local-time]')) {
        const date = new Date(timeElement.dateTime);
        if (Number.isNaN(date.getTime())) {
          continue;
        }

        const formatter = new Intl.DateTimeFormat(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
        timeElement.textContent = formatter.format(date);
        const timeZone = formatter.resolvedOptions().timeZone;
        timeElement.setAttribute('aria-label', 'Local time' + (timeZone ? ' in ' + timeZone : '') + ': ' + timeElement.textContent);
      }
    </script>
  </body>
</html>`;
}

function statusBadge(status) {
  return `<span class="status status-${escapeHtml(status)}">${formatEnum(status)}</span>`;
}

function emptyFeed() {
  return `<section class="notice">
    <h2>No public cohorts yet</h2>
    <p>Create the first cohort to publish it to the feed.</p>
  </section>`;
}

function noSearchResults(search) {
  return `<section class="notice">
    <h2>No matching cohorts</h2>
    <p>No public cohorts match "${escapeHtml(search)}". Try a title, topic, audience, category, or skill word.</p>
  </section>`;
}

function searchPanel(search) {
  return `<form method="get" action="/cohorts" class="search-panel" role="search">
    <label>
      Search cohorts
      <input type="search" name="q" value="${escapeHtml(search)}" placeholder="Try topic, audience, category, or skill">
    </label>
    <div class="button-row">
      <button type="submit">Search</button>
      ${search ? '<a class="button-link secondary" href="/cohorts">Clear</a>' : ''}
    </div>
  </form>`;
}

function capacityLabel(event) {
  if (event.capacity.isFull) {
    return 'Full';
  }

  if (event.status === 'active') {
    return `${event.capacity.openSpots} spot(s) open`;
  }

  if (event.capacity.quorumRemaining === 0) {
    return 'Quorum ready';
  }

  return `${event.capacity.quorumRemaining} more to activate`;
}

function eventCard(event) {
  return `<article class="event-card">
    <img class="event-image" src="${escapeHtml(event.imageUrl)}" alt="${escapeHtml(event.title)} cohort image">
    <div class="event-card-body">
      <div class="event-card-header">
        ${statusBadge(event.status)}
        <span>${escapeHtml(capacityLabel(event))}</span>
      </div>
      <h2><a href="/cohorts/${encodeURIComponent(event.id)}">${escapeHtml(event.title)}</a></h2>
      <p>${escapeHtml(event.description)}</p>
      <dl class="decision-grid" aria-label="Cohort decision details">
        <div>
          <dt>Starts</dt>
          <dd>${localTime(event.firstMeetingAt)}</dd>
        </div>
        <div>
          <dt>Open spots</dt>
          <dd>${escapeHtml(event.capacity.openSpots)} of ${escapeHtml(event.capacity.maxParticipants)}</dd>
        </div>
        <div>
          <dt>Quorum</dt>
          <dd>${escapeHtml(event.capacity.committedCount)} / ${escapeHtml(event.capacity.minQuorum)}</dd>
        </div>
      </dl>
      <dl class="meta-grid compact">
        <div>
          <dt>Topic</dt>
          <dd>${escapeHtml(event.topic)}</dd>
        </div>
        <div>
          <dt>Skill</dt>
          <dd>${formatEnum(event.targetSkillLevel)}</dd>
        </div>
      </dl>
    </div>
  </article>`;
}

function linkPanel(event) {
  if (event.lockedEventLink) {
    return `<section class="notice success">
      <h2>Private link unlocked</h2>
      <p><a href="${escapeHtml(event.lockedEventLink)}">${escapeHtml(event.lockedEventLink)}</a></p>
    </section>`;
  }

  if (event.linkVisibility === 'authorized_only') {
    return `<section class="notice">
      <h2>Private link unlocked for members</h2>
      <p>Sign in as the creator or an interested participant to view the cohort link.</p>
    </section>`;
  }

  return `<section class="notice">
    <h2>Private link locked</h2>
    <p>Location unlocks when quorum is met. If quorum is not met by the deadline, all credits are returned.</p>
  </section>`;
}

function selectedAttribute(left, right) {
  return left === right ? ' selected' : '';
}

function interestPanel({ event, users = [], viewerId, interestResult, interestErrors = [] }) {
  if (event.status !== 'open' && !interestResult && interestErrors.length === 0) {
    return '';
  }

  const selectedUserId = viewerId
    && viewerId !== event.creatorId
    ? viewerId
    : users.find((user) => user.id !== event.creatorId)?.id
    ?? users[0]?.id;
  const options = users.map((user) => (
    `<option value="${escapeHtml(user.id)}"${selectedAttribute(user.id, selectedUserId)}>${escapeHtml(user.displayName)}</option>`
  )).join('');

  return `<section class="notice interest-panel">
    <h2>Show interest</h2>
    ${interestErrors.length > 0 ? `<div class="form-errors">
      <p>Interest was not recorded.</p>
      <ul>${interestErrors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}</ul>
    </div>` : ''}
    ${interestResult ? `<p>${escapeHtml(interestResult.participant.displayName)} used ${escapeHtml(interestResult.creditHoldAmount)} credit to show interest. ${interestResult.activated ? 'Quorum met. The cohort is active.' : 'If quorum is not met, this credit is returned.'}</p>
      <p><a href="/dashboard?participantUserId=${encodeURIComponent(interestResult.participant.id)}">Open dashboard</a></p>` : ''}
    ${event.status === 'open' ? `<form method="post" action="/cohorts/${encodeURIComponent(event.id)}/interest" class="inline-form">
      <label>
        Demo participant
        <select name="userId" required>
          ${options}
        </select>
      </label>
      <button type="submit">Use 1 credit</button>
    </form>` : ''}
  </section>`;
}

function eventDetail({ event, users, viewerId, interestResult, interestErrors }) {
  return `<section class="detail-layout">
    <article class="event-detail">
      <img class="event-hero-image" src="${escapeHtml(event.imageUrl)}" alt="${escapeHtml(event.title)} cohort image">
      <div class="event-card-header">
        ${statusBadge(event.status)}
        <span>${escapeHtml(event.minQuorum)} of ${escapeHtml(event.maxParticipants)} quorum</span>
      </div>
      <h2>${escapeHtml(event.title)}</h2>
      <p>${escapeHtml(event.description)}</p>
      <dl class="meta-grid">
        <div>
          <dt>Category</dt>
          <dd>${formatEnum(event.category)}</dd>
        </div>
        <div>
          <dt>Topic</dt>
          <dd>${escapeHtml(event.topic)}</dd>
        </div>
        <div>
          <dt>Audience</dt>
          <dd>${escapeHtml(event.targetAudience)}</dd>
        </div>
        <div>
          <dt>Skill level</dt>
          <dd>${formatEnum(event.targetSkillLevel)}</dd>
        </div>
        <div>
          <dt>First meeting</dt>
          <dd>${localTime(event.firstMeetingAt)}</dd>
        </div>
        <div>
          <dt>Cadence</dt>
          <dd>${formatEnum(event.recurrence)} for ${escapeHtml(event.meetingCount)} meeting(s)</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>${escapeHtml(event.meetingDurationMinutes)} minutes</dd>
        </div>
        <div>
          <dt>Expires</dt>
          <dd>${localTime(event.expiresAt)}</dd>
        </div>
      </dl>
      ${event.additionalDetails ? `<section class="detail-notes">
        <h3>Additional details</h3>
        <p>${escapeHtml(event.additionalDetails)}</p>
      </section>` : ''}
    </article>
    <aside>
      ${linkPanel(event)}
      ${interestPanel({ event, users, viewerId, interestResult, interestErrors })}
    </aside>
  </section>`;
}

export function renderCohortFeedPage({ events, search = '' }) {
  const normalizedSearch = String(search ?? '').trim();
  const results = events.length === 0
    ? (normalizedSearch ? noSearchResults(normalizedSearch) : emptyFeed())
    : `<section class="event-list">${events.map(eventCard).join('')}</section>`;

  return pageShell({
    title: 'Cohorts',
    eyebrow: 'Public feed',
    heading: 'Cohorts',
    lede: 'Browse open and active online cohorts. Use 1 credit to show interest; credits are returned if quorum is not met.',
    body: `${searchPanel(normalizedSearch)}${results}`
  });
}

export function renderCohortDetailPage({ event, users = [], viewerId, interestResult, interestErrors = [] }) {
  return pageShell({
    title: event.title,
    eyebrow: 'Cohort detail',
    heading: event.title,
    lede: `${event.topic} for ${event.targetAudience}`,
    body: eventDetail({ event, users, viewerId, interestResult, interestErrors })
  });
}
