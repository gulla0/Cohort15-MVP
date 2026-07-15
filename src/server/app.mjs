import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRuntimeConfig } from '../config/runtime.mjs';
import { createInjectedTestAuth, createSupabaseMagicLinkAuth } from '../auth/supabase.mjs';
import { createSessionService, safeReturnPath } from '../auth/session.mjs';
import { createResendEmailProvider } from '../email/resend.mjs';
import { createStripeClient, StripeProviderError, verifyStripeSignature } from '../payments/stripe.mjs';
import { DomainValidationError } from '../domain/validation.mjs';
import { createLofiStore } from '../persistence/store.mjs';
import {
  createLocalRepositories, InsufficientCreditsError, RepositoryConflictError, RepositoryNotFoundError,
} from '../persistence/repositories.mjs';
import { createSupabasePostgresRepositories } from '../persistence/supabase-postgres.mjs';
import { createCohortService, HoneypotSubmissionError } from '../services/create-cohort.mjs';
import { createEventBrowsingService } from '../services/event-browsing.mjs';
import { createFeedbackService } from '../services/feedback.mjs';
import { createShowInterestService, InterestHoneypotSubmissionError } from '../services/show-interest.mjs';
import { createPurchaseService, PurchaseVerificationError } from '../services/purchases.mjs';
import { createNotificationService } from '../services/notifications.mjs';
import {
  clientIpFromRequest, createRollingWindowLimiter, RateLimitExceededError,
} from '../services/rate-limit.mjs';
import { renderCreateCohortPage } from '../ui/create-cohort.mjs';
import { renderHomePage } from '../ui/home.mjs';
import { renderSignInPage } from '../ui/auth.mjs';
import { renderBuyCreditsPage, renderCheckoutCompletePage } from '../ui/credits.mjs';
import { renderCohortDetailPage } from '../ui/cohorts.mjs';
import { renderCohortSocialImage, renderCohortSocialPng } from '../ui/social-image.mjs';
import {
  ARTICLE_PATH, FORMATION_ARTICLE_PATH, VIDEO_ARTICLE_PATH, renderDemandResearchArticle,
  renderFormationFieldNotePage, renderOriginalProductThesisPage, renderResearchIndexPage,
} from '../ui/research.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CREATE_COHORT_BODY_LIMIT_BYTES = 128 * 1024;
const FEEDBACK_BODY_LIMIT_BYTES = 32 * 1024;
const STRIPE_WEBHOOK_BODY_LIMIT_BYTES = 256 * 1024;

export function createRuntimeRepositories(config, options = {}) {
  if (config.isProduction) {
    return createSupabasePostgresRepositories({
      url: config.supabaseUrl,
      serviceRoleKey: config.supabaseServiceRoleKey,
      fetchImpl: options.fetchImpl,
    });
  }
  return createLocalRepositories({ store: createLofiStore() });
}

function send(res, status, contentType, body, headers = {}) {
  res.writeHead(status, {
    'content-type': contentType,
    'x-content-type-options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

function redirect(res, status, location, headers = {}) {
  res.writeHead(status, { location, 'x-content-type-options': 'nosniff', ...headers });
  res.end();
}

async function readFormBody(req, maximumBytes = 64 * 1024) {
  const contentLength = Number(req.headers?.['content-length']);
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    const error = new Error('Request body too large');
    error.code = 'body_too_large';
    throw error;
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumBytes) {
      const error = new Error('Request body too large');
      error.code = 'body_too_large';
      throw error;
    }
    chunks.push(buffer);
  }
  return Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString('utf8')));
}

async function readJsonBody(req, maximumBytes = 32 * 1024) {
  const contentLength = Number(req.headers?.['content-length']);
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    const error = new Error('Request body too large');
    error.code = 'body_too_large';
    throw error;
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumBytes) {
      const error = new Error('Request body too large');
      error.code = 'body_too_large';
      throw error;
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    const error = new Error('Malformed JSON');
    error.code = 'malformed_json';
    throw error;
  }
}

