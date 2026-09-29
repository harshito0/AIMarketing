'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ClientSelector } from '@/components/social/client-selector';
import { SocialSubNav } from '@/components/social/social-subnav';
import { ConnectAccountModal } from '@/components/social/connect-account-modal';
import { Client, SocialAccountItem } from '@/lib/types';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Globe,
  PlusCircle,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Lock,
  ExternalLink,
  Info,
  Layers,
} from 'lucide-react';

export default function SocialAccountsPage() {
  const { profile, role } = useAuth();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [accounts, setAccounts] = useState<SocialAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSuperOrManager = role === 'ADMIN' || role === 'MANAGER' || profile?.email === 'aman@codekap.com';

  const fetchAccounts = async (clientId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/social/accounts?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.warn('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient?.id) {
      fetchAccounts(selectedClient.id);
    }
  }, [selectedClient?.id]);

  const handleDisconnect = async (accountId: string, platform: string, username: string) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platform} account ${username} from ${selectedClient?.name}?`)) {
      return;
    }

    setDisconnectingId(accountId);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/social/accounts?id=${accountId}&clientId=${selectedClient?.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disconnect');

      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      setStatusMessage({ type: 'success', text: `Disconnected ${username} successfully.` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error disconnecting account.' });
    } finally {
      setDisconnectingId(null);
    }
  };

  const instagramAccounts = accounts.filter((a) => a.platform === 'INSTAGRAM');
  const facebookAccounts = accounts.filter((a) => a.platform === 'FACEBOOK');

  return (
    <AuthGuard allowedDepartments={['Digital Marketing', 'Social Media', 'Marketing']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
                <Globe className="w-4 h-4" />
                <span>Meta Graph API v20.0 Integrations</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Connected Social Accounts
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Manage Instagram Professional accounts and Facebook Pages linked to this client.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ClientSelector
                selectedClientId={selectedClient?.id || null}
                onSelectClient={(c) => setSelectedClient(c)}
              />
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                disabled={!isSuperOrManager}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer btn-press disabled:opacity-50"
                title={!isSuperOrManager ? 'Admin or Manager role required to connect accounts' : ''}
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Connect Account</span>
              </button>
            </div>
          </div>

          <SocialSubNav />

          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Security & Permissions Info Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Server-Side Security Enforced:</strong> All Meta OAuth tokens and Page access credentials are AES-256 encrypted on the server and strictly isolated to <strong>{selectedClient?.name}</strong>. Access tokens are never exposed in browser payloads.
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-lg">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero Leakage Client Isolation</span>
            </div>
          </div>

          {/* Accounts Grid */}
          {loading ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading connected social accounts for {selectedClient?.name}...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Globe className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  No social accounts connected for {selectedClient?.name}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Connect official Instagram Professional accounts or Facebook Pages to enable AI-powered automated publishing, realistic feed previewing, and scheduled queuing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Connect Instagram / Facebook</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Instagram Accounts Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600"></span>
                    <span>Instagram Professional Accounts ({instagramAccounts.length})</span>
                  </h3>
                </div>

                {instagramAccounts.length === 0 ? (
                  <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No Instagram account connected yet.
                  </div>
                ) : (
                  instagramAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 card-lift"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-0.5 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 shrink-0 shadow-xs">
                            <img
                              src={acc.profilePictureUrl || selectedClient?.logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${acc.username}`}
                              alt={acc.username}
                              className="w-12 h-12 rounded-xl object-cover border-2 border-white"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-extrabold text-slate-900">{acc.username}</h4>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800">
                                Connected ✓
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {acc.pageName || 'Instagram Professional'}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            acc.connectionHealth === 'HEALTHY'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {acc.connectionHealth}
                        </span>
                      </div>

                      {/* Diagnostic details */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1.5 text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Connection Health:</span>
                          <span className="font-semibold text-slate-800">{acc.healthMessage || 'Active & Valid'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Connected By:</span>
                          <span className="font-semibold text-slate-800">{acc.connectedByName || 'Aman Sir'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Last Verified Sync:</span>
                          <span className="font-semibold text-slate-800">{new Date(acc.lastSyncAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <a
                          href={`https://instagram.com/${acc.username.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>Open in Instagram</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowConnectModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                          >
                            Manage
                          </button>
                          <button
                            type="button"
                            disabled={!isSuperOrManager || disconnectingId === acc.id}
                            onClick={() => handleDisconnect(acc.id, acc.platform, acc.username)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Disconnect</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Facebook Pages Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>Facebook Business Pages ({facebookAccounts.length})</span>
                  </h3>
                </div>

                {facebookAccounts.length === 0 ? (
                  <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No Facebook Page connected yet.
                  </div>
                ) : (
                  facebookAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 card-lift"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={acc.profilePictureUrl || selectedClient?.logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${acc.username}`}
                            alt={acc.username}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-extrabold text-slate-900">{acc.pageName || acc.username}</h4>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800">
                                Connected ✓
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium">Facebook Page</div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            acc.connectionHealth === 'HEALTHY'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {acc.connectionHealth}
                        </span>
                      </div>

                      {/* Diagnostic details */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1.5 text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Page ID / Status:</span>
                          <span className="font-semibold text-slate-800">{acc.healthMessage || 'Active & Valid'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Connected By:</span>
                          <span className="font-semibold text-slate-800">{acc.connectedByName || 'Aman Sir'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Last Verified Sync:</span>
                          <span className="font-semibold text-slate-800">{new Date(acc.lastSyncAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-500">
                          Meta Graph v20.0
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowConnectModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                          >
                            Manage
                          </button>
                          <button
                            type="button"
                            disabled={!isSuperOrManager || disconnectingId === acc.id}
                            onClick={() => handleDisconnect(acc.id, acc.platform, acc.username)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Disconnect</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Connect Account Modal */}
          {selectedClient && (
            <ConnectAccountModal
              isOpen={showConnectModal}
              onClose={() => setShowConnectModal(false)}
              client={selectedClient}
              onSuccess={() => fetchAccounts(selectedClient.id)}
            />
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
