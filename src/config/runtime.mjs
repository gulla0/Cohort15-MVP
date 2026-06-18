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
  const appUrl = value?.trim() || 'http://localhost:3000';

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

export function loadRuntimeConfig(env = process.env) {
  const appEnv = normalizeAppEnv(env);
  const isProduction = appEnv === 'production';

  return Object.freeze({
    appEnv,
    isProduction,
    appUrl: parseAppUrl(env.COHORT15_LOFI_APP_URL, isProduction),
    host: env.HOST?.trim() || '0.0.0.0',
    port: parsePort(env.PORT),
    googleAnalyticsId: env.COHORT15_LOFI_GA_MEASUREMENT_ID?.trim() || 'G-LF22TLDSBV'
  });
}

export function listRuntimeEnvVars() {
  return Object.freeze([
    'COHORT15_LOFI_APP_ENV',
    'COHORT15_LOFI_APP_URL',
    'COHORT15_LOFI_GA_MEASUREMENT_ID',
    'HOST',
    'NODE_ENV',
    'NODE_VERSION',
    'PORT'
  ]);
}