async function readRawBody(req, maximumBytes) {
  const contentLength = Number(req.headers?.['content-length']);
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    const error = new Error('Request body too large');
    error.code = 'body_too_large';
    throw error;
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumBytes) {
      const error = new Error('Request body too large');
      error.code = 'body_too_large';
      throw error;
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function sameOrigin(req, config) {
  if (!req.headers?.origin) return true;
  let expectedOrigin;
  try { expectedOrigin = new URL(config.appUrl).origin; } catch { expectedOrigin = ''; }
  return req.headers.origin === expectedOrigin;
}

function createValidationMessage(error) {
  const field = error.field === 'firstMeetingAt' ? 'firstMeetingLocal' : error.field;
  const fieldLabels = {
    creatorEmail: 'Creator email', title: 'Title', description: 'Description',
    category: 'Category', topic: 'Topic', targetAudience: 'Target audience',
    targetSkillLevel: 'Target skill level', additionalDetails: 'Additional details',
    minQuorum: 'Minimum quorum', meetingLink: 'Approved meeting link',
    creatorTimeZone: 'Time zone', firstMeetingLocal: 'First meeting date and time',
    meetingDurationMinutes: 'Duration in minutes', recurrence: 'Recurrence',
    meetingCount: 'Total number of sessions',
  };
  const message = error.field === 'firstMeetingAt'
    ? 'First meeting date and time must be more than seven days after submission.'
    : `${fieldLabels[field] ?? 'Submission'} ${error.rule}.`;
  return { field, message };
}

function interestConflictMessage(code) {
  return {
    creator_email: 'The creator email cannot count toward this cohort’s quorum.',
    creator_user: 'You cannot show interest in a cohort you created.',
    duplicate_email: 'This email has already been counted toward this cohort’s quorum.',
    duplicate_user: 'Your account has already been counted toward this cohort’s quorum.',
    expired: 'This cohort’s interest window has closed.',
    already_met: 'This cohort has already reached quorum and is no longer accepting interest.',
  }[code] ?? 'Your interest could not be recorded because the cohort’s state changed. Please review the cohort and try again.';
}

export function createRequestHandler(options = {}) {
  const config = options.config ?? loadRuntimeConfig(options.env ?? process.env);
  const repositories = options.repositories ?? createRuntimeRepositories(config, {
    fetchImpl: options.fetchImpl,
  });
  const creationLimiter = options.creationLimiter ?? createRollingWindowLimiter({
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  const emailProvider = options.emailProvider ?? createResendEmailProvider({ apiKey: config.resendApiKey });
  const notifications = options.notifications ?? createNotificationService({
    repositories, emailProvider, appUrl: config.appUrl, logger: options.logger,
  });
  const cohortCreator = options.cohortCreator ?? createCohortService({
    repositories, limiter: creationLimiter, notifications,
  });
  const eventBrowsing = options.eventBrowsing ?? createEventBrowsingService({ repositories });
  const interestLimiter = options.interestLimiter ?? createRollingWindowLimiter({
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  const feedbackLimiter = options.feedbackLimiter ?? createRollingWindowLimiter({
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  const showInterest = options.showInterest ?? createShowInterestService({
    repositories, limiter: interestLimiter, notifications, logger: options.logger,
  });
  const feedback = options.feedback ?? createFeedbackService({
    repositories, limiter: feedbackLimiter,
  });
  const authProvider = options.authProvider ?? (config.supabaseAnonKey
    ? createSupabaseMagicLinkAuth({
      url: config.supabaseUrl,
      anonKey: config.supabaseAnonKey,
      fetchImpl: options.fetchImpl,
    })
    : createInjectedTestAuth());
  const sessions = options.sessions ?? createSessionService({
    repositories,
    isProduction: config.isProduction,
    now: options.now,
    randomBytes: options.randomBytes,
  });
  const stripe = options.stripe ?? (config.stripeSecretKey
    ? createStripeClient({ secretKey: config.stripeSecretKey, fetchImpl: options.fetchImpl })
    : null);
  const purchases = options.purchases ?? (stripe && config.stripePrice6Credits
    ? createPurchaseService({
      repositories, stripe, priceId: config.stripePrice6Credits, appUrl: config.appUrl,
      randomUUID: options.randomUUID, now: options.now,
    })
    : null);

  async function sendInterestError(res, cohortId, status, error, headers = {}, auth = null) {
    try {
      const cohort = await eventBrowsing.getById(cohortId);
      send(res, status, 'text/html; charset=utf-8', renderCohortDetailPage(cohort, {
        appUrl: config.appUrl, error, googleAnalyticsId: config.googleAnalyticsId, auth,
      }), headers);
    } catch (readError) {
      if (readError instanceof RepositoryNotFoundError) {
        send(res, 404, 'text/plain; charset=utf-8', 'Not found');
      } else {
        send(res, 500, 'text/plain; charset=utf-8', 'We could not load this cohort. Please try again.');
      }
    }
  }

  return async function handleRequest(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';
    let resolvedAuth;
    let authResolved = false;
    async function currentAuth() {
      if (!authResolved) {
        resolvedAuth = await sessions.authenticate(req.headers?.cookie);
        authResolved = true;
      }
      return resolvedAuth;
    }

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

    if (method === 'GET' && url.pathname === '/auth/sign-in') {
      const returnTo = safeReturnPath(url.searchParams.get('return_to') ?? '/');
      send(res, 200, 'text/html; charset=utf-8', renderSignInPage({
        auth: await currentAuth(),
        returnTo,
        requested: url.searchParams.get('requested') === '1',
        error: url.searchParams.get('error') === '1',
      }));
      return;
    }

    if (method === 'POST' && url.pathname === '/auth/magic-link') {
      const mediaType = String(req.headers?.['content-type'] ?? '').split(';')[0].trim().toLowerCase();
      if (mediaType !== 'application/x-www-form-urlencoded') {
        send(res, 415, 'text/plain; charset=utf-8', 'Unsupported media type');
        return;
      }
      if (!sameOrigin(req, config)) {
        send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
        return;
      }
      let returnTo = '/';
      try {
        const input = await readFormBody(req);
        returnTo = safeReturnPath(input.returnTo ?? '/');
        const callback = new URL('/auth/callback', config.appUrl);
        callback.searchParams.set('return_to', returnTo);
        await authProvider.requestMagicLink({ email: input.email, redirectTo: callback.href });
      } catch {
        // The response is intentionally identical for invalid, unknown, and provider-failed requests.
      }
      redirect(res, 303, `/auth/sign-in?requested=1&return_to=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (method === 'GET' && url.pathname === '/auth/callback') {
      const returnTo = safeReturnPath(url.searchParams.get('return_to') ?? '/');
      try {
        const identity = await authProvider.verifyCallback({
          tokenHash: url.searchParams.get('token_hash') ?? '',
          type: url.searchParams.get('type') ?? '',
        });
        const auth = await sessions.create(identity);
        redirect(res, 303, returnTo, { 'set-cookie': auth.cookie });
      } catch {
        redirect(res, 303, `/auth/sign-in?error=1&return_to=${encodeURIComponent(returnTo)}`);
      }
      return;
    }

    if (method === 'POST' && url.pathname === '/auth/sign-out') {
      const mediaType = String(req.headers?.['content-type'] ?? '').split(';')[0].trim().toLowerCase();
      if (mediaType !== 'application/x-www-form-urlencoded') {
        send(res, 415, 'text/plain; charset=utf-8', 'Unsupported media type');
        return;
      }
      if (!sameOrigin(req, config)) {
        send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
        return;
      }
      const auth = await currentAuth();
      if (!auth) {
        send(res, 401, 'text/plain; charset=utf-8', 'Authentication required');
        return;
      }
      let input;
      try { input = await readFormBody(req); } catch {
        send(res, 400, 'text/plain; charset=utf-8', 'Invalid request');
        return;
      }
      if (!sessions.verifyCsrf(auth, input.csrf)) {
        send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
        return;
      }
      await sessions.destroy(req.headers?.cookie);
      redirect(res, 303, '/', { 'set-cookie': sessions.clearCookie() });
      return;
    }

    if (method === 'GET' && url.pathname === '/credits/buy') {
      const returnTo = safeReturnPath(url.searchParams.get('return_to') ?? '/');
      send(res, 200, 'text/html; charset=utf-8', renderBuyCreditsPage({
        auth: await currentAuth(), cancelled: url.searchParams.get('cancelled') === '1', returnTo,
      }));
      return;
    }

    if (method === 'POST' && url.pathname === '/credits/checkout') {
      const mediaType = String(req.headers?.['content-type'] ?? '').split(';')[0].trim().toLowerCase();
      if (mediaType !== 'application/x-www-form-urlencoded') {
        send(res, 415, 'text/plain; charset=utf-8', 'Unsupported media type');
        return;
      }
      if (!sameOrigin(req, config)) {
        send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
        return;
      }
      const auth = await currentAuth();
      if (!auth) {
        send(res, 401, 'text/plain; charset=utf-8', 'Authentication required');
        return;
      }
      try {
        const input = await readFormBody(req);
        if (!sessions.verifyCsrf(auth, input.csrf)) {
          send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
          return;
        }
        if (!purchases) throw new StripeProviderError('payments_unavailable');
        const checkout = await purchases.startCheckout(auth.user, safeReturnPath(input.returnTo ?? '/'));
        redirect(res, 303, checkout.checkoutUrl);
      } catch {
        send(res, 502, 'text/html; charset=utf-8', renderBuyCreditsPage({ auth }));
      }
      return;
    }

    if (method === 'GET' && url.pathname === '/credits/checkout/complete') {
      const auth = await currentAuth();
      const returnTo = safeReturnPath(url.searchParams.get('return_to') ?? '/');
      if (!auth) {
        redirect(res, 303, `/auth/sign-in?return_to=${encodeURIComponent(url.pathname + url.search)}`);
        return;
      }
      let state = 'failure';
      try {
        if (!purchases) throw new StripeProviderError('payments_unavailable');
        await purchases.reconcileSession(url.searchParams.get('session_id') ?? '', auth.user.id);
        state = 'paid';
      } catch (error) {
        if (error instanceof PurchaseVerificationError && error.code === 'session_not_paid_or_mismatched') state = 'pending';
      }
      const refreshed = await sessions.authenticate(req.headers?.cookie);
      send(res, state === 'failure' ? 400 : 200, 'text/html; charset=utf-8', renderCheckoutCompletePage({
        auth: refreshed ?? auth, state, returnTo,
      }));
      return;
    }

    if (method === 'POST' && url.pathname === '/webhooks/stripe') {
      try {
        const rawBody = await readRawBody(req, STRIPE_WEBHOOK_BODY_LIMIT_BYTES);
        verifyStripeSignature(rawBody, req.headers?.['stripe-signature'], config.stripeWebhookSecret, { now: options.now?.() });
        const event = JSON.parse(rawBody.toString('utf8'));
        if (!purchases) throw new StripeProviderError('payments_unavailable');
        await purchases.handleEvent(event);
        send(res, 200, 'application/json; charset=utf-8', JSON.stringify({ received: true }));
      } catch (error) {
        if (error?.code === 'body_too_large') send(res, 413, 'text/plain; charset=utf-8', 'Payload too large');
        else if (error instanceof StripeProviderError && error.code === 'invalid_signature') send(res, 400, 'text/plain; charset=utf-8', 'Invalid signature');
        else if (error instanceof SyntaxError || (error instanceof PurchaseVerificationError && error.code === 'invalid_event')) send(res, 400, 'text/plain; charset=utf-8', 'Invalid event');
        else if (error instanceof PurchaseVerificationError) send(res, 200, 'application/json; charset=utf-8', JSON.stringify({ received: true }));
        else send(res, 500, 'text/plain; charset=utf-8', 'Webhook processing failed');
      }
      return;
    }

    if (method === 'GET' && url.pathname === '/') {
      const listing = await eventBrowsing.list({ status: url.searchParams.get('status') ?? 'all' });
      send(res, 200, 'text/html; charset=utf-8', renderHomePage({
        googleAnalyticsId: config.googleAnalyticsId,
        cohorts: listing.cohorts,
        status: listing.status,
        auth: await currentAuth(),
      }));
      return;
    }

    if (method === 'GET' && url.pathname === '/research') {
      send(res, 200, 'text/html; charset=utf-8', renderResearchIndexPage({
        googleAnalyticsId: config.googleAnalyticsId,
        auth: await currentAuth(),
      }));
      return;
    }

    if (method === 'GET' && url.pathname === ARTICLE_PATH) {
      send(res, 200, 'text/html; charset=utf-8', renderDemandResearchArticle({
        googleAnalyticsId: config.googleAnalyticsId,
        auth: await currentAuth(),
      }));
      return;
    }

    if (method === 'GET' && url.pathname === VIDEO_ARTICLE_PATH) {
      send(res, 200, 'text/html; charset=utf-8', renderOriginalProductThesisPage({
        googleAnalyticsId: config.googleAnalyticsId,
        auth: await currentAuth(),
      }));
      return;
    }

    if (method === 'GET' && url.pathname === FORMATION_ARTICLE_PATH) {
      send(res, 200, 'text/html; charset=utf-8', renderFormationFieldNotePage({
        googleAnalyticsId: config.googleAnalyticsId,
        auth: await currentAuth(),
      }));
      return;
    }

    if (method === 'GET' && url.pathname === '/cohorts') {
      redirect(res, 302, '/');
      return;
    }

    if (method === 'GET' && url.pathname === '/cohorts/new') {
      const auth = await currentAuth();
      if (!auth) {
        redirect(res, 303, '/auth/sign-in?return_to=%2Fcohorts%2Fnew');
        return;
      }
      send(res, 200, 'text/html; charset=utf-8', renderCreateCohortPage({ auth }));
      return;
    }

    const detailMatch = method === 'GET' ? /^\/cohorts\/([^/]+)$/u.exec(url.pathname) : null;
    if (detailMatch) {
      try {
        const cohort = await eventBrowsing.getById(decodeURIComponent(detailMatch[1]));
        send(res, 200, 'text/html; charset=utf-8', renderCohortDetailPage(cohort, {
          appUrl: config.appUrl,
          googleAnalyticsId: config.googleAnalyticsId,
          auth: await currentAuth(),
        }));
      } catch (error) {
        if (error instanceof RepositoryNotFoundError) send(res, 404, 'text/plain; charset=utf-8', 'Not found');
        else throw error;
      }
      return;
    }

    const socialImageMatch = method === 'GET' ? /^\/cohorts\/([^/]+)\/social-image\.png$/u.exec(url.pathname) : null;
    if (socialImageMatch) {
      try {
        const cohort = await eventBrowsing.getById(decodeURIComponent(socialImageMatch[1]));
        send(res, 200, 'image/png', await renderCohortSocialPng(cohort), {
          'cache-control': 'public, max-age=300',
        });
      } catch (error) {
        if (error instanceof RepositoryNotFoundError) send(res, 404, 'text/plain; charset=utf-8', 'Not found');
        else throw error;
      }
      return;
    }

    const socialSvgMatch = method === 'GET' ? /^\/cohorts\/([^/]+)\/social-image\.svg$/u.exec(url.pathname) : null;
    if (socialSvgMatch) {
      try {
        const cohort = await eventBrowsing.getById(decodeURIComponent(socialSvgMatch[1]));
        send(res, 200, 'image/svg+xml; charset=utf-8', renderCohortSocialImage(cohort), {
          'cache-control': 'public, max-age=300',
        });
      } catch (error) {
        if (error instanceof RepositoryNotFoundError) send(res, 404, 'text/plain; charset=utf-8', 'Not found');
        else throw error;
      }
      return;
    }

    if (method === 'POST' && url.pathname === '/cohorts') {
      const mediaType = String(req.headers?.['content-type'] ?? '').split(';')[0].trim().toLowerCase();
      if (mediaType !== 'application/x-www-form-urlencoded') {
        send(res, 415, 'text/plain; charset=utf-8', 'Unsupported media type');
        return;
      }
      if (!sameOrigin(req, config)) {
        send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
        return;
      }

      const auth = await currentAuth();
      if (!auth) {
        send(res, 401, 'text/plain; charset=utf-8', 'Authentication required');
        return;
      }

      let input = {};
      try {
        input = await readFormBody(req, CREATE_COHORT_BODY_LIMIT_BYTES);
        if (!sessions.verifyCsrf(auth, input.csrf)) {
          send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
          return;
        }
        delete input.csrf;
        const cohort = await cohortCreator.create(input, {
          clientIp: clientIpFromRequest(req, config),
          actor: { userId: auth.user.id, email: auth.user.email },
        });
        redirect(res, 303, `/cohorts/${encodeURIComponent(cohort.id)}`);
      } catch (error) {
        if (error?.code === 'body_too_large') {
          send(res, 413, 'text/html; charset=utf-8', renderCreateCohortPage({
            auth,
            error: {
              field: '',
              message: 'This submission is too large. Shorten the entered text and try again.',
              preserveValues: false,
            },
          }));
        } else if (error instanceof RateLimitExceededError) {
          send(res, 429, 'text/html; charset=utf-8', renderCreateCohortPage({
            auth,
            error: {
              field: '',
              message: 'Too many cohorts have been created from this connection. Please wait and try again.',
            },
            values: input,
          }), {
            'retry-after': String(error.retryAfterSeconds),
          });
        } else if (error instanceof InsufficientCreditsError) {
          send(res, 402, 'text/html; charset=utf-8', renderCreateCohortPage({
            auth: { ...auth, balance: error.balance },
            error: {
              code: 'insufficient_credits', field: '',
              message: `Creating a cohort costs 2 credits. You have ${error.balance.available} available.`,
            }, values: input,
          }));
        } else if (error instanceof RepositoryConflictError) {
          send(res, 409, 'text/html; charset=utf-8', renderCreateCohortPage({
            auth,
            error: {
              field: '',
              message: 'The cohort could not be created because of a temporary conflict. Please resubmit.',
            },
            values: input,
          }));
        } else if (error instanceof DomainValidationError) {
          send(res, 400, 'text/html; charset=utf-8', renderCreateCohortPage({
            auth,
            error: createValidationMessage(error),
            values: input,
          }));
        } else if (error instanceof HoneypotSubmissionError) {
          send(res, 400, 'text/html; charset=utf-8', renderCreateCohortPage({
            auth,
            error: {
              field: '', message: 'Please check your submission and try again.', preserveValues: false,
            },
          }));
        } else {
          send(res, 500, 'text/html; charset=utf-8', renderCreateCohortPage({
            auth,
            error: {
              field: '',
              message: 'We could not create the cohort right now. Your entries are safe to resubmit.',
            },
            values: input,
          }));
        }
      }
      return;
    }

    const interestMatch = method === 'POST' ? /^\/cohorts\/([^/]+)\/interests$/u.exec(url.pathname) : null;
    if (interestMatch) {
      const cohortId = decodeURIComponent(interestMatch[1]);
      const mediaType = String(req.headers?.['content-type'] ?? '').split(';')[0].trim().toLowerCase();
      if (mediaType !== 'application/x-www-form-urlencoded') {
        send(res, 415, 'text/plain; charset=utf-8', 'Unsupported media type');
        return;
      }
      if (!sameOrigin(req, config)) {
        send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
        return;
      }

      const auth = await currentAuth();
      if (!auth) {
        send(res, 401, 'text/plain; charset=utf-8', 'Authentication required');
        return;
      }

      try {
        const input = await readFormBody(req);
        if (!sessions.verifyCsrf(auth, input.csrf)) {
          send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
          return;
        }
        delete input.csrf;
        await showInterest.show(cohortId, input, {
          clientIp: clientIpFromRequest(req, config),
          actor: { userId: auth.user.id, email: auth.user.email },
        });
        redirect(res, 303, `/cohorts/${encodeURIComponent(cohortId)}`);
      } catch (error) {
        if (error?.code === 'body_too_large') {
          await sendInterestError(res, cohortId, 413, {
            field: '', message: 'This submission is too large. Please try again.',
          }, {}, auth);
        } else if (error instanceof RateLimitExceededError) {
          await sendInterestError(res, cohortId, 429, {
            field: '',
            message: 'Too many interests have been submitted from this connection. Please wait and try again.',
          }, {
            'retry-after': String(error.retryAfterSeconds),
          }, auth);
        } else if (error instanceof RepositoryNotFoundError) {
          send(res, 404, 'text/plain; charset=utf-8', 'Not found');
        } else if (error instanceof InsufficientCreditsError) {
          await sendInterestError(res, cohortId, 402, {
            code: 'insufficient_credits', field: '',
            message: `Showing interest costs 1 credit. You have ${error.balance.available} available.`,
          }, {}, { ...auth, balance: error.balance });
        } else if (error instanceof RepositoryConflictError) {
          await sendInterestError(res, cohortId, 409, {
            field: '', message: interestConflictMessage(error.code),
          }, {}, auth);
        } else if (error instanceof DomainValidationError || error instanceof InterestHoneypotSubmissionError) {
          const validationError = error instanceof DomainValidationError
            ? {
              field: '', message: 'Please check your submission and try again.',
            }
            : { field: '', message: 'Please check your submission and try again.' };
          await sendInterestError(res, cohortId, 400, validationError, {}, auth);
        } else {
          await sendInterestError(res, cohortId, 500, {
            field: '', message: 'We could not record your interest right now. Please try again.',
          }, {}, auth);
        }
      }
      return;
    }

    if (method === 'POST' && url.pathname === '/feedback') {
      const mediaType = String(req.headers?.['content-type'] ?? '').split(';')[0].trim().toLowerCase();
      if (mediaType !== 'application/json') {
        send(res, 415, 'application/json; charset=utf-8', JSON.stringify({ ok: false, error: 'unsupported_media_type' }));
        return;
      }
      if (!sameOrigin(req, config)) {
        send(res, 403, 'application/json; charset=utf-8', JSON.stringify({ ok: false, error: 'forbidden' }));
        return;
      }
      try {
        const input = await readJsonBody(req, FEEDBACK_BODY_LIMIT_BYTES);
        const saved = await feedback.submit(input, { clientIp: clientIpFromRequest(req, config) });
        send(res, 200, 'application/json; charset=utf-8', JSON.stringify({
          ok: true,
          id: saved.id,
          completionState: saved.completionState,
        }));
      } catch (error) {
        if (error?.code === 'body_too_large') {
          send(res, 413, 'application/json; charset=utf-8', JSON.stringify({ ok: false, error: 'body_too_large' }));
        } else if (error?.code === 'malformed_json') {
          send(res, 400, 'application/json; charset=utf-8', JSON.stringify({ ok: false, error: 'malformed_json' }));
        } else if (error instanceof RateLimitExceededError) {
          send(res, 429, 'application/json; charset=utf-8', JSON.stringify({ ok: false, error: 'rate_limited' }), {
            'retry-after': String(error.retryAfterSeconds),
          });
        } else if (error instanceof DomainValidationError) {
          send(res, 400, 'application/json; charset=utf-8', JSON.stringify({
            ok: false,
            error: 'validation_error',
            field: error.field,
          }));
        } else {
          send(res, 500, 'application/json; charset=utf-8', JSON.stringify({ ok: false, error: 'server_error' }));
        }
      }
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
