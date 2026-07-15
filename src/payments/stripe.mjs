import { createHmac, timingSafeEqual } from 'node:crypto';

const STRIPE_API_URL = 'https://api.stripe.com/v1';
const SIGNATURE_TOLERANCE_SECONDS = 300;

export class StripeProviderError extends Error {
  constructor(code = 'stripe_provider_error') {
    super(code);
    this.name = 'StripeProviderError';
    this.code = code;
  }
}

function requireValue(value, name) {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new StripeProviderError(`invalid_${name}`);
  return normalized;
}

async function providerJson(response) {
  if (!response.ok) throw new StripeProviderError('stripe_request_failed');
  try { return await response.json(); } catch { throw new StripeProviderError('stripe_response_invalid'); }
}

export function createStripeClient({ secretKey, fetchImpl = globalThis.fetch } = {}) {
  const key = requireValue(secretKey, 'secret_key');
  if (typeof fetchImpl !== 'function') throw new StripeProviderError('invalid_transport');
  const headers = { authorization: `Bearer ${key}` };

  return Object.freeze({
    async createCheckoutSession(input) {
      const body = new URLSearchParams({
        mode: 'payment',
        'line_items[0][price]': requireValue(input.priceId, 'price_id'),
        'line_items[0][quantity]': '1',
        success_url: requireValue(input.successUrl, 'success_url'),
        cancel_url: requireValue(input.cancelUrl, 'cancel_url'),
        client_reference_id: requireValue(input.purchaseId, 'purchase_id'),
        'metadata[purchase_id]': requireValue(input.purchaseId, 'purchase_id'),
        'metadata[user_id]': requireValue(input.userId, 'user_id'),
      });
      const response = await fetchImpl(`${STRIPE_API_URL}/checkout/sessions`, {
        method: 'POST', headers: { ...headers, 'content-type': 'application/x-www-form-urlencoded', 'idempotency-key': input.purchaseId },
        body: body.toString(),
      });
      const session = await providerJson(response);
      if (!session?.id || !session?.url) throw new StripeProviderError('stripe_response_invalid');
      return session;
    },

    async retrieveCheckoutSession(sessionId) {
      const id = encodeURIComponent(requireValue(sessionId, 'session_id'));
      return providerJson(await fetchImpl(`${STRIPE_API_URL}/checkout/sessions/${id}`, { headers }));
    },
  });
}

export function verifyStripeSignature(rawBody, signatureHeader, endpointSecret, options = {}) {
  const secret = requireValue(endpointSecret, 'webhook_secret');
  const parts = String(signatureHeader ?? '').split(',').map((part) => part.trim());
  const timestampText = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  const timestamp = Number(timestampText);
  const nowSeconds = Math.floor(new Date(options.now ?? new Date()).valueOf() / 1000);
  if (!Number.isInteger(timestamp) || Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS || signatures.length === 0) {
    throw new StripeProviderError('invalid_signature');
  }
  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
  const expected = createHmac('sha256', secret).update(`${timestamp}.`).update(payload).digest();
  const valid = signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/iu.test(signature)) return false;
    const candidate = Buffer.from(signature, 'hex');
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
  if (!valid) throw new StripeProviderError('invalid_signature');
  return true;
}

