const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const RESEND_BATCH_ENDPOINT = `${RESEND_ENDPOINT}/batch`;
const DEFAULT_TIMEOUT_MS = 5_000;
const SENDER = 'Cohort15 <updates@cohort15.com>';
const REPLY_TO = 'cohort15dotcom@gmail.com';

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

  async function request(endpoint, payload, idempotencyKey) {
    if (!apiKey) throw new EmailProviderError('not_configured');

    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new EmailProviderError(providerErrorCode(error));
    }

    if (!response.ok) throw new EmailProviderError(`http_${response.status}`);
  }

  function payload({ to, subject, html }) {
    return {
      from: SENDER,
      reply_to: REPLY_TO,
      to: [to],
      subject,
      html,
    };
  }

  return Object.freeze({
    async send({ to, subject, html, idempotencyKey }) {
      return request(RESEND_ENDPOINT, payload({ to, subject, html }), idempotencyKey);
    },

    async sendBatch({ messages, idempotencyKey }) {
      if (!Array.isArray(messages) || messages.length < 1 || messages.length > 100) {
        throw new TypeError('messages must contain between 1 and 100 emails');
      }
      return request(RESEND_BATCH_ENDPOINT, messages.map(payload), idempotencyKey);
    },
  });
}

export function sanitizedEmailProviderErrorCode(error) {
  return providerErrorCode(error);
}
