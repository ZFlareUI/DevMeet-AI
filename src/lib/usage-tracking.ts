import { prisma } from '@/lib/prisma';
import { getPlanConfig, isWithinLimits } from '@/lib/stripe';
import { SubscriptionPlan } from '@prisma/client';

export interface UsageStats {
  candidates: number;
  interviews: number;
  storage: number; // in bytes
  teamMembers: number;
}

export interface PlanLimits {
  candidates: number;
  interviews: number;
  storage: number; // in bytes
  teamMembers: number;
}

export interface UsageReport {
  usage: UsageStats;
  limits: PlanLimits;
  withinLimits: {
    candidates: boolean;
    interviews: boolean;
    storage: boolean;
    teamMembers: boolean;
  };
  percentUsed: {
    candidates: number;
    interviews: number;
    storage: number;
    teamMembers: number;
  };
}

// Get current usage for an organization
export async function getOrganizationUsage(organizationId: string): Promise<UsageStats> {
  const [
    candidateCount,
    interviewCount,
    userCount,
    storageResult
  ] = await Promise.all([
    // Count candidates
    prisma.candidate.count({
      where: { organizationId }
    }),
    
    // Count interviews
    prisma.interview.count({
      where: { organizationId }
    }),
    
    // Count team members
    prisma.user.count({
      where: { organizationId }
    }),
    
    // Calculate storage usage
    prisma.uploadedFile.aggregate({
      where: { organizationId },
      _sum: { fileSize: true }
    })
  ]);

  return {
    candidates: candidateCount,
    interviews: interviewCount,
    storage: storageResult._sum.fileSize || 0,
    teamMembers: userCount,
  };
}

// Get usage report with limits comparison
export async function getUsageReport(organizationId: string): Promise<UsageReport> {
  const [usage, organization] = await Promise.all([
    getOrganizationUsage(organizationId),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true }
    })
  ]);

  if (!organization) {
    throw new Error('Organization not found');
  }

  const planConfig = getPlanConfig(organization.plan);
  const limits: PlanLimits = {
    candidates: planConfig.limits.candidates,
    interviews: planConfig.limits.interviews,
    storage: planConfig.limits.storage,
    teamMembers: planConfig.limits.teamMembers,
  };

  return {
    usage,
    limits,
    withinLimits: {
      candidates: isWithinLimits(usage.candidates, limits.candidates),
      interviews: isWithinLimits(usage.interviews, limits.interviews),
      storage: isWithinLimits(usage.storage, limits.storage),
      teamMembers: isWithinLimits(usage.teamMembers, limits.teamMembers),
    },
    percentUsed: {
      candidates: limits.candidates === -1 ? 0 : (usage.candidates / limits.candidates) * 100,
      interviews: limits.interviews === -1 ? 0 : (usage.interviews / limits.interviews) * 100,
      storage: limits.storage === -1 ? 0 : (usage.storage / limits.storage) * 100,
      teamMembers: limits.teamMembers === -1 ? 0 : (usage.teamMembers / limits.teamMembers) * 100,
    },
  };
}

// Check if organization can perform an action (create candidate, interview, etc.)
export async function canPerformAction(
  organizationId: string,
  action: 'candidate' | 'interview' | 'storage' | 'teamMember',
  additionalUsage: number = 1
): Promise<{ allowed: boolean; reason?: string }> {
  const report = await getUsageReport(organizationId);
  
  switch (action) {
    case 'candidate':
      const newCandidateCount = report.usage.candidates + additionalUsage;
      if (!isWithinLimits(newCandidateCount, report.limits.candidates)) {
        return {
          allowed: false,
          reason: `Candidate limit exceeded. Current: ${report.usage.candidates}, Limit: ${report.limits.candidates === -1 ? 'Unlimited' : report.limits.candidates}`,
        };
      }
      break;
      
    case 'interview':
      const newInterviewCount = report.usage.interviews + additionalUsage;
      if (!isWithinLimits(newInterviewCount, report.limits.interviews)) {
        return {
          allowed: false,
          reason: `Interview limit exceeded. Current: ${report.usage.interviews}, Limit: ${report.limits.interviews === -1 ? 'Unlimited' : report.limits.interviews}`,
        };
      }
      break;
      
    case 'storage':
      const newStorageUsage = report.usage.storage + additionalUsage;
      if (!isWithinLimits(newStorageUsage, report.limits.storage)) {
        const currentMB = Math.round(report.usage.storage / (1024 * 1024));
        const limitMB = report.limits.storage === -1 ? 'Unlimited' : Math.round(report.limits.storage / (1024 * 1024));
        return {
          allowed: false,
          reason: `Storage limit exceeded. Current: ${currentMB}MB, Limit: ${limitMB}MB`,
        };
      }
      break;
      
    case 'teamMember':
      const newTeamMemberCount = report.usage.teamMembers + additionalUsage;
      if (!isWithinLimits(newTeamMemberCount, report.limits.teamMembers)) {
        return {
          allowed: false,
          reason: `Team member limit exceeded. Current: ${report.usage.teamMembers}, Limit: ${report.limits.teamMembers === -1 ? 'Unlimited' : report.limits.teamMembers}`,
        };
      }
      break;
  }
  
  return { allowed: true };
}

// Record usage metrics for analytics and billing
export async function recordUsageMetric(
  organizationId: string,
  metricType: 'candidates' | 'interviews' | 'assessments' | 'storage',
  value: number,
  period: 'daily' | 'monthly' = 'monthly'
) {
  const date = new Date();
  
  // Normalize date based on period
  if (period === 'monthly') {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  await prisma.usageMetric.upsert({
    where: {
      organizationId_metricType_period_date: {
        organizationId,
        metricType,
        period,
        date,
      },
    },
    update: {
      value,
    },
    create: {
      organizationId,
      metricType,
      value,
      period,
      date,
    },
  });
}

// Get usage trends for analytics
export async function getUsageTrends(
  organizationId: string,
  metricType: string,
  period: 'daily' | 'monthly' = 'monthly',
  months: number = 12
) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return await prisma.usageMetric.findMany({
    where: {
      organizationId,
      metricType,
      period,
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
}

// Middleware function to check limits before actions
export function withUsageLimits(
  action: 'candidate' | 'interview' | 'storage' | 'teamMember'
) {
  return async (organizationId: string, additionalUsage: number = 1) => {
    const check = await canPerformAction(organizationId, action, additionalUsage);
    
    if (!check.allowed) {
      throw new Error(check.reason);
    }
    
    return true;
  };
}

// Format usage for display
export function formatUsageForDisplay(usage: number, limit: number, unit?: string): string {
  const limitDisplay = limit === -1 ? '∞' : limit.toString();
  const unitSuffix = unit ? ` ${unit}` : '';
  return `${usage}${unitSuffix} / ${limitDisplay}${unitSuffix}`;
}

export function formatStorageUsage(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

// Get organization plan limits
export async function getOrganizationLimits(organizationId: string): Promise<PlanLimits> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true }
  });

  if (!organization) {
    throw new Error('Organization not found');
  }

  const planConfig = getPlanConfig(organization.plan);
  
  return {
    candidates: planConfig.limits.candidates,
    interviews: planConfig.limits.interviews,
    storage: planConfig.limits.storage,
    teamMembers: planConfig.limits.teamMembers,
  };
}