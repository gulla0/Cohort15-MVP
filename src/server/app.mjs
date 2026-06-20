import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRuntimeConfig } from '../config/runtime.mjs';
import { createResendEmailProvider } from '../email/resend.mjs';
import { DomainValidationError } from '../domain/validation.mjs';
import { createLofiStore } from '../persistence/store.mjs';
import {
  createLocalRepositories, RepositoryConflictError, RepositoryNotFoundError,
} from '../persistence/repositories.mjs';
import { createSupabasePostgresRepositories } from '../persistence/supabase-postgres.mjs';
import { createCohortService, HoneypotSubmissionError } from '../services/create-cohort.mjs';
import { createEventBrowsingService } from '../services/event-browsing.mjs';
import { createShowInterestService, InterestHoneypotSubmissionError } from '../services/show-interest.mjs';
import { createNotificationService } from '../services/notifications.mjs';
import {
  clientIpFromRequest, createRollingWindowLimiter, RateLimitExceededError,
} from '../services/rate-limit.mjs';
import { renderCreateCohortPage } from '../ui/create-cohort.mjs';
import { renderHomePage } from '../ui/home.mjs';
import { renderCohortDetailPage } from '../ui/cohorts.mjs';
import {
  ARTICLE_PATH, FORMATION_ARTICLE_PATH, VIDEO_ARTICLE_PATH, renderDemandResearchArticle,
  renderFormationFieldNotePage, renderOriginalProductThesisPage, renderResearchIndexPage,
} from '../ui/research.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

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

