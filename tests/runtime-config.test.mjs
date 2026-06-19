import test from 'node:test';
import assert from 'node:assert/strict';
import { listRuntimeEnvVars, loadRuntimeConfig } from '../src/config/runtime.mjs';
import { createRuntimeRepositories } from '../src/server/app.mjs';

const productionEnv = Object.freeze({
  COHORT15_LOFI_APP_ENV: 'production',
  COHORT15_LOFI_APP_URL: 'https://cohort15.com',
  COHORT15_LOFI_GA_MEASUREMENT_ID: 'G-LF22TLDSBV',
  COHORT15_LOFI_SUPABASE_URL: 'https://lofi-project.supabase.co',
  COHORT15_LOFI_SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  COHORT15_LOFI_RESEND_API_KEY: 'test-resend-key',
  COHORT15_LOFI_EMAIL_FROM: 'Cohort15 <updates@cohort15.com>',
  COHORT15_LOFI_EMAIL_REPLY_TO: 'cohort15dotcom@gmail.com',
});

test('lofi runtime defaults to a local dependency-free shell', () => {
  const config = loadRuntimeConfig({});

  assert.equal(config.appEnv, 'development');
  assert.equal(config.appUrl, 'http://localhost:3000');
  assert.equal(config.host, '0.0.0.0');
  assert.equal(config.port, 3000);
  assert.equal(config.googleAnalyticsId, 'G-LF22TLDSBV');
});

test('production shell requires an https app URL', () => {
  assert.throws(
    () => loadRuntimeConfig({
      COHORT15_LOFI_APP_ENV: 'production',
      ...productionEnv,
      COHORT15_LOFI_APP_URL: 'http://cohort15.com',
    }),
    /must use https/
  );

  assert.equal(loadRuntimeConfig(productionEnv).isProduction, true);
});

test('production requires the complete isolated lofi environment contract', () => {
  for (const name of [
    'COHORT15_LOFI_APP_URL',
    'COHORT15_LOFI_GA_MEASUREMENT_ID',
    'COHORT15_LOFI_SUPABASE_URL',
    'COHORT15_LOFI_SUPABASE_SERVICE_ROLE_KEY',
    'COHORT15_LOFI_RESEND_API_KEY',
    'COHORT15_LOFI_EMAIL_FROM',
    'COHORT15_LOFI_EMAIL_REPLY_TO',
  ]) {
    const env = { ...productionEnv };
    delete env[name];
    assert.throws(() => loadRuntimeConfig(env), new RegExp(`${name} is required`));
  }
});

test('production rejects sender settings that disagree with the fixed email policy', () => {
  assert.throws(
    () => loadRuntimeConfig({
      ...productionEnv,
      COHORT15_LOFI_EMAIL_FROM: 'Other <other@example.com>',
    }),
    /COHORT15_LOFI_EMAIL_FROM must be Cohort15/,
  );
  assert.throws(
    () => loadRuntimeConfig({
      ...productionEnv,
      COHORT15_LOFI_EMAIL_REPLY_TO: 'other@example.com',
    }),
    /COHORT15_LOFI_EMAIL_REPLY_TO must be cohort15dotcom@gmail.com/,
  );
});

test('production repositories use the configured lofi Supabase project', async () => {
  const requests = [];
  const config = loadRuntimeConfig(productionEnv);
  const repositories = createRuntimeRepositories(config, {
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return new Response('[]', { status: 200 });
    },
  });

  await repositories.listCohorts();

  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /^https:\/\/lofi-project\.supabase\.co\/rest\/v1\/cohort15_lofi_cohorts/u);
  assert.equal(requests[0].options.headers.apikey, 'test-service-role-key');
});

test('runtime environment contract contains no legacy provider variables', () => {
  const names = listRuntimeEnvVars();
  assert.ok(names.includes('COHORT15_LOFI_APP_URL'));
  assert.ok(names.includes('COHORT15_LOFI_GA_MEASUREMENT_ID'));
  assert.ok(names.includes('COHORT15_LOFI_SUPABASE_URL'));
  assert.ok(names.includes('COHORT15_LOFI_SUPABASE_SERVICE_ROLE_KEY'));
  assert.ok(names.includes('COHORT15_LOFI_RESEND_API_KEY'));
  assert.ok(names.includes('COHORT15_LOFI_EMAIL_FROM'));
  assert.ok(names.includes('COHORT15_LOFI_EMAIL_REPLY_TO'));
  assert.equal(names.some((name) => /AUTH|STRIPE|CREDIT|SOCIAL|UPLOAD/.test(name)), false);
});
