import { analyticsMarkup } from './analytics.mjs';
import { renderFeedbackWidget } from './feedback-widget.mjs';

const ARTICLE_PATH = '/research/why-small-committed-groups';
const VIDEO_ARTICLE_PATH = '/research/introducing-cohort15-original-product-thesis';
const FORMATION_ARTICLE_PATH = '/research/testing-how-small-groups-form';
const YOUTUBE_URL = 'https://www.youtube.com/watch?v=E5f-qqNILlg&t=4s';

export const RESEARCH_ENTRIES = Object.freeze([
  Object.freeze({
    type: 'Field note',
    title: 'How Cohort15 is testing small-group formation',
    summary: 'The formation loop, manual experiments, and modest success criteria guiding the next phase of Cohort15.',
    publishedAt: '2026-06-20',
    href: FORMATION_ARTICLE_PATH,
  }),
  Object.freeze({
    type: 'Product update',
    title: 'Introducing Cohort15: The original product thesis',
    summary: 'The founder story, original mechanics, and early assumptions behind Cohort15—plus what changed in the validation MVP.',
    publishedAt: '2026-06-20',
    href: VIDEO_ARTICLE_PATH,
  }),
  Object.freeze({
    type: 'Research',
    title: 'Why small, committed groups are worth building',
    summary: 'A synthesis of 20 public requests for serious peers, recurring accountability, and groups designed around a concrete goal.',
    publishedAt: '2026-06-20',
    href: ARTICLE_PATH,
  }),
]);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeEntryHref(entry) {
  const href = String(entry.href ?? '');
  if (entry.external) {
    let url;
    try { url = new URL(href); } catch { throw new TypeError('External research links must be valid URLs.'); }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new TypeError('External research links must use HTTP or HTTPS.');
    }
    return url.href;
  }
  if (!href.startsWith('/research/') || href.includes('\\')) {
    throw new TypeError('Internal research links must use a /research/ route.');
  }
  return href;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) throw new TypeError('Research entry dates must use YYYY-MM-DD.');
  return new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

function pageStart({ title, description, googleAnalyticsId, researchIndex = false }) {
  return `<!doctype html><html lang="en"><head>${analyticsMarkup(googleAnalyticsId)}<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><title>${escapeHtml(title)} | Cohort15</title><link rel="stylesheet" href="/assets/styles.css"></head><body>
    <header class="shell topbar"><a class="brand" href="/">Cohort15</a><nav class="site-nav" aria-label="Primary navigation"><a class="text-link" href="/#cohorts">Browse cohorts</a><a class="text-link" href="/research"${researchIndex ? ' aria-current="page"' : ''}>Research &amp; Field Notes</a><a class="button-link compact" href="/cohorts/new">Create a cohort</a></nav></header>`;
}

export function renderResearchCard(entry) {
  const href = escapeHtml(safeEntryHref(entry));
  const external = entry.external ? ' target="_blank" rel="noopener noreferrer"' : '';
  const action = entry.external ? 'Read external publication ↗' : 'Read on Cohort15 →';
  return `<article class="research-card">
    <div class="research-meta"><span class="status-pill">${escapeHtml(entry.type)}</span><time datetime="${escapeHtml(entry.publishedAt)}">${escapeHtml(formatDate(entry.publishedAt))}</time></div>
    <h2><a href="${href}"${external}>${escapeHtml(entry.title)}</a></h2>
    <p>${escapeHtml(entry.summary)}</p>
    <a class="text-link" href="${href}"${external}>${action}</a>
  </article>`;
}

export function renderResearchIndexPage({
  googleAnalyticsId = 'G-LF22TLDSBV', entries = RESEARCH_ENTRIES,
} = {}) {
  return `${pageStart({
    title: 'Research & Field Notes',
    description: 'Research, essays, field notes, and product updates shaping Cohort15.',
    googleAnalyticsId,
    researchIndex: true,
  })}<main>
    <section class="shell research-hero" aria-labelledby="research-title"><p class="eyebrow">Research &amp; Field Notes</p><h1 id="research-title">The thinking behind Cohort15.</h1><p class="lede">Research, product observations, and working ideas about helping a few serious people reliably show up around a concrete goal.</p></section>
    <section class="section research-lanes" aria-labelledby="collection-title"><div class="shell"><div class="section-heading"><div><p class="eyebrow">The collection</p><h2 id="collection-title">Evidence, ideas, and progress.</h2><p>Written work lives here. Product videos will include a useful written summary and a link to YouTube; selected external publications will be labeled clearly.</p></div></div><div class="editorial-lanes" aria-label="Content types"><span>Research</span><span>Essays</span><span>Field notes</span><span>Product updates</span><span>External publications</span></div></div></section>
    <section class="section listing-section" aria-labelledby="latest-title"><div class="shell"><div class="section-heading"><div><p class="eyebrow">Latest</p><h2 id="latest-title">Start with the evidence.</h2></div></div><div class="research-grid">${entries.map(renderResearchCard).join('')}</div></div></section>
  </main><footer><div class="shell">Cohort15 — small, high-intent online groups.</div></footer>${renderFeedbackWidget()}</body></html>`;
}

