import { deflateSync } from 'node:zlib';

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

const PNG_WIDTH = 1200;
const PNG_HEIGHT = 630;
const GLYPHS = Object.freeze({
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  6: ['01111', '10000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '11110'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '/': ['00001', '00001', '00010', '00100', '01000', '10000', '10000'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
});

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

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function setPixel(pixels, x, y, [red, green, blue]) {
  if (x < 0 || x >= PNG_WIDTH || y < 0 || y >= PNG_HEIGHT) return;
  const offset = (y * PNG_WIDTH + x) * 3;
  pixels[offset] = red;
  pixels[offset + 1] = green;
  pixels[offset + 2] = blue;
}

function fillRect(pixels, x, y, width, height, color) {
  for (let row = Math.max(0, y); row < Math.min(PNG_HEIGHT, y + height); row += 1) {
    for (let column = Math.max(0, x); column < Math.min(PNG_WIDTH, x + width); column += 1) {
      setPixel(pixels, column, row, color);
    }
  }
}

function drawText(pixels, text, x, y, scale, color) {
  const normalized = plainText(text).toUpperCase().replace(/[^A-Z0-9:./& -]/gu, '');
  let cursor = x;
  for (const character of normalized) {
    if (character === ' ') {
      cursor += scale * 4;
      continue;
    }
    const glyph = GLYPHS[character] ?? GLYPHS['-'];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let column = 0; column < glyph[row].length; column += 1) {
        if (glyph[row][column] === '1') {
          fillRect(pixels, cursor + column * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cursor += scale * 6;
  }
}

function encodePng(pixels) {
  const scanlineLength = PNG_WIDTH * 3 + 1;
  const raw = Buffer.alloc(scanlineLength * PNG_HEIGHT);
  for (let y = 0; y < PNG_HEIGHT; y += 1) {
    const rawOffset = y * scanlineLength;
    raw[rawOffset] = 0;
    pixels.copy(raw, rawOffset + 1, y * PNG_WIDTH * 3, (y + 1) * PNG_WIDTH * 3);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(PNG_WIDTH, 0);
  header.writeUInt32BE(PNG_HEIGHT, 4);
  header[8] = 8;
  header[9] = 2;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

export function renderCohortSocialPng(cohort) {
  const pixels = Buffer.alloc(PNG_WIDTH * PNG_HEIGHT * 3, 247);
  fillRect(pixels, 0, 0, PNG_WIDTH, PNG_HEIGHT, [238, 246, 240]);
  fillRect(pixels, 54, 52, 1092, 526, [255, 255, 255]);
  fillRect(pixels, 54, 52, 1092, 16, [71, 146, 117]);
  fillRect(pixels, 78, 76, 1044, 478, [250, 253, 250]);
  fillRect(pixels, 720, 346, 350, 154, [18, 53, 43]);

  const titleLines = wrapText(cohort.title, { maxCharacters: 27, maxLines: 3 });
  const topicLines = wrapText(cohort.topic, { maxCharacters: 41, maxLines: 2 });
  drawText(pixels, 'Cohort15', 88, 104, 7, [18, 53, 43]);
  drawText(pixels, `${label(cohort.category)} cohort`, 88, 154, 5, [29, 111, 88]);
  titleLines.forEach((line, index) => drawText(pixels, line, 88, 210 + index * 58, 9, [16, 36, 31]));
  drawText(pixels, 'Topic', 90, 402, 4, [90, 113, 105]);
  topicLines.forEach((line, index) => drawText(pixels, line, 90, 438 + index * 36, 5, [56, 85, 76]));
  drawText(pixels, 'Quorum progress', 754, 386, 4, [185, 218, 205]);
  drawText(pixels, `${cohort.interestCount} of ${cohort.minQuorum}`, 754, 430, 6, [255, 255, 255]);
  fillRect(pixels, 754, 466, 244, 12, [54, 88, 76]);
  fillRect(pixels, 754, 466, Math.max(12, Math.round((cohort.interestCount / cohort.minQuorum) * 244)), 12, [90, 208, 160]);
  drawText(pixels, scheduleLabel(cohort), 88, 532, 4, [37, 69, 59]);
  drawText(pixels, 'cohort15.com', 862, 532, 4, [90, 113, 105]);
  return encodePng(pixels);
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
