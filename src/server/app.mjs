import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join } from 'node:path';
import { clearSessionCookie, createSessionManager } from '../auth/session.mjs';
import {
  ALLOWED_IMAGE_UPLOAD_TYPES,
  MAX_UPLOADED_IMAGE_BYTES,
  getFoundationSummary
} from '../domain/constants.mjs';
import { createDemoRepositories } from '../persistence/seeds.mjs';
import { createJsonFileStore } from '../persistence/store.mjs';
import { createCohortService } from '../services/create-cohort.mjs';
import { createDashboardService } from '../services/dashboards.mjs';
import { createEventBrowsingService } from '../services/event-browsing.mjs';
import { createExpireCohortsService } from '../services/expire-cohorts.mjs';
import { createShowInterestService } from '../services/show-interest.mjs';
import { renderSignInPage } from '../ui/auth.mjs';
import { renderCohortDetailPage, renderCohortFeedPage } from '../ui/cohorts.mjs';
import { renderCreateCohortPage } from '../ui/create-cohort.mjs';
import { renderCreatorDashboardPage, renderDashboardPage, renderParticipantDashboardPage } from '../ui/dashboards.mjs';
import { renderBuyCreditsPlaceholderPage, renderHomePage } from '../ui/home.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');
const IMAGE_EXTENSION_BY_TYPE = Object.freeze({
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
});

function contentTypeForImagePath(fileName) {
  const extension = extname(fileName).toLowerCase();
  if (extension === '.gif') {
    return 'image/gif';
  }
  if (extension === '.jpg' || extension === '.jpeg') {
    return 'image/jpeg';
  }
  if (extension === '.webp') {
    return 'image/webp';
  }
  return 'image/png';
}

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function redirect(res, location, headers = {}) {
  send(res, 303, {
    location,
    ...headers
  }, '');
}

function safeReturnTo(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '/';
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }

  return value;
}

async function readBodyBuffer(req) {
  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return Buffer.from(req.body);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function parseFormBody(body) {
  return Object.fromEntries(new URLSearchParams(body.toString('utf8')));
}

function parseMultipartFormData(body, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    throw new Error('Image upload form was missing its boundary.');
  }

  const boundary = `--${boundaryMatch[1] ?? boundaryMatch[2]}`;
  const parts = body.toString('latin1').split(boundary);
  const fields = {};
  const files = {};

  for (const part of parts) {
    if (!part || part === '--\r\n' || part === '--') {
      continue;
    }

    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) {
      continue;
    }

    const rawHeaders = part.slice(0, headerEnd).trim();
    let rawContent = part.slice(headerEnd + 4);
    if (rawContent.endsWith('\r\n')) {
      rawContent = rawContent.slice(0, -2);
    }

    const disposition = rawHeaders.match(/content-disposition:\s*form-data;\s*([^\r\n]+)/i);
    const name = disposition?.[1]?.match(/name="([^"]+)"/)?.[1];
    if (!name) {
      continue;
    }

    const filename = disposition[1].match(/filename="([^"]*)"/)?.[1];
    if (typeof filename === 'string') {
      const contentTypeMatch = rawHeaders.match(/content-type:\s*([^\r\n]+)/i);
      files[name] = {
        filename,
        contentType: contentTypeMatch?.[1]?.trim().toLowerCase() ?? 'application/octet-stream',
        content: Buffer.from(rawContent, 'latin1')
      };
      continue;
    }

    fields[name] = Buffer.from(rawContent, 'latin1').toString('utf8');
  }

  return { fields, files };
}

async function storeUploadedEventImage(file, options) {
  if (!file || file.filename.length === 0 || file.content.length === 0) {
    return undefined;
  }

  if (!ALLOWED_IMAGE_UPLOAD_TYPES.includes(file.contentType)) {
    throw new Error('Event image must be a PNG, JPG, GIF, or WebP file.');
  }

  if (file.content.length > MAX_UPLOADED_IMAGE_BYTES) {
    throw new Error('Event image must be 2 MB or smaller.');
  }

  const extension = IMAGE_EXTENSION_BY_TYPE[file.contentType] || extname(file.filename).toLowerCase();
  const fileName = `${options.createUploadId() || randomUUID()}${extension}`;
  await mkdir(options.uploadedImageDir, { recursive: true });
  await writeFile(join(options.uploadedImageDir, fileName), file.content);
  return `${options.uploadedImagePathPrefix}/${fileName}`;
}

async function parseCreateCohortRequest(req, options) {
  const contentType = req.headers?.['content-type'] ?? req.headers?.['Content-Type'] ?? '';
  const body = await readBodyBuffer(req);

  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    return parseFormBody(body);
  }

  const { fields, files } = parseMultipartFormData(body, contentType);
  const imageUrl = await storeUploadedEventImage(files.eventImage, options);
  return {
    ...fields,
    ...(imageUrl ? { imageUrl } : {})
  };
}

