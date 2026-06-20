import { analyticsMarkup } from './analytics.mjs';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function label(value) {
  return String(value).replaceAll('-', ' ').replace(/\b\w/gu, (character) => character.toUpperCase());
}

function localTime(instant, { includeEnd = false, durationMinutes = 0 } = {}) {
  const end = new Date(Date.parse(instant) + durationMinutes * 60_000).toISOString();
  return `<time class="local-time" datetime="${escapeHtml(instant)}" data-local-time${includeEnd ? ` data-end="${end}"` : ''}>${escapeHtml(instant)}</time>`;
}

function schedule(cohort) {
  const recurrence = cohort.recurrence === 'none' ? 'One time' : label(cohort.recurrence);
  return `<dl class="cohort-facts">
    <div><dt>First meeting</dt><dd>${localTime(cohort.firstMeetingAt, { includeEnd: true, durationMinutes: cohort.meetingDurationMinutes })}</dd></div>
    <div><dt>Duration</dt><dd>${cohort.meetingDurationMinutes} minutes</dd></div>
    <div><dt>Recurrence</dt><dd>${recurrence}</dd></div>
    <div><dt>Meetings</dt><dd>${cohort.meetingCount}</dd></div>
  </dl>`;
}

function progress(cohort) {
  const percentage = Math.min(100, Math.round((cohort.interestCount / cohort.minQuorum) * 100));
  return `<div class="quorum-progress">
    <div class="progress-copy"><strong>${cohort.interestCount} of ${cohort.minQuorum} interested</strong><span>${cohort.quorumStatus === 'met' ? 'Quorum met' : `${Math.max(0, cohort.minQuorum - cohort.interestCount)} more needed`}</span></div>
    <div class="progress-track" role="progressbar" aria-label="Quorum progress" aria-valuemin="0" aria-valuemax="${cohort.minQuorum}" aria-valuenow="${Math.min(cohort.interestCount, cohort.minQuorum)}"><span style="width:${percentage}%"></span></div>
  </div>`;
}

export function renderCohortCard(cohort) {
  return `<article class="cohort-card">
    <div class="card-heading"><span class="status-pill ${cohort.collectionStatus}">${label(cohort.collectionStatus)}</span><span class="category">${escapeHtml(label(cohort.category))}</span></div>
    <h3><a href="/cohorts/${encodeURIComponent(cohort.id)}">${escapeHtml(cohort.title)}</a></h3>
    <p>${escapeHtml(cohort.description)}</p>
    ${schedule(cohort)}
    ${progress(cohort)}
    <a class="text-link" href="/cohorts/${encodeURIComponent(cohort.id)}">View cohort details →</a>
  </article>`;
}

export function localTimeScript() {
  return `<script>
    (() => {
      const formatter = new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
      });
      document.querySelectorAll('[data-local-time]').forEach((element) => {
        const start = new Date(element.dateTime);
        const endValue = element.dataset.end;
        element.textContent = endValue ? formatter.format(start) + ' – ' + formatter.format(new Date(endValue)) : formatter.format(start);
      });
    })();
  </script>`;
}

function pageStart(title, googleAnalyticsId) {
  return `<!doctype html><html lang="en"><head>${analyticsMarkup(googleAnalyticsId)}<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} | Cohort15</title><link rel="stylesheet" href="/assets/styles.css"></head><body><header class="shell topbar"><a class="brand" href="/">Cohort15</a><nav class="site-nav" aria-label="Primary navigation"><a class="text-link" href="/research">Research &amp; Field Notes</a><a class="button-link compact" href="/cohorts/new">Create a cohort</a></nav></header>`;
}

