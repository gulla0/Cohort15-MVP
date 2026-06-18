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
        <label>Creator email <input type="email" name="creatorEmail" maxlength="254" required autocomplete="email"></label>
        <label>Title <input name="title" minlength="3" maxlength="120" required></label>
        <label class="full">Description <textarea name="description" minlength="20" maxlength="2000" required></textarea></label>
        <label>Category <select name="category" required><option value="">Choose one</option>${options(CATEGORIES)}</select></label>
        <label>Topic <input name="topic" minlength="2" maxlength="100" required></label>
        <label class="full">Target audience <textarea name="targetAudience" minlength="2" maxlength="500" required></textarea></label>
        <label>Target skill level <select name="targetSkillLevel" required><option value="">Choose one</option>${options(TARGET_SKILL_LEVELS)}</select></label>
        <label>Minimum quorum <input type="number" name="minQuorum" min="1" max="15" required></label>
        <label class="full">Additional details <textarea name="additionalDetails" maxlength="2000"></textarea></label>
        <label class="full">Approved meeting link <input type="url" name="meetingLink" maxlength="2048" required></label>
        <p class="field-note full">For safety, links must use HTTPS and an approved Google Meet, Zoom, Microsoft Teams, Discord, or Slack host.</p>
        <input type="hidden" name="creatorTimeZone" value="UTC">
        <label>First meeting date and time <input type="datetime-local" name="firstMeetingLocal" required></label>
        <label>Duration in minutes <input type="number" name="meetingDurationMinutes" min="15" max="480" required></label>
        <label>Recurrence <select name="recurrence" required>${options(RECURRENCES)}</select></label>
        <label>Meeting count <input type="number" name="meetingCount" min="1" max="52" value="1" required></label>
        <button class="button-link full" type="submit">Create cohort</button>
      </form>
    </main>
    <script>document.querySelector('[name="creatorTimeZone"]').value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';</script>
  </body>
</html>`;
}
