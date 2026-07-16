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

test('Piece of Pie home renders the branded foundation and account entry point', () => {
  const html = renderHomePage({ googleAnalyticsId: 'G-TEST' });

  assert.match(html, /Find a few people who will actually show up/);
  assert.match(html, /Example cohorts/);
  assert.match(html, /Interview practice/);
  assert.match(html, /Language learning/);
  assert.match(html, /Founder accountability/);
  assert.match(html, /A focused book group/);
  assert.match(html, /Create your first cohort for free/);
  assert.match(html, /Free to start/);
  assert.doesNotMatch(html, /Credits, simply/);
  assert.match(html, /New accounts get <strong>2 credits<\/strong>—enough to create one cohort or join two/);
  assert.match(html, /If a cohort doesn’t form, those credits come back/);
  assert.ok(html.indexOf('Example cohorts') < html.indexOf('Open directory'));
  assert.doesNotMatch(html, /ledger|credit hold/i);
  assert.match(html, /G-TEST/);
  assert.match(html, /Sign in/);
  assert.doesNotMatch(html, /Stripe|Dashboard|event image/i);
});

test('shell exposes home, authentication and credit entry, styles, health, and keeps deferred routes absent', async () => {
  const handler = createRequestHandler({ config });

  const home = await invoke(handler);
  assert.equal(home.status, 200);
  assert.match(home.body, /Cohort15/);

  const styles = await invoke(handler, { url: '/assets/styles.css' });
  assert.equal(styles.status, 200);
  assert.match(styles.headers['content-type'], /text\/css/);
  assert.match(styles.body, /\.cohort-form input::placeholder/);
  assert.match(styles.body, /font-size: 0\.72rem/);
  assert.match(styles.body, /color: #8b948f/);
  assert.match(styles.body, /align-content: start/);
  assert.match(styles.body, /\.cohort-form input\[readonly\]/);
  assert.match(styles.body, /\.recurrence-summary/);

  const health = await invoke(handler, { url: '/health' });
  assert.equal(health.status, 200);
  assert.deepEqual(JSON.parse(health.body), {
    ok: true,
    app: 'cohort15-lofi-mvp',
    environment: 'test'
  });

  const signIn = await invoke(handler, { url: '/auth/sign-in' });
  assert.equal(signIn.status, 200);
  assert.match(signIn.body, /Email me a sign-in link/);

  const buyCredits = await invoke(handler, { url: '/credits/buy' });
  assert.equal(buyCredits.status, 200);
  assert.match(buyCredits.body, /6 credits for \$6/u);
  assert.match(buyCredits.body, /Sign in to buy credits/u);

  for (const legacyPath of ['/dashboard', '/admin/expire-cohorts']) {
    const response = await invoke(handler, { url: legacyPath });
    assert.equal(response.status, 404);
  }
});
