'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/ui/navigation';
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
        return <CheckCircleIcon className="w-5 h-5 text-cyan-400" />;
      case 'testing':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />;
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
    <div className="min-h-screen bg-gradient-to-br from-[#0D001A] via-[#1A0B2E] to-[#2D1B69]">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            DevMeet AI Features
          </h1>
          <p className="text-lg text-purple-200 mb-2">
            Complete production-ready platform with real-world logic implementation
          </p>
          {session && (
            <p className="text-sm text-cyan-300">
              Welcome back, {session.user?.name}! Your role: <span className="font-medium text-purple-300">{session.user?.role || 'User'}</span>
            </p>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const status = featureStatus[feature.id] || 'planned';
            
            // Unique gradient combinations for each feature
            const gradientCombinations = [
              'from-cyan-400 via-blue-500 to-indigo-600', // Authentication
              'from-purple-400 via-pink-500 to-rose-600', // Candidate Management
              'from-indigo-400 via-purple-500 to-pink-600', // Interview Scheduling
              'from-emerald-400 via-teal-500 to-cyan-600', // AI Interviewer
              'from-orange-400 via-amber-500 to-yellow-600', // Analytics
              'from-violet-400 via-fuchsia-500 to-pink-600' // GitHub Integration
            ];
            
            const gradient = gradientCombinations[index % gradientCombinations.length];
            
            return (
              <Card key={feature.id} className="bg-gradient-to-br from-black/30 via-purple-900/20 to-black/30 backdrop-blur-md border border-purple-500/40 hover:border-cyan-400/60 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-xl hover:shadow-2xl group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status)}
                      <span className="text-xs font-medium text-purple-300 group-hover:text-cyan-300 transition-colors duration-300">
                        {getStatusText(status)}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-100 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-purple-200 text-sm mb-4 group-hover:text-purple-100 transition-colors duration-300">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-2 mb-6">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center text-sm text-purple-300 group-hover:text-cyan-200 transition-colors duration-300">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 group-hover:text-emerald-300 transition-colors duration-300" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                  
                  <Link href={feature.link}>
                    <Button 
                      variant="outline" 
                      className="w-full border-purple-500/40 text-purple-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <Card className="bg-gradient-to-br from-black/30 via-emerald-900/20 to-black/30 backdrop-blur-md border border-emerald-500/40 shadow-xl mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-white via-emerald-200 to-cyan-200 bg-clip-text text-transparent mb-6">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-emerald-500/25 group-hover:scale-110 transition-all duration-300">
                  <CheckCircleIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-medium text-white mb-2 group-hover:text-emerald-100 transition-colors duration-300">API Services</h3>
                <p className="text-sm text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">All systems operational</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-purple-500/25 group-hover:scale-110 transition-all duration-300">
                  <CheckCircleIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-medium text-white mb-2 group-hover:text-purple-100 transition-colors duration-300">Database</h3>
                <p className="text-sm text-purple-300 group-hover:text-purple-200 transition-colors duration-300">Connected and healthy</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-amber-500/25 group-hover:scale-110 transition-all duration-300">
                  <ExclamationTriangleIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-medium text-white mb-2 group-hover:text-amber-100 transition-colors duration-300">AI Services</h3>
                <p className="text-sm text-amber-300 group-hover:text-amber-200 transition-colors duration-300">Beta testing mode</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Readiness Checklist */}
        <Card className="bg-gradient-to-br from-black/30 via-indigo-900/20 to-black/30 backdrop-blur-md border border-indigo-500/40 shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent mb-6">Production Readiness Checklist</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 group">
                <h3 className="font-medium text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 mr-2 text-emerald-400" />
                  Security & Authentication
                </h3>
                <ul className="space-y-2 text-sm text-purple-200 ml-7">
                  <li className="group-hover:text-purple-100 transition-colors duration-300">NextAuth.js implementation</li>
                  <li className="group-hover:text-purple-100 transition-colors duration-300">Role-based access control</li>
                  <li className="group-hover:text-purple-100 transition-colors duration-300">API route protection</li>
                  <li className="group-hover:text-purple-100 transition-colors duration-300">Input validation with Zod</li>
                </ul>
              </div>
              <div className="space-y-4 group">
                <h3 className="font-medium text-purple-400 group-hover:text-purple-300 transition-colors duration-300 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 mr-2 text-emerald-400" />
                  User Experience
                </h3>
                <ul className="space-y-2 text-sm text-purple-200 ml-7">
                  <li className="group-hover:text-purple-100 transition-colors duration-300">Responsive design</li>
                  <li className="group-hover:text-purple-100 transition-colors duration-300">Loading states</li>
                  <li className="group-hover:text-purple-100 transition-colors duration-300">Error handling</li>
                  <li className="group-hover:text-purple-100 transition-colors duration-300">Toast notifications</li>
                </ul>
              </div>
              <div className="space-y-4 group">
                <h3 className="font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 mr-2 text-emerald-400" />
                  Data Management
                </h3>
                <ul className="space-y-2 text-sm text-purple-200 ml-7">
                  <li className="group-hover:text-purple-100 transition-colors duration-300">Prisma ORM setup</li>
                  <li className="group-hover:text-purple-100 transition-colors duration-300">Database schema</li>
                  <li className="group-hover:text-purple-100 transition-colors duration-300">API standardization</li>
                  <li className="group-hover:text-purple-100 transition-colors duration-300">Form validation</li>
                </ul>
              </div>
              <div className="space-y-4 group">
                <h3 className="font-medium text-pink-400 group-hover:text-pink-300 transition-colors duration-300 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 mr-2 text-emerald-400" />
                  Advanced Features
                </h3>
                <ul className="space-y-2 text-sm text-purple-200 ml-7">
                  <li className="group-hover:text-purple-100 transition-colors duration-300">AI interview engine</li>
                  <li className="group-hover:text-purple-100 transition-colors duration-300">Real-time websockets</li>
                  <li className="group-hover:text-purple-100 transition-colors duration-300">GitHub integration</li>
                  <li className="group-hover:text-purple-100 transition-colors duration-300">Analytics dashboard</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}