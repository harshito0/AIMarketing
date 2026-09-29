'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ClientSelector } from '@/components/social/client-selector';
import { SocialSubNav } from '@/components/social/social-subnav';
import { Client, SocialPostItem } from '@/lib/types';
import {
  FileText,
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  Clock,
  Calendar,
  Send,
  Sparkles,
} from 'lucide-react';

export default function SocialDraftsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [drafts, setDrafts] = useState<SocialPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = async (clientId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/social/posts?clientId=${clientId}&status=DRAFT`);
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.posts || []);
      }
    } catch (err) {
      console.warn('Drafts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient?.id) {
      fetchDrafts(selectedClient.id);
    }
  }, [selectedClient?.id]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this draft?')) return;
    try {
      const res = await fetch(`/api/social/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error('Delete draft error:', err);
    }
  };

  return (
    <AuthGuard allowedDepartments={['Digital Marketing', 'Social Media', 'Marketing']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
                <FileText className="w-4 h-4" />
                <span>Unpublished Concept Storage</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Post Drafts
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Saved in-progress captions, concepts, and media creatives.
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
                <span>+ New Draft</span>
              </Link>
            </div>
          </div>

          <SocialSubNav />

          {loading ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading drafts...</span>
            </div>
          ) : drafts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No drafts found for {selectedClient?.name}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Drafts allow your team to work on AI captions and creative concepts before scheduling.
              </p>
              <Link
                href="/social/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create a Draft</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        DRAFT
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {draft.platforms.join(' & ')}
                      </span>
                    </div>

                    {draft.media && draft.media.length > 0 && (
                      <div className="rounded-xl overflow-hidden aspect-video bg-slate-950">
                        <img
                          src={draft.media[0].url}
                          alt="Draft media"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <p className="text-xs font-medium text-slate-800 line-clamp-3 leading-relaxed whitespace-pre-line">
                      {draft.caption}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Created by {draft.createdByName}</span>
                      <span>{new Date(draft.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(draft.id)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/social/create?editId=${draft.id}`}
                          className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Open in Composer</span>
                        </Link>
                      </div>
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
