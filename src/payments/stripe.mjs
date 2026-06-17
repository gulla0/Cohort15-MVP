const STRIPE_API_URL = 'https://api.stripe.com/v1';

function assertSecretKey(secretKey) {
  if (typeof secretKey !== 'string' || secretKey.trim().length === 0) {
    throw new Error('Stripe checkout is not configured.');
  }
}

async function parseStripeResponse(response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Stripe request failed.');
  }
  return payload;
}

export function createStripeCheckoutAdapter({ secretKey, fetchImpl = globalThis.fetch } = {}) {
  assertSecretKey(secretKey);
  if (typeof fetchImpl !== 'function') {
    throw new Error('Stripe checkout requires fetch.');
  }

  return Object.freeze({
    async createSession({ purchaseId, userId, customerEmail, priceId, successUrl, cancelUrl }) {
      const body = new URLSearchParams({
        mode: 'payment',
        client_reference_id: userId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'metadata[purchase_id]': purchaseId,
        'metadata[user_id]': userId
      });
      if (customerEmail) {
        body.set('customer_email', customerEmail);
      }

      const response = await fetchImpl(`${STRIPE_API_URL}/checkout/sessions`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${secretKey}`,
          'content-type': 'application/x-www-form-urlencoded',
          'idempotency-key': purchaseId
        },
        body
      });
      return parseStripeResponse(response);
    },

    async retrieveSession(sessionId) {
      if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
        throw new Error('A valid Stripe Checkout Session ID is required.');
      }
      const response = await fetchImpl(`${STRIPE_API_URL}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
        headers: { authorization: `Bearer ${secretKey}` }
      });
      return parseStripeResponse(response);
    }
  });
}
