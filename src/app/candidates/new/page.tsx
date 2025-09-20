'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { validateInput, candidateSchema, type CandidateInput } from '@/lib/validation';

export default function AddCandidatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState<CandidateInput>({
    name: '',
    email: '',
    position: '',
    experience: '',
    skills: [],
    phone: '',
    githubUrl: '',
    resume: '',
    coverLetter: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData(prev => ({ 
          ...prev, 
          skills: [...prev.skills, skillInput.trim()] 
        }));
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(skill => skill !== skillToRemove) 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      addToast({ message: 'You must be logged in to add candidates', type: 'error' });
      return;
    }

    setErrors({});
    
    // Validate form data
    const validation = validateInput(candidateSchema, formData);
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
      
      const response = await api.candidates.create(formData);
      
      if (response.success) {
        addToast({ message: 'Candidate added successfully!', type: 'success' });
        router.push('/candidates');
      } else {
        addToast({ message: response.error || 'Failed to add candidate', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to add candidate:', error);
      addToast({ message: 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/candidates" className="mr-4">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Candidates
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Candidate</h1>
              <p className="mt-1 text-sm text-gray-600">
                Enter candidate information to add them to your pipeline
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter candidate's full name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="candidate@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Position */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.position ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g. Frontend Developer, Software Engineer"
                />
                {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position}</p>}
              </div>

              {/* Experience */}
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level *
                </label>
                <select
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.experience ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select experience level</option>
                  <option value="junior">Junior (0-2 years)</option>
                  <option value="mid">Mid-level (2-5 years)</option>
                  <option value="senior">Senior (5-8 years)</option>
                  <option value="lead">Lead (8+ years)</option>
                </select>
                {errors.experience && <p className="mt-1 text-sm text-red-600">{errors.experience}</p>}
              </div>

              {/* Skills */}
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                  Skills * (Press Enter to add)
                </label>
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type a skill and press Enter"
                />
                {errors.skills && <p className="mt-1 text-sm text-red-600">{errors.skills}</p>}
                
                {formData.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              {/* GitHub URL */}
              <div>
                <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  id="githubUrl"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.githubUrl ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://github.com/username"
                />
                {errors.githubUrl && <p className="mt-1 text-sm text-red-600">{errors.githubUrl}</p>}
                <p className="mt-1 text-sm text-gray-500">
                  We'll analyze their GitHub profile to generate a technical score
                </p>
              </div>

              {/* Cover Letter */}
              <div>
                <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter / Notes
                </label>
                <textarea
                  id="coverLetter"
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.coverLetter ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Any additional notes or cover letter content..."
                />
                {errors.coverLetter && <p className="mt-1 text-sm text-red-600">{errors.coverLetter}</p>}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link href="/candidates">
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? 'Adding Candidate...' : 'Add Candidate'}
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
                <h3 className="text-sm font-medium text-gray-900">About GitHub Analysis</h3>
                <p className="mt-1 text-sm text-gray-600">
                  When you provide a GitHub URL, our AI will analyze the candidate's repositories, 
                  commits, languages used, and coding patterns to generate a technical score. 
                  This helps you quickly assess their technical capabilities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}