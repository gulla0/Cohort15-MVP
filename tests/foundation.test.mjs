import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestHandler } from '../src/server/app.mjs';
import { renderHomePage } from '../src/ui/home.mjs';

function invoke(handler, { url = '/', method = 'GET' } = {}) {
  return new Promise((resolve, reject) => {
    const req = { url, method, headers: {} };
    const response = {
      status: undefined,
      headers: undefined,
      body: '',
      writeHead(status, headers) {
        this.status = status;
        this.headers = headers;
      },
      end(body = '') {
        this.body = String(body);
        resolve(this);
      }
    };

    Promise.resolve(handler(req, response)).catch(reject);
  });
}

const config = Object.freeze({
  appEnv: 'test',
  appUrl: 'http://localhost:3000',
  googleAnalyticsId: 'G-TEST'
});

test('lofi home renders branded foundation without legacy product surfaces', () => {
  const html = renderHomePage({ googleAnalyticsId: 'G-TEST' });

  assert.match(html, /Form small, high-intent online groups/);
  assert.match(html, /seven days/);
  assert.match(html, /G-TEST/);
  assert.doesNotMatch(html, /Sign in|Buy Credits|Stripe|Dashboard|event image/i);
});

test('shell exposes only home, styles, health, and 404 routes', async () => {
  const handler = createRequestHandler({ config });

  const home = await invoke(handler);
  assert.equal(home.status, 200);
  assert.match(home.body, /Cohort15/);

  const styles = await invoke(handler, { url: '/assets/styles.css' });
  assert.equal(styles.status, 200);
  assert.match(styles.headers['content-type'], /text\/css/);

  const health = await invoke(handler, { url: '/health' });
  assert.equal(health.status, 200);
  assert.deepEqual(JSON.parse(health.body), {
    ok: true,
    app: 'cohort15-lofi-mvp',
    environment: 'test'
  });

  for (const legacyPath of ['/auth/sign-in', '/credits/buy', '/dashboard', '/admin/expire-cohorts']) {
    const response = await invoke(handler, { url: legacyPath });
    assert.equal(response.status, 404);
  }
});
