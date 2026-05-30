import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getFoundationSummary } from '../domain/constants.mjs';
import { createDemoRepositories } from '../persistence/seeds.mjs';
import { createCohortService } from '../services/create-cohort.mjs';
import { renderCreateCohortPage } from '../ui/create-cohort.mjs';
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

    if (url.pathname === '/') {
      send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, renderHomePage());
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
