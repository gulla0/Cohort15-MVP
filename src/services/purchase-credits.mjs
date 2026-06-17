import { randomUUID } from 'node:crypto';

export const CREDIT_PACKAGES = Object.freeze({
  '6': Object.freeze({ credits: 6, amountCents: 600, currency: 'usd', priceConfigKey: 'price6Credits' }),
  '14': Object.freeze({ credits: 14, amountCents: 1200, currency: 'usd', priceConfigKey: 'price14Credits' })
});

function requirePackage(packageId, stripeConfig) {
  const packageDefinition = CREDIT_PACKAGES[packageId];
  if (!packageDefinition) {
    throw new Error('Select a valid credit package.');
  }
  const priceId = stripeConfig[packageDefinition.priceConfigKey];
  if (!priceId) {
    throw new Error('Stripe checkout is not configured for this credit package.');
  }
  return { ...packageDefinition, priceId };
}

export function createPurchaseCreditsService({
  repositories,
  ledger,
  stripeCheckout,
  stripeConfig,
  appUrl,
  now = () => new Date(),
  createId = () => randomUUID()
}) {
  async function startCheckout({ user, packageId }) {
    if (!stripeCheckout) {
      throw new Error('Stripe checkout is not configured.');
    }
    const selected = requirePackage(packageId, stripeConfig);
    const purchaseId = `purchase-${createId()}`;
    const session = await stripeCheckout.createSession({
      purchaseId,
      userId: user.id,
      customerEmail: user.email,
      priceId: selected.priceId,
      successUrl: `${appUrl}/credits/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/credits/buy?cancelled=1`
    });
    if (!session?.id || !session?.url) {
      throw new Error('Stripe did not return a usable Checkout Session.');
    }
    const timestamp = now();
    repositories.purchases.save({
      id: purchaseId,
      userId: user.id,
      provider: 'stripe',
      providerCheckoutId: session.id,
      packageCredits: selected.credits,
      amountCents: selected.amountCents,
      currency: selected.currency,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp
    });
    return { checkoutUrl: session.url };
  }

  async function completeCheckout({ userId, sessionId }) {
    if (!stripeCheckout) {
      throw new Error('Stripe checkout is not configured.');
    }
    const purchase = repositories.purchases.findByProviderCheckoutId(sessionId);
    if (!purchase || purchase.userId !== userId) {
      throw new Error('Checkout purchase was not found for this account.');
    }
    if (purchase.status === 'paid' && purchase.creditTransactionId) {
      return { purchase, alreadyCompleted: true };
    }

    const session = await stripeCheckout.retrieveSession(sessionId);
    const isExpectedPurchase = session.id === purchase.providerCheckoutId
      && session.client_reference_id === userId
      && session.metadata?.purchase_id === purchase.id
      && session.metadata?.user_id === userId
      && session.amount_total === purchase.amountCents
      && session.currency === purchase.currency;
    if (!isExpectedPurchase) {
      throw new Error('Stripe Checkout Session did not match the expected purchase.');
    }
    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      throw new Error('Stripe payment is not complete. No credits were added.');
    }

    const creditTransaction = ledger.purchase(
      userId,
      purchase.packageCredits,
      `stripe_checkout:${session.id}`
    );
    const completed = repositories.purchases.save({
      ...purchase,
      providerPaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
      status: 'paid',
      creditTransactionId: creditTransaction.id,
      updatedAt: now()
    });
    return { purchase: completed, creditTransaction, alreadyCompleted: false };
  }

  return Object.freeze({ startCheckout, completeCheckout });
}
