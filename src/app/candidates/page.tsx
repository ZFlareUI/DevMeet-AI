'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import type { Candidate } from '@/lib/validation';

export default function CandidatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }

    loadCandidates();
  }, [session, status, router]);

  const loadCandidates = async () => {
    try {
      setIsLoading(true);
      
      const queryParams: Record<string, any> = {};
      if (searchQuery) queryParams.search = searchQuery;
      if (statusFilter !== 'all') queryParams.status = statusFilter;
      
      const response = await api.candidates.getAll(queryParams);

      if (response.success) {
        setCandidates(response.data);
      } else {
        addToast({ message: response.error || 'Failed to load candidates', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to load candidates:', error);
      addToast({ message: 'Failed to load candidates', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCandidates();
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    // Trigger reload with new filter
    setTimeout(loadCandidates, 100);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your candidate pipeline and schedule interviews
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/dashboard">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/candidates/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Candidate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </form>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Filter:</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Candidates</option>
                  <option value="active">Active</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        {candidates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery ? 'Try adjusting your search or filters.' : 'Get started by adding your first candidate.'}
              </p>
              <Link href="/candidates/new">
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Your First Candidate
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {candidates.map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {candidate.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                        <p className="text-sm text-gray-600">{candidate.email}</p>
                        {candidate.githubUrl && (
                          <p className="text-sm text-blue-600">
                            GitHub: @{candidate.githubUrl.split('/').pop()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {candidate.githubScore && (
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {candidate.githubScore.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500">GitHub Score</p>
                        </div>
                      )}

                      <div className="text-center">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          candidate.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : candidate.status === 'hired'
                            ? 'bg-blue-100 text-blue-800'
                            : candidate.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <Link href={`/interviews/new?candidateId=${candidate.id}`}>
                          <Button variant="outline" size="sm">
                            Schedule Interview
                          </Button>
                        </Link>
                        <Link href={`/candidates/${candidate.id}`}>
                          <Button size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {candidate.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{candidate.notes}</p>
                    </div>
                  )}

                  <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                    <span>Added: {new Date(candidate.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(candidate.updatedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}