'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PlanConfig {
  name: string;
  price: number;
  limits: {
    candidates: number;
    interviews: number;
    storage: number;
    teamMembers: number;
  };
}

interface Organization {
  id: string;
  name: string;
  plan: string;
  planLimits: PlanConfig['limits'];
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface BillingData {
  organization: Organization;
  subscription: Subscription | null;
}

const PLAN_CONFIGS = {
  FREE: {
    name: 'Free',
    price: 0,
    limits: {
      candidates: 10,
      interviews: 5,
      storage: 100,
      teamMembers: 1,
    },
  },
  BASIC: {
    name: 'Basic',
    price: 29,
    limits: {
      candidates: 100,
      interviews: 50,
      storage: 1024,
      teamMembers: 5,
    },
  },
  PRO: {
    name: 'Professional',
    price: 99,
    limits: {
      candidates: 500,
      interviews: 200,
      storage: 10240,
      teamMembers: 20,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 299,
    limits: {
      candidates: -1,
      interviews: -1,
      storage: -1,
      teamMembers: -1,
    },
  },
};

export default function BillingPage() {
  const { data: session } = useSession();
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/billing/subscription');
      if (response.ok) {
        const data = await response.json();
        setBillingData(data);
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (newPlan: string) => {
    setActionLoading('changing-plan');
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: newPlan,
          action: billingData?.subscription ? 'update' : 'create',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.clientSecret) {
          // Handle Stripe payment confirmation if needed
          console.log('Payment required:', result.clientSecret);
        }
        fetchBillingData();
      }
    } catch (error) {
      console.error('Failed to change plan:', error);
    } finally {
      setActionLoading('');
    }
  };

  const handleCancelSubscription = async () => {
    setActionLoading('cancelling');
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (response.ok) {
        fetchBillingData();
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setActionLoading('');
    }
  };

  const handleResumeSubscription = async () => {
    setActionLoading('resuming');
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });

      if (response.ok) {
        fetchBillingData();
      }
    } catch (error) {
      console.error('Failed to resume subscription:', error);
    } finally {
      setActionLoading('');
    }
  };

  const handleManageBilling = async () => {
    setActionLoading('portal');
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'billing-portal' }),
      });

      if (response.ok) {
        const result = await response.json();
        window.open(result.url, '_blank');
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    } finally {
      setActionLoading('');
    }
  };

  const formatStorage = (mb: number) => {
    if (mb === -1) return 'Unlimited';
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  const formatCount = (count: number) => {
    return count === -1 ? 'Unlimited' : count.toString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading billing information...</div>
        </div>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Billing & Subscription</h1>
          <p>Failed to load billing information. Please try again.</p>
        </div>
      </div>
    );
  }

  const currentPlan = billingData.organization.plan as keyof typeof PLAN_CONFIGS;
  const currentPlanConfig = PLAN_CONFIGS[currentPlan];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

      {/* Current Plan */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-blue-600">
              {currentPlanConfig.name}
            </h3>
            {currentPlanConfig.price > 0 && (
              <p className="text-gray-600">
                ${currentPlanConfig.price}/month
              </p>
            )}
          </div>
          <div className="text-right">
            {billingData.subscription && (
              <div>
                <p className="text-sm text-gray-600">
                  Status: <span className="capitalize">{billingData.subscription.status.toLowerCase()}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Renews: {new Date(billingData.subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
                {billingData.subscription.cancelAtPeriodEnd && (
                  <p className="text-sm text-red-600">Cancels at period end</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{formatCount(currentPlanConfig.limits.candidates)}</p>
            <p className="text-sm text-gray-600">Candidates</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{formatCount(currentPlanConfig.limits.interviews)}</p>
            <p className="text-sm text-gray-600">Interviews</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{formatStorage(currentPlanConfig.limits.storage)}</p>
            <p className="text-sm text-gray-600">Storage</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{formatCount(currentPlanConfig.limits.teamMembers)}</p>
            <p className="text-sm text-gray-600">Team Members</p>
          </div>
        </div>
      </Card>

      {/* Available Plans */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(PLAN_CONFIGS).map(([planKey, plan]) => (
            <div
              key={planKey}
              className={`border rounded-lg p-4 ${
                planKey === currentPlan ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
              <p className="text-2xl font-bold mb-4">
                {plan.price === 0 ? 'Free' : `$${plan.price}`}
                {plan.price > 0 && <span className="text-sm text-gray-600">/month</span>}
              </p>
              
              <ul className="text-sm space-y-1 mb-4">
                <li>{formatCount(plan.limits.candidates)} candidates</li>
                <li>{formatCount(plan.limits.interviews)} interviews</li>
                <li>{formatStorage(plan.limits.storage)} storage</li>
                <li>{formatCount(plan.limits.teamMembers)} team members</li>
              </ul>

              {planKey !== currentPlan && (
                <Button
                  onClick={() => handlePlanChange(planKey)}
                  disabled={actionLoading === 'changing-plan'}
                  className="w-full"
                  variant={plan.price > currentPlanConfig.price ? 'default' : 'outline'}
                >
                  {actionLoading === 'changing-plan' ? 'Updating...' : 
                   plan.price > currentPlanConfig.price ? 'Upgrade' : 'Downgrade'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Billing Actions */}
      {billingData.subscription && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Manage Subscription</h2>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleManageBilling}
              disabled={actionLoading === 'portal'}
              variant="outline"
            >
              {actionLoading === 'portal' ? 'Loading...' : 'Manage Billing'}
            </Button>
            
            {billingData.subscription.cancelAtPeriodEnd ? (
              <Button
                onClick={handleResumeSubscription}
                disabled={actionLoading === 'resuming'}
              >
                {actionLoading === 'resuming' ? 'Resuming...' : 'Resume Subscription'}
              </Button>
            ) : (
              <Button
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'cancelling'}
                variant="destructive"
              >
                {actionLoading === 'cancelling' ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}