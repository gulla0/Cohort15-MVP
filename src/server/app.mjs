import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRuntimeConfig } from '../config/runtime.mjs';
import { renderHomePage } from '../ui/home.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function send(res, status, contentType, body) {
  res.writeHead(status, {
    'content-type': contentType,
    'x-content-type-options': 'nosniff'
  });
  res.end(body);
}

export function createRequestHandler(options = {}) {
  const config = options.config ?? loadRuntimeConfig(options.env ?? process.env);

  return async function handleRequest(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';

    if (method === 'GET' && url.pathname === '/health') {
      send(res, 200, 'application/json; charset=utf-8', JSON.stringify({
        ok: true,
        app: 'cohort15-lofi-mvp',
        environment: config.appEnv
      }));
      return;
    }

    if (method === 'GET' && url.pathname === '/assets/styles.css') {
      const css = await readFile(join(rootDir, 'src', 'ui', 'styles.css'), 'utf8');
      send(res, 200, 'text/css; charset=utf-8', css);
      return;
    }

    if (method === 'GET' && url.pathname === '/') {
      send(res, 200, 'text/html; charset=utf-8', renderHomePage({
        googleAnalyticsId: config.googleAnalyticsId
      }));
      return;
    }

    send(res, 404, 'text/plain; charset=utf-8', 'Not found');
  };
}

export function createApp(options = {}) {
  return createServer(createRequestHandler(options));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadRuntimeConfig();
  const app = createApp({ config });
  app.listen(config.port, config.host, () => {
    console.log(`Cohort15 lofi MVP running at ${config.appUrl}`);
  });
}
