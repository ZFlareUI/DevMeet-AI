'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, PencilIcon, CheckIcon, UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    experience: '',
    education: '',
    skills: '',
    bio: '',
    github: '',
    linkedin: '',
    website: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }))
    }
  }, [session, status, router])

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    // TODO: Save profile data to backend
    setIsEditing(false)
    // Add toast notification here
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">My Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isEditing ? (
                <Button 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  onClick={handleSave}
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              ) : (
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => setIsEditing(true)}
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <CardContent className="p-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                <UserIcon className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="text-3xl font-bold bg-transparent border-b border-white/30 text-white placeholder-purple-200 focus:outline-none focus:border-purple-400 w-full"
                      placeholder="Your Name"
                    />
                    <input
                      type="text"
                      value={profileData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="text-xl bg-transparent border-b border-white/30 text-purple-200 placeholder-purple-300 focus:outline-none focus:border-purple-400 w-full"
                      placeholder="Your Title (e.g., Senior Full Stack Developer)"
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-3xl font-bold text-white">{profileData.name || 'Your Name'}</h2>
                    <p className="text-xl text-purple-200">{profileData.title || 'Your Title'}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="w-5 h-5 text-purple-400" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="your.email@example.com"
                    />
                  ) : (
                    <span className="text-purple-200">{profileData.email || 'your.email@example.com'}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="w-5 h-5 text-purple-400" />
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  ) : (
                    <span className="text-purple-200">{profileData.phone || 'Add phone number'}</span>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="w-5 h-5 text-purple-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="City, Country"
                    />
                  ) : (
                    <span className="text-purple-200">{profileData.location || 'Add location'}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <BriefcaseIcon className="w-5 h-5 text-purple-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="5+ years experience"
                    />
                  ) : (
                    <span className="text-purple-200">{profileData.experience || 'Add experience'}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About & Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">About Me</h3>
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full h-32 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Tell us about yourself, your passion for development, and what makes you unique..."
                />
              ) : (
                <p className="text-purple-200">{profileData.bio || 'Add a brief description about yourself...'}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Skills</h3>
              {isEditing ? (
                <textarea
                  value={profileData.skills}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                  className="w-full h-32 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="React, Node.js, TypeScript, Python, AWS, Docker..."
                />
              ) : (
                <p className="text-purple-200">{profileData.skills || 'Add your technical skills...'}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Education & Links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <AcademicCapIcon className="w-6 h-6 mr-2" />
                Education
              </h3>
              {isEditing ? (
                <textarea
                  value={profileData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  className="w-full h-24 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Bachelor's in Computer Science, University of..."
                />
              ) : (
                <p className="text-purple-200">{profileData.education || 'Add your education background...'}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Links</h3>
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <input
                      type="url"
                      value={profileData.github}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="GitHub profile URL"
                    />
                    <input
                      type="url"
                      value={profileData.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="LinkedIn profile URL"
                    />
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Personal website URL"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-purple-200">GitHub: {profileData.github || 'Add GitHub profile'}</p>
                    <p className="text-purple-200">LinkedIn: {profileData.linkedin || 'Add LinkedIn profile'}</p>
                    <p className="text-purple-200">Website: {profileData.website || 'Add personal website'}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}