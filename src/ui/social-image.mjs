function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function label(value) {
  return String(value ?? '').replaceAll('-', ' ').replace(/\b\w/gu, (character) => character.toUpperCase());
}

function plainText(value) {
  return String(value ?? '').replace(/\s+/gu, ' ').trim();
}

function wrapText(value, { maxCharacters = 42, maxLines = 3 } = {}) {
  const words = plainText(value).split(' ').filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  if (words.join(' ').length > lines.join(' ').length && lines.length) {
    lines[lines.length - 1] = `${lines.at(-1).replace(/\s+\S*$/u, '') || lines.at(-1)}...`;
  }
  return lines;
}

function scheduleLabel(cohort) {
  const date = new Date(cohort.firstMeetingAt);
  if (Number.isNaN(date.getTime())) return '';
  const timeZone = cohort.creatorTimeZone || 'UTC';
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
  const sessions = cohort.meetingCount === 1 ? '1 session' : `${cohort.meetingCount} sessions`;
  return `${formatted} - ${sessions}`;
}

export function cohortSocialDescription(cohort) {
  const summary = plainText(cohort.description).slice(0, 180).replace(/\s+\S*$/u, '');
  return summary || `A ${label(cohort.category).toLowerCase()} cohort for ${plainText(cohort.topic)}.`;
}

export function renderCohortSocialImage(cohort) {
  const titleLines = wrapText(cohort.title, { maxCharacters: 29, maxLines: 3 });
  const topicLines = wrapText(cohort.topic, { maxCharacters: 44, maxLines: 2 });
  const title = titleLines.map((line, index) => (
    `<text x="88" y="${190 + index * 72}" class="title">${escapeXml(line)}</text>`
  )).join('');
  const topic = topicLines.map((line, index) => (
    `<text x="90" y="${430 + index * 34}" class="body">${escapeXml(line)}</text>`
  )).join('');
  const progress = `${cohort.interestCount} of ${cohort.minQuorum} interested`;
  const progressWidth = Math.min(410, Math.max(26, Math.round((cohort.interestCount / cohort.minQuorum) * 410)));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(cohort.title)}">
  <defs>
    <linearGradient id="background" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#f7fbf7"/>
      <stop offset="0.58" stop-color="#e8f4ee"/>
      <stop offset="1" stop-color="#f4f1e8"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#14362b" flood-opacity="0.16"/>
    </filter>
  </defs>
  <style>
    .brand { fill: #12352b; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 38px; font-weight: 800; }
    .eyebrow { fill: #1d6f58; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 28px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    .title { fill: #10241f; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 62px; font-weight: 850; }
    .body { fill: #38554c; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 30px; font-weight: 650; }
    .meta { fill: #25453b; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 27px; font-weight: 750; }
    .small { fill: #5a7169; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 23px; font-weight: 650; }
  </style>
  <rect width="1200" height="630" fill="url(#background)"/>
  <circle cx="1015" cy="108" r="132" fill="#cdeadd" opacity="0.78"/>
  <circle cx="1082" cy="526" r="154" fill="#f0dc9f" opacity="0.56"/>
  <rect x="56" y="52" width="1088" height="526" rx="34" fill="#ffffff" opacity="0.86" filter="url(#shadow)"/>
  <text x="88" y="116" class="brand">Cohort15</text>
  <text x="88" y="158" class="eyebrow">${escapeXml(label(cohort.category))} cohort</text>
  ${title}
  <text x="90" y="388" class="small">Topic</text>
  ${topic}
  <rect x="720" y="346" width="350" height="154" rx="22" fill="#12352b"/>
  <text x="754" y="394" class="small" fill="#b9dacd">Quorum progress</text>
  <text x="754" y="438" class="meta" fill="#ffffff">${escapeXml(progress)}</text>
  <rect x="754" y="466" width="244" height="12" rx="6" fill="#36584c"/>
  <rect x="754" y="466" width="${Math.round((progressWidth / 410) * 244)}" height="12" rx="6" fill="#5ad0a0"/>
  <text x="88" y="548" class="meta">${escapeXml(scheduleLabel(cohort))}</text>
  <text x="862" y="548" class="small">cohort15.com</text>
</svg>`;
}
