import {
  EVENT_CATEGORIES,
  RECURRENCE_VALUES,
  TARGET_SKILL_LEVELS
} from '../domain/constants.mjs';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function inputValue(values, field) {
  return escapeHtml(values?.[field] ?? '');
}

function optionList(values, selectedValue) {
  return values.map((value) => {
    const selected = value === selectedValue ? ' selected' : '';
    return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(value.replaceAll('_', ' '))}</option>`;
  }).join('');
}

function userOptions(users, selectedUserId) {
  return users.map((user) => {
    const selected = user.id === selectedUserId ? ' selected' : '';
    return `<option value="${escapeHtml(user.id)}"${selected}>${escapeHtml(user.displayName)}</option>`;
  }).join('');
}

function errorList(errors) {
  if (!errors || errors.length === 0) {
    return '';
  }

  return `<section class="notice error" aria-live="polite">
    <h2>Fix these fields</h2>
    <ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}</ul>
  </section>`;
}

function successNotice(result) {
  if (!result) {
    return '';
  }

  return `<section class="notice success" aria-live="polite">
    <h2>Cohort created</h2>
    <p>${escapeHtml(result.event.title)} is open. ${result.tokenHoldAmount} creator tokens are now held until quorum or expiry.</p>
    <p>Private link status: locked until quorum.</p>
  </section>`;
}

export function renderCreateCohortPage({ users, values = {}, errors = [], result } = {}) {
  const selectedUserId = values.creatorId ?? users?.[0]?.id;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Create cohort - Cohort15 MVP</title>
    <link rel="stylesheet" href="/assets/styles.css">
  </head>
  <body>
    <main class="shell">
      <nav class="topbar">
        <a href="/">Cohort15</a>
        <a href="/cohorts">Cohorts</a>
      </nav>

      <section class="page-heading" aria-labelledby="page-title">
        <p class="eyebrow">Creator flow</p>
        <h1 id="page-title">Create cohort</h1>
        <p class="lede">Publish an online cohort by holding 2 creator tokens until quorum unlocks the private link.</p>
      </section>

      ${successNotice(result)}
      ${errorList(errors)}

      <form class="form-grid" method="post" action="/cohorts/new">
        <label>
          Creator
          <select name="creatorId" required>
            ${userOptions(users ?? [], selectedUserId)}
          </select>
        </label>

        <label>
          Title
          <input name="title" value="${inputValue(values, 'title')}" required>
        </label>

        <label class="span-2">
          Short description
          <textarea name="description" required>${inputValue(values, 'description')}</textarea>
        </label>

        <label>
          Category
          <select name="category" required>
            ${optionList(EVENT_CATEGORIES, values.category)}
          </select>
        </label>

        <label>
          Topic
          <input name="topic" value="${inputValue(values, 'topic')}" required>
        </label>

        <label>
          Target audience
          <input name="targetAudience" value="${inputValue(values, 'targetAudience')}" required>
        </label>

        <label>
          Skill level
          <select name="targetSkillLevel" required>
            ${optionList(TARGET_SKILL_LEVELS, values.targetSkillLevel)}
          </select>
        </label>

        <label>
          Minimum quorum
          <input name="minQuorum" type="number" min="1" value="${inputValue(values, 'minQuorum')}" required>
        </label>

        <label>
          Max participants
          <input name="maxParticipants" type="number" min="1" max="15" value="${inputValue(values, 'maxParticipants')}" required>
        </label>

        <label>
          First meeting
          <input name="firstMeetingAt" type="datetime-local" value="${inputValue(values, 'firstMeetingAt')}" required>
        </label>

        <label>
          Duration minutes
          <input name="meetingDurationMinutes" type="number" min="1" value="${inputValue(values, 'meetingDurationMinutes')}" required>
        </label>

        <label>
          Recurrence
          <select name="recurrence" required>
            ${optionList(RECURRENCE_VALUES, values.recurrence)}
          </select>
        </label>

        <label>
          Meeting count
          <input name="meetingCount" type="number" min="1" value="${inputValue(values, 'meetingCount')}" required>
        </label>

        <label class="span-2">
          Private online link
          <input name="lockedEventLink" type="url" value="${inputValue(values, 'lockedEventLink')}" required>
        </label>

        <label class="span-2">
          Additional details
          <textarea name="additionalDetails">${inputValue(values, 'additionalDetails')}</textarea>
        </label>

        <button type="submit">Create cohort</button>
      </form>
    </main>
  </body>
</html>`;
}
