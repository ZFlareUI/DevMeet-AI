'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/ui/navigation';
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
    { 
      label: 'Active Interviews', 
      value: stats.activeInterviews.toString(), 
      icon: PlayCircleIcon, 
      color: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600',
      textColor: 'text-cyan-300',
      hoverColor: 'hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500'
    },
    { 
      label: 'Candidates in Pipeline', 
      value: stats.candidatesInPipeline.toString(), 
      icon: UserGroupIcon, 
      color: 'bg-gradient-to-br from-purple-400 via-pink-500 to-rose-600',
      textColor: 'text-purple-300',
      hoverColor: 'hover:from-purple-300 hover:via-pink-400 hover:to-rose-500'
    },
    { 
      label: 'Interviews This Month', 
      value: stats.interviewsThisMonth.toString(), 
      icon: CalendarIcon, 
      color: 'bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-600',
      textColor: 'text-indigo-300',
      hoverColor: 'hover:from-indigo-300 hover:via-purple-400 hover:to-pink-500'
    },
    { 
      label: 'Hired This Month', 
      value: stats.hiredThisMonth.toString(), 
      icon: CheckCircleIcon, 
      color: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
      textColor: 'text-emerald-300',
      hoverColor: 'hover:from-emerald-300 hover:via-teal-400 hover:to-cyan-500'
    }
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
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role-based content */}
        {session.user.role === 'CANDIDATE' ? (
          // Candidate Dashboard
          <div className="space-y-8">
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-110">
                <UserGroupIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-4">Welcome to Your Candidate Portal</h2>
              <p className="text-lg text-purple-200 mb-8">Track your interview progress and manage your applications</p>
              
              {/* Candidate Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="bg-gradient-to-br from-black/30 via-cyan-900/20 to-black/30 backdrop-blur-md border border-cyan-500/40 hover:border-cyan-300/60 transition-all duration-300 transform hover:scale-105 shadow-xl group">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-cyan-500/25 group-hover:scale-110 transition-all duration-300">
                      <CalendarIcon className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-cyan-300 mb-2 group-hover:text-cyan-200 transition-colors duration-300">0</p>
                    <p className="text-sm text-cyan-200 group-hover:text-white transition-colors duration-300">Upcoming Interviews</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-black/30 via-purple-900/20 to-black/30 backdrop-blur-md border border-purple-500/40 hover:border-purple-300/60 transition-all duration-300 transform hover:scale-105 shadow-xl group">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-400 via-pink-500 to-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-purple-500/25 group-hover:scale-110 transition-all duration-300">
                      <ClipboardDocumentListIcon className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-purple-300 mb-2 group-hover:text-purple-200 transition-colors duration-300">0</p>
                    <p className="text-sm text-purple-200 group-hover:text-white transition-colors duration-300">Applications</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-black/30 via-emerald-900/20 to-black/30 backdrop-blur-md border border-emerald-500/40 hover:border-emerald-300/60 transition-all duration-300 transform hover:scale-105 shadow-xl group">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-emerald-500/25 group-hover:scale-110 transition-all duration-300">
                      <ChartBarIcon className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-emerald-300 mb-2 group-hover:text-emerald-200 transition-colors duration-300">-</p>
                    <p className="text-sm text-emerald-200 group-hover:text-white transition-colors duration-300">Interview Score</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-400 hover:via-purple-500 hover:to-pink-400 text-white shadow-xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300"
                  onClick={() => router.push('/profile')}
                >
                  <UserGroupIcon className="w-5 h-5 mr-2" />
                  View My Profile
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:from-purple-400 hover:via-indigo-500 hover:to-cyan-400 text-white shadow-xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
                  onClick={() => router.push('/jobs')}
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Browse Job Opportunities
                </Button>
                <Link href="/interviews">
                  <Button 
                    className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-500 hover:from-emerald-400 hover:via-teal-500 hover:to-cyan-400 text-white shadow-xl hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300"
                  >
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    My Interviews
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Recruiter/Admin Dashboard
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsConfig.map((stat, index) => (
                <Card key={index} className="bg-gradient-to-br from-black/30 via-purple-900/20 to-black/30 backdrop-blur-md border border-purple-500/40 hover:border-cyan-400/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 shadow-xl hover:shadow-2xl group">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className={`w-14 h-14 ${stat.color} ${stat.hoverColor} rounded-xl flex items-center justify-center shadow-xl group-hover:shadow-lg transition-all duration-300 border border-white/10`}>
                        <stat.icon className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm font-medium ${stat.textColor} group-hover:text-white transition-colors duration-300`}>{stat.label}</p>
                        <p className="text-3xl font-bold text-white group-hover:text-cyan-100 transition-colors duration-300">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Interviews */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-black/30 via-purple-900/20 to-black/30 backdrop-blur-md border border-purple-500/40 shadow-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">Recent Interviews</h2>
                  <Link href="/interviews">
                    <Button variant="outline" size="sm" className="border-gradient-to-r border-purple-400/50 text-purple-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105">View All</Button>
                  </Link>
                </div>
                {recentInterviews.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                    <p className="text-purple-200 mb-2 text-lg">No interviews scheduled yet</p>
                    <p className="text-purple-300 mb-6 text-sm">Start building your interview pipeline</p>
                    <Link href="/interviews/new">
                      <Button className="bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-400 hover:via-purple-500 hover:to-pink-400 text-white shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105">Schedule Your First Interview</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentInterviews.map((interview) => (
                      <div key={interview.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-black/30 to-purple-900/30 rounded-lg hover:from-black/40 hover:to-purple-900/40 transition-all duration-300 border border-purple-500/30 hover:border-cyan-400/50 group">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/25 group-hover:scale-110 transition-all duration-300">
                            <span className="text-white font-semibold text-sm">{interview.candidateAvatar}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-cyan-100 transition-colors duration-300">{interview.candidateName}</h3>
                            <p className="text-sm text-purple-200 group-hover:text-purple-100 transition-colors duration-300">{interview.title}</p>
                            <p className="text-xs text-purple-300 group-hover:text-cyan-300 transition-colors duration-300">
                              {new Date(interview.scheduledAt).toLocaleDateString()} at{' '}
                              {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            {interview.score && (
                              <p className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">Score: {interview.score}/10</p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm transition-all duration-300 ${
                            interview.status === 'completed' ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-400/40' :
                            interview.status === 'in-progress' ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-400/40' :
                            interview.status === 'scheduled' ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-400/40' :
                            'bg-gradient-to-r from-gray-500/30 to-slate-500/30 text-gray-300 border border-gray-400/40'
                          }`}>
                            {interview.status}
                          </span>
                          <Link href={`/interviews/${interview.id}`}>
                            <Button variant="outline" size="sm" className="border-purple-400/50 text-purple-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105">
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
            <Card className="mt-6 bg-gradient-to-br from-black/30 via-indigo-900/20 to-black/30 backdrop-blur-md border border-indigo-500/40 shadow-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent">Hiring Analytics</h2>
                  <Link href="/analytics">
                    <Button variant="outline" size="sm" className="border-indigo-400/50 text-indigo-300 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105">View Analytics</Button>
                  </Link>
                </div>
                <div className="h-64 bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-cyan-900/30 rounded-lg flex items-center justify-center border border-gradient-to-r border-indigo-500/30 hover:border-cyan-400/50 transition-all duration-300 group">
                  <div className="text-center">
                    <ChartBarIcon className="w-20 h-20 text-indigo-400 mx-auto mb-4 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300" />
                    <p className="text-indigo-200 mb-2 text-lg group-hover:text-white transition-colors duration-300">Hiring metrics and performance insights</p>
                    <p className="text-sm text-indigo-300 mb-4 group-hover:text-cyan-300 transition-colors duration-300">Candidate pipeline, interview scores, hiring funnel</p>
                    <Link href="/analytics">
                      <Button className="bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 hover:from-indigo-400 hover:via-purple-500 hover:to-cyan-400 text-white shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-105">View Full Analytics</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Candidates Sidebar */}
          <div>
            <Card className="bg-gradient-to-br from-black/30 via-rose-900/20 to-black/30 backdrop-blur-md border border-rose-500/40 shadow-xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-white via-rose-200 to-pink-200 bg-clip-text text-transparent mb-6">Top Candidates</h2>
                {topCandidates.length === 0 ? (
                  <div className="text-center py-8">
                    <UserGroupIcon className="w-16 h-16 text-rose-400 mx-auto mb-4" />
                    <p className="text-rose-200 mb-2 text-lg">No candidates yet</p>
                    <p className="text-rose-300 mb-6 text-sm">Start building your talent pipeline</p>
                    <Link href="/candidates/new">
                      <Button className="bg-gradient-to-r from-rose-500 via-pink-600 to-purple-500 hover:from-rose-400 hover:via-pink-500 hover:to-purple-400 text-white shadow-xl hover:shadow-rose-500/25 transition-all duration-300 hover:scale-105">Add Your First Candidate</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topCandidates.map((candidate) => (
                      <div key={candidate.id} className="p-4 border border-rose-500/30 bg-gradient-to-r from-black/30 to-rose-900/30 rounded-lg hover:from-black/40 hover:to-rose-900/40 transition-all duration-300 hover:border-pink-400/50 group">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-rose-100 transition-colors duration-300">{candidate.name}</h3>
                            <p className="text-sm text-rose-200 group-hover:text-rose-100 transition-colors duration-300">{candidate.email}</p>
                          </div>
                          <div className="text-right">
                            {candidate.githubScore && (
                              <>
                                <p className="text-lg font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">{candidate.githubScore.toFixed(1)}</p>
                                <p className="text-xs text-rose-300 group-hover:text-pink-300 transition-colors duration-300">GitHub Score</p>
                              </>
                            )}
                          </div>
                        </div>
                        {candidate.githubUrl && (
                          <div className="mb-3">
                            <p className="text-xs text-rose-300 mb-1 group-hover:text-pink-300 transition-colors duration-300">
                              GitHub: @{candidate.githubUrl.split('/').pop()}
                            </p>
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-rose-400/50 text-rose-300 hover:text-white hover:bg-gradient-to-r hover:from-rose-500/20 hover:to-pink-500/20 hover:border-pink-400/50 transition-all duration-300 hover:scale-105"
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
            <Card className="mt-6 bg-gradient-to-br from-black/30 via-teal-900/20 to-black/30 backdrop-blur-md border border-teal-500/40 shadow-xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-white via-teal-200 to-cyan-200 bg-clip-text text-transparent mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link href="/candidates/new">
                    <Button variant="outline" className="w-full justify-start border-teal-400/50 text-teal-300 hover:text-white hover:bg-gradient-to-r hover:from-teal-500/20 hover:to-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 group">
                      <UserGroupIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Add New Candidate
                    </Button>
                  </Link>
                  <Link href="/interviews/new">
                    <Button variant="outline" className="w-full justify-start border-cyan-400/50 text-cyan-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 group">
                      <CalendarIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Schedule Interview
                    </Button>
                  </Link>
                  <Link href="/analytics">
                    <Button variant="outline" className="w-full justify-start border-indigo-400/50 text-indigo-300 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/20 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 group">
                      <ChartBarIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      View Analytics
                    </Button>
                  </Link>
                  <Link href="/candidates">
                    <Button variant="outline" className="w-full justify-start border-purple-400/50 text-purple-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 hover:border-pink-400/50 transition-all duration-300 hover:scale-105 group">
                      <ClipboardDocumentListIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Manage Candidates
                    </Button>
                  </Link>
                  <Link href="/jobs">
                    <Button variant="outline" className="w-full justify-start border-emerald-400/50 text-emerald-300 hover:text-white hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-teal-500/20 hover:border-teal-400/50 transition-all duration-300 hover:scale-105 group">
                      <ClipboardDocumentListIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Manage Jobs
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button variant="outline" className="w-full justify-start border-pink-400/50 text-pink-300 hover:text-white hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-rose-500/20 hover:border-rose-400/50 transition-all duration-300 hover:scale-105 group">
                      <PlayCircleIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Explore Features
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