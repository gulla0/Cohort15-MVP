const APP_ENV_VALUES = new Set(['development', 'test', 'production']);

function normalizeAppEnv(env) {
  const value = (env.COHORT15_LOFI_APP_ENV ?? env.NODE_ENV ?? 'development')
    .trim()
    .toLowerCase();

  if (!APP_ENV_VALUES.has(value)) {
    throw new Error('COHORT15_LOFI_APP_ENV must be development, test, or production.');
  }

  return value;
}

function parsePort(value) {
  const port = Number.parseInt(value ?? '3000', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  return port;
}

function parseAppUrl(value, isProduction) {
  const appUrl = requiredProductionValue(
    value,
    'COHORT15_LOFI_APP_URL',
    isProduction,
    isProduction ? '' : 'http://localhost:3000',
  );

  let parsed;
  try {
    parsed = new URL(appUrl);
  } catch {
    throw new Error('COHORT15_LOFI_APP_URL must be a valid URL.');
  }

  if (isProduction && parsed.protocol !== 'https:') {
    throw new Error('COHORT15_LOFI_APP_URL must use https in production.');
  }

  return appUrl.replace(/\/$/, '');
}

function requiredProductionValue(value, name, isProduction, fallback = '') {
  const normalized = value?.trim() || fallback;
  if (isProduction && !normalized) {
    throw new Error(`${name} is required in production.`);
  }
  return normalized;
}

function parseSupabaseUrl(value, isProduction) {
  const url = requiredProductionValue(
    value,
    'COHORT15_LOFI_SUPABASE_URL',
    isProduction,
  );
  if (!url) return '';

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('COHORT15_LOFI_SUPABASE_URL must be a valid URL.');
  }
  if (isProduction && parsed.protocol !== 'https:') {
    throw new Error('COHORT15_LOFI_SUPABASE_URL must use https in production.');
  }
  return url.replace(/\/$/, '');
}

function fixedEmailValue(value, name, expected, isProduction) {
  const configured = requiredProductionValue(
    value,
    name,
    isProduction,
    isProduction ? '' : expected,
  );
  if (configured && configured !== expected) {
    throw new Error(`${name} must be ${expected}.`);
  }
  return configured;
}

export function loadRuntimeConfig(env = process.env) {
  const appEnv = normalizeAppEnv(env);
  const isProduction = appEnv === 'production';

  return Object.freeze({
    appEnv,
    isProduction,
    appUrl: parseAppUrl(env.COHORT15_LOFI_APP_URL, isProduction),
    host: env.HOST?.trim() || '0.0.0.0',
    port: parsePort(env.PORT),
    googleAnalyticsId: requiredProductionValue(
      env.COHORT15_LOFI_GA_MEASUREMENT_ID,
      'COHORT15_LOFI_GA_MEASUREMENT_ID',
      isProduction,
      isProduction ? '' : 'G-LF22TLDSBV',
    ),
    supabaseUrl: parseSupabaseUrl(env.COHORT15_LOFI_SUPABASE_URL, isProduction),
    supabaseServiceRoleKey: requiredProductionValue(
      env.COHORT15_LOFI_SUPABASE_SERVICE_ROLE_KEY,
      'COHORT15_LOFI_SUPABASE_SERVICE_ROLE_KEY',
      isProduction,
    ),
    resendApiKey: requiredProductionValue(
      env.COHORT15_LOFI_RESEND_API_KEY,
      'COHORT15_LOFI_RESEND_API_KEY',
      isProduction,
    ),
    emailFrom: fixedEmailValue(
      env.COHORT15_LOFI_EMAIL_FROM,
      'COHORT15_LOFI_EMAIL_FROM',
      'Cohort15 <updates@cohort15.com>',
      isProduction,
    ),
    emailReplyTo: fixedEmailValue(
      env.COHORT15_LOFI_EMAIL_REPLY_TO,
      'COHORT15_LOFI_EMAIL_REPLY_TO',
      'cohort15dotcom@gmail.com',
      isProduction,
    ),
  });
}

export function listRuntimeEnvVars() {
  return Object.freeze([
    'COHORT15_LOFI_APP_ENV',
    'COHORT15_LOFI_APP_URL',
    'COHORT15_LOFI_GA_MEASUREMENT_ID',
    'COHORT15_LOFI_SUPABASE_URL',
    'COHORT15_LOFI_SUPABASE_SERVICE_ROLE_KEY',
    'COHORT15_LOFI_RESEND_API_KEY',
    'COHORT15_LOFI_EMAIL_FROM',
    'COHORT15_LOFI_EMAIL_REPLY_TO',
    'HOST',
    'NODE_ENV',
    'NODE_VERSION',
    'PORT'
  ]);
}
