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
  PlusIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import type { Candidate, Interview } from '@/lib/api';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

        if (candidatesResponse.success && candidatesResponse.data) {
          setCandidates(candidatesResponse.data);
        } else {
          addToast({ message: candidatesResponse.error || 'Failed to load candidates', type: 'error' });
        }

        if (interviewsResponse.success && interviewsResponse.data) {
          setInterviews(interviewsResponse.data);
        } else {
          addToast({ message: interviewsResponse.error || 'Failed to load interviews', type: 'error' });
        }

        // Calculate stats
        const candidatesData = candidatesResponse.success && candidatesResponse.data ? candidatesResponse.data : [];
        const interviewsData = interviewsResponse.success && interviewsResponse.data ? interviewsResponse.data : [];
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        setStats({
          activeInterviews: interviewsData.filter((i: Interview) => i.status === 'scheduled' || i.status === 'in-progress').length,
          candidatesInPipeline: candidatesData.filter((c: Candidate) => c.status && !['HIRED', 'REJECTED'].includes(c.status)).length,
          interviewsThisMonth: interviewsData.filter((i: Interview) => {
            if (!i.scheduledAt) return false;
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-blue-300">Loading dashboard...</p>
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
      color: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600',
      textColor: 'text-blue-300',
      hoverColor: 'hover:from-blue-400 hover:via-blue-500 hover:to-indigo-500'
    },
    { 
      label: 'Candidates in Pipeline', 
      value: stats.candidatesInPipeline.toString(), 
      icon: UserGroupIcon, 
      color: 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600',
      textColor: 'text-purple-300',
      hoverColor: 'hover:from-purple-400 hover:via-purple-500 hover:to-indigo-500'
    },
    { 
      label: 'Interviews This Month', 
      value: stats.interviewsThisMonth.toString(), 
      icon: CalendarIcon, 
      color: 'bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600',
      textColor: 'text-indigo-300',
      hoverColor: 'hover:from-indigo-400 hover:via-purple-500 hover:to-blue-500'
    },
    { 
      label: 'Hired This Month', 
      value: stats.hiredThisMonth.toString(), 
      icon: CheckCircleIcon, 
      color: 'bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-600',
      textColor: 'text-emerald-300',
      hoverColor: 'hover:from-emerald-400 hover:via-blue-500 hover:to-indigo-500'
    }
  ];

  const recentInterviews = interviews
    .filter(interview => interview.scheduledAt)
    .sort((a, b) => new Date(b.scheduledAt!).getTime() - new Date(a.scheduledAt!).getTime())
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role-based content */}
        {session.user.role === 'CANDIDATE' ? (
          // Candidate Dashboard
          <div className="space-y-8">
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-110">
                <UserGroupIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">Welcome to Your Candidate Portal</h2>
              <p className="text-lg text-slate-300 mb-8">Track your interview progress and manage your applications</p>
              
              {/* Candidate Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-blue-500/40 hover:border-blue-300/60 transition-all duration-300 transform hover:scale-105 shadow-xl group">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-blue-500/25 group-hover:scale-110 transition-all duration-300">
                      <CalendarIcon className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-blue-300 mb-2 group-hover:text-blue-200 transition-colors duration-300">0</p>
                    <p className="text-sm text-blue-200 group-hover:text-white transition-colors duration-300">Upcoming Interviews</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-purple-500/40 hover:border-purple-300/60 transition-all duration-300 transform hover:scale-105 shadow-xl group">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-purple-500/25 group-hover:scale-110 transition-all duration-300">
                      <ClipboardDocumentListIcon className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-purple-300 mb-2 group-hover:text-purple-200 transition-colors duration-300">0</p>
                    <p className="text-sm text-purple-200 group-hover:text-white transition-colors duration-300">Applications</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-emerald-500/40 hover:border-emerald-300/60 transition-all duration-300 transform hover:scale-105 shadow-xl group">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-emerald-500/25 group-hover:scale-110 transition-all duration-300">
                      <ChartBarIcon className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-emerald-300 mb-2 group-hover:text-emerald-200 transition-colors duration-300">-</p>
                    <p className="text-sm text-emerald-200 group-hover:text-white transition-colors duration-300">Interview Score</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
                  onClick={() => router.push('/profile')}
                >
                  <UserGroupIcon className="w-5 h-5 mr-2" />
                  View My Profile
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white shadow-xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
                  onClick={() => router.push('/jobs')}
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Browse Job Opportunities
                </Button>
                <Link href="/interviews">
                  <Button 
                    className="bg-gradient-to-r from-emerald-500 via-blue-600 to-indigo-600 hover:from-emerald-400 hover:via-blue-500 hover:to-indigo-500 text-white shadow-xl hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300"
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
                <Card key={index} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-slate-700/50 hover:border-blue-500/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 shadow-xl hover:shadow-2xl group">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className={`w-14 h-14 ${stat.color} ${stat.hoverColor} rounded-xl flex items-center justify-center shadow-xl group-hover:shadow-lg transition-all duration-300 border border-white/10`}>
                        <stat.icon className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm font-medium ${stat.textColor} group-hover:text-white transition-colors duration-300`}>{stat.label}</p>
                        <p className="text-3xl font-bold text-white group-hover:text-blue-100 transition-colors duration-300">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Interviews */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-slate-700/50 shadow-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">Recent Interviews</h2>
                  <Link href="/interviews">
                    <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105">View All</Button>
                  </Link>
                </div>
                {recentInterviews.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <p className="text-slate-200 mb-2 text-lg">No interviews scheduled yet</p>
                    <p className="text-slate-300 mb-6 text-sm">Start building your interview pipeline</p>
                    <Link href="/interviews/new">
                      <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">Schedule Your First Interview</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentInterviews.map((interview) => (
                      <div key={interview.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg hover:from-slate-700/60 hover:to-slate-600/60 transition-all duration-300 border border-slate-600/50 hover:border-blue-500/50 group">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 group-hover:scale-110 transition-all duration-300">
                            <span className="text-white font-semibold text-sm">{interview.candidateAvatar}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-blue-100 transition-colors duration-300">{interview.candidateName}</h3>
                            <p className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors duration-300">{interview.title}</p>
                            <p className="text-xs text-slate-400 group-hover:text-blue-300 transition-colors duration-300">
                              {interview.scheduledAt ? (
                                <>
                                  {new Date(interview.scheduledAt).toLocaleDateString()} at{' '}
                                  {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </>
                              ) : (
                                'Not scheduled'
                              )}
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
                            interview.status === 'completed' ? 'bg-gradient-to-r from-emerald-500/30 to-green-500/30 text-emerald-300 border border-emerald-400/40' :
                            interview.status === 'in-progress' ? 'bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-300 border border-blue-400/40' :
                            interview.status === 'scheduled' ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-400/40' :
                            'bg-gradient-to-r from-slate-500/30 to-gray-500/30 text-slate-300 border border-slate-400/40'
                          }`}>
                            {interview.status}
                          </span>
                          <Link href={`/interviews/${interview.id}`}>
                            <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
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
            <Card className="mt-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-slate-700/50 shadow-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">Hiring Analytics</h2>
                  <Link href="/analytics">
                    <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105">View Analytics</Button>
                  </Link>
                </div>
                <div className="h-64 bg-gradient-to-br from-slate-800/60 via-indigo-900/40 to-slate-800/60 rounded-lg flex items-center justify-center border border-slate-600/50 hover:border-blue-500/50 transition-all duration-300 group">
                  <div className="text-center">
                    <ChartBarIcon className="w-20 h-20 text-blue-400 mx-auto mb-4 group-hover:text-blue-300 group-hover:scale-110 transition-all duration-300" />
                    <p className="text-slate-200 mb-2 text-lg group-hover:text-white transition-colors duration-300">Hiring metrics and performance insights</p>
                    <p className="text-sm text-slate-300 mb-4 group-hover:text-blue-300 transition-colors duration-300">Candidate pipeline, interview scores, hiring funnel</p>
                    <Link href="/analytics">
                      <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">View Full Analytics</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Candidates Sidebar */}
          <div>
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-slate-700/50 shadow-xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent mb-6">Top Candidates</h2>
                {topCandidates.length === 0 ? (
                  <div className="text-center py-8">
                    <UserGroupIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <p className="text-slate-200 mb-2 text-lg">No candidates yet</p>
                    <p className="text-slate-300 mb-6 text-sm">Start building your talent pipeline</p>
                    <Link href="/candidates/new">
                      <Button className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105">Add Your First Candidate</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topCandidates.map((candidate) => (
                      <div key={candidate.id} className="p-4 border border-slate-600/50 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-lg hover:from-slate-700/70 hover:to-slate-600/70 transition-all duration-300 hover:border-purple-500/50 group">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-purple-100 transition-colors duration-300">{candidate.name}</h3>
                            <p className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors duration-300">{candidate.email}</p>
                          </div>
                          <div className="text-right">
                            {candidate.githubScore && (
                              <>
                                <p className="text-lg font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">{candidate.githubScore.toFixed(1)}</p>
                                <p className="text-xs text-slate-400 group-hover:text-purple-300 transition-colors duration-300">GitHub Score</p>
                              </>
                            )}
                          </div>
                        </div>
                        {candidate.githubUrl && (
                          <div className="mb-3">
                            <p className="text-xs text-slate-400 mb-1 group-hover:text-purple-300 transition-colors duration-300">
                              GitHub: @{candidate.githubUrl.split('/').pop()}
                            </p>
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105"
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
            <Card className="mt-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-slate-700/50 shadow-xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-white via-blue-200 to-indigo-200 bg-clip-text text-transparent mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link href="/candidates/new">
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 group">
                      <UserGroupIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Add New Candidate
                    </Button>
                  </Link>
                  <Link href="/interviews/new">
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 group">
                      <CalendarIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Schedule Interview
                    </Button>
                  </Link>
                  <Link href="/analytics">
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 group">
                      <ChartBarIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      View Analytics
                    </Button>
                  </Link>
                  <Link href="/candidates">
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 group">
                      <ClipboardDocumentListIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Manage Candidates
                    </Button>
                  </Link>
                  <Link href="/jobs">
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 group">
                      <ClipboardDocumentListIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Manage Jobs
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 group">
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