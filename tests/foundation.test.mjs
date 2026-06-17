import assert from 'node:assert/strict';
import test from 'node:test';
import { handleRequest } from '../src/server/app.mjs';
import { getFoundationSummary } from '../src/domain/constants.mjs';

async function invoke(path) {
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

  await handleRequest({ url: path }, res);

  return {
    status: res.statusCode,
    headers: res.headers,
    body: chunks.join('')
  };
}

test('foundation summary exposes the initial app areas', () => {
  assert.deepEqual(getFoundationSummary().areas, ['domain', 'persistence', 'server', 'ui']);
});

test('server renders the MVP foundation shell and health endpoint', async () => {
  const home = await invoke('/');
  assert.equal(home.status, 200);
  assert.match(home.body, /Cohort15/);
  assert.match(home.body, /href="\/credits\/buy">Buy Credits<\/a>/);

  const health = await invoke('/health');
  assert.equal(health.status, 200);
  assert.equal(JSON.parse(health.body).ok, true);
});

test('buy credits page is reachable and requires an account before checkout', async () => {
  const page = await invoke('/credits/buy');
  assert.equal(page.status, 200);
  assert.match(page.body, /<h1 id="page-title">Buy Credits<\/h1>/);
  assert.match(page.body, /Choose a one-time credit package/);
  assert.match(page.body, /Sign in to buy credits/);
  assert.doesNotMatch(page.body, /payment succeeded/i);
});

test('primary navigation keeps buy credits aligned with other links', async () => {
  const styles = await invoke('/assets/styles.css');

  assert.equal(styles.status, 200);
  assert.match(styles.body, /\.topbar-links\s*{[^}]*align-items:\s*center;/s);
  assert.match(styles.body, /\.topbar-links a\s*{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*min-height:\s*34px;/s);
  assert.match(styles.body, /@media \(max-width: 760px\)\s*{[\s\S]*\.topbar-links\s*{[^}]*justify-content:\s*flex-start;/);
});