function interestForm(cohort, { error } = {}) {
  if (cohort.collectionStatus !== 'active' || cohort.quorumStatus !== 'gathering') return '';
  return `<section class="interest-panel" aria-labelledby="interest-heading">
    <p class="eyebrow">Join this cohort</p><h2 id="interest-heading">Show your interest</h2>
    <p>Enter your email to count toward quorum. Your email stays private and is used only for updates about this cohort.</p>
    <form class="interest-form" method="post" action="/cohorts/${encodeURIComponent(cohort.id)}/interests" novalidate>
      <div class="honeypot" aria-hidden="true"><label>Website<input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>
      <label for="interest-email">Email</label><input id="interest-email" name="email" type="email" autocomplete="email" required maxlength="254"${error?.field === 'email' ? ' aria-invalid="true" aria-describedby="interest-error"' : ''}>
      <button class="button-link" type="submit" onclick="if (typeof gtag === 'function') gtag('event', 'join_cohort_interest');">I’m interested</button>
    </form>
  </section>`;
}

function interestFormScript() {
  return `<script>
    (() => {
      const form = document.querySelector('.interest-form');
      if (!form) return;
      const email = form.querySelector('[name="email"]');
      const error = document.querySelector('#interest-error');
      const showError = (message) => {
        error.textContent = message;
        error.hidden = false;
        email.setAttribute('aria-invalid', 'true');
        email.setAttribute('aria-describedby', 'interest-error');
        email.focus();
      };
      email.addEventListener('input', () => {
        error.hidden = true;
        email.removeAttribute('aria-invalid');
        email.removeAttribute('aria-describedby');
      });
      form.addEventListener('submit', (event) => {
        if (email.validity.valueMissing) {
          event.preventDefault();
          showError('Enter your email to show interest.');
        } else if (!email.validity.valid) {
          event.preventDefault();
          showError('Enter a valid email address.');
        }
      });
    })();
  </script>`;
}

export function renderCohortDetailPage(cohort, options = {}) {
  const acceptsInterest = cohort.collectionStatus === 'active' && cohort.quorumStatus === 'gathering';
  const errorNotice = options.error
    ? `<p class="form-error" id="interest-error" role="alert">${escapeHtml(options.error.message)}</p>`
    : acceptsInterest ? '<p class="form-error" id="interest-error" role="alert" hidden></p>' : '';
  const meetingAccess = cohort.meetingLink
    ? `<div class="meeting-access unlocked"><p class="eyebrow">Quorum met</p><h2>The meeting is unlocked.</h2><a class="button-link" href="${escapeHtml(cohort.meetingLink)}" rel="noopener noreferrer">Open meeting link</a></div>`
    : `<div class="meeting-access"><p class="eyebrow">${cohort.quorumStatus === 'met' ? 'Meeting ended' : 'Link locked'}</p><h2>${cohort.quorumStatus === 'met' ? 'This meeting link is no longer public.' : 'The meeting link unlocks at quorum.'}</h2><p>Schedule details stay public throughout the cohort lifecycle.</p></div>`;
  return `${pageStart(cohort.title, options.googleAnalyticsId ?? 'G-LF22TLDSBV')}<main class="shell detail-shell">
    <a class="text-link" href="/#cohorts">← Browse all cohorts</a>
    <div class="detail-heading"><div><p class="eyebrow">${escapeHtml(label(cohort.category))} · ${escapeHtml(cohort.collectionStatus)}</p><h1>${escapeHtml(cohort.title)}</h1><p class="lede">${escapeHtml(cohort.description)}</p></div>${meetingAccess}</div>
    ${progress(cohort)}
    ${errorNotice}
    ${interestForm(cohort, options)}
    <section class="detail-grid"><div><h2>Meeting schedule</h2>${schedule(cohort)}<p class="local-note">Times are shown in your local timezone.</p></div><div><h2>Who it’s for</h2><dl class="cohort-facts"><div><dt>Topic</dt><dd>${escapeHtml(cohort.topic)}</dd></div><div><dt>Audience</dt><dd>${escapeHtml(cohort.targetAudience)}</dd></div><div><dt>Skill level</dt><dd>${escapeHtml(label(cohort.targetSkillLevel))}</dd></div></dl>${cohort.additionalDetails ? `<h2>Additional details</h2><p>${escapeHtml(cohort.additionalDetails)}</p>` : ''}</div></section>
  </main><footer><div class="shell">Cohort15 — small, high-intent online groups.</div></footer>${localTimeScript()}${acceptsInterest ? interestFormScript() : ''}</body></html>`;
}
