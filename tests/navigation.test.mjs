import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { renderSignInPage } from '../src/ui/auth.mjs';
import { renderCohortDetailPage } from '../src/ui/cohorts.mjs';
import { renderCreateCohortPage } from '../src/ui/create-cohort.mjs';
import { renderBuyCreditsPage, renderCheckoutCompletePage } from '../src/ui/credits.mjs';
import { renderHomePage } from '../src/ui/home.mjs';
import { renderSiteHeader } from '../src/ui/navigation.mjs';
import {
  renderDemandResearchArticle, renderFormationFieldNotePage,
  renderOriginalProductThesisPage, renderResearchIndexPage,
} from '../src/ui/research.mjs';

const auth = Object.freeze({
  user: { id: 'private-user', email: 'private@example.com' },
  balance: { available: 2 },
  csrfToken: 'csrf<&"',
});

function header(html) {
  return /<header class="shell topbar">[\s\S]*?<\/header>/u.exec(html)?.[0] ?? '';
}

function currentCount(html) {
  return [...html.matchAll(/aria-current="page"/gu)].length;
}

function publicCohort() {
  return {
    id: 'cohort-1', title: 'Build a compiler', description: 'Build something useful together.',
    category: 'build', topic: 'Compilers', targetAudience: 'Curious developers',
    targetSkillLevel: 'intermediate', minQuorum: 3, meetingDurationMinutes: 60,
    recurrence: 'weekly', meetingCount: 2, firstMeetingAt: '2099-07-10T22:00:00.000Z',
    createdAt: '2099-06-18T12:00:00.000Z', updatedAt: '2099-06-18T12:00:00.000Z',
    expiresAt: '2099-06-25T12:00:00.000Z', finalMeetingEndsAt: '2099-07-17T23:00:00.000Z',
    interestCount: 0, collectionStatus: 'active', quorumStatus: 'gathering',
    quorumMetAt: null, meetingLink: null,
  };
}

test('shared navigation preserves canonical DOM order and anonymous current state', () => {
  const html = renderSiteHeader({ currentPath: '/auth/sign-in?return_to=%2Fcohorts%2Fnew' });
  const labels = ['Cohort15', 'Browse cohorts', 'Create a cohort', 'Research &amp; Field Notes', 'Sign in'];
  for (let index = 1; index < labels.length; index += 1) {
    assert.ok(html.indexOf(labels[index - 1]) < html.indexOf(labels[index]), labels[index]);
  }
  assert.match(html, /<nav class="site-nav" aria-label="Primary navigation">/u);
  assert.match(html, /href="\/auth\/sign-in" aria-current="page">Sign in/u);
  assert.equal(currentCount(html), 1);
  assert.doesNotMatch(html, /account-disclosure|Sign out|Buy credits/u);
});

test('signed-in account disclosure preserves balance, current state, action order, and CSRF', () => {
  const ordinary = renderSiteHeader({ auth, currentPath: '/' });
  assert.match(ordinary, /<details class="account-disclosure" data-account-disclosure>/u);
  assert.doesNotMatch(ordinary, /data-account-disclosure open/u);
  assert.match(ordinary, /<summary aria-label="Account, 2 available credits">2 credits<\/summary>/u);
  assert.ok(ordinary.indexOf('Buy credits') < ordinary.indexOf('Sign out'));
  assert.match(ordinary, /<form class="inline-form" method="post" action="\/auth\/sign-out">/u);
  assert.match(ordinary, /name="csrf" value="csrf&lt;&amp;&quot;"/u);
  assert.doesNotMatch(ordinary, /private@example\.com|private-user/u);

  const creditPage = renderSiteHeader({ auth, currentPath: '/credits/buy?cancelled=1' });
  assert.match(creditPage, /data-account-disclosure open/u);
  assert.match(creditPage, /href="\/credits\/buy" aria-current="page">Buy credits/u);
  assert.equal(currentCount(creditPage), 1);
});

test('route families expose exactly one understandable current item', () => {
  const cases = [
    ['/', 'Browse cohorts'], ['/cohorts/cohort-1#request', 'Browse cohorts'],
    ['/cohorts/new?error=1', 'Create a cohort'], ['/research', 'Research &amp; Field Notes'],
    ['/research/testing-how-small-groups-form', 'Research &amp; Field Notes'],
  ];
  for (const [currentPath, label] of cases) {
    const html = renderSiteHeader({ auth, currentPath });
    assert.match(html, new RegExp(`aria-current="page">${label}`, 'u'), currentPath);
    assert.equal(currentCount(html), 1, currentPath);
  }
  assert.equal(currentCount(renderSiteHeader({ auth, currentPath: '/unmatched' })), 0);
});

test('every full server-rendered page adopts the same shared destination hierarchy', () => {
  const pages = [
    renderHomePage(), renderSignInPage(), renderCreateCohortPage({ auth }),
    renderCohortDetailPage(publicCohort()), renderResearchIndexPage(),
    renderDemandResearchArticle(), renderOriginalProductThesisPage(),
    renderFormationFieldNotePage(), renderBuyCreditsPage(),
    renderCheckoutCompletePage({ auth, state: 'paid' }),
  ];
  for (const page of pages) {
    const siteHeader = header(page);
    assert.ok(siteHeader, 'shared header is present');
    assert.equal((page.match(/aria-label="Primary navigation"/gu) ?? []).length, 1);
    assert.ok(siteHeader.indexOf('Browse cohorts') < siteHeader.indexOf('Create a cohort'));
    assert.ok(siteHeader.indexOf('Create a cohort') < siteHeader.indexOf('Research &amp; Field Notes'));
    assert.match(siteHeader, /href="\/#cohorts"/u);
    assert.match(siteHeader, /href="\/cohorts\/new"/u);
    assert.match(siteHeader, /href="\/research"/u);
  }
});

test('navigation enhancement and responsive styles preserve native keyboard and touch paths', () => {
  const html = renderSiteHeader({ auth, currentPath: '/' });
  assert.match(html, /event\.key !== 'Escape'/u);
  assert.match(html, /summary\.focus\(\)/u);
  assert.match(html, /!disclosure\.contains\(event\.target\)/u);
  assert.match(html, /!disclosure\.contains\(document\.activeElement\)/u);
  assert.doesNotMatch(html, /role="menu|aria-haspopup|ArrowDown|tabindex=/u);

  const styles = readFileSync(new URL('../src/ui/styles.css', import.meta.url), 'utf8');
  assert.match(styles, /\.account-disclosure > summary[\s\S]*?min-height: 44px/u);
  assert.match(styles, /\.account-navigation > \.button-link\.compact[\s\S]*?min-height: 44px/u);
  assert.match(styles, /\.account-panel[\s\S]*?max-width: min\(280px, calc\(100vw - 24px\)\)/u);
  assert.match(styles, /\.nav-link\[aria-current="page"\][\s\S]*?text-decoration: underline;[\s\S]*?text-underline-offset: 7px/u);
  assert.doesNotMatch(styles, /\.nav-primary\s*\{\s*border:/u);
  assert.doesNotMatch(styles, /\.nav-link\[aria-current="page"\][^}]*background:/u);
  assert.match(styles, /@media \(max-width: 520px\)[\s\S]*?\.site-nav \{ align-items: center; flex-direction: row; flex-wrap: wrap;/u);
  assert.match(styles, /@media \(max-width: 520px\)[\s\S]*?\.nav-link \{ justify-content: flex-start; width: auto;/u);
  assert.match(styles, /summary:focus-visible/u);
});
