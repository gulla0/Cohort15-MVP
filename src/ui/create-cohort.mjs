import { CATEGORIES, RECURRENCES, TARGET_SKILL_LEVELS } from '../domain/constants.mjs';

function options(values) {
  return values.map((value) => `<option value="${value}">${value.replaceAll('_', ' ')}</option>`).join('');
}

export function renderCreateCohortPage({ error } = {}) {
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
      ${error ? '<div class="form-error" role="alert">Please check your submission and try again.</div>' : ''}
      <form class="cohort-form" method="post" action="/cohorts">
        <div class="honeypot" aria-hidden="true"><label>Website <input name="website" autocomplete="off" tabindex="-1"></label></div>
        <label>Creator email <input type="email" name="creatorEmail" maxlength="254" required autocomplete="email" placeholder="you@example.com — kept private and used for cohort updates"></label>
        <label>Title <input name="title" minlength="3" maxlength="120" required placeholder="A short, specific name for the cohort"></label>
        <label class="full">Description <textarea name="description" minlength="20" maxlength="2000" required placeholder="Explain what the group will work on and what participants can expect"></textarea></label>
        <label>Category <select name="category" required><option value="">Choose the cohort's purpose</option>${options(CATEGORIES)}</select></label>
        <label>Topic <input name="topic" minlength="2" maxlength="100" required placeholder="The focused subject, skill, or project"></label>
        <label class="full">Target audience <textarea name="targetAudience" minlength="2" maxlength="500" required placeholder="Describe who should join and any relevant background"></textarea></label>
        <label>Target skill level <select name="targetSkillLevel" required><option value="">Choose the expected experience</option>${options(TARGET_SKILL_LEVELS)}</select></label>
        <label>Minimum quorum <input type="number" name="minQuorum" min="1" max="15" required placeholder="People needed to unlock the meeting link (1–15)"></label>
        <label class="full">Additional details <textarea name="additionalDetails" maxlength="2000" placeholder="Optional: preparation, materials, norms, or other context"></textarea></label>
        <label class="full">Approved meeting link <input type="url" name="meetingLink" maxlength="2048" required placeholder="https://meet.google.com/abc-defg-hij"></label>
        <p class="field-note full">For safety, links must use HTTPS and an approved Google Meet, Zoom, Microsoft Teams, Discord, or Slack host.</p>
        <input type="hidden" name="creatorTimeZone" value="UTC">
        <label>First meeting date and time <input type="datetime-local" name="firstMeetingLocal" required></label>
        <label>Duration in minutes <input type="number" name="meetingDurationMinutes" min="15" max="480" required placeholder="For example, 60"></label>
        <label>Recurrence <select name="recurrence" required>${options(RECURRENCES)}</select></label>
        <label>Meeting count <input type="number" name="meetingCount" min="1" max="52" value="1" required></label>
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
      const earliestMeeting = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
      earliestMeeting.setSeconds(0, 0);
      earliestMeeting.setMinutes(earliestMeeting.getMinutes() + 1);
      const localPart = (value) => String(value).padStart(2, '0');
      firstMeetingInput.min = [
        earliestMeeting.getFullYear(),
        localPart(earliestMeeting.getMonth() + 1),
        localPart(earliestMeeting.getDate()),
      ].join('-') + 'T' + [
        localPart(earliestMeeting.getHours()),
        localPart(earliestMeeting.getMinutes()),
      ].join(':');
    </script>
  </body>
</html>`;
}
