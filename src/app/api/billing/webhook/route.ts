import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyStripeSignature } from '@/lib/stripe';
import { SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = verifyStripeSignature(body, signature, endpointSecret);

    // Handle different webhook events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerCreated(customer);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId;
  if (!organizationId) {
    console.error('No organizationId in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  let plan: any = 'FREE';
  
  // Map Stripe price ID to plan
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) plan = 'BASIC';
  else if (priceId === process.env.STRIPE_PRO_PRICE_ID) plan = 'PRO';
  else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) plan = 'ENTERPRISE';

  const status = mapStripeStatus(subscription.status);

  // Update or create subscription
  await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    update: {
      plan,
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    create: {
      organizationId,
      plan,
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
    },
  });

  // Update organization plan
  await prisma.organization.update({
    where: { id: organizationId },
    data: { 
      plan,
      stripeCustomerId: subscription.customer as string,
    },
  });
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId;
  if (!organizationId) return;

  // Update subscription status
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELLED',
      cancelAtPeriodEnd: true,
    },
  });

  // Downgrade organization to FREE plan
  await prisma.organization.update({
    where: { id: organizationId },
    data: { plan: 'FREE' },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // Find subscription by Stripe subscription ID
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });

  if (subscription) {
    // Update subscription status to active
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE' },
    });

    // Update organization status
    await prisma.organization.update({
      where: { id: subscription.organizationId },
      data: { isActive: true },
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // Find subscription by Stripe subscription ID
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });

  if (subscription) {
    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' },
    });

    // You might want to send notifications here
    console.log(`Payment failed for organization: ${subscription.organizationId}`);
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  const organizationId = customer.metadata.organizationId;
  if (!organizationId) return;

  // Update organization with Stripe customer ID
  await prisma.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customer.id },
  });
}

function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE';
    case 'canceled':
      return 'CANCELLED';
    case 'incomplete':
    case 'incomplete_expired':
      return 'INACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'unpaid':
      return 'UNPAID';
    default:
      return 'INACTIVE';
  }
}