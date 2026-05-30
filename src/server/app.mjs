import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getFoundationSummary } from '../domain/constants.mjs';
import { renderHomePage } from '../ui/home.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

export async function handleRequest(req, res) {
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

  send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, 'Not found');
}

export function createApp() {
  return createServer(handleRequest);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  createApp().listen(port, () => {
    console.log(`Cohort15 dev server running at http://localhost:${port}`);
  });
}
