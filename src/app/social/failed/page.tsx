'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ClientSelector } from '@/components/social/client-selector';
import { SocialSubNav } from '@/components/social/social-subnav';
import { Client, SocialPostItem } from '@/lib/types';
import {
  AlertCircle,
  RefreshCw,
  Edit,
  Trash2,
  Send,
  Globe,
  PlusCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

export default function SocialFailedPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [posts, setPosts] = useState<SocialPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchFailed = async (clientId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/social/posts?clientId=${clientId}&status=FAILED`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.warn('Failed posts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient?.id) {
      fetchFailed(selectedClient.id);
    }
  }, [selectedClient?.id]);

  const handleRetry = async (postId: string) => {
    setRetryingId(postId);
    try {
      const res = await fetch('/api/social/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        if (selectedClient?.id) fetchFailed(selectedClient.id);
      }
    } catch (err) {
      console.error('Retry publish error:', err);
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this failed post entry?')) return;
    try {
      const res = await fetch(`/api/social/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <AuthGuard allowedDepartments={['Digital Marketing', 'Social Media', 'Marketing']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span>Publishing Error Diagnosis</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Failed Posts & Error Resolution
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Inspect Meta API errors, reconnect expired accounts, and retry failed publications.
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
              <span>Loading failed posts...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Zero publishing failures!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All connected social channels for {selectedClient?.name} are running smoothly with no outstanding errors.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl border border-rose-200 p-5 shadow-2xs space-y-4 hover:border-rose-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-rose-100">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>FAILED</span>
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        Platforms: {post.platforms.join(' & ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-semibold">
                      Created on: {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Failure Reason Alert Banner */}
                  <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5">
                      <span>❌ Publishing failed:</span>
                    </div>
                    <p className="font-mono text-[11px] leading-relaxed">
                      {post.failureReason || 'Meta API returned an authorization or network error.'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {post.media && post.media.length > 0 && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200">
                        <img
                          src={post.media[0].url}
                          alt="Failed Post Media"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {post.caption}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Link
                        href="/social/accounts"
                        className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Reconnect Account</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-rose-600 font-semibold"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/social/create?editId=${post.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit & Fix</span>
                      </Link>

                      <button
                        type="button"
                        disabled={retryingId === post.id}
                        onClick={() => handleRetry(post.id)}
                        className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                      >
                        {retryingId === post.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Retrying...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Retry Publishing</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