export function renderDemandResearchArticle({ googleAnalyticsId = 'G-LF22TLDSBV' } = {}) {
  return `${pageStart({
    title: 'Why small, committed groups are worth building',
    description: 'What 20 public requests for serious peers reveal about small, structured, goal-oriented groups.',
    googleAnalyticsId,
  })}<main class="shell article-shell">
    <a class="text-link" href="/research">← All research &amp; field notes</a>
    <header class="article-header"><p class="eyebrow">Research</p><h1>Why small, committed groups are worth building</h1><p class="lede">What 20 public requests for serious peers reveal about accountability, group size, and the limits of broad online communities.</p><div class="article-byline"><span>By Cohort15</span><time datetime="2026-06-20">June 20, 2026</time><span>8 min read</span></div></header>
    <article class="article-body">
      <p class="article-intro">People are not simply asking for more community. They are asking for a few serious people who share a goal, agree on a cadence, and reliably show up.</p>

      <h2>The question behind the research</h2>
      <p>Cohort15 is built around a simple premise: a small group becomes useful when its purpose, schedule, and minimum commitment are concrete. We wanted to test whether people already describe this need in public, without prompting from us.</p>
      <p>The research focused on requests for study partners, accountability groups, founder circles, practice squads, and other recurring small-group formats. The aim was not to estimate the total market. It was to look for repeated language, constraints, and frustrations that could confirm—or weaken—the product thesis.</p>

      <h2>Methodology</h2>
      <p>We reviewed 20 relevant public posts and comments across Reddit, Indie Hackers, and Hacker News. Fourteen were recent at the time of review; six older examples were included because they described the desired structure unusually clearly.</p>
      <p>Each item was examined for the goal people wanted to pursue, preferred group size, expected cadence, commitment language, and the failure mode of existing options. Public usernames, outreach notes, internal rankings, and research-system citation markers have intentionally been excluded from this article.</p>

      <h2>The strongest pattern: commitment density</h2>
      <p>Across technical learning, job searching, solo building, writing, and gaming, people repeatedly asked for a small number of reliable peers. Their language was practical: serious, consistent, committed, weekly check-ins, regular communication, and people who actually show up.</p>
      <p>This is better understood as a search for <strong>commitment density</strong> than a search for community size. A large server can contain thousands of relevant people while still making it difficult to know who shares your timeline, schedule, and willingness to participate.</p>

      <blockquote><p>The recurring request is not “give me more people.” It is “help me find the few people who will do this with me.”</p></blockquote>

      <h2>People are already writing the group specification</h2>
      <p>Many requests included enough detail to define a cohort: a specific skill or outcome, a timezone, a recurring meeting rhythm, a preferred number of participants, and a threshold for seriousness. Examples included multiple weekly coding check-ins, Sunday interview practice, weekly chapter targets, and fixed progress reviews for founders.</p>
      <p>That matters because Cohort15 does not need to invent a new social behavior. The product can formalize behavior people already attempt manually: state the goal, make the schedule visible, gather a minimum number of committed people, and begin when the group is viable.</p>

      <h2>Where existing options break down</h2>
      <p>The repeated complaints were not about a lack of content or public communities. They were about follow-through in the social layer:</p>
      <ul>
        <li>one-to-one partners disappear or turn out to be a poor fit;</li>
        <li>large Discord and Slack communities become noisy or passive;</li>
        <li>groups start without a clear cadence or participation threshold;</li>
        <li>time-zone and availability mismatches appear after people join;</li>
        <li>there is no clear moment when interest becomes a real commitment.</li>
      </ul>
      <p>A useful product response is therefore structural, not motivational. The group needs a concrete purpose, public schedule, small scope, and clear start condition.</p>

      <h2>The clearest early use cases</h2>
      <p>Technical learning and career preparation produced the most concentrated evidence. DSA and interview practice, beginner programming, AI project learning, and job-search accountability all combine measurable goals with recurring work. They are natural candidates for short, focused cohorts.</p>
      <p>Founder accountability also showed strong demand, especially around isolation and maintaining momentum. Writing and reliable gaming squads suggest the same structure can travel beyond work and education, but they should be tested rather than assumed to behave identically.</p>

      <h2>What this means for Cohort15</h2>
      <ol>
        <li><strong>Keep groups small and specific.</strong> Relevance and reliability matter more than reach.</li>
        <li><strong>Make cadence visible before joining.</strong> Schedule is part of the match, not an administrative detail.</li>
        <li><strong>Use a clear start condition.</strong> A quorum turns vague interest into an actionable group.</li>
        <li><strong>Favor time-bounded experiments.</strong> A defined run is easier to commit to and evaluate.</li>
        <li><strong>Measure attendance and continuation.</strong> Sign-ups alone cannot validate whether the group is useful.</li>
      </ol>

      <h2>Limitations</h2>
      <p>This was directional demand research, not a representative survey. Public posts overrepresent people comfortable asking online, and Reddit was easier to search than LinkedIn, X, YouTube comments, or private communities. Some examples requested one partner rather than a group, and stated intent does not prove that participants will attend.</p>
      <p>The findings support testing the product thesis; they do not settle group size, matching quality, retention, or willingness to pay. Those questions require live cohort experiments and direct participant feedback.</p>

      <section class="article-cta" aria-labelledby="article-cta-title"><p class="eyebrow">Put the idea to work</p><h2 id="article-cta-title">Make the group you wish existed.</h2><p>Choose a concrete goal, set the schedule and quorum, and let interested people decide with the full commitment in view.</p><div class="button-row"><a class="button-link" href="/cohorts/new">Create a cohort</a><a class="button-link secondary" href="/#cohorts">Browse cohorts</a></div></section>
    </article>
  </main><footer><div class="shell">Cohort15 — small, high-intent online groups.</div></footer>${renderFeedbackWidget()}</body></html>`;
}

