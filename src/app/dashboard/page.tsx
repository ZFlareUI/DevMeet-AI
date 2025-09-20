'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  PlayCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import type { Candidate, Interview } from '@/lib/validation';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    activeInterviews: 0,
    candidatesInPipeline: 0,
    interviewsThisMonth: 0,
    hiredThisMonth: 0
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }

    loadDashboardData();
  }, [session, status, router]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [candidatesResponse, interviewsResponse] = await Promise.all([
        api.candidates.getAll(),
        api.interviews.getAll()
      ]);

      if (candidatesResponse.success) {
        setCandidates(candidatesResponse.data);
      } else {
        showToast(candidatesResponse.error || 'Failed to load candidates', 'error');
      }

      if (interviewsResponse.success) {
        setInterviews(interviewsResponse.data);
      } else {
        showToast(interviewsResponse.error || 'Failed to load interviews', 'error');
      }

      // Calculate stats
      const candidatesData = candidatesResponse.success ? candidatesResponse.data : [];
      const interviewsData = interviewsResponse.success ? interviewsResponse.data : [];
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      setStats({
        activeInterviews: interviewsData.filter(i => i.status === 'scheduled' || i.status === 'in-progress').length,
        candidatesInPipeline: candidatesData.filter(c => c.status === 'active').length,
        interviewsThisMonth: interviewsData.filter(i => {
          const interviewDate = new Date(i.scheduledAt);
          return interviewDate.getMonth() === currentMonth && interviewDate.getFullYear() === currentYear;
        }).length,
        hiredThisMonth: candidatesData.filter(c => {
          if (c.status !== 'hired' || !c.updatedAt) return false;
          const hiredDate = new Date(c.updatedAt);
          return hiredDate.getMonth() === currentMonth && hiredDate.getFullYear() === currentYear;
        }).length
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleInterview = async (candidateId: string) => {
    try {
      router.push(`/interviews/new?candidateId=${candidateId}`);
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      showToast('Failed to schedule interview', 'error');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/candidates?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  const statsConfig = [
    { label: 'Active Interviews', value: stats.activeInterviews.toString(), icon: PlayCircleIcon, color: 'bg-blue-500' },
    { label: 'Candidates in Pipeline', value: stats.candidatesInPipeline.toString(), icon: UserGroupIcon, color: 'bg-green-500' },
    { label: 'Interviews This Month', value: stats.interviewsThisMonth.toString(), icon: CalendarIcon, color: 'bg-purple-500' },
    { label: 'Hired This Month', value: stats.hiredThisMonth.toString(), icon: CheckCircleIcon, color: 'bg-orange-500' }
  ];

  const recentInterviews = interviews
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 5)
    .map(interview => {
      const candidate = candidates.find(c => c.id === interview.candidateId);
      return {
        ...interview,
        candidateName: candidate?.name || 'Unknown Candidate',
        candidateAvatar: candidate?.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'UK'
      };
    });

  const topCandidates = candidates
    .filter(c => c.status === 'active')
    .sort((a, b) => (b.githubScore || 0) - (a.githubScore || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DA</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">DevMeet AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search candidates..." 
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Link href="/interviews/create">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Interview
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Interviews */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Interviews</h2>
                  <Link href="/interviews">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentInterviews.map((interview) => (
                    <div key={interview.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{interview.avatar}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{interview.candidate}</h3>
                          <p className="text-sm text-gray-600">{interview.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{interview.time}</p>
                          {interview.score && (
                            <p className="text-sm font-semibold text-green-600">Score: {interview.score}/10</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          interview.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          interview.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {interview.status}
                        </span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Analytics Chart Placeholder */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Hiring Analytics</h2>
                  <Link href="/analytics">
                    <Button variant="outline" size="sm">View Analytics</Button>
                  </Link>
                </div>
                <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Hiring metrics and performance insights</p>
                    <p className="text-sm text-gray-500">Candidate pipeline, interview scores, hiring funnel</p>
                    <Link href="/analytics">
                      <Button className="mt-4">View Full Analytics</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Candidates Sidebar */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Candidates</h2>
                <div className="space-y-4">
                  {topCandidates.map((candidate, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                          <p className="text-sm text-gray-600">{candidate.position}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{candidate.score}</p>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">GitHub: @{candidate.github}</p>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.map((skill, skillIndex) => (
                            <span key={skillIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        Schedule Interview
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                    Create Job Posting
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Manage Team
                  </Button>
                  <Link href="/analytics">
                    <Button variant="outline" className="w-full justify-start">
                      <ChartBarIcon className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}