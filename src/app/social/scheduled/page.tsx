'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ClientSelector } from '@/components/social/client-selector';
import { SocialSubNav } from '@/components/social/social-subnav';
import { Client, SocialPostItem } from '@/lib/types';
import {
  Clock,
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  Send,
  Calendar,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export default function SocialScheduledPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [posts, setPosts] = useState<SocialPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [queueFeedback, setQueueFeedback] = useState<string | null>(null);

  const fetchScheduled = async (clientId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/social/posts?clientId=${clientId}&status=SCHEDULED`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.warn('Scheduled posts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient?.id) {
      fetchScheduled(selectedClient.id);
    }
  }, [selectedClient?.id]);

  const handleProcessQueue = async () => {
    setProcessingQueue(true);
    setQueueFeedback(null);
    try {
      const res = await fetch('/api/social/queue/process', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setQueueFeedback(`Queue processed: ${data.processedCount || 0} scheduled post(s) checked.`);
        if (selectedClient?.id) fetchScheduled(selectedClient.id);
      }
    } catch (err: any) {
      setQueueFeedback(`Queue check notice: ${err.message}`);
    } finally {
      setProcessingQueue(false);
    }
  };

  const handleCancelSchedule = async (id: string) => {
    if (!window.confirm('Cancel schedule and move post back to Drafts?')) return;
    try {
      const res = await fetch(`/api/social/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT', scheduledAt: null }),
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Cancel schedule error:', err);
    }
  };

  const handlePublishImmediately = async (id: string) => {
    if (!window.confirm('Publish this post immediately via official Meta Graph API?')) return;
    try {
      const res = await fetch('/api/social/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id }),
      });
      if (res.ok) {
        if (selectedClient?.id) fetchScheduled(selectedClient.id);
      }
    } catch (err) {
      console.error('Publish error:', err);
    }
  };

  return (
    <AuthGuard allowedDepartments={['Digital Marketing', 'Social Media', 'Marketing']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
                <Clock className="w-4 h-4" />
                <span>Automated Server Publishing Queue</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Scheduled Posts Queue
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Posts scheduled to publish automatically via official Meta Graph API at their target time.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ClientSelector
                selectedClientId={selectedClient?.id || null}
                onSelectClient={(c) => setSelectedClient(c)}
              />
              <button
                type="button"
                onClick={handleProcessQueue}
                disabled={processingQueue}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                title="Run background scheduler queue immediately"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${processingQueue ? 'animate-spin text-blue-600' : ''}`} />
                <span>Process Queue</span>
              </button>
              <Link
                href="/social/create"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer btn-press shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Schedule Post</span>
              </Link>
            </div>
          </div>

          <SocialSubNav />

          {queueFeedback && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{queueFeedback}</span>
            </div>
          )}

          {/* Queue List */}
          {loading ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading scheduled queue...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No scheduled posts for {selectedClient?.name}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When you schedule posts with date and time in the composer, they will queue here and publish autonomously.
              </p>
              <Link
                href="/social/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Schedule a Post</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                        SCHEDULED
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        Platforms: {post.platforms.join(' & ')}
                      </span>
                      {post.location && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>{post.location}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-extrabold text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200/80 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Target: {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {post.media && post.media.length > 0 && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200">
                        <img
                          src={post.media[0].url}
                          alt="Media"
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
                    <span className="text-[11px] text-slate-400">
                      Created by <strong>{post.createdByName}</strong> on {new Date(post.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCancelSchedule(post.id)}
                        className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors"
                      >
                        Cancel Schedule
                      </button>

                      <Link
                        href={`/social/create?editId=${post.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handlePublishImmediately(post.id)}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish Now</span>
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
