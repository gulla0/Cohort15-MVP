import assert from 'node:assert/strict';
import test from 'node:test';
import { listRuntimeEnvVars, loadRuntimeConfig } from '../src/config/runtime.mjs';

function validProductionEnv(overrides = {}) {
  return {
    COHORT15_APP_ENV: 'production',
    COHORT15_APP_URL: 'https://cohort15-mvp.onrender.com',
    COHORT15_SESSION_SECRET: 'a-production-session-secret-at-least-32-chars',
    COHORT15_ADMIN_EMAILS: 'admin@example.com',
    COHORT15_UPLOAD_MODE: 'disabled',
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    STRIPE_SECRET_KEY: 'sk_live_example',
    STRIPE_WEBHOOK_SECRET: 'whsec_example',
    STRIPE_PRICE_6_CREDITS: 'price_6',
    STRIPE_PRICE_14_CREDITS: 'price_14',
    LINKEDIN_CLIENT_ID: 'linkedin-client-id',
    LINKEDIN_CLIENT_SECRET: 'linkedin-client-secret',
    X_API_KEY: 'x-api-key',
    X_API_SECRET: 'x-api-secret',
    EMAIL_PROVIDER_API_KEY: 'email-api-key',
    EMAIL_FROM_ADDRESS: 'hello@cohort15.com',
    ...overrides
  };
}

test('runtime config keeps local development explicit and easy to run', () => {
  const config = loadRuntimeConfig({});

  assert.equal(config.appEnv, 'development');
  assert.equal(config.isProduction, false);
  assert.equal(config.appUrl, 'http://localhost:3000');
  assert.equal(config.host, '0.0.0.0');
  assert.equal(config.port, 3000);
  assert.equal(config.uploadMode, 'local');
});

test('runtime config treats NODE_ENV=production as production mode', () => {
  assert.throws(
    () => loadRuntimeConfig({ NODE_ENV: 'production' }),
    /Invalid Cohort15 production configuration:[\s\S]*COHORT15_APP_URL is required in production/
  );
});

test('production runtime config validates required provider and secret boundaries', () => {
  assert.throws(
    () => loadRuntimeConfig(validProductionEnv({
      SUPABASE_SERVICE_ROLE_KEY: '',
      STRIPE_WEBHOOK_SECRET: ''
    })),
    /SUPABASE_SERVICE_ROLE_KEY is required in production[\s\S]*STRIPE_WEBHOOK_SECRET is required in production/
  );
});

test('production runtime config rejects local persistence and local upload fallback', () => {
  assert.throws(
    () => loadRuntimeConfig(validProductionEnv({
      COHORT15_PERSISTENCE_FILE: '.local/cohort15-state.json',
      COHORT15_UPLOAD_MODE: 'local'
    })),
    /COHORT15_UPLOAD_MODE=local is not allowed in production[\s\S]*COHORT15_PERSISTENCE_FILE is local-development storage/
  );
});

test('production runtime config returns sanitized operational values without secrets', () => {
  const config = loadRuntimeConfig(validProductionEnv({
    HOST: '127.0.0.1',
    PORT: '4242',
    SUPABASE_AUTH_CALLBACK_PATH: '/auth/supabase/callback',
    STRIPE_WEBHOOK_PATH: '/payments/stripe/webhook'
  }));

  assert.equal(config.isProduction, true);
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.port, 4242);
  assert.equal(config.auth.supabaseUrl, 'https://project.supabase.co');
  assert.equal(config.auth.supabaseAuthCallbackPath, '/auth/supabase/callback');
  assert.equal(config.stripe.webhookPath, '/payments/stripe/webhook');
  assert.deepEqual(config.adminEmails, ['admin@example.com']);
  assert.equal('SUPABASE_SERVICE_ROLE_KEY' in config, false);
  assert.equal('STRIPE_SECRET_KEY' in config, false);
});

test('runtime env var list documents production requirements', () => {
  const vars = listRuntimeEnvVars();

  assert.ok(vars.requiredInProduction.includes('COHORT15_APP_URL'));
  assert.ok(vars.requiredInProduction.includes('STRIPE_SECRET_KEY'));
  assert.ok(vars.requiredInProduction.includes('SUPABASE_SERVICE_ROLE_KEY'));
  assert.ok(vars.optional.includes('COHORT15_PERSISTENCE_FILE'));
});
