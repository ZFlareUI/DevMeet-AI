'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/ui/navigation';
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
      <div className="min-h-screen bg-gradient-to-br from-[#0D001A] via-[#1A0B2E] to-[#2D1B69] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-purple-200">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D001A] via-[#1A0B2E] to-[#2D1B69]">
      <Navigation showBackButton={true} backUrl="/dashboard" backLabel="Dashboard" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Candidates</h1>
          <p className="text-lg text-purple-200">
            Manage your candidate pipeline and schedule interviews
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          <Link href="/candidates/new">
            <Button className="bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-400 hover:via-purple-500 hover:to-pink-400 text-white shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add New Candidate
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 bg-gradient-to-br from-black/30 via-purple-900/20 to-black/30 backdrop-blur-md border border-purple-500/40 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" />
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-black/30 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-gray-400"
                  />
                </div>
              </form>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-300">Filter:</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="bg-black/30 border border-purple-500/30 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white"
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
          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
            <CardContent className="p-12 text-center">
              <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No candidates found</h3>
              <p className="text-gray-300 mb-6">
                {searchQuery ? 'Try adjusting your search or filters.' : 'Get started by adding your first candidate.'}
              </p>
              <Link href="/candidates/new">
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Your First Candidate
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {candidates.map((candidate) => (
              <Card key={candidate.id} className="bg-black/20 backdrop-blur-sm border-purple-500/30 hover:bg-black/40 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {candidate.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{candidate.name}</h3>
                        <p className="text-sm text-gray-300">{candidate.email}</p>
                        {candidate.githubUrl && (
                          <p className="text-sm text-cyan-400">
                            GitHub: @{candidate.githubUrl.split('/').pop()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {candidate.githubScore && (
                        <div className="text-center">
                          <p className="text-2xl font-bold text-cyan-400">
                            {candidate.githubScore.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-400">GitHub Score</p>
                        </div>
                      )}

                      <div className="text-center">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          ['APPLIED', 'SCREENING', 'INTERVIEWING', 'ASSESSMENT', 'OFFERED'].includes(candidate.status)
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : candidate.status === 'HIRED'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : candidate.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1).toLowerCase()}
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <Link href={`/interviews/new?candidateId=${candidate.id}`}>
                          <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20">
                            Schedule Interview
                          </Button>
                        </Link>
                        <Link href={`/candidates/${candidate.id}`}>
                          <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {candidate.notes && (
                    <div className="mt-4 p-3 bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-lg">
                      <p className="text-sm text-gray-300">{candidate.notes}</p>
                    </div>
                  )}

                  <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
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