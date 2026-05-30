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
        <a href="/">${APP_NAME}</a>
        <a href="/cohorts">Cohorts</a>
        <a href="/cohorts/new">Create</a>
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

function emptyFeed() {
  return `<section class="notice">
    <h2>No public cohorts yet</h2>
    <p>Create the first cohort to publish it to the feed.</p>
  </section>`;
}

function eventCard(event) {
  return `<article class="event-card">
    <div class="event-card-header">
      ${statusBadge(event.status)}
      <span>${escapeHtml(event.minQuorum)} needed</span>
    </div>
    <h2><a href="/cohorts/${encodeURIComponent(event.id)}">${escapeHtml(event.title)}</a></h2>
    <p>${escapeHtml(event.description)}</p>
    <dl class="meta-grid">
      <div>
        <dt>Topic</dt>
        <dd>${escapeHtml(event.topic)}</dd>
      </div>
      <div>
        <dt>Skill</dt>
        <dd>${formatEnum(event.targetSkillLevel)}</dd>
      </div>
      <div>
        <dt>First meeting</dt>
        <dd>${escapeHtml(formatDateTime(event.firstMeetingAt))}</dd>
      </div>
    </dl>
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
    <p>Location unlocks when quorum is met.</p>
  </section>`;
}

function eventDetail(event) {
  return `<section class="detail-layout">
    <article class="event-detail">
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
          <dd>${escapeHtml(formatDateTime(event.firstMeetingAt))}</dd>
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
          <dd>${escapeHtml(formatDateTime(event.expiresAt))}</dd>
        </div>
      </dl>
      ${event.additionalDetails ? `<section class="detail-notes">
        <h3>Additional details</h3>
        <p>${escapeHtml(event.additionalDetails)}</p>
      </section>` : ''}
    </article>
    ${linkPanel(event)}
  </section>`;
}

export function renderCohortFeedPage({ events }) {
  return pageShell({
    title: 'Cohorts',
    eyebrow: 'Public feed',
    heading: 'Cohorts',
    lede: 'Browse open and active online cohorts. Private links stay hidden until quorum unlocks them.',
    body: events.length === 0 ? emptyFeed() : `<section class="event-list">${events.map(eventCard).join('')}</section>`
  });
}

export function renderCohortDetailPage({ event }) {
  return pageShell({
    title: event.title,
    eyebrow: 'Cohort detail',
    heading: event.title,
    lede: `${event.topic} for ${event.targetAudience}`,
    body: eventDetail(event)
  });
}
