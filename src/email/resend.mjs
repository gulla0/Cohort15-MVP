const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_TIMEOUT_MS = 5_000;

export class EmailProviderError extends Error {
  constructor(code) {
    super('Email delivery failed');
    this.name = 'EmailProviderError';
    this.code = code;
  }
}

function providerErrorCode(error) {
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return 'timeout';
  if (error instanceof EmailProviderError) return error.code;
  return 'request_failed';
}

export function createResendEmailProvider({
  apiKey,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl is required');

  return Object.freeze({
    async send({ to, subject, html, idempotencyKey }) {
      if (!apiKey) throw new EmailProviderError('not_configured');

      let response;
      try {
        response = await fetchImpl(RESEND_ENDPOINT, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json',
            'idempotency-key': idempotencyKey,
          },
          body: JSON.stringify({
            from: 'Cohort15 <updates@cohort15.com>',
            reply_to: 'cohort15dotcom@gmail.com',
            to: [to],
            subject,
            html,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        throw new EmailProviderError(providerErrorCode(error));
      }

      if (!response.ok) {
        throw new EmailProviderError(`http_${response.status}`);
      }
    },
  });
}

export function sanitizedEmailProviderErrorCode(error) {
  return providerErrorCode(error);
}