function renderCreatePage(state, options = {}) {
  return renderCreateCohortPage({
    ...options
  });
}

function createState(options = {}) {
  const persistenceFile = options.persistenceFile ?? process.env.COHORT15_PERSISTENCE_FILE;

  if (persistenceFile) {
    return createDemoRepositories({
      store: createJsonFileStore(persistenceFile)
    });
  }

  return createDemoRepositories();
}

const defaultState = createState();

export function createRequestHandler(state = createState(), options = {}) {
  const uploadedImageDir = options.uploadedImageDir ?? join(rootDir, 'public', 'assets', 'uploads');
  const uploadedImagePathPrefix = options.uploadedImagePathPrefix ?? '/assets/uploads';
  const createUploadId = options.createUploadId ?? (() => randomUUID());
  const cohortService = createCohortService({
    ...state,
    options
  });
  const dashboardService = createDashboardService(state);
  const eventBrowsingService = createEventBrowsingService(state);
  const expireCohortsService = createExpireCohortsService(state);
  const showInterestService = createShowInterestService(state);
  const sessionManager = options.sessionManager ?? createSessionManager({
    repositories: state.repositories,
    createSessionId: options.createSessionId
  });

  function currentUser(req) {
    return sessionManager.getCurrentUser(req);
  }

  function requireCurrentUser(req, res) {
    const user = currentUser(req);
    if (user) {
      return user;
    }

    send(res, 401, { 'content-type': 'text/html; charset=utf-8' }, renderSignInPage({
      users: state.repositories.users.list(),
      returnTo: req.url ?? '/'
    }));
    return undefined;
  }

  return async function handleRequest(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const user = currentUser(req);

    if (url.pathname === '/health') {
      send(res, 200, { 'content-type': 'application/json; charset=utf-8' }, JSON.stringify({
        ok: true,
        ...getFoundationSummary()
      }));
      return;
    }

    if (url.pathname === '/assets/styles.css') {
      const css = await readFile(join(rootDir, 'src', 'ui', 'styles.css'), 'utf8');
      send(res, 200, { 'content-type': 'text/css; charset=utf-8' }, css);
      return;
    }

    if (url.pathname === '/assets/default-cohort.png') {
      const image = await readFile(join(rootDir, 'public', 'assets', 'default-cohort.png'));
      send(res, 200, { 'content-type': 'image/png' }, image);
      return;
    }

    if (url.pathname.startsWith('/assets/uploads/') && (req.method ?? 'GET') === 'GET') {
      const fileName = decodeURIComponent(url.pathname.slice('/assets/uploads/'.length));
      if (!fileName || fileName.includes('/') || fileName.includes('..')) {
        send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, 'Not found');
        return;
      }

      try {
        const image = await readFile(join(uploadedImageDir, fileName));
        send(res, 200, { 'content-type': contentTypeForImagePath(fileName) }, image);
      } catch {
        send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, 'Not found');
      }
      return;
    }

    if (url.pathname === '/') {
      send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderHomePage({ currentUser: user }));
      return;
    }

    if (url.pathname === '/auth/sign-in' && (req.method ?? 'GET') === 'GET') {
      send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderSignInPage({
        users: state.repositories.users.list(),
        currentUser: user,
        returnTo: safeReturnTo(url.searchParams.get('returnTo') ?? '/')
      }));
      return;
    }

    if (url.pathname === '/auth/sign-in' && req.method === 'POST') {
      const values = parseFormBody(await readBodyBuffer(req));
      const returnTo = safeReturnTo(values.returnTo);

      try {
        const session = sessionManager.signIn(values.userId);
        redirect(res, returnTo, {
          'set-cookie': session.cookie
        });
      } catch (error) {
        send(res, 400, { 'content-type': 'text/html; charset=utf-8' }, renderSignInPage({
          users: state.repositories.users.list(),
          error: error.message,
          returnTo
        }));
      }
      return;
    }

    if (url.pathname === '/auth/sign-out' && req.method === 'POST') {
      sessionManager.signOut(req);
      redirect(res, '/', {
        'set-cookie': clearSessionCookie()
      });
      return;
    }

    if (url.pathname === '/credits/buy' && (req.method ?? 'GET') === 'GET') {
      send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderBuyCreditsPlaceholderPage({ currentUser: user }));
      return;
    }

    if (url.pathname === '/cohorts' && (req.method ?? 'GET') === 'GET') {
      const search = url.searchParams.get('q') ?? '';
      send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderCohortFeedPage({
        events: eventBrowsingService.listPublicEvents({ search }),
        search,
        currentUser: user
      }));
      return;
    }

    if (url.pathname === '/cohorts/new' && (req.method ?? 'GET') === 'GET') {
      const authenticatedUser = requireCurrentUser(req, res);
      if (!authenticatedUser) {
        return;
      }

      send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderCreatePage(state, {
        currentUser: authenticatedUser
      }));
      return;
    }

    if (url.pathname === '/cohorts/new' && req.method === 'POST') {
      const authenticatedUser = requireCurrentUser(req, res);
      if (!authenticatedUser) {
        return;
      }

      let values = {};
      try {
        values = {
          ...(await parseCreateCohortRequest(req, {
            uploadedImageDir,
            uploadedImagePathPrefix,
            createUploadId
          })),
          creatorId: authenticatedUser.id
        };
        const result = cohortService.create(values);
        send(res, 201, { 'content-type': 'text/html; charset=utf-8' }, renderCreatePage(state, {
          values: {},
          result,
          currentUser: authenticatedUser
        }));
      } catch (error) {
        send(res, 400, { 'content-type': 'text/html; charset=utf-8' }, renderCreatePage(state, {
          values,
          errors: [error.message],
          currentUser: authenticatedUser
        }));
      }
      return;
    }

    if (url.pathname === '/dashboard' && (req.method ?? 'GET') === 'GET') {
      const authenticatedUser = requireCurrentUser(req, res);
      if (!authenticatedUser) {
        return;
      }

      try {
        send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderDashboardPage(
          {
            ...dashboardService.getCombinedDashboard({
              creatorUserId: authenticatedUser.id,
              participantUserId: authenticatedUser.id
            }),
            currentUser: authenticatedUser
          }
        ));
      } catch (error) {
        send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, error.message);
      }
      return;
    }

    if (url.pathname === '/dashboard/creator' && (req.method ?? 'GET') === 'GET') {
      const authenticatedUser = requireCurrentUser(req, res);
      if (!authenticatedUser) {
        return;
      }

      try {
        send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderCreatorDashboardPage({
          dashboard: dashboardService.getCreatorDashboard(authenticatedUser.id),
          currentUser: authenticatedUser
        }));
      } catch (error) {
        send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, error.message);
      }
      return;
    }

    if (url.pathname === '/dashboard/participant' && (req.method ?? 'GET') === 'GET') {
      const authenticatedUser = requireCurrentUser(req, res);
      if (!authenticatedUser) {
        return;
      }

      try {
        send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderParticipantDashboardPage({
          dashboard: dashboardService.getParticipantDashboard(authenticatedUser.id),
          currentUser: authenticatedUser
        }));
      } catch (error) {
        send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, error.message);
      }
      return;
    }

    if (url.pathname === '/admin/expire-cohorts' && req.method === 'POST') {
      const nowParam = url.searchParams.get('now');
      const processedAt = nowParam ? new Date(nowParam) : new Date();

      if (Number.isNaN(processedAt.getTime())) {
        send(res, 400, { 'content-type': 'application/json; charset=utf-8' }, JSON.stringify({
          error: 'now must be an ISO date when provided.'
        }));
        return;
      }

      const result = expireCohortsService.expireDueCohorts(processedAt);
      send(res, 200, { 'content-type': 'application/json; charset=utf-8' }, JSON.stringify({
        processedAt: result.processedAt.toISOString(),
        expiredCount: result.expiredCount,
        expiredEventIds: result.results
          .filter((item) => item.expired)
          .map((item) => item.event.id)
      }));
      return;
    }

    const cohortDetailMatch = url.pathname.match(/^\/cohorts\/([^/]+)$/);
    if (cohortDetailMatch && (req.method ?? 'GET') === 'GET') {
      const event = eventBrowsingService.getPublicEvent(
        decodeURIComponent(cohortDetailMatch[1]),
        user?.id
      );

      if (!event) {
        send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, 'Cohort not found');
        return;
      }

      send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderCohortDetailPage({
        event,
        currentUser: user
      }));
      return;
    }

    const showInterestMatch = url.pathname.match(/^\/cohorts\/([^/]+)\/interest$/);
    if (showInterestMatch && req.method === 'POST') {
      const authenticatedUser = requireCurrentUser(req, res);
      if (!authenticatedUser) {
        return;
      }

      const eventId = decodeURIComponent(showInterestMatch[1]);

      try {
        const result = showInterestService.showInterest({ eventId, userId: authenticatedUser.id });
        const event = eventBrowsingService.getPublicEvent(eventId, authenticatedUser.id);
        send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderCohortDetailPage({
          event,
          currentUser: authenticatedUser,
          interestResult: result
        }));
      } catch (error) {
        const event = eventBrowsingService.getPublicEvent(eventId, authenticatedUser.id);
        if (!event) {
          send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, 'Cohort not found');
          return;
        }

        send(res, 400, { 'content-type': 'text/html; charset=utf-8' }, renderCohortDetailPage({
          event,
          currentUser: authenticatedUser,
          interestErrors: [error.message]
        }));
      }
      return;
    }

    send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, 'Not found');
  };
}

export const handleRequest = createRequestHandler(defaultState);

export function createApp() {
  return createServer(handleRequest);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  createApp().listen(port, () => {
    console.log(`Cohort15 dev server running at http://localhost:${port}`);
  });
}
