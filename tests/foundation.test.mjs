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

  const health = await invoke('/health');
  assert.equal(health.status, 200);
  assert.equal(JSON.parse(health.body).ok, true);
});
