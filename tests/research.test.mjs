import test from 'node:test';
import assert from 'node:assert/strict';

import { createRequestHandler } from '../src/server/app.mjs';
import {
  ARTICLE_PATH, renderDemandResearchArticle, renderResearchCard, renderResearchIndexPage,
} from '../src/ui/research.mjs';

const config = Object.freeze({
  appEnv: 'test',
  isProduction: false,
  appUrl: 'http://localhost:3000',
  googleAnalyticsId: 'G-TEST',
});

function invoke(handler, url) {
  return new Promise((resolve, reject) => {
    const req = { url, method: 'GET', headers: {} };
    const response = {
      status: undefined, headers: undefined, body: '',
      writeHead(status, headers) { this.status = status; this.headers = headers; },
      end(body = '') { this.body = String(body); resolve(this); },
    };
    Promise.resolve(handler(req, response)).catch(reject);
  });
}

test('research index presents the editorial model without invented media links', () => {
  const html = renderResearchIndexPage({ googleAnalyticsId: 'G-TEST' });

  assert.match(html, /<main>/);
  assert.match(html, /aria-labelledby="research-title"/);
  assert.match(html, /Research &amp; Field Notes/);
  assert.match(html, /Research[\s\S]+Essays[\s\S]+Field notes[\s\S]+Product updates[\s\S]+External publications/);
  assert.match(html, new RegExp(`href="${ARTICLE_PATH}"`));
  assert.match(html, /G-TEST/);
  assert.doesNotMatch(html, /youtube\.com|youtu\.be|medium\.com/i);
});

test('public research article is a sanitized synthesis with method, limits, implications, and CTA', () => {
  const html = renderDemandResearchArticle({ googleAnalyticsId: 'G-TEST' });

  for (const expected of [
    'Methodology', 'The strongest pattern', 'What this means for Cohort15', 'Limitations',
    'Create a cohort', 'Browse cohorts', '20 relevant public posts',
  ]) assert.match(html, new RegExp(expected));
  assert.match(html, /<article class="article-body">/);
  assert.match(html, /<time datetime="2026-06-20">/);
  assert.doesNotMatch(html, /reddit\.com|Public handle|Suggested outreach|Quality score|turn\d+view|cite/i);
});

test('research cards escape content and reject unsafe links', () => {
  const html = renderResearchCard({
    type: '<Research>',
    title: '<script>alert(1)</script>',
    summary: 'A & B',
    publishedAt: '2026-06-20',
    href: '/research/safe-entry',
  });
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /A &amp; B/);
  assert.doesNotMatch(html, /<script>/);

  assert.throws(() => renderResearchCard({
    type: 'External publication', title: 'Unsafe', summary: 'Unsafe',
    publishedAt: '2026-06-20', href: 'javascript:alert(1)', external: true,
  }), /HTTP or HTTPS/);
});

test('GET research routes render through the server and preserve unknown-route 404s', async () => {
  const handler = createRequestHandler({ config });
  const index = await invoke(handler, '/research');
  const article = await invoke(handler, ARTICLE_PATH);
  const missing = await invoke(handler, '/research/not-published');

  assert.equal(index.status, 200);
  assert.match(index.headers['content-type'], /text\/html/);
  assert.equal(article.status, 200);
  assert.match(article.body, /commitment density/i);
  assert.equal(missing.status, 404);
});
