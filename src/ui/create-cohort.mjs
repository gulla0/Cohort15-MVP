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

function sessionCountNote(recurrence) {
  return recurrence === 'none'
    ? 'Fixed at 1 session for a one-time group.'
    : 'Choose between 2 and 52 sessions.';
}

function recurrenceSummary(recurrence, countValue) {
  if (recurrence === 'none') return 'This group will meet once.';
  const count = Math.max(2, Number(countValue) || 2);
  const cadence = {
    daily: { phrase: 'once per day', span: count, unit: 'day' },
    weekly: { phrase: 'once per week', span: count, unit: 'week' },
    biweekly: { phrase: 'once every two weeks', span: count * 2, unit: 'week' },
    monthly: { phrase: 'once per month', span: count, unit: 'month' },
  }[recurrence];
  const unit = cadence.span === 1 ? cadence.unit : `${cadence.unit}s`;
  return `This group will meet ${cadence.phrase} for ${cadence.span} ${unit}.`;
}

export function renderCreateCohortPage({ error, values = {} } = {}) {
  const value = (field, fallback = '') => escapeHtml(values[field] ?? fallback);
  const recurrence = values.recurrence ?? 'none';
  const isRecurring = recurrence !== 'none';
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Create a cohort | Cohort15</title>
    <link rel="stylesheet" href="/assets/styles.css">
  </head>
  <body>
    <header class="shell topbar"><a class="brand" href="/">Cohort15</a><nav class="site-nav" aria-label="Primary navigation"><a class="text-link" href="/research">Research &amp; Field Notes</a><span class="status-pill">Create</span></nav></header>
    <main class="shell form-shell">
      <p class="eyebrow">Anonymous cohort request</p>
      <h1>Create a focused cohort.</h1>
      <p class="lede">Collect interest for seven days. Your email stays private and is used only for updates about this cohort.</p>
      ${error ? `<div class="form-error" id="form-error" role="alert"><strong>${escapeHtml(error.message)}</strong>${error.preserveValues === false ? '' : '<br>Your entries have been kept so you can correct the submission and resubmit.'}</div>` : ''}
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
        <label>Recurrence <select name="recurrence" required${fieldState(error, 'recurrence')}>${selectedOptions(RECURRENCES, recurrence)}</select></label>
        <label>Total number of sessions <input type="number" name="meetingCount" min="${isRecurring ? '2' : '1'}" max="${isRecurring ? '52' : '1'}" value="${value('meetingCount', isRecurring ? '2' : '1')}" required${isRecurring ? '' : ' readonly'}${fieldState(error, 'meetingCount')}><span class="control-note" data-session-count-note>${sessionCountNote(recurrence)}</span></label>
        <p class="recurrence-summary full" data-recurrence-summary aria-live="polite">${recurrenceSummary(recurrence, values.meetingCount)}</p>
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

      const recurrenceInput = document.querySelector('[name="recurrence"]');
      const meetingCountInput = document.querySelector('[name="meetingCount"]');
      const sessionCountNote = document.querySelector('[data-session-count-note]');
      const recurrenceSummary = document.querySelector('[data-recurrence-summary]');
      const cadenceDetails = {
        daily: { phrase: 'once per day', multiplier: 1, unit: 'day' },
        weekly: { phrase: 'once per week', multiplier: 1, unit: 'week' },
        biweekly: { phrase: 'once every two weeks', multiplier: 2, unit: 'week' },
        monthly: { phrase: 'once per month', multiplier: 1, unit: 'month' }
      };
      const updateRecurrenceSummary = () => {
        if (recurrenceInput.value === 'none') {
          recurrenceSummary.textContent = 'This group will meet once.';
          return;
        }
        const count = Math.max(2, Number(meetingCountInput.value) || 2);
        const cadence = cadenceDetails[recurrenceInput.value];
        const span = count * cadence.multiplier;
        const unit = span === 1 ? cadence.unit : cadence.unit + 's';
        recurrenceSummary.textContent = 'This group will meet ' + cadence.phrase
          + ' for ' + span + ' ' + unit + '.';
      };
      const syncMeetingCount = () => {
        const recurring = recurrenceInput.value !== 'none';
        meetingCountInput.readOnly = !recurring;
        meetingCountInput.min = recurring ? '2' : '1';
        meetingCountInput.max = recurring ? '52' : '1';
        if (!recurring) meetingCountInput.value = '1';
        if (recurring && Number(meetingCountInput.value) < 2) meetingCountInput.value = '2';
        sessionCountNote.textContent = recurring
          ? 'Choose between 2 and 52 sessions.'
          : 'Fixed at 1 session for a one-time group.';
        updateRecurrenceSummary();
      };
      recurrenceInput.addEventListener('change', syncMeetingCount);
      meetingCountInput.addEventListener('input', updateRecurrenceSummary);
      syncMeetingCount();
    </script>
  </body>
</html>`;
}
