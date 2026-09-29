'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ClientSelector } from '@/components/social/client-selector';
import { SocialSubNav } from '@/components/social/social-subnav';
import { Client, SocialPostItem } from '@/lib/types';
import {
  Send,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  Calendar,
  User,
  Layers,
  MapPin,
} from 'lucide-react';

export default function SocialPublishedPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [posts, setPosts] = useState<SocialPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPublished = async (clientId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/social/posts?clientId=${clientId}&status=PUBLISHED`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.warn('Published posts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient?.id) {
      fetchPublished(selectedClient.id);
    }
  }, [selectedClient?.id]);

  return (
    <AuthGuard allowedDepartments={['Digital Marketing', 'Social Media', 'Marketing']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-1">
                <Send className="w-4 h-4" />
                <span>Live Meta Publishing Audit</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Published History
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Verified live posts published on Instagram and Facebook with Meta platform IDs and links.
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
                <span>+ Create Post</span>
              </Link>
            </div>
          </div>

          <SocialSubNav />

          {loading ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading published history...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No published posts yet for {selectedClient?.name}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once posts are published immediately or via the scheduling queue, their live links and audit receipts will appear here.
              </p>
              <Link
                href="/social/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish a Post</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const latestAttempt = post.attempts && post.attempts.length > 0 ? post.attempts[0] : null;
                const platformUrl =
                  latestAttempt?.platformPostUrl ||
                  (latestAttempt?.platformPostId
                    ? `https://www.instagram.com/p/${latestAttempt.platformPostId}`
                    : `https://www.instagram.com/auravitalstar`);

                return (
                  <div
                    key={post.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PUBLISHED ✓</span>
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {post.platforms.join(' & ')}
                        </span>
                        {post.location && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            <span>{post.location}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Published: {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : 'Live'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      {post.media && post.media.length > 0 && (
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200">
                          <img
                            src={post.media[0].url}
                            alt="Published Media"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                          {post.caption}
                        </p>
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="text-[11px] text-blue-700 font-semibold">
                            {post.hashtags.join(' ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Published by: <strong>{post.createdByName}</strong></span>
                        {latestAttempt?.platformPostId && (
                          <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                            Meta ID: {latestAttempt.platformPostId}
                          </span>
                        )}
                      </div>

                      <a
                        href={platformUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <span>View Live on Platform</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
