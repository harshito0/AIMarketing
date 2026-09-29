'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ClientSelector } from '@/components/social/client-selector';
import { SocialSubNav } from '@/components/social/social-subnav';
import { Client, SocialAccountItem, SocialPostItem } from '@/lib/types';
import {
  Share2,
  Sparkles,
  PlusCircle,
  Clock,
  Send,
  AlertCircle,
  FileText,
  Globe,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  MapPin,
  Calendar,
} from 'lucide-react';

export default function SocialOverviewPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [accounts, setAccounts] = useState<SocialAccountItem[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<SocialPostItem[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<SocialPostItem[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async (clientId: string) => {
    try {
      setLoading(true);
      const [accRes, schedRes, pubRes, actRes] = await Promise.all([
        fetch(`/api/social/accounts?clientId=${clientId}`),
        fetch(`/api/social/posts?clientId=${clientId}&status=SCHEDULED&limit=5`),
        fetch(`/api/social/posts?clientId=${clientId}&status=PUBLISHED&limit=5`),
        fetch(`/api/social/activity?clientId=${clientId}&limit=6`),
      ]);

      if (accRes.ok) {
        const d = await accRes.json();
        setAccounts(d.accounts || []);
      }
      if (schedRes.ok) {
        const d = await schedRes.json();
        setScheduledPosts(d.posts || []);
      }
      if (pubRes.ok) {
        const d = await pubRes.json();
        setPublishedPosts(d.posts || []);
      }
      if (actRes.ok) {
        const d = await actRes.json();
        setActivities(d.activities || []);
      }
    } catch (err) {
      console.warn('Dashboard data fetch note:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient?.id) {
      fetchDashboardData(selectedClient.id);
    }
  }, [selectedClient?.id]);

  const instagramAccount = accounts.find((a) => a.platform === 'INSTAGRAM' && a.isConnected);
  const facebookAccount = accounts.find((a) => a.platform === 'FACEBOOK' && a.isConnected);

  return (
    <AuthGuard allowedDepartments={['Digital Marketing', 'Social Media', 'Marketing']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Top Header with Client Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
                <Share2 className="w-4 h-4" />
                <span>KAIRO Social Operations Hub</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Social Media Overview
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                AI-assisted post creation, scheduling, Meta Graph API publishing, and client account health.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ClientSelector
                selectedClientId={selectedClient?.id || null}
                onSelectClient={(c) => setSelectedClient(c)}
              />
              <Link
                href="/social/create"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer btn-press shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Post</span>
              </Link>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <SocialSubNav />

          {/* Client Brand Hero Card */}
          {selectedClient && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedClient.logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedClient.name}`}
                    alt={selectedClient.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-lg shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold tracking-tight">
                        {selectedClient.businessName || selectedClient.name}
                      </h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {selectedClient.clientCode || 'CK-CLIENT'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl line-clamp-1">
                      {selectedClient.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span>{selectedClient.city}, {selectedClient.province}</span>
                      </span>
                      <span>•</span>
                      <span className="text-amber-300 font-semibold">{selectedClient.industry}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    href="/social/accounts"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xs transition-all flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Connected Accounts ({accounts.length})</span>
                  </Link>
                  <Link
                    href="/social/calendar"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>View Calendar</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs card-lift">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Scheduled Queue</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{scheduledPosts.length}</div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Next post publishing automatically</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs card-lift">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Published Posts</span>
                <Send className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600">{publishedPosts.length}</div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Live on Instagram & Facebook</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs card-lift">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Instagram Status</span>
                <span className={`w-2.5 h-2.5 rounded-full ${instagramAccount ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'}`}></span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 truncate">
                {instagramAccount ? instagramAccount.username : 'Not Connected'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>{instagramAccount ? 'Connected ✓' : 'Setup required'}</span>
                <Link href="/social/accounts" className="text-blue-600 font-bold hover:underline">
                  Manage
                </Link>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs card-lift">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Facebook Page</span>
                <span className={`w-2.5 h-2.5 rounded-full ${facebookAccount ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'}`}></span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 truncate">
                {facebookAccount ? (facebookAccount.pageName || facebookAccount.username) : 'Not Connected'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>{facebookAccount ? 'Connected ✓' : 'Setup required'}</span>
                <Link href="/social/accounts" className="text-blue-600 font-bold hover:underline">
                  Manage
                </Link>
              </div>
            </div>
          </div>

          {/* Two-Column Layout: Scheduled Queue & Activity Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scheduled Posts Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Upcoming Scheduled Posts</span>
                </h3>
                <Link href="/social/scheduled" className="text-xs font-bold text-blue-600 hover:underline">
                  View All ({scheduledPosts.length}) →
                </Link>
              </div>

              {loading ? (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Loading scheduled posts...</span>
                </div>
              ) : scheduledPosts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">No scheduled posts for {selectedClient?.name}</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Create AI-assisted social media content and schedule it to publish automatically via Meta Graph API.
                  </p>
                  <Link
                    href="/social/create"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Post Now</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {post.media && post.media.length > 0 ? (
                          <img
                            src={post.media[0].url}
                            alt="Media preview"
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              SCHEDULED
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Platforms: {post.platforms.join(', ')}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-800 mt-1 line-clamp-2 leading-relaxed">
                            {post.caption}
                          </p>
                          <div className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>
                              {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'Pending'}
                            </span>
                            <span>•</span>
                            <span>By {post.createdByName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Link
                          href={`/social/create?editId=${post.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          href="/social/scheduled"
                          className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team Activity Feed Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Team Activity Log</span>
                </h3>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                {activities.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No recent team activity logged yet.
                  </div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="text-xs font-bold text-slate-900">{act.action}</div>
                      {act.details && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{act.details}</div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{act.userName}</span>
                        <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
