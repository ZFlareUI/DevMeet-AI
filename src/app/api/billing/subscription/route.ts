import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  createStripeCustomer,
  createStripeSubscription,
  updateStripeSubscription,
  cancelStripeSubscription,
  resumeStripeSubscription,
  createBillingPortalSession,
  getPlanConfig
} from '@/lib/stripe';
import { SubscriptionPlan } from '@prisma/client';

type PlanConfig = {
  name: string;
  price: number;
  stripePriceId?: string;
  limits: {
    candidates: number;
    interviews: number;
    storage: number;
    teamMembers: number;
  };
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization and subscription
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: {
          include: {
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const subscription = user.organization.subscriptions[0];
    const planConfig = getPlanConfig(user.organization.plan);

    return NextResponse.json({
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        plan: user.organization.plan,
        planLimits: planConfig.limits,
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, action } = await req.json();

    if (!plan || !action) {
      return NextResponse.json(
        { error: 'Plan and action are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: {
          include: {
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organization = user.organization;
    const currentSubscription = organization.subscriptions[0];

    switch (action) {
      case 'create': {
        if (plan === 'FREE') {
          // Update organization plan to FREE (no Stripe involved)
          await prisma.organization.update({
            where: { id: organization.id },
            data: { plan: SubscriptionPlan.FREE },
          });
          
          return NextResponse.json({ success: true, plan: 'FREE' });
        }

        const planConfig = getPlanConfig(plan as SubscriptionPlan);
        if (!(planConfig as PlanConfig).stripePriceId) {
          return NextResponse.json(
            { error: 'Invalid plan configuration' },
            { status: 400 }
          );
        }

        // Create Stripe customer if doesn't exist
        let stripeCustomerId = organization.stripeCustomerId;
        if (!stripeCustomerId) {
          const customer = await createStripeCustomer(
            session.user.email,
            organization.name,
            organization.id
          );
          stripeCustomerId = customer.id;
          
          // Update organization with Stripe customer ID
          await prisma.organization.update({
            where: { id: organization.id },
            data: { stripeCustomerId },
          });
        }

        // Create Stripe subscription
        const stripeSubscription = await createStripeSubscription(
          stripeCustomerId,
          (planConfig as PlanConfig).stripePriceId!,
          organization.id
        );

        // Create subscription record in database
        await prisma.subscription.create({
          data: {
            organizationId: organization.id,
            plan: plan as SubscriptionPlan,
            status: 'ACTIVE',
            currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
            stripeCustomerId,
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: (planConfig as PlanConfig).stripePriceId,
          },
        });

        // Update organization plan
        await prisma.organization.update({
          where: { id: organization.id },
          data: { plan: plan as SubscriptionPlan },
        });

        return NextResponse.json({
          subscriptionId: stripeSubscription.id,
          clientSecret: (stripeSubscription as any).latest_invoice?.payment_intent?.client_secret,
        });
      }

      case 'update': {
        if (!currentSubscription?.stripeSubscriptionId) {
          return NextResponse.json(
            { error: 'No active subscription found' },
            { status: 404 }
          );
        }

        const planConfig = getPlanConfig(plan as SubscriptionPlan);
        if (!(planConfig as PlanConfig).stripePriceId) {
          return NextResponse.json(
            { error: 'Invalid plan configuration' },
            { status: 400 }
          );
        }

        // Update Stripe subscription
        const updatedSubscription = await updateStripeSubscription(
          currentSubscription.stripeSubscriptionId,
          (planConfig as PlanConfig).stripePriceId!
        );

        // Update database
        await prisma.subscription.update({
          where: { id: currentSubscription.id },
          data: {
            plan: plan as SubscriptionPlan,
            stripePriceId: (planConfig as PlanConfig).stripePriceId,
            currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
          },
        });

        await prisma.organization.update({
          where: { id: organization.id },
          data: { plan: plan as SubscriptionPlan },
        });

        return NextResponse.json({ success: true });
      }

      case 'cancel': {
        if (!currentSubscription?.stripeSubscriptionId) {
          return NextResponse.json(
            { error: 'No active subscription found' },
            { status: 404 }
          );
        }

        await cancelStripeSubscription(currentSubscription.stripeSubscriptionId);

        await prisma.subscription.update({
          where: { id: currentSubscription.id },
          data: { cancelAtPeriodEnd: true },
        });

        return NextResponse.json({ success: true });
      }

      case 'resume': {
        if (!currentSubscription?.stripeSubscriptionId) {
          return NextResponse.json(
            { error: 'No active subscription found' },
            { status: 404 }
          );
        }

        await resumeStripeSubscription(currentSubscription.stripeSubscriptionId);

        await prisma.subscription.update({
          where: { id: currentSubscription.id },
          data: { cancelAtPeriodEnd: false },
        });

        return NextResponse.json({ success: true });
      }

      case 'billing-portal': {
        if (!organization.stripeCustomerId) {
          return NextResponse.json(
            { error: 'No Stripe customer found' },
            { status: 404 }
          );
        }

        const portalSession = await createBillingPortalSession(
          organization.stripeCustomerId,
          `${req.nextUrl.origin}/dashboard/billing`
        );

        return NextResponse.json({ url: portalSession.url });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}