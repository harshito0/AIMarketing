'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/dashboard-layout';
import { AuthGuard } from '../../../components/auth-guard';
import { useAuth } from '../../../lib/auth/auth-context';
import { UserProfile, UserRole, UserStatus } from '../../../lib/types';
import {
  Users,
  UserCheck,
  Mail,
  PlusCircle,
  RefreshCw,
  Shield,
  AlertCircle,
  CheckCircle2,
  X,
  KeyRound,
  Copy,
  Check,
  Trash2,
  Share2,
  Sparkles,
  Lock
} from 'lucide-react';

interface InvitationItem {
  id: string;
  email: string;
  name?: string;
  role: string;
  passcode: string;
  status: string;
  message?: string;
  invitedBy?: string;
  invitedByName?: string;
  expiresAt: string;
  createdAt: string;
}

export default function AdminTeamPage() {
  const { getIdToken, user: authUser, profile } = useAuth();
  const DEFAULT_USERS: UserProfile[] = [
    {
      uid: 'usr_aman',
      name: 'Aman Sir',
      email: 'aman@codekap.com',
      username: 'aman',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Super Admin / Founder & CEO',
    },
  ];

  const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [invitations, setInvitations] = useState<InvitationItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('codekap_cached_invitations');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('TEAM_MEMBER');
  const [inviteMessage, setInviteMessage] = useState('');
  const [customPasscode, setCustomPasscode] = useState('');
  const [inviting, setInviting] = useState(false);
  const [generatedPasscodeResult, setGeneratedPasscodeResult] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Role Edit Modal State
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('TEAM_MEMBER');
  const [updatingRole, setUpdatingRole] = useState(false);

  const generateRandomPasscode = () => {
    const digits = Math.floor(1000 + Math.random() * 9000);
    setCustomPasscode(`AGENT-${digits}`);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const getAuthHeaders = async (includeJson = false): Promise<Record<string, string>> => {
    const token = await getIdToken();
    const effectiveUserId = authUser?.uid || profile?.uid || 'usr_aman';
    const effectiveUserEmail = authUser?.email || profile?.email || 'aman@codekap.com';
    const effectiveRole = 'ADMIN';
    const headers: Record<string, string> = {
      'X-User-Id': effectiveUserId,
      'X-User-Email': effectiveUserEmail,
      'X-User-Role': effectiveRole,
    };
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = await getAuthHeaders();

      const [usersRes, invRes] = await Promise.all([
        fetch('/api/admin/users', { headers, cache: 'no-store' }),
        fetch('/api/admin/invitations', { headers, cache: 'no-store' }),
      ]);

      let usersJson: any = null;
      try {
        const text = await usersRes.text();
        usersJson = text ? JSON.parse(text) : null;
      } catch {}

      if (usersRes.ok && usersJson && Array.isArray(usersJson) && usersJson.length > 0) {
        setUsers(usersJson);
      }

      let invJson: any = null;
      try {
        const text = await invRes.text();
        invJson = text ? JSON.parse(text) : null;
      } catch {}

      if (invRes.ok && invJson && Array.isArray(invJson)) {
        setInvitations(invJson);
        try {
          localStorage.setItem('codekap_cached_invitations', JSON.stringify(invJson));
        } catch {}
      } else {
        // Fallback to localStorage cache if server returned empty or error
        try {
          const cached = localStorage.getItem('codekap_cached_invitations');
          if (cached) setInvitations(JSON.parse(cached));
        } catch {}
      }
    } catch (err: any) {
      console.warn('[AdminTeamPage fetchData note]: Using local fallback', err);
      try {
        const cached = localStorage.getItem('codekap_cached_invitations');
        if (cached) setInvitations(JSON.parse(cached));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile, authUser]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError('');
    setSuccessMessage('');

    const targetPasscode = customPasscode.trim().toUpperCase() || `AGENT-${Math.floor(1000 + Math.random() * 9000)}`;

    const fallbackInvite: InvitationItem = {
      id: `inv_${Date.now()}`,
      email: inviteEmail.trim().toLowerCase(),
      name: inviteName.trim() || undefined,
      role: inviteRole,
      passcode: targetPasscode,
      message: inviteMessage.trim() || undefined,
      status: 'PENDING',
      invitedBy: authUser?.uid || profile?.uid || 'usr_aman',
      invitedByName: profile?.name || authUser?.displayName || 'Aman Sir',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      const headers = await getAuthHeaders(true);

      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim() || undefined,
          role: inviteRole,
          customPasscode: customPasscode.trim() || undefined,
          message: inviteMessage.trim() || undefined,
        }),
      });

      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (!res.ok) {
        setError(data.error || data.message || `Failed to create and dispatch invitation (HTTP ${res.status}).`);
        return;
      }

      const savedInvite = data.invitation || fallbackInvite;
      setGeneratedPasscodeResult(savedInvite);
      setSuccessMessage(data.message || `Team invitation & passcode generated for ${inviteEmail}!`);

      setInvitations((prev) => {
        const updated = [savedInvite, ...prev.filter((i) => i.email !== savedInvite.email && i.passcode !== savedInvite.passcode)];
        try {
          localStorage.setItem('codekap_cached_invitations', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Clear input form
      setInviteEmail('');
      setInviteName('');
      setInviteMessage('');
      setCustomPasscode('');
      fetchData();
    } catch (err: any) {
      console.error('[Send Invite Error]:', err);
      setError(err.message || 'Network error sending invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (targetUser.email === 'aman@codekap.com' || targetUser.uid === 'usr_aman') {
      alert('Security Protection: The Super Admin / Owner account cannot be removed.');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${targetUser.name || targetUser.email} from the workspace? This will revoke their access immediately.`)) {
      return;
    }

    setError('');
    setSuccessMessage('');

    // Optimistic UI update
    setUsers((prev) => prev.filter((u) => u.uid !== targetUser.uid && u.email !== targetUser.email));
    setSuccessMessage(`Team member ${targetUser.name || targetUser.email} removed successfully.`);

    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUser.uid || targetUser.email)}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to remove user from database.');
        fetchData();
      }
    } catch (err: any) {
      setError(err.message || 'Error removing team member.');
      fetchData();
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invite passcode?')) return;

    setError('');
    setSuccessMessage('');

    // Immediately remove from UI state and update cache
    setInvitations((prev) => {
      const updated = prev.filter((i) => i.id !== invitationId && i.passcode !== invitationId);
      try {
        localStorage.setItem('codekap_cached_invitations', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSuccessMessage('Invitation passcode revoked successfully.');

    try {
      const headers = await getAuthHeaders();

      fetch(`/api/admin/invitations/${encodeURIComponent(invitationId)}/revoke`, {
        method: 'POST',
        headers,
      }).catch((err) => console.warn('[Revoke Network Notice]:', err));
    } catch (err: any) {
      console.warn('[Revoke Note]:', err);
    }
  };

  const handleResendInvite = async (invitationId: string, email: string) => {
    setResendingId(invitationId);
    setError('');
    setSuccessMessage('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/invitations/${encodeURIComponent(invitationId)}/resend`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Invitation email & passcode resent to ${email}!`);
      } else {
        setError(data.error || 'Failed to resend invitation email.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error resending email.');
    } finally {
      setResendingId(null);
    }
  };

  const handleUpdateUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRole) return;

    setUpdatingRole(true);
    setError('');
    setSuccessMessage('');
    try {
      const headers = await getAuthHeaders(true);

      const res = await fetch(`/api/admin/users/${selectedUserForRole.uid}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role: newRole }),
      });

      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (!res.ok) {
        setError(data.error || 'Failed to update user role.');
      } else {
        setSuccessMessage(`User role updated to ${newRole}.`);
        setSelectedUserForRole(null);
        fetchData();
      }
    } catch (err: any) {
      setError(err.message || 'Error updating role.');
    } finally {
      setUpdatingRole(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-1">
                <Shield className="w-4 h-4" />
                <span>Super Admin Control Hub</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Team & Passcode Management
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Invite colleagues, generate secure joining passcodes, and govern workspace permissions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/tasks"
                className="px-4 py-3 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs flex items-center gap-2 transition-all"
              >
                <span>Task Delegation Hub →</span>
              </a>

              <button
                onClick={() => {
                  generateRandomPasscode();
                  setGeneratedPasscodeResult(null);
                  setIsInviteModalOpen(true);
                }}
                className="px-5 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all hover:scale-[1.01]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Invite Member & Generate Passcode</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Super Admin</span>
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-lg font-bold text-slate-900 mt-1">Aman Sir (@aman)</p>
              <p className="text-xs text-purple-700 font-semibold mt-0.5">aman@codekap.com</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Active Team Members</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{users.length}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Registered workspace users</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Pending Passcodes</span>
                <KeyRound className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {invitations.filter(i => i.status === 'PENDING').length}
              </p>
              <p className="text-xs text-amber-700 font-medium mt-0.5">Active joining codes</p>
            </div>
          </div>

          {/* Section 1: Generated Passcodes & Invites */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Generated Team Invite Passcodes</h2>
              </div>
              <span className="text-xs text-slate-500">
                Share passcodes with colleagues to let them register at <code className="text-blue-600 font-mono">/signup</code>
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading team passcodes...</span>
              </div>
            ) : invitations.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No passcodes generated yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  As Super Admin, click below to generate an invite passcode and assign a role to your team member.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      generateRandomPasscode();
                      setGeneratedPasscodeResult(null);
                      setIsInviteModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Generate First Passcode</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-4">Invited Email</th>
                      <th className="py-3.5 px-4">Role Granted</th>
                      <th className="py-3.5 px-4">Team Passcode</th>
                      <th className="py-3.5 px-4">Invite Message</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Expires</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                            <span>{inv.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                            {inv.role}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs tracking-wider">
                              {inv.passcode}
                            </span>
                            <button
                              onClick={() => copyToClipboard(inv.passcode, inv.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="Copy Passcode"
                            >
                              {copiedCode === inv.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4 max-w-xs">
                          {inv.message ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 text-blue-900 border border-blue-100 text-[11px] font-medium leading-tight">
                              💬 &ldquo;{inv.message}&rdquo;
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">No custom message</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            inv.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {inv.status === 'PENDING' && (
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleResendInvite(inv.id, inv.email)}
                                disabled={resendingId === inv.id}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold transition-colors disabled:opacity-60 flex items-center gap-1 cursor-pointer"
                                title="Resend Email to Gmail Inbox"
                              >
                                {resendingId === inv.id ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Sending...</span>
                                  </>
                                ) : (
                                  <>
                                    <Mail className="w-3 h-3" />
                                    <span>Resend Email</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleRevokeInvite(inv.id)}
                                className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold cursor-pointer"
                              >
                                Revoke
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Active Team Members */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Active Workspace Members ({users.length})</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Member Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {users.map((u) => {
                    const isSuper = u.email === 'aman@codekap.com' || u.role === 'ADMIN';
                    return (
                      <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`}
                              alt={u.name}
                              className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                            />
                            <div>
                              <span>{u.name}</span>
                              {isSuper && (
                                <span className="ml-2 px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-bold">
                                  SUPER ADMIN
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600">{u.email}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'MANAGER'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Active
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            {!isSuper && (
                              <button
                                onClick={() => {
                                  setSelectedUserForRole(u);
                                  setNewRole(u.role);
                                }}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold transition-colors cursor-pointer btn-press"
                              >
                                Edit Role
                              </button>
                            )}

                            {u.email !== 'aman@codekap.com' && u.uid !== 'usr_aman' && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer btn-press"
                                title="Remove team member from workspace"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal: Invite Team Member & Generate Passcode */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 border border-slate-200 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Invite Team Member</h2>
                    <p className="text-xs text-slate-500">Generate a secure passcode for your team colleague</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {generatedPasscodeResult ? (
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h3 className="text-sm font-bold">Invite Passcode Generated!</h3>
                    <p className="text-xs text-emerald-700">
                      Share this passcode with <strong>{generatedPasscodeResult.email}</strong> to let them join with <strong>{generatedPasscodeResult.role}</strong> access.
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-emerald-300 font-mono font-black text-xl text-slate-900 tracking-wider">
                      {generatedPasscodeResult.passcode}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-slate-900">Shareable Invite Message:</p>
                    <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]">
                      "You've been invited to join Agent AI! Register at http://localhost:3000/signup using Passcode: {generatedPasscodeResult.passcode}"
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard(
                          `You've been invited to join Agent AI! Register at http://localhost:3000/signup using Passcode: ${generatedPasscodeResult.passcode}`,
                          'snippet'
                        );
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 flex items-center gap-1.5"
                    >
                      {copiedCode === 'snippet' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode === 'snippet' ? 'Copied to Clipboard!' : 'Copy Invite Message'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Member Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Member Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. rahul@codekap.com"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Assigned Workspace Role *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'MANAGER', label: 'Manager' },
                        { key: 'TEAM_MEMBER', label: 'Team Member' },
                        { key: 'ADMIN', label: 'Admin' },
                      ].map((r) => (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => setInviteRole(r.key as any)}
                          className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all ${
                            inviteRole === r.key
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Invitation Message / Note (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="e.g. Welcome to Agent AI! Join our Jeevansphere campaign team."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Assigned Passcode
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPasscode}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Regenerate
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={customPasscode}
                      onChange={(e) => setCustomPasscode(e.target.value.toUpperCase())}
                      placeholder="e.g. AGENT-4819"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-blue-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviting || !inviteEmail.trim()}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-60"
                    >
                      {inviting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating Passcode...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Save & Generate Passcode</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Edit User Role */}
        {selectedUserForRole && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Change Role for {selectedUserForRole.name}</h3>
                <button onClick={() => setSelectedUserForRole(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateUserRole} className="space-y-4">
                <div className="space-y-2">
                  {(['ADMIN', 'MANAGER', 'TEAM_MEMBER'] as UserRole[]).map((r) => (
                    <label key={r} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="userRole"
                        value={r}
                        checked={newRole === r}
                        onChange={() => setNewRole(r)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-800">{r}</span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForRole(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingRole}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
                  >
                    {updatingRole ? 'Saving...' : 'Update Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
