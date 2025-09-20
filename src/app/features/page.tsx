'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  ChartBarIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function FeaturesPage() {
  const { data: session } = useSession();
  const [featureStatus, setFeatureStatus] = useState<Record<string, 'active' | 'testing' | 'planned'>>({});

  useEffect(() => {
    // Simulate feature status check
    setFeatureStatus({
      authentication: 'active',
      candidateManagement: 'active', 
      interviewScheduling: 'active',
      aiInterviewer: 'testing',
      analytics: 'active',
      githubIntegration: 'testing',
      notifications: 'active',
      roleBasedAccess: 'active'
    });
  }, []);

  const features = [
    {
      id: 'authentication',
      title: 'Authentication & Authorization',
      description: 'Secure GitHub OAuth login with role-based access control',
      icon: UserGroupIcon,
      link: '/auth/signin',
      details: [
        'GitHub OAuth integration',
        'JWT session management', 
        'Role-based permissions (Admin, Interviewer, Candidate)',
        'Secure middleware protection'
      ]
    },
    {
      id: 'candidateManagement',
      title: 'Candidate Management',
      description: 'Complete candidate lifecycle from application to hire',
      icon: UserGroupIcon,
      link: '/candidates',
      details: [
        'Add and manage candidate profiles',
        'Skill tracking and assessment',
        'Status management (Applied, Interview, Hired)',
        'GitHub profile integration'
      ]
    },
    {
      id: 'interviewScheduling',
      title: 'Interview Scheduling',
      description: 'AI-powered interview scheduling and management',
      icon: CalendarIcon,
      link: '/interviews',
      details: [
        'Schedule technical, behavioral, and system design interviews',
        'Automated calendar integration',
        'Interview type customization',
        'Duration and difficulty settings'
      ]
    },
    {
      id: 'aiInterviewer',
      title: 'AI Interviewer',
      description: 'Advanced AI-powered interview conductor',
      icon: CogIcon,
      link: '/interview/demo',
      details: [
        'Natural language conversation',
        'Technical question generation',
        'Real-time assessment',
        'Adaptive difficulty adjustment'
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting',
      description: 'Comprehensive hiring analytics and insights',
      icon: ChartBarIcon,
      link: '/analytics',
      details: [
        'Interview success rates',
        'Candidate pipeline metrics',
        'Time-to-hire analytics',
        'Skills gap analysis'
      ]
    },
    {
      id: 'githubIntegration',
      title: 'GitHub Integration',
      description: 'Automated technical assessment from GitHub profiles',
      icon: CogIcon,
      link: '/candidates',
      details: [
        'Repository analysis',
        'Code quality assessment',
        'Technology stack detection',
        'Contribution pattern analysis'
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'testing':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'planned':
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Production Ready';
      case 'testing':
        return 'Beta Testing';
      case 'planned':
        return 'In Development';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">DevMeet AI Features</h1>
              <p className="mt-1 text-sm text-gray-600">
                Complete production-ready platform with real-world logic implementation
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        {session && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Welcome back, {session.user?.name}!
                  </h2>
                  <p className="text-gray-600">
                    Your role: <span className="font-medium">{session.user?.role || 'User'}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            const status = featureStatus[feature.id] || 'planned';
            
            return (
              <Card key={feature.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status)}
                      <span className="text-xs font-medium text-gray-600">
                        {getStatusText(status)}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-2 mb-4">
                    {feature.details.map((detail, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                  
                  <Link href={feature.link}>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={status === 'planned'}
                    >
                      {status === 'planned' ? 'Coming Soon' : 'Explore Feature'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* System Status */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-medium text-gray-900">API Services</h3>
                <p className="text-sm text-green-600">All systems operational</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-medium text-gray-900">Database</h3>
                <p className="text-sm text-green-600">Connected and healthy</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="font-medium text-gray-900">AI Services</h3>
                <p className="text-sm text-yellow-600">Beta testing mode</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Readiness Checklist */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Production Readiness Checklist</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Security & Authentication</h3>
                <ul className="space-y-2 text-sm text-gray-600 ml-4">
                  <li>NextAuth.js implementation</li>
                  <li>Role-based access control</li>
                  <li>API route protection</li>
                  <li>Input validation with Zod</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">User Experience</h3>
                <ul className="space-y-2 text-sm text-gray-600 ml-4">
                  <li>Responsive design</li>
                  <li>Loading states</li>
                  <li>Error handling</li>
                  <li>Toast notifications</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Data Management</h3>
                <ul className="space-y-2 text-sm text-gray-600 ml-4">
                  <li>Prisma ORM setup</li>
                  <li>Database schema</li>
                  <li>API standardization</li>
                  <li>Form validation</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Advanced Features</h3>
                <ul className="space-y-2 text-sm text-gray-600 ml-4">
                  <li>AI interview engine</li>
                  <li>Real-time websockets</li>
                  <li>GitHub integration</li>
                  <li>Analytics dashboard</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}