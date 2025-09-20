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
  const { addToast } = useToast();
  
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
      
      // Check user role and load appropriate data
      if (!session?.user?.role) {
        addToast({ message: 'User role not found', type: 'error' });
        return;
      }

      const userRole = session.user.role;
      
      // Only load candidates and interviews for authorized roles
      if (['ADMIN', 'RECRUITER', 'INTERVIEWER'].includes(userRole)) {
        const [candidatesResponse, interviewsResponse] = await Promise.all([
          api.candidates.getAll(),
          api.interviews.getAll()
        ]);

        if (candidatesResponse.success) {
          setCandidates(candidatesResponse.data);
        } else {
          addToast({ message: candidatesResponse.error || 'Failed to load candidates', type: 'error' });
        }

        if (interviewsResponse.success) {
          setInterviews(interviewsResponse.data);
        } else {
          addToast({ message: interviewsResponse.error || 'Failed to load interviews', type: 'error' });
        }

        // Calculate stats
        const candidatesData = candidatesResponse.success ? candidatesResponse.data : [];
        const interviewsData = interviewsResponse.success ? interviewsResponse.data : [];
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        setStats({
          activeInterviews: interviewsData.filter((i: Interview) => i.status === 'scheduled' || i.status === 'in-progress').length,
          candidatesInPipeline: candidatesData.filter((c: Candidate) => !['HIRED', 'REJECTED'].includes(c.status)).length,
          interviewsThisMonth: interviewsData.filter((i: Interview) => {
            const interviewDate = new Date(i.scheduledAt);
            return interviewDate.getMonth() === currentMonth && interviewDate.getFullYear() === currentYear;
          }).length,
          hiredThisMonth: candidatesData.filter((c: Candidate) => {
            if (c.status !== 'HIRED' || !c.updatedAt) return false;
            const hiredDate = new Date(c.updatedAt);
            return hiredDate.getMonth() === currentMonth && hiredDate.getFullYear() === currentYear;
          }).length
        });
      } else if (userRole === 'CANDIDATE') {
        // Load candidate-specific data (their own interviews, applications, etc.)
        setStats({
          activeInterviews: 0,
          candidatesInPipeline: 0,
          interviewsThisMonth: 0,
          hiredThisMonth: 0
        });
        
        addToast({ 
          message: 'Welcome to your candidate dashboard!', 
          type: 'success' 
        });
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      addToast({ message: 'Failed to load dashboard data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleInterview = async (candidateId: string) => {
    try {
      router.push(`/interviews/new?candidateId=${candidateId}`);
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      addToast({ message: 'Failed to schedule interview', type: 'error' });
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
      <div className="min-h-screen bg-gradient-to-br from-[#0D001A] via-[#1A0B2E] to-[#2D1B69] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-cyan-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  const statsConfig = [
    { label: 'Active Interviews', value: stats.activeInterviews.toString(), icon: PlayCircleIcon, color: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
    { label: 'Candidates in Pipeline', value: stats.candidatesInPipeline.toString(), icon: UserGroupIcon, color: 'bg-gradient-to-r from-purple-500 to-indigo-500' },
    { label: 'Interviews This Month', value: stats.interviewsThisMonth.toString(), icon: CalendarIcon, color: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
    { label: 'Hired This Month', value: stats.hiredThisMonth.toString(), icon: CheckCircleIcon, color: 'bg-gradient-to-r from-emerald-500 to-cyan-500' }
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
    .filter(c => !['HIRED', 'REJECTED'].includes(c.status))
    .sort((a, b) => (b.githubScore || 0) - (a.githubScore || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D001A] via-[#1A0B2E] to-[#2D1B69]">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-purple-500/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">DA</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">DevMeet AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" />
                <input 
                  type="text" 
                  placeholder="Search candidates..." 
                  className="pl-10 pr-4 py-2 bg-black/30 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-purple-300 backdrop-blur-sm"
                />
              </div>
              <Link href="/features">
                <Button variant="outline" className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20 backdrop-blur-sm">
                  Features
                </Button>
              </Link>
              <Link href="/interviews/create">
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 shadow-lg text-white">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Interview
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role-based content */}
        {session.user.role === 'CANDIDATE' ? (
          // Candidate Dashboard
          <div className="space-y-8">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <UserGroupIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-4">Welcome to Your Candidate Portal</h2>
              <p className="text-lg text-purple-200 mb-8">Track your interview progress and manage your applications</p>
              
              {/* Candidate Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 hover:bg-black/30 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-cyan-300 mb-2">0</p>
                    <p className="text-sm text-purple-200">Upcoming Interviews</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 hover:bg-black/30 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-purple-300 mb-2">0</p>
                    <p className="text-sm text-purple-200">Applications</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 hover:bg-black/30 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <ChartBarIcon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-emerald-300 mb-2">-</p>
                    <p className="text-sm text-purple-200">Interview Score</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-xl transform hover:scale-105 transition-all duration-300"
                  onClick={() => router.push('/profile')}
                >
                  <UserGroupIcon className="w-5 h-5 mr-2" />
                  View My Profile
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-xl transform hover:scale-105 transition-all duration-300"
                  onClick={() => router.push('/jobs')}
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Apply for Interview
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Recruiter/Admin Dashboard
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsConfig.map((stat, index) => (
                <Card key={index} className="bg-black/20 backdrop-blur-sm border-purple-500/30 hover:bg-black/30 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-200">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Interviews */}
          <div className="lg:col-span-2">
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Recent Interviews</h2>
                  <Link href="/interviews">
                    <Button variant="outline" size="sm" className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20">View All</Button>
                  </Link>
                </div>
                {recentInterviews.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                    <p className="text-purple-200 mb-2">No interviews scheduled yet</p>
                    <Link href="/interviews/new">
                      <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white">Schedule Your First Interview</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentInterviews.map((interview) => (
                      <div key={interview.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg hover:bg-black/30 transition-colors border border-purple-500/20">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{interview.candidateAvatar}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{interview.candidateName}</h3>
                            <p className="text-sm text-purple-200">{interview.title}</p>
                            <p className="text-xs text-purple-300">
                              {new Date(interview.scheduledAt).toLocaleDateString()} at{' '}
                              {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            {interview.score && (
                              <p className="text-sm font-semibold text-emerald-400">Score: {interview.score}/10</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            interview.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            interview.status === 'in-progress' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                            interview.status === 'scheduled' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {interview.status}
                          </span>
                          <Link href={`/interviews/${interview.id}`}>
                            <Button variant="outline" size="sm" className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analytics Chart Placeholder */}
            <Card className="mt-6 bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Hiring Analytics</h2>
                  <Link href="/analytics">
                    <Button variant="outline" size="sm" className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20">View Analytics</Button>
                  </Link>
                </div>
                <div className="h-64 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-lg flex items-center justify-center border border-purple-500/20">
                  <div className="text-center">
                    <ChartBarIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                    <p className="text-purple-200">Hiring metrics and performance insights</p>
                    <p className="text-sm text-purple-300">Candidate pipeline, interview scores, hiring funnel</p>
                    <Link href="/analytics">
                      <Button className="mt-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">View Full Analytics</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Candidates Sidebar */}
          <div>
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Top Candidates</h2>
                {topCandidates.length === 0 ? (
                  <div className="text-center py-8">
                    <UserGroupIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                    <p className="text-purple-200 mb-2">No candidates yet</p>
                    <Link href="/candidates/new">
                      <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white">Add Your First Candidate</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topCandidates.map((candidate) => (
                      <div key={candidate.id} className="p-4 border border-purple-500/30 bg-black/20 rounded-lg hover:bg-black/30 transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-white">{candidate.name}</h3>
                            <p className="text-sm text-purple-200">{candidate.email}</p>
                          </div>
                          <div className="text-right">
                            {candidate.githubScore && (
                              <>
                                <p className="text-lg font-bold text-emerald-400">{candidate.githubScore.toFixed(1)}</p>
                                <p className="text-xs text-purple-300">GitHub Score</p>
                              </>
                            )}
                          </div>
                        </div>
                        {candidate.githubUrl && (
                          <div className="mb-3">
                            <p className="text-xs text-purple-300 mb-1">
                              GitHub: @{candidate.githubUrl.split('/').pop()}
                            </p>
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-purple-400/50 text-purple-300 hover:bg-purple-500/20"
                          onClick={() => handleScheduleInterview(candidate.id)}
                        >
                          Schedule Interview
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6 bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link href="/candidates/new">
                    <Button variant="outline" className="w-full justify-start border-purple-400/50 text-purple-300 hover:bg-purple-500/20">
                      <UserGroupIcon className="w-4 h-4 mr-2" />
                      Add New Candidate
                    </Button>
                  </Link>
                  <Link href="/interviews/new">
                    <Button variant="outline" className="w-full justify-start border-purple-400/50 text-purple-300 hover:bg-purple-500/20">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Schedule Interview
                    </Button>
                  </Link>
                  <Link href="/analytics">
                    <Button variant="outline" className="w-full justify-start border-purple-400/50 text-purple-300 hover:bg-purple-500/20">
                      <ChartBarIcon className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                  </Link>
                  <Link href="/candidates">
                    <Button variant="outline" className="w-full justify-start border-purple-400/50 text-purple-300 hover:bg-purple-500/20">
                      <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                      Manage Candidates
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}