'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { validateInput, interviewSchema, type InterviewInput, type Candidate } from '@/lib/validation';

export default function NewInterviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  
  const candidateId = searchParams?.get('candidateId');
  
  const [formData, setFormData] = useState<InterviewInput>({
    title: '',
    candidateId: candidateId || '',
    interviewerId: session?.user?.id || '',
    type: 'TECHNICAL',
    scheduledAt: '',
    duration: 60
  });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      setFormData(prev => ({ ...prev, interviewerId: session.user.id }));
    }
  }, [session]);

  const loadCandidates = async () => {
    try {
      setIsLoadingCandidates(true);
      // Get all candidates (we'll filter out HIRED and REJECTED on the frontend if needed)
      const response = await api.candidates.getAll();
      if (response.success) {
        // Filter to only show candidates available for interviews
        const availableCandidates = response.data.filter((candidate: any) => 
          !['HIRED', 'REJECTED'].includes(candidate.status)
        );
        setCandidates(availableCandidates);
      }
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'duration' ? parseInt(value) || 60 : value 
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      addToast({ message: 'You must be logged in to schedule interviews', type: 'error' });
      return;
    }

    setErrors({});
    
    // Validate form data
    const validation = validateInput(interviewSchema, formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.errors.forEach(error => {
        const [field, message] = error.split(': ');
        fieldErrors[field] = message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await api.interviews.create(formData);
      
      if (response.success) {
        addToast({ message: 'Interview scheduled successfully!', type: 'success' });
        router.push('/interviews');
      } else {
        addToast({ message: response.error || 'Failed to schedule interview', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      addToast({ message: 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate default date/time (tomorrow at 10 AM)
  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16); // Format for datetime-local input
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D001A] via-[#1A0B2E] to-[#2D1B69]">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-purple-500/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/interviews" className="mr-4">
              <Button variant="outline" className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Interviews
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Schedule New Interview</h1>
              <p className="mt-1 text-sm text-purple-200">
                Set up an AI-powered interview session with advanced analytics
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-2xl">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
              {/* Interview Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-purple-200 mb-2">
                  Interview Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-black/30 border-2 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-purple-300 transition-all duration-300 ${
                    errors.title ? 'border-red-500' : 'border-purple-500/30'
                  }`}
                  placeholder="e.g. Technical Interview - Frontend Developer"
                />
                {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
              </div>

              {/* Candidate Selection */}
              <div>
                <label htmlFor="candidateId" className="block text-sm font-medium text-purple-200 mb-2">
                  Candidate *
                </label>
                <select
                  id="candidateId"
                  name="candidateId"
                  value={formData.candidateId}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-black/30 border-2 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white transition-all duration-300 ${
                    errors.candidateId ? 'border-red-500' : 'border-purple-500/30'
                  }`}
                  disabled={isLoadingCandidates}
                >
                  <option value="" className="bg-gray-800">Select a candidate</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id} className="bg-gray-800">
                      {candidate.name} ({candidate.email})
                    </option>
                  ))}
                </select>
                {errors.candidateId && <p className="mt-1 text-sm text-red-400">{errors.candidateId}</p>}
                {isLoadingCandidates && <p className="mt-1 text-sm text-purple-300">Loading candidates...</p>}
              </div>

              {/* Interview Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-purple-200 mb-2">
                  Interview Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-black/30 border-2 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white transition-all duration-300 ${
                    errors.type ? 'border-red-500' : 'border-purple-500/30'
                  }`}
                >
                  <option value="TECHNICAL" className="bg-gray-800">Technical Interview</option>
                  <option value="BEHAVIORAL" className="bg-gray-800">Behavioral Interview</option>
                  <option value="SYSTEM_DESIGN" className="bg-gray-800">System Design Interview</option>
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-400">{errors.type}</p>}
              </div>

              {/* Scheduled Date/Time */}
              <div>
                <label htmlFor="scheduledAt" className="block text-sm font-medium text-purple-200 mb-2">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="scheduledAt"
                  name="scheduledAt"
                  value={formData.scheduledAt || getDefaultDateTime()}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-black/30 border-2 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white transition-all duration-300 ${
                    errors.scheduledAt ? 'border-red-500' : 'border-purple-500/30'
                  }`}
                />
                {errors.scheduledAt && <p className="mt-1 text-sm text-red-400">{errors.scheduledAt}</p>}
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-purple-200 mb-2">
                  Duration (minutes)
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration?.toString() || '60'}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-black/30 border-2 border-purple-500/30 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white transition-all duration-300"
                >
                  <option value="30" className="bg-gray-800">30 minutes</option>
                  <option value="45" className="bg-gray-800">45 minutes</option>
                  <option value="60" className="bg-gray-800">60 minutes</option>
                  <option value="90" className="bg-gray-800">90 minutes</option>
                  <option value="120" className="bg-gray-800">2 hours</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-purple-500/20">
                <Link href="/interviews">
                  <Button type="button" variant="outline" disabled={isLoading} className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-3 font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                  {isLoading ? 'Scheduling...' : 'Schedule Interview'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>

        {/* Sidebar with Info */}
        <div className="space-y-6">
          {/* AI Features Card */}
          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">AI-Powered Interviews</h3>
              </div>
              <div className="space-y-3 text-sm text-purple-200">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Smart question generation based on interview type</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Real-time GitHub profile analysis</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Automated scoring and detailed feedback</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Video recording for later review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Types Card */}
          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-2xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Interview Types</h3>
              <div className="space-y-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-lg">
                  <h4 className="font-medium text-emerald-400 mb-1">Technical</h4>
                  <p className="text-xs text-purple-200">Coding challenges, algorithm questions, system architecture</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="font-medium text-purple-400 mb-1">Behavioral</h4>
                  <p className="text-xs text-purple-200">Communication skills, teamwork, problem-solving approach</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg">
                  <h4 className="font-medium text-cyan-400 mb-1">System Design</h4>
                  <p className="text-xs text-purple-200">Architecture planning, scalability, design patterns</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-2xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pro Tips</h3>
              <div className="space-y-3 text-sm text-purple-200">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Schedule interviews at least 24 hours in advance</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Ensure candidates have their GitHub profiles updated</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>60-90 minutes works best for technical interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}