function redirect(res, status, location) {
  res.writeHead(status, { location, 'x-content-type-options': 'nosniff' });
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
    duplicate_email: 'This email has already been counted toward this cohort’s quorum.',
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
  const showInterest = options.showInterest ?? createShowInterestService({
    repositories, limiter: interestLimiter, notifications, logger: options.logger,
  });

  async function sendInterestError(res, cohortId, status, error, headers = {}) {
    try {
      const cohort = await eventBrowsing.getById(cohortId);
      send(res, status, 'text/html; charset=utf-8', renderCohortDetailPage(cohort, {
        error, googleAnalyticsId: config.googleAnalyticsId,
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
      const listing = await eventBrowsing.list({ status: url.searchParams.get('status') ?? 'all' });
      send(res, 200, 'text/html; charset=utf-8', renderHomePage({
        googleAnalyticsId: config.googleAnalyticsId,
        cohorts: listing.cohorts,
        status: listing.status,
      }));
      return;
    }

    if (method === 'GET' && url.pathname === '/research') {
      send(res, 200, 'text/html; charset=utf-8', renderResearchIndexPage({
        googleAnalyticsId: config.googleAnalyticsId,
      }));
      return;
    }

    if (method === 'GET' && url.pathname === ARTICLE_PATH) {
      send(res, 200, 'text/html; charset=utf-8', renderDemandResearchArticle({
        googleAnalyticsId: config.googleAnalyticsId,
      }));
      return;
    }

    if (method === 'GET' && url.pathname === VIDEO_ARTICLE_PATH) {
      send(res, 200, 'text/html; charset=utf-8', renderOriginalProductThesisPage({
        googleAnalyticsId: config.googleAnalyticsId,
      }));
      return;
    }

    if (method === 'GET' && url.pathname === FORMATION_ARTICLE_PATH) {
      send(res, 200, 'text/html; charset=utf-8', renderFormationFieldNotePage({
        googleAnalyticsId: config.googleAnalyticsId,
      }));
      return;
    }

    if (method === 'GET' && url.pathname === '/cohorts') {
      redirect(res, 302, '/');
      return;
    }

    if (method === 'GET' && url.pathname === '/cohorts/new') {
      send(res, 200, 'text/html; charset=utf-8', renderCreateCohortPage());
      return;
    }

    const detailMatch = method === 'GET' ? /^\/cohorts\/([^/]+)$/u.exec(url.pathname) : null;
    if (detailMatch) {
      try {
        const cohort = await eventBrowsing.getById(decodeURIComponent(detailMatch[1]));
        send(res, 200, 'text/html; charset=utf-8', renderCohortDetailPage(cohort, {
          googleAnalyticsId: config.googleAnalyticsId,
        }));
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
      if (req.headers?.origin) {
        let expectedOrigin;
        try { expectedOrigin = new URL(config.appUrl).origin; } catch { expectedOrigin = ''; }
        if (req.headers.origin !== expectedOrigin) {
          send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
          return;
        }
      }

      let input = {};
      try {
        input = await readFormBody(req);
        const cohort = await cohortCreator.create(input, {
          clientIp: clientIpFromRequest(req, config),
        });
        redirect(res, 303, `/cohorts/${encodeURIComponent(cohort.id)}`);
      } catch (error) {
        if (error?.code === 'body_too_large') {
          send(res, 413, 'text/html; charset=utf-8', renderCreateCohortPage({
            error: {
              field: '',
              message: 'This submission is too large. Shorten the entered text and try again.',
              preserveValues: false,
            },
          }));
        } else if (error instanceof RateLimitExceededError) {
          send(res, 429, 'text/html; charset=utf-8', renderCreateCohortPage({
            error: {
              field: '',
              message: 'Too many cohorts have been created from this connection. Please wait and try again.',
            },
            values: input,
          }), {
            'retry-after': String(error.retryAfterSeconds),
          });
        } else if (error instanceof RepositoryConflictError) {
          send(res, 409, 'text/html; charset=utf-8', renderCreateCohortPage({
            error: {
              field: '',
              message: 'The cohort could not be created because of a temporary conflict. Please resubmit.',
            },
            values: input,
          }));
        } else if (error instanceof DomainValidationError) {
          send(res, 400, 'text/html; charset=utf-8', renderCreateCohortPage({
            error: createValidationMessage(error),
            values: input,
          }));
        } else if (error instanceof HoneypotSubmissionError) {
          send(res, 400, 'text/html; charset=utf-8', renderCreateCohortPage({
            error: {
              field: '', message: 'Please check your submission and try again.', preserveValues: false,
            },
          }));
        } else {
          send(res, 500, 'text/html; charset=utf-8', renderCreateCohortPage({
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
      if (req.headers?.origin) {
        let expectedOrigin;
        try { expectedOrigin = new URL(config.appUrl).origin; } catch { expectedOrigin = ''; }
        if (req.headers.origin !== expectedOrigin) {
          send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
          return;
        }
      }

      try {
        const input = await readFormBody(req);
        await showInterest.show(cohortId, input, { clientIp: clientIpFromRequest(req, config) });
        redirect(res, 303, `/cohorts/${encodeURIComponent(cohortId)}`);
      } catch (error) {
        if (error?.code === 'body_too_large') {
          await sendInterestError(res, cohortId, 413, {
            field: '', message: 'This submission is too large. Enter only your email and try again.',
          });
        } else if (error instanceof RateLimitExceededError) {
          await sendInterestError(res, cohortId, 429, {
            field: '',
            message: 'Too many interests have been submitted from this connection. Please wait and try again.',
          }, {
            'retry-after': String(error.retryAfterSeconds),
          });
        } else if (error instanceof RepositoryNotFoundError) {
          send(res, 404, 'text/plain; charset=utf-8', 'Not found');
        } else if (error instanceof RepositoryConflictError) {
          await sendInterestError(res, cohortId, 409, {
            field: 'email', message: interestConflictMessage(error.code),
          });
        } else if (error instanceof DomainValidationError || error instanceof InterestHoneypotSubmissionError) {
          const validationError = error instanceof DomainValidationError
            ? {
              field: error.field === 'email' ? 'email' : '',
              message: error.field === 'email'
                ? `Email ${error.rule}.`
                : 'Please check your submission and try again.',
            }
            : { field: '', message: 'Please check your submission and try again.' };
          await sendInterestError(res, cohortId, 400, validationError);
        } else {
          await sendInterestError(res, cohortId, 500, {
            field: '', message: 'We could not record your interest right now. Please try again.',
          });
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
