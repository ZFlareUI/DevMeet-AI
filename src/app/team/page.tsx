'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

const ROLE_LABELS = {
  ADMIN: 'Administrator',
  RECRUITER: 'Recruiter',
  INTERVIEWER: 'Interviewer',
  CANDIDATE: 'Candidate',
};

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'INTERVIEWER',
  });
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const [membersResponse, invitationsResponse] = await Promise.all([
        fetch('/api/team/members'),
        fetch('/api/team/invitations'),
      ]);

      if (membersResponse.ok) {
        const members = await membersResponse.json();
        setTeamMembers(members);
      }

      if (invitationsResponse.ok) {
        const invites = await invitationsResponse.json();
        setInvitations(invites);
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('inviting');

    try {
      const response = await fetch('/api/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData),
      });

      if (response.ok) {
        setInviteData({ email: '', role: 'INTERVIEWER' });
        setShowInviteForm(false);
        fetchTeamData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      alert('Failed to send invitation');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading(`canceling-${invitationId}`);

    try {
      const response = await fetch(`/api/team/invitations?id=${invitationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTeamData();
      } else {
        alert('Failed to cancel invitation');
      }
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      alert('Failed to cancel invitation');
    } finally {
      setActionLoading('');
    }
  };

  const handleUpdateMember = async (memberId: string, updates: Partial<TeamMember>) => {
    setActionLoading(`updating-${memberId}`);

    try {
      const response = await fetch(`/api/team/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, ...updates }),
      });

      if (response.ok) {
        fetchTeamData();
      } else {
        alert('Failed to update member');
      }
    } catch (error) {
      console.error('Failed to update member:', error);
      alert('Failed to update member');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading team information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Team Management</h1>
        <Button onClick={() => setShowInviteForm(true)}>
          Invite Team Member
        </Button>
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Invite Team Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="INTERVIEWER">Interviewer</option>
                  <option value="RECRUITER">Recruiter</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={actionLoading === 'inviting'}
                  className="flex-1"
                >
                  {actionLoading === 'inviting' ? 'Sending...' : 'Send Invitation'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Team Members */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Team Members</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Last Login</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id} className="border-b">
                  <td className="py-2">{member.name || 'No name'}</td>
                  <td className="py-2">{member.email}</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}
                    </span>
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      member.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2">
                    {member.lastLoginAt 
                      ? new Date(member.lastLoginAt).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      {member.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateMember(member.id, { isActive: false })}
                          disabled={actionLoading === `updating-${member.id}`}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateMember(member.id, { isActive: true })}
                          disabled={actionLoading === `updating-${member.id}`}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {teamMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No team members found
            </div>
          )}
        </div>
      </Card>

      {/* Pending Invitations */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Sent</th>
                <th className="text-left py-2">Expires</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation.id} className="border-b">
                  <td className="py-2">{invitation.email}</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {ROLE_LABELS[invitation.role as keyof typeof ROLE_LABELS]}
                    </span>
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-sm capitalize ${
                      invitation.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : invitation.status === 'ACCEPTED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invitation.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="py-2">
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    {invitation.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        disabled={actionLoading === `canceling-${invitation.id}`}
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invitations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No pending invitations
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}