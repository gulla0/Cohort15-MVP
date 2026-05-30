import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getFoundationSummary } from '../domain/constants.mjs';
import { createDemoRepositories } from '../persistence/seeds.mjs';
import { createCohortService } from '../services/create-cohort.mjs';
import { createDashboardService } from '../services/dashboards.mjs';
import { createEventBrowsingService } from '../services/event-browsing.mjs';
import { createExpireCohortsService } from '../services/expire-cohorts.mjs';
import { createShowInterestService } from '../services/show-interest.mjs';
import { renderCohortDetailPage, renderCohortFeedPage } from '../ui/cohorts.mjs';
import { renderCreateCohortPage } from '../ui/create-cohort.mjs';
import { renderCreatorDashboardPage, renderDashboardPage, renderParticipantDashboardPage } from '../ui/dashboards.mjs';
import { renderHomePage } from '../ui/home.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

async function readBody(req) {
  if (typeof req.body === 'string') {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

function parseFormBody(body) {
  return Object.fromEntries(new URLSearchParams(body));
}

function renderCreatePage(state, options = {}) {
  return renderCreateCohortPage({
    users: state.repositories.users.list(),
    ...options
  });
}

function createState() {
  return createDemoRepositories();
}

const defaultState = createState();

export function createRequestHandler(state = createState()) {
  const cohortService = createCohortService(state);
  const dashboardService = createDashboardService(state);
  const eventBrowsingService = createEventBrowsingService(state);
  const expireCohortsService = createExpireCohortsService(state);
  const showInterestService = createShowInterestService(state);

  return async function handleRequest(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');

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

    if (url.pathname === '/') {
      send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderHomePage());
      return;
    }

    if (url.pathname === '/cohorts' && (req.method ?? 'GET') === 'GET') {
      send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderCohortFeedPage({
        events: eventBrowsingService.listPublicEvents()
      }));
      return;
    }

    if (url.pathname === '/cohorts/new' && (req.method ?? 'GET') === 'GET') {
      send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderCreatePage(state));
      return;
    }

    if (url.pathname === '/cohorts/new' && req.method === 'POST') {
      const values = parseFormBody(await readBody(req));

      try {
        const result = cohortService.create(values);
        send(res, 201, { 'content-type': 'text/html; charset=utf-8' }, renderCreatePage(state, {
          values: {},
          result
        }));
      } catch (error) {
        send(res, 400, { 'content-type': 'text/html; charset=utf-8' }, renderCreatePage(state, {
          values,
          errors: [error.message]
        }));
      }
      return;
    }

    if (url.pathname === '/dashboard' && (req.method ?? 'GET') === 'GET') {
      const creatorUserId = url.searchParams.get('creatorUserId') ?? 'user-creator';
      const participantUserId = url.searchParams.get('participantUserId') ?? 'user-participant';

      try {
        send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderDashboardPage({
          creatorDashboard: dashboardService.getCreatorDashboard(creatorUserId),
          participantDashboard: dashboardService.getParticipantDashboard(participantUserId)
        }));
      } catch (error) {
        send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, error.message);
      }
      return;
    }

    if (url.pathname === '/dashboard/creator' && (req.method ?? 'GET') === 'GET') {
      const userId = url.searchParams.get('userId') ?? 'user-creator';

      try {
        send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderCreatorDashboardPage({
          dashboard: dashboardService.getCreatorDashboard(userId)
        }));
      } catch (error) {
        send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, error.message);
      }
      return;
    }

    if (url.pathname === '/dashboard/participant' && (req.method ?? 'GET') === 'GET') {
      const userId = url.searchParams.get('userId') ?? 'user-participant';

      try {
        send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderParticipantDashboardPage({
          dashboard: dashboardService.getParticipantDashboard(userId)
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
      const viewerId = url.searchParams.get('viewerId') ?? undefined;
      const event = eventBrowsingService.getPublicEvent(
        decodeURIComponent(cohortDetailMatch[1]),
        viewerId
      );

      if (!event) {
        send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, 'Cohort not found');
        return;
      }

      send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderCohortDetailPage({
        event,
        users: state.repositories.users.list(),
        viewerId
      }));
      return;
    }

    const showInterestMatch = url.pathname.match(/^\/cohorts\/([^/]+)\/interest$/);
    if (showInterestMatch && req.method === 'POST') {
      const eventId = decodeURIComponent(showInterestMatch[1]);
      const values = parseFormBody(await readBody(req));
      const viewerId = values.userId;

      try {
        const result = showInterestService.showInterest({ eventId, userId: viewerId });
        const event = eventBrowsingService.getPublicEvent(eventId, viewerId);
        send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderCohortDetailPage({
          event,
          users: state.repositories.users.list(),
          viewerId,
          interestResult: result
        }));
      } catch (error) {
        const event = eventBrowsingService.getPublicEvent(eventId, viewerId);
        if (!event) {
          send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, 'Cohort not found');
          return;
        }

        send(res, 400, { 'content-type': 'text/html; charset=utf-8' }, renderCohortDetailPage({
          event,
          users: state.repositories.users.list(),
          viewerId,
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