export function renderOriginalProductThesisPage({ googleAnalyticsId = 'G-LF22TLDSBV' } = {}) {
  return `${pageStart({
    title: 'Introducing Cohort15: The original product thesis',
    description: 'The founder story and original product thesis behind Cohort15, with an update on what changed in the validation MVP.',
    googleAnalyticsId,
  })}<main class="shell article-shell">
    <a class="text-link" href="/research">← All research &amp; field notes</a>
    <header class="article-header"><p class="eyebrow">Product update</p><h1>Introducing Cohort15: The original product thesis</h1><p class="lede">The founder story, initial product mechanics, and early assumptions behind a place for small groups of high-intent people.</p><div class="article-byline"><span>By Cohort15</span><time datetime="2026-06-20">June 20, 2026</time><span>13 min watch</span></div></header>
    <article class="article-body">
      <section class="video-embed" aria-labelledby="video-title"><h2 class="visually-hidden" id="video-title">Introducing Cohort15 video</h2><iframe src="https://www.youtube-nocookie.com/embed/E5f-qqNILlg?start=4" title="Introducing Cohort15: The original product thesis" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></section>
      <p class="video-link"><a class="text-link" href="${escapeHtml(YOUTUBE_URL)}" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></p>

      <aside class="editorial-note" aria-labelledby="editorial-note-title"><p class="eyebrow">Editorial note</p><h2 id="editorial-note-title">This video captures the original vision.</h2><p>The central thesis remains intact, but several mechanics described in the video—credits, refunds, maximum membership, and automated social publishing—are not part of the current validation MVP. The update below documents that evolution.</p></aside>

      <p class="article-intro">Cohort15 began with a personal experience: learning something difficult became possible after finding a small group of people willing to take the same journey seriously.</p>

      <h2>The problem Cohort15 set out to solve</h2>
      <p>The original idea was an application where people could form cohorts of 15 members or fewer around a specific intention. Learning TypeScript was one example, but the format could also support building, gaming, accountability, or any other journey that benefits from committed peers.</p>
      <p>The important quality was not the subject. It was signal: people who genuinely cared about the same outcome and were willing to contribute time, effort, and consistency.</p>

      <h2>The founder story</h2>
      <p>Without a formal computer-science background, programming initially felt too difficult to begin. Seeing other developers build useful things was inspiring, but also intimidating. The turning point was finding a small group of people attempting the same journey.</p>
      <p>That group did not remove the difficulty. It made taking the first step—and continuing through a long learning process—possible. Cohort15 grew from the belief that more people should have an easier way to find that kind of small, committed group.</p>

      <blockquote><p>Cohort15 should help people publish an intent, gather the right people, and then get out of their way.</p></blockquote>

      <h2>An assembly point, not another community platform</h2>
      <p>One of the earliest product boundaries remains important: Cohort15 is for assembling the group, not keeping it captive. Once enough people come together, they can move to Discord, Google Meet, Slack, or whatever tool suits them.</p>
      <p>The product’s job is to make an intention visible, let interested people commit, and create a clear moment when the group is ready to begin.</p>

      <h2>The original mechanics</h2>
      <p>The first concept used a small credit payment as a filter. Creating a cohort would cost two credits, showing interest would cost one, and credits would be returned if the group failed to reach its target. A successful cohort would unlock a creator-provided meeting link.</p>
      <p>The video also proposed publishing cohort requests across social networks so people could discover relevant groups where they already spent time instead of repeatedly checking another application.</p>

      <h2>What stayed true</h2>
      <ul>
        <li>Groups should form around a concrete goal rather than generic networking.</li>
        <li>Participants should understand the commitment before joining.</li>
        <li>A quorum should turn scattered interest into a group that can begin.</li>
        <li>Cohort15 should assemble people, then let them use their preferred tools.</li>
        <li>The product should be treated as an experiment and public good, not as a claim that every assumption is already correct.</li>
      </ul>

      <h2>What changed in the validation MVP</h2>
      <p>The current version tests the underlying demand before testing monetization or heavier filtering:</p>
      <ul>
        <li><strong>No credits, authentication, or payments.</strong> Creating a cohort and showing interest require only a private email address.</li>
        <li><strong>Quorum instead of maximum membership.</strong> A creator chooses how many interested people are needed, from 1 through 15; interest closes when that threshold is reached.</li>
        <li><strong>The meeting link is supplied at creation.</strong> It remains private until quorum is reached.</li>
        <li><strong>No automated social publishing yet.</strong> Distribution is a separate assumption to test after the core formation flow.</li>
        <li><strong>A seven-day interest window.</strong> Each request has a defined period in which to become viable.</li>
      </ul>
      <p>This smaller product asks a narrower question: will people publish focused group intentions, and will others commit when the goal, schedule, and quorum are visible?</p>

      <h2>Why document the earlier version?</h2>
      <p>Product ideas become more useful when their assumptions remain visible. The video records where Cohort15 started; the validation MVP records what was removed to obtain a clearer test. Future results may support bringing some mechanics back, changing them again, or discarding them permanently.</p>

      <section class="article-cta" aria-labelledby="video-cta-title"><p class="eyebrow">The current experiment</p><h2 id="video-cta-title">See what Cohort15 is testing now.</h2><p>Explore the demand research behind the validation MVP, or publish a focused cohort request of your own.</p><div class="button-row"><a class="button-link" href="/cohorts/new">Create a cohort</a><a class="button-link secondary" href="${ARTICLE_PATH}">Read the research</a></div></section>
    </article>
  </main><footer><div class="shell">Cohort15 — small, high-intent online groups.</div></footer>${renderFeedbackWidget()}</body></html>`;
}

