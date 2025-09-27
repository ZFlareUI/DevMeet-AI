import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

// Stripe configuration
export const STRIPE_CONFIG = {
  plans: {
    FREE: {
      name: 'Free',
      price: 0,
      limits: {
        candidates: 10,
        interviews: 5,
        storage: 100 * 1024 * 1024, // 100MB
        teamMembers: 1,
      },
    },
    BASIC: {
      name: 'Basic',
      price: 2900, // $29.00 in cents
      stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
      limits: {
        candidates: 100,
        interviews: 50,
        storage: 1 * 1024 * 1024 * 1024, // 1GB
        teamMembers: 5,
      },
    },
    PRO: {
      name: 'Professional',
      price: 9900, // $99.00 in cents
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
      limits: {
        candidates: 500,
        interviews: 200,
        storage: 10 * 1024 * 1024 * 1024, // 10GB
        teamMembers: 20,
      },
    },
    ENTERPRISE: {
      name: 'Enterprise',
      price: 29900, // $299.00 in cents
      stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
      limits: {
        candidates: -1, // Unlimited
        interviews: -1, // Unlimited
        storage: -1, // Unlimited
        teamMembers: -1, // Unlimited
      },
    },
  },
};

export type StripePlan = keyof typeof STRIPE_CONFIG.plans;

// Utility functions
export function getPlanConfig(plan: StripePlan) {
  return STRIPE_CONFIG.plans[plan];
}

export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceInCents / 100);
}

export function isWithinLimits(usage: number, limit: number): boolean {
  if (limit === -1) return true; // Unlimited
  return usage < limit;
}

// Stripe webhook signature verification
export function verifyStripeSignature(
  body: string,
  signature: string,
  endpointSecret: string
) {
  return stripe.webhooks.constructEvent(body, signature, endpointSecret);
}

// Create Stripe customer
export async function createStripeCustomer(
  email: string,
  name: string,
  organizationId: string
) {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      organizationId,
    },
  });
}

// Create Stripe subscription
export async function createStripeSubscription(
  customerId: string,
  priceId: string,
  organizationId: string
) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      organizationId,
    },
  });
}

// Update subscription
export async function updateStripeSubscription(
  subscriptionId: string,
  newPriceId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: 'always_invoice',
  });
}

// Cancel subscription
export async function cancelStripeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Resume subscription
export async function resumeStripeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

// Create billing portal session
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// Get usage for billing
export async function getUsageMetrics(organizationId: string) {
  // This would be implemented to fetch from your database
  // For now, returning a placeholder
  return {
    candidates: 0,
    interviews: 0,
    storage: 0,
    teamMembers: 0,
  };
}