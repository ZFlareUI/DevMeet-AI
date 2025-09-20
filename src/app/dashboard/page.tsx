'use client';

import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  PlayCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Dashboard() {
  const stats = [
    { label: 'Active Interviews', value: '12', icon: PlayCircleIcon, color: 'bg-blue-500' },
    { label: 'Candidates in Pipeline', value: '48', icon: UserGroupIcon, color: 'bg-green-500' },
    { label: 'Interviews This Month', value: '89', icon: CalendarIcon, color: 'bg-purple-500' },
    { label: 'Hired This Month', value: '15', icon: CheckCircleIcon, color: 'bg-orange-500' }
  ];

  const recentInterviews = [
    { 
      id: 1, 
      candidate: 'Sarah Chen', 
      position: 'Frontend Developer', 
      status: 'In Progress', 
      score: null,
      time: '2:30 PM',
      avatar: 'SC'
    },
    { 
      id: 2, 
      candidate: 'Michael Rodriguez', 
      position: 'Full Stack Engineer', 
      status: 'Completed', 
      score: 8.7,
      time: '11:45 AM',
      avatar: 'MR'
    },
    { 
      id: 3, 
      candidate: 'Emily Johnson', 
      position: 'DevOps Engineer', 
      status: 'Scheduled', 
      score: null,
      time: '4:00 PM',
      avatar: 'EJ'
    }
  ];

  const topCandidates = [
    { 
      name: 'Alex Thompson', 
      position: 'Backend Developer', 
      score: 9.2, 
      github: 'alexthompson',
      skills: ['Node.js', 'PostgreSQL', 'AWS']
    },
    { 
      name: 'Lisa Park', 
      position: 'Frontend Developer', 
      score: 8.9, 
      github: 'lisapark',
      skills: ['React', 'TypeScript', 'GraphQL']
    },
    { 
      name: 'David Kumar', 
      position: 'Data Engineer', 
      score: 8.5, 
      github: 'davidkumar',
      skills: ['Python', 'Spark', 'Kafka']
    }
  ];

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
              <Button className="bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="w-4 h-4 mr-2" />
                New Interview
              </Button>
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
                  <Button variant="outline" size="sm">View All</Button>
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
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Hiring Analytics</h2>
                <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Analytics charts will be implemented here</p>
                    <p className="text-sm text-gray-500">Interview performance, hiring trends, candidate quality metrics</p>
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
                  <Button variant="outline" className="w-full justify-start">
                    <ChartBarIcon className="w-4 h-4 mr-2" />
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}