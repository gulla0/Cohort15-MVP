import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { CREATE_EVENT_CREDIT_COST, DEFAULT_COHORT_IMAGE_PATH } from '../src/domain/constants.mjs';
import { createDemoRepositories } from '../src/persistence/seeds.mjs';
import { createCohortService } from '../src/services/create-cohort.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

const now = new Date('2026-06-01T12:00:00.000Z');

function validInput(overrides = {}) {
  return {
    creatorId: 'user-creator',
    title: 'Beginner TypeScript Build Cohort',
    description: 'Build small TypeScript projects together.',
    category: 'build',
    topic: 'TypeScript',
    targetAudience: 'Beginner developers who know basic JavaScript.',
    targetSkillLevel: 'beginner',
    minQuorum: '5',
    maxParticipants: '8',
    lockedEventLink: 'https://meet.google.com/cohort',
    firstMeetingAt: '2026-06-20T18:00:00.000Z',
    meetingDurationMinutes: '90',
    recurrence: 'weekly',
    meetingCount: '4',
    ...overrides
  };
}

function createServiceFixture(options = {}) {
  const state = createDemoRepositories();
  const service = createCohortService({
    ...state,
    options: {
      now: () => now,
      createEventId: () => options.eventId ?? 'event-created'
    }
  });

  return {
    ...state,
    service
  };
}

function encodeForm(values) {
  return new URLSearchParams(values).toString();
}

function encodeMultipartForm(values, file) {
  const boundary = '----cohort15-test-boundary';
  const chunks = [];

  for (const [name, value] of Object.entries(values)) {
    chunks.push(Buffer.from(
      `--${boundary}\r\n`
      + `Content-Disposition: form-data; name="${name}"\r\n\r\n`
      + `${value}\r\n`
    ));
  }

  if (file) {
    chunks.push(Buffer.from(
      `--${boundary}\r\n`
      + `Content-Disposition: form-data; name="eventImage"; filename="${file.filename}"\r\n`
      + `Content-Type: ${file.contentType}\r\n\r\n`
    ));
    chunks.push(file.content);
    chunks.push(Buffer.from('\r\n'));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat(chunks)
  };
}

async function invoke(handler, request) {
  const chunks = [];
  const res = {
    statusCode: 0,
    headers: {},
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body) {
      chunks.push(body ?? '');
    }
  };

  await handler(request, res);

  return {
    status: res.statusCode,
    headers: res.headers,
    body: chunks.join('')
  };
}

test('create cohort holds 2 creator credits and saves an open event with default expiry', () => {
  const { repositories, ledger, service } = createServiceFixture();

  const result = service.create(validInput());

  assert.equal(result.event.id, 'event-created');
  assert.equal(result.event.status, 'open');
  assert.equal(result.event.creatorId, 'user-creator');
  assert.equal(result.event.imageUrl, DEFAULT_COHORT_IMAGE_PATH);
  assert.equal(result.event.expiresAt.toISOString(), '2026-06-15T12:00:00.000Z');
  assert.equal(repositories.events.findById('event-created').title, 'Beginner TypeScript Build Cohort');

  const transactions = repositories.creditTransactions.listByEvent('event-created');
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].type, 'hold');
  assert.equal(transactions[0].amount, CREATE_EVENT_CREDIT_COST);
  assert.equal(ledger.balanceForUser('user-creator').held, CREATE_EVENT_CREDIT_COST);
});

test('create cohort preserves a custom event image URL', () => {
  const { service } = createServiceFixture();

  const result = service.create(validInput({ imageUrl: 'https://images.example/typescript.png' }));

  assert.equal(result.event.imageUrl, 'https://images.example/typescript.png');
});

test('create cohort supports daily recurring cohorts', () => {
  const { service } = createServiceFixture();

  const result = service.create(validInput({
    recurrence: 'daily',
    meetingCount: '5'
  }));

  assert.equal(result.event.recurrence, 'daily');
  assert.equal(result.event.meetingCount, 5);
});

test('create cohort rejects creators with fewer than 2 available credits', () => {
  const { repositories, ledger, service } = createServiceFixture();
  ledger.hold('user-creator', 'existing-event-1', 2);
  ledger.hold('user-creator', 'existing-event-2', 2);
  ledger.hold('user-creator', 'existing-event-3', 1);

  assert.throws(() => service.create(validInput()), /Insufficient available credits/);
  assert.equal(repositories.events.findById('event-created'), undefined);
});

test('create cohort surfaces validation errors before saving', () => {
  const { repositories, service } = createServiceFixture();

  assert.throws(() => service.create(validInput({
    title: '',
    maxParticipants: '20',
    recurrence: 'none',
    meetingCount: '4'
  })), /title is required/);

  assert.equal(repositories.events.list().length, 0);
});

test('create cohort rejects first meetings before the quorum window closes', () => {
  const { repositories, service } = createServiceFixture();

  assert.throws(
    () => service.create(validInput({ firstMeetingAt: '2026-06-10T18:00:00.000Z' })),
    /firstMeetingAt must be after the 14-day quorum window/
  );

  assert.equal(repositories.events.list().length, 0);
});

