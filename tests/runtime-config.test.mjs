import test from 'node:test';
import assert from 'node:assert/strict';
import { listRuntimeEnvVars, loadRuntimeConfig } from '../src/config/runtime.mjs';

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
      COHORT15_LOFI_APP_URL: 'http://cohort15.com'
    }),
    /must use https/
  );

  assert.equal(loadRuntimeConfig({
    COHORT15_LOFI_APP_ENV: 'production',
    COHORT15_LOFI_APP_URL: 'https://cohort15.com'
  }).isProduction, true);
});

test('runtime environment contract contains no legacy provider variables', () => {
  const names = listRuntimeEnvVars();
  assert.ok(names.includes('COHORT15_LOFI_APP_URL'));
  assert.ok(names.includes('COHORT15_LOFI_GA_MEASUREMENT_ID'));
  assert.equal(names.some((name) => /AUTH|STRIPE|CREDIT|SOCIAL|UPLOAD/.test(name)), false);
});
