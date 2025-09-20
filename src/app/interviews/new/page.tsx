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
      const response = await api.candidates.getAll({ status: 'active' });
      if (response.success) {
        setCandidates(response.data);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/interviews" className="mr-4">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Interviews
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Schedule New Interview</h1>
              <p className="mt-1 text-sm text-gray-600">
                Set up an AI-powered interview session
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Interview Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g. Technical Interview - Frontend Developer"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Candidate Selection */}
              <div>
                <label htmlFor="candidateId" className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate *
                </label>
                <select
                  id="candidateId"
                  name="candidateId"
                  value={formData.candidateId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.candidateId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoadingCandidates}
                >
                  <option value="">Select a candidate</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name} ({candidate.email})
                    </option>
                  ))}
                </select>
                {errors.candidateId && <p className="mt-1 text-sm text-red-600">{errors.candidateId}</p>}
                {isLoadingCandidates && <p className="mt-1 text-sm text-gray-500">Loading candidates...</p>}
              </div>

              {/* Interview Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="TECHNICAL">Technical Interview</option>
                  <option value="BEHAVIORAL">Behavioral Interview</option>
                  <option value="SYSTEM_DESIGN">System Design Interview</option>
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
              </div>

              {/* Scheduled Date/Time */}
              <div>
                <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="scheduledAt"
                  name="scheduledAt"
                  value={formData.scheduledAt || getDefaultDateTime()}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.scheduledAt ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.scheduledAt && <p className="mt-1 text-sm text-red-600">{errors.scheduledAt}</p>}
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration?.toString() || '60'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link href="/interviews">
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? 'Scheduling...' : 'Schedule Interview'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">AI-Powered Interviews</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Our AI interviewer will conduct the interview, ask relevant questions based on the type selected, 
                  and provide detailed assessments. The candidate will receive a link to join the interview at the scheduled time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}