import sharp from 'sharp';

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

function wrapText(value, { maxCharacters = 38, maxLines = 3 } = {}) {
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

function scheduleLabel(cohort, options = {}) {
  const date = new Date(cohort.firstMeetingAt);
  if (Number.isNaN(date.getTime())) return '';
  const timeZone = cohort.creatorTimeZone || 'UTC';
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: options.compact ? undefined : 'numeric',
    minute: options.compact ? undefined : '2-digit',
    timeZoneName: options.compact ? undefined : 'short',
  }).format(date);
  const sessions = cohort.meetingCount === 1 ? '1 session' : `${cohort.meetingCount} sessions`;
  return `${formatted} - ${sessions}`;
}

export function cohortSocialDescription(cohort) {
  const summary = plainText(cohort.description).slice(0, 180).replace(/\s+\S*$/u, '');
  return summary || `A ${label(cohort.category).toLowerCase()} cohort for ${plainText(cohort.topic)}.`;
}

export function renderCohortSocialImage(cohort) {
  const titleLines = wrapText(cohort.title, { maxCharacters: 36, maxLines: 3 });
  const title = titleLines.map((line, index) => (
    `<text x="86" y="${220 + index * 68}" class="title">${escapeXml(line)}</text>`
  )).join('');
  const progress = `${cohort.interestCount} of ${cohort.minQuorum} interested`;
  const progressWidth = Math.min(100, Math.round((cohort.interestCount / cohort.minQuorum) * 100));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(cohort.title)}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#f5fbf7"/>
      <stop offset="1" stop-color="#e8f3ed"/>
    </linearGradient>
  </defs>
  <style>
    .brand, .eyebrow, .title, .meta, .small {
      font-family: Arial, Helvetica, sans-serif;
      letter-spacing: 0;
    }
    .brand { fill: #12352b; font-size: 42px; font-weight: 800; }
    .eyebrow { fill: #1d6f58; font-size: 28px; font-weight: 800; text-transform: uppercase; }
    .title { fill: #10241f; font-size: 58px; font-weight: 800; }
    .meta { fill: #25453b; font-size: 30px; font-weight: 700; }
    .small { fill: #5a7169; font-size: 24px; font-weight: 700; }
  </style>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="44" y="44" width="1112" height="542" rx="24" fill="#ffffff"/>
  <rect x="44" y="44" width="1112" height="12" rx="6" fill="#4b9979"/>
  <text x="86" y="118" class="brand">Cohort15</text>
  <text x="86" y="166" class="eyebrow">${escapeXml(label(cohort.category))} cohort</text>
  ${title}
  <rect x="86" y="466" width="1028" height="74" rx="12" fill="#f0f7f3"/>
  <text x="120" y="512" class="meta">${escapeXml(scheduleLabel(cohort))}</text>
  <text x="772" y="512" class="small">${escapeXml(progress)}</text>
  <rect x="772" y="526" width="250" height="8" rx="4" fill="#d0e2da"/>
  <rect x="772" y="526" width="${Math.max(12, Math.round((progressWidth / 100) * 250))}" height="8" rx="4" fill="#4b9979"/>
</svg>`;
}

export async function renderCohortSocialPng(cohort) {
  return sharp(Buffer.from(renderCohortSocialImage(cohort)))
    .png()
    .toBuffer();
}