test('create cohort rejects unsupported private meeting link providers', () => {
  const { repositories, service } = createServiceFixture();

  assert.throws(
    () => service.create(validInput({ lockedEventLink: 'https://example.com/private-room' })),
    /lockedEventLink must be an approved Google Meet, Zoom, Microsoft Teams, Discord, or Slack https link/
  );

  assert.equal(repositories.events.list().length, 0);
});

test('create cohort page renders form errors and success without exposing private link', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state, {
    now: () => now
  });

  const form = await invoke(handler, { url: '/cohorts/new', method: 'GET' });
  assert.equal(form.status, 200);
  assert.match(form.body, /Create cohort/);
  assert.match(form.body, /name="firstMeetingAt" type="datetime-local" min="/);
  assert.match(form.body, /enctype="multipart\/form-data"/);
  assert.match(form.body, /name="eventImage" type="file"/);
  assert.match(form.body, /Ship a tiny AI research assistant in 4 weeks/);
  assert.match(form.body, /AI workflow prototyping/);
  assert.match(form.body, /https:\/\/meet\.google\.com\/cohort-room/);
  assert.doesNotMatch(form.body, /name="imageUrl"/);
  assert.match(form.body, /<option value="daily">daily<\/option>/);
  assert.match(form.body, /name="creatorId" type="hidden" value="user-creator"/);
  assert.doesNotMatch(form.body, /<select name="creatorId"/);
  assert.doesNotMatch(form.body, />\s*Creator\s*<select/);

  const styles = await invoke(handler, { url: '/assets/styles.css', method: 'GET' });
  assert.equal(styles.status, 200);
  assert.match(styles.body, /\.form-grid input::placeholder,\n\.form-grid textarea::placeholder/);
  assert.match(styles.body, /color: #b8b0a4;/);
  assert.match(styles.body, /\.form-grid input:focus::placeholder,\n\.form-grid textarea:focus::placeholder/);
  assert.match(styles.body, /color: transparent;\n  opacity: 0;/);

  const invalid = await invoke(handler, {
    url: '/cohorts/new',
    method: 'POST',
    body: encodeForm(validInput({ title: '' }))
  });
  assert.equal(invalid.status, 400);
  assert.match(invalid.body, /Fix these fields/);
  assert.match(invalid.body, /title is required/);

  const valid = await invoke(handler, {
    url: '/cohorts/new',
    method: 'POST',
    body: encodeForm(validInput({ lockedEventLink: 'https://zoom.us/private-room' }))
  });
  assert.equal(valid.status, 201);
  assert.match(valid.body, /Cohort created/);
  assert.match(valid.body, /Private link status: locked until quorum/);
  assert.match(valid.body, /href="\/dashboard\?creatorUserId=user-creator"/);
  assert.doesNotMatch(valid.body, /zoom\.us/);
});

test('create cohort route assigns the temporary demo creator instead of trusting posted creator ids', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state, {
    now: () => now
  });

  const response = await invoke(handler, {
    url: '/cohorts/new',
    method: 'POST',
    body: encodeForm(validInput({
      creatorId: 'user-participant',
      lockedEventLink: 'https://meet.google.com/demo-creator-route'
    }))
  });

  assert.equal(response.status, 201);
  assert.equal(state.repositories.events.list()[0].creatorId, 'user-creator');
});

test('create cohort route stores a selected local event image', async () => {
  const state = createDemoRepositories();
  const uploadedImageDir = await mkdtemp(join(tmpdir(), 'cohort15-upload-test-'));
  const handler = createRequestHandler(state, {
    now: () => now,
    createUploadId: () => 'uploaded-image',
    uploadedImageDir
  });
  const form = encodeMultipartForm(validInput({
    lockedEventLink: 'https://meet.google.com/uploaded-image'
  }), {
    filename: 'cohort.png',
    contentType: 'image/png',
    content: Buffer.from('fake png bytes')
  });

  const response = await invoke(handler, {
    url: '/cohorts/new',
    method: 'POST',
    headers: {
      'content-type': form.contentType
    },
    body: form.body
  });

  assert.equal(response.status, 201);
  assert.equal(state.repositories.events.list()[0].imageUrl, '/assets/uploads/uploaded-image.png');
  assert.equal(await readFile(join(uploadedImageDir, 'uploaded-image.png'), 'utf8'), 'fake png bytes');

  const imageResponse = await invoke(handler, {
    url: '/assets/uploads/uploaded-image.png',
    method: 'GET'
  });
  assert.equal(imageResponse.status, 200);
  assert.equal(imageResponse.headers['content-type'], 'image/png');
});

test('create cohort route rejects unsupported uploaded image types', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state, {
    now: () => now,
    uploadedImageDir: await mkdtemp(join(tmpdir(), 'cohort15-upload-test-'))
  });
  const form = encodeMultipartForm(validInput({
    lockedEventLink: 'https://meet.google.com/bad-upload'
  }), {
    filename: 'notes.txt',
    contentType: 'text/plain',
    content: Buffer.from('not an image')
  });

  const response = await invoke(handler, {
    url: '/cohorts/new',
    method: 'POST',
    headers: {
      'content-type': form.contentType
    },
    body: form.body
  });

  assert.equal(response.status, 400);
  assert.match(response.body, /Event image must be a PNG, JPG, GIF, or WebP file/);
  assert.equal(state.repositories.events.list().length, 0);
});
