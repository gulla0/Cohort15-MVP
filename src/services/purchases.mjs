export const CREDIT_PACKAGE = Object.freeze({
  packageId: 'six_credits', credits: 6, amountCents: 600, currency: 'usd',
});

export class PurchaseVerificationError extends Error {
  constructor(code = 'purchase_verification_failed') {
    super(code);
    this.name = 'PurchaseVerificationError';
    this.code = code;
  }
}

function sessionValues(session) {
  return {
    purchaseId: session?.metadata?.purchase_id,
    userId: session?.metadata?.user_id,
    packageId: CREDIT_PACKAGE.packageId,
    credits: CREDIT_PACKAGE.credits,
    amountCents: session?.amount_total,
    currency: String(session?.currency ?? '').toLowerCase(),
    stripeCheckoutSessionId: session?.id,
    stripePaymentIntentId: typeof session?.payment_intent === 'string' ? session.payment_intent : session?.payment_intent?.id,
  };
}

export function createPurchaseService({ repositories, stripe, priceId, appUrl, randomUUID, now } = {}) {
  if (!repositories || !stripe || !priceId || !appUrl) throw new TypeError('purchase service configuration is required');

  async function fulfillSession(session, { expectedUserId } = {}) {
    const values = sessionValues(session);
    if (session?.object !== 'checkout.session' || session?.status !== 'complete' || session?.payment_status !== 'paid'
      || !values.purchaseId || !values.userId || !values.stripeCheckoutSessionId || !values.stripePaymentIntentId
      || values.amountCents !== CREDIT_PACKAGE.amountCents || values.currency !== CREDIT_PACKAGE.currency) {
      throw new PurchaseVerificationError('session_not_paid_or_mismatched');
    }
    if (expectedUserId && values.userId !== expectedUserId) throw new PurchaseVerificationError('wrong_owner');
    const purchase = await repositories.getPurchaseById(values.purchaseId);
    if (purchase.userId !== values.userId || purchase.stripeCheckoutSessionId !== values.stripeCheckoutSessionId) {
      throw new PurchaseVerificationError('purchase_mismatch');
    }
    return repositories.fulfillPurchase(values, { now: now?.(), transactionId: randomUUID?.() });
  }

  return Object.freeze({
    async startCheckout(user, returnTo = '/') {
      const purchase = await repositories.createPendingPurchase({
        userId: user.id, ...CREDIT_PACKAGE,
        stripeCheckoutSessionId: null, stripePaymentIntentId: null, fulfilledAt: null,
      }, { id: randomUUID?.(), now: now?.() });
      const complete = new URL('/credits/checkout/complete', appUrl);
      complete.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
      complete.searchParams.set('return_to', returnTo);
      const session = await stripe.createCheckoutSession({
        priceId, purchaseId: purchase.id, userId: user.id,
        successUrl: complete.href,
        cancelUrl: new URL('/credits/buy?cancelled=1', appUrl).href,
      });
      await repositories.setPurchaseCheckoutSession(purchase.id, session.id, { now: now?.() });
      return Object.freeze({ purchase, checkoutUrl: session.url });
    },

    async reconcileSession(sessionId, userId) {
      try {
        const session = await stripe.retrieveCheckoutSession(sessionId);
        return await fulfillSession(session, { expectedUserId: userId });
      } catch (error) {
        try {
          const purchase = await repositories.getPurchaseByStripeCheckoutSessionId(sessionId);
          if (purchase.userId === userId && purchase.status === 'fulfilled') {
            return Object.freeze({ purchase, fulfilled: false });
          }
        } catch {
          // The signed webhook may not have fulfilled this session yet; preserve the original failure.
        }
        throw error;
      }
    },

    async handleEvent(event) {
      if (!event?.id || !event?.type) throw new PurchaseVerificationError('invalid_event');
      if (event.type !== 'checkout.session.completed') {
        await repositories.recordStripeEvent({ eventId: event.id, eventType: event.type, outcome: 'ignored' }, { now: now?.() });
        return Object.freeze({ outcome: 'ignored' });
      }
      const result = await fulfillSession(event.data?.object);
      await repositories.recordStripeEvent({
        eventId: event.id, eventType: event.type, outcome: result.fulfilled ? 'fulfilled' : 'duplicate',
      }, { now: now?.() });
      return Object.freeze({ outcome: result.fulfilled ? 'fulfilled' : 'duplicate', result });
    },
  });
}