export function renderFormationFieldNotePage({ googleAnalyticsId = 'G-LF22TLDSBV' } = {}) {
  return `${pageStart({
    title: 'How Cohort15 is testing small-group formation',
    description: 'The formation loop and manual experiments guiding the next phase of Cohort15.',
    googleAnalyticsId,
  })}<main class="shell article-shell">
    <a class="text-link" href="/research">← All research &amp; field notes</a>
    <header class="article-header"><p class="eyebrow">Field note</p><h1>How Cohort15 is testing small-group formation</h1><p class="lede">The next phase is not about building a large community. It is about learning whether scattered intent can become a small group that actually starts.</p><div class="article-byline"><span>By Cohort15</span><time datetime="2026-06-20">June 20, 2026</time><span>6 min read</span></div></header>
    <article class="article-body">
      <p class="article-intro">The internet has plenty of places to talk. The harder problem is finding a few people pursuing a similar goal, on a compatible schedule, with enough commitment to keep the group from disappearing after two days.</p>

      <h2>The problem is formation, not community</h2>
      <p>Early research found repeated requests for coding peers, interview-practice partners, job-search check-ins, founder accountability, writing circles, study groups, and reliable gaming squads. Across those use cases, people were rarely asking for another broad community. They wanted a few serious peers who would show up.</p>
      <p>Large communities remain useful for discovery and advice, but membership alone does not create cadence or commitment. Cohort15 is testing the gap between expressing an intention and assembling a group that can begin.</p>

      <blockquote><p>The working question is simple: can scattered intent become a real group?</p></blockquote>

      <h2>What the current product tests</h2>
      <p>The live validation MVP lets anyone publish a focused cohort request with a public goal, schedule, recurrence, and quorum. Interested people respond with a private email address. The meeting link stays private until enough people commit, and each request has seven days to reach that threshold.</p>
      <p>This is deliberately smaller than the original product vision. There is no authentication, payment, credit system, or automated social distribution. The immediate signal is whether someone will propose a group or join one when its commitment is visible—not whether they will like a post or enter a generic waitlist.</p>

      <h2>The formation loop</h2>
      <p>The next experiments follow a short loop:</p>
      <ol>
        <li>Someone expresses a concrete intent.</li>
        <li>That intent becomes a public group request.</li>
        <li>The request reaches people likely to care.</li>
        <li>A few people commit with the schedule and goal in view.</li>
        <li>The group starts, narrows, changes, or expires.</li>
      </ol>
      <p>Failure is useful here. An intent that attracts polite attention but no commitment may be too broad, poorly timed, or simply weak. The product should reveal that rather than manufacture activity.</p>

      <h2>Why the next learning will be manual</h2>
      <p>Public creation is already available, but early distribution and follow-up can remain hands-on. If someone is looking for coding accountability, job-search peers, or an AI learning group, we can carefully test whether that request belongs with an existing cohort or should become a new one.</p>
      <p>Manual work exposes distinctions software can hide: one partner versus a small group, live calls versus asynchronous check-ins, a strict curriculum versus shared momentum, or a broad theme versus a tightly defined outcome. Those answers matter more than automating an unproven routing system.</p>

      <h2>Admin-hosted intents as probes</h2>
      <p>One proposed experiment is for Cohort15 to publish a few simple requests—such as coding accountability, a learning group, or job-search accountability—rather than waiting for every request to originate with a visitor. These would be research probes, not polished cohort products.</p>
      <p>A broad request may attract enough people to reveal the specific group they need. “Coding accountability” might separate into DSA practice, shipping one project, or learning TypeScript. It may also prove that broad intents do not work. Either result would improve the next test. This capability is not part of the current automated product flow; it is a prospective manual experiment.</p>

      <h2>Distribution needs permission</h2>
      <p>Group requests only work when relevant people see them. Early distribution may use direct outreach, email, Cohort15’s own site, or appropriate posts on existing networks. The standard is permission and relevance: people should opt in to hear about topics they care about, not receive indiscriminate promotion.</p>
      <p>Over time, that could become a subscription layer for coding, learning, job-search, or founder requests. For now, the goal is to learn which signals are worth routing before building feeds or notification infrastructure.</p>

      <h2>What success looks like now</h2>
      <p>Success is not thousands of users or a busy content feed. A meaningful early result is helping one small group—often four to eight people—gather around the same intent and begin. Attendance and continuation matter more than raw interest.</p>
      <p>The questions are practical: Do people join? Do they show up? Are broad intents useful, or must requests be specific from the start? Do people want Cohort15 to define the group, or do they prefer to propose their own?</p>

      <h2>What remains open</h2>
      <p>Cohort15 is not assuming the final product is a marketplace, social network, paid commitment system, or highly structured cohort platform. It is not assuming the first niche is already obvious. Those are downstream choices.</p>
      <p>The current job is to find the smallest formation loop that works: one person wants a group, a few matching people find it, enough people commit, and the group starts. We will share what attracts real commitment, what remains too vague, and what changes as those experiments run.</p>

      <section class="article-cta" aria-labelledby="formation-cta-title"><p class="eyebrow">Join the experiment</p><h2 id="formation-cta-title">Put a real intent into the loop.</h2><p>Publish the group you want to form, or browse current requests and decide whether one is worth showing up for.</p><div class="button-row"><a class="button-link" href="/cohorts/new">Create a cohort</a><a class="button-link secondary" href="/#cohorts">Browse cohorts</a></div></section>
    </article>
  </main><footer><div class="shell">Cohort15 — small, high-intent online groups.</div></footer>${renderFeedbackWidget()}</body></html>`;
}

export { ARTICLE_PATH, FORMATION_ARTICLE_PATH, VIDEO_ARTICLE_PATH };
