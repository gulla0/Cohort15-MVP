import { CATEGORIES, RECURRENCES, TARGET_SKILL_LEVELS } from '../domain/constants.mjs';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function selectedOptions(values, selectedValue) {
  return values.map((value) => (
    `<option value="${value}"${value === selectedValue ? ' selected' : ''}>${value.replaceAll('_', ' ')}</option>`
  )).join('');
}

function fieldState(error, field) {
  return error?.field === field ? ' aria-invalid="true" aria-describedby="form-error"' : '';
}

export function renderCreateCohortPage({ error, values = {} } = {}) {
  const value = (field, fallback = '') => escapeHtml(values[field] ?? fallback);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Create a cohort | Cohort15</title>
    <link rel="stylesheet" href="/assets/styles.css">
  </head>
  <body>
    <header class="shell topbar"><a class="brand" href="/">Cohort15</a><span class="status-pill">Create</span></header>
    <main class="shell form-shell">
      <p class="eyebrow">Anonymous cohort request</p>
      <h1>Create a focused cohort.</h1>
      <p class="lede">Collect interest for seven days. Your email stays private and is used only for updates about this cohort.</p>
      ${error ? `<div class="form-error" id="form-error" role="alert"><strong>${escapeHtml(error.message)}</strong><br>Your entries have been kept so you can correct this field and resubmit.</div>` : ''}
      <form class="cohort-form" method="post" action="/cohorts">
        <div class="honeypot" aria-hidden="true"><label>Website <input name="website" autocomplete="off" tabindex="-1"></label></div>
        <label>Creator email <input type="email" name="creatorEmail" value="${value('creatorEmail')}" maxlength="254" required autocomplete="email" placeholder="you@example.com — kept private and used for cohort updates"${fieldState(error, 'creatorEmail')}></label>
        <label>Title <input name="title" value="${value('title')}" minlength="3" maxlength="120" required placeholder="A short, specific name for the cohort"${fieldState(error, 'title')}></label>
        <label class="full">Description <textarea name="description" minlength="20" maxlength="2000" required placeholder="Explain what the group will work on and what participants can expect"${fieldState(error, 'description')}>${value('description')}</textarea></label>
        <label>Category <select name="category" required${fieldState(error, 'category')}><option value="">Choose the cohort's purpose</option>${selectedOptions(CATEGORIES, values.category)}</select></label>
        <label>Topic <input name="topic" value="${value('topic')}" minlength="2" maxlength="100" required placeholder="The focused subject, skill, or project"${fieldState(error, 'topic')}></label>
        <label class="full">Target audience <textarea name="targetAudience" minlength="2" maxlength="500" required placeholder="Describe who should join and any relevant background"${fieldState(error, 'targetAudience')}>${value('targetAudience')}</textarea></label>
        <label>Target skill level <select name="targetSkillLevel" required${fieldState(error, 'targetSkillLevel')}><option value="">Choose the expected experience</option>${selectedOptions(TARGET_SKILL_LEVELS, values.targetSkillLevel)}</select></label>
        <label>Minimum quorum <input type="number" name="minQuorum" value="${value('minQuorum')}" min="1" max="15" required placeholder="People needed to unlock the meeting link (1–15)"${fieldState(error, 'minQuorum')}></label>
        <label class="full">Additional details <textarea name="additionalDetails" maxlength="2000" placeholder="Optional: preparation, materials, norms, or other context"${fieldState(error, 'additionalDetails')}>${value('additionalDetails')}</textarea></label>
        <label class="full">Approved meeting link <input type="url" name="meetingLink" value="${value('meetingLink')}" maxlength="2048" required placeholder="https://meet.google.com/abc-defg-hij"${fieldState(error, 'meetingLink')}></label>
        <p class="field-note full">For safety, links must use HTTPS and an approved Google Meet, Zoom, Microsoft Teams, Discord, or Slack host.</p>
        <input type="hidden" name="creatorTimeZone" value="${value('creatorTimeZone', 'UTC')}">
        <label>First meeting date and time <input type="datetime-local" name="firstMeetingLocal" value="${value('firstMeetingLocal')}" required${fieldState(error, 'firstMeetingLocal')}></label>
        <label>Duration in minutes <input type="number" name="meetingDurationMinutes" value="${value('meetingDurationMinutes')}" min="15" max="480" required placeholder="For example, 60"${fieldState(error, 'meetingDurationMinutes')}></label>
        <label>Recurrence <select name="recurrence" required${fieldState(error, 'recurrence')}>${selectedOptions(RECURRENCES, values.recurrence ?? 'none')}</select></label>
        <label>Meeting count <input type="number" name="meetingCount" min="1" max="52" value="${value('meetingCount', '1')}" required${fieldState(error, 'meetingCount')}></label>
        <button class="button-link full" type="submit">Create cohort</button>
      </form>
    </main>
    <script>
      const timeZoneInput = document.querySelector('[name="creatorTimeZone"]');
      timeZoneInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

      for (const field of document.querySelectorAll('[placeholder]')) {
        const hint = field.placeholder;
        field.addEventListener('focus', () => { field.placeholder = ''; });
        field.addEventListener('blur', () => {
          if (!field.value) field.placeholder = hint;
        });
      }

      const firstMeetingInput = document.querySelector('[name="firstMeetingLocal"]');
      const localPart = (value) => String(value).padStart(2, '0');
      const updateMeetingMinimum = () => {
        const earliestMeeting = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
        earliestMeeting.setSeconds(0, 0);
        earliestMeeting.setMinutes(earliestMeeting.getMinutes() + 1);
        firstMeetingInput.min = [
          earliestMeeting.getFullYear(),
          localPart(earliestMeeting.getMonth() + 1),
          localPart(earliestMeeting.getDate()),
        ].join('-') + 'T' + [
          localPart(earliestMeeting.getHours()),
          localPart(earliestMeeting.getMinutes()),
        ].join(':');
      };
      updateMeetingMinimum();
      firstMeetingInput.addEventListener('focus', updateMeetingMinimum);
      setInterval(updateMeetingMinimum, 30 * 1000);
    </script>
  </body>
</html>`;
}
