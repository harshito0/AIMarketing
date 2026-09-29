'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';
import { ClientSelector } from '@/components/social/client-selector';
import { SocialSubNav } from '@/components/social/social-subnav';
import { PostPreview } from '@/components/social/post-preview';
import { MusicSelectorModal } from '@/components/social/music-selector-modal';
import { Client, SocialMediaItem, SocialMusicItem, SocialPlatform } from '@/lib/types';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  RefreshCw,
  MapPin,
  Music2,
  Calendar,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Tag,
  Sliders,
  X,
  Plus,
  Wand2,
  Check,
} from 'lucide-react';

function CreateSocialPostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('editId');
  const { profile, role } = useAuth();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(['INSTAGRAM', 'FACEBOOK']);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [location, setLocation] = useState('');
  const [editingLocation, setEditingLocation] = useState(false);
  const [mediaList, setMediaList] = useState<SocialMediaItem[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<SocialMusicItem | null>(null);
  const [showMusicModal, setShowMusicModal] = useState(false);

  // Scheduling state
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('19:30');
  const [scheduleTimezone, setScheduleTimezone] = useState('Asia/Kolkata');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // AI Generation State
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [aiObjective, setAiObjective] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default schedule date to tomorrow
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setScheduleDate(d.toISOString().split('T')[0]);
  }, []);

  // Fetch client config & existing post if editing
  const loadClientConfig = async (client: Client) => {
    try {
      const res = await fetch(`/api/social/client-config?clientId=${client.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setLocation(data.config.defaultLocation || `${client.businessName || client.name}, ${client.city}`);
          setScheduleTimezone(data.config.defaultTimezone || 'Asia/Kolkata');
          if (hashtags.length === 0 && data.config.defaultHashtags?.length > 0) {
            setHashtags(data.config.defaultHashtags);
          }
        }
      }
    } catch (err) {
      setLocation(`${client.businessName || client.name}, ${client.city || 'Canada'}`);
    }
  };

  const loadExistingPost = async (id: string) => {
    try {
      const res = await fetch(`/api/social/posts/${id}`);
      if (res.ok) {
        const data = await res.json();
        const p = data.post;
        if (p) {
          setCaption(p.caption || '');
          setHashtags(p.hashtags || []);
          setLocation(p.location || '');
          setPlatforms(p.platforms || ['INSTAGRAM', 'FACEBOOK']);
          setMediaList(p.media || []);
          setSelectedMusic(p.music || null);
          if (p.scheduledAt) {
            const dt = new Date(p.scheduledAt);
            setScheduleDate(dt.toISOString().split('T')[0]);
            setScheduleTime(dt.toTimeString().slice(0, 5));
          }
        }
      }
    } catch (err) {
      console.warn('Error loading edit post:', err);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      loadClientConfig(selectedClient);
    }
  }, [selectedClient?.id]);

  useEffect(() => {
    if (editId) {
      loadExistingPost(editId);
    }
  }, [editId]);

  // Toggle platform
  const togglePlatform = (p: SocialPlatform) => {
    if (platforms.includes(p)) {
      if (platforms.length === 1) return; // Keep at least one
      setPlatforms(platforms.filter((x) => x !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  // Media Upload Simulator & File Reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video');
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setMediaList((prev) => [
          ...prev,
          {
            url,
            type: isVideo ? 'video' : 'image',
            name: file.name,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  // AI Caption Generation
  const handleGenerateCaption = async (action: 'generate' | 'regenerate' | 'improve' | 'shorten' | 'make_professional' | 'make_engaging') => {
    if (!selectedClient) {
      setStatusFeedback({ type: 'error', text: 'Please select a client before generating content.' });
      return;
    }

    setIsGeneratingCaption(true);
    setStatusFeedback(null);

    try {
      const res = await fetch('/api/social/posts/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          action,
          currentCaption: caption,
          location,
          mediaDescription: mediaList[0]?.name || 'Luxury lifestyle visual showcase',
          mediaType: mediaList[0]?.type || 'image',
          userObjective: aiObjective,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed');

      if (data.data) {
        setCaption(data.data.fullFormattedCaption);
        if (data.data.suggestedHashtags?.length > 0) {
          const combined = Array.from(new Set([...hashtags, ...data.data.suggestedHashtags]));
          setHashtags(combined);
        }
        setStatusFeedback({ type: 'success', text: `AI generated caption with ${data.data.toneApplied} tone applied!` });
      }
    } catch (err: any) {
      setStatusFeedback({ type: 'error', text: err.message || 'Error communicating with AI engine.' });
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // AI Hashtag Generation
  const handleGenerateHashtags = async () => {
    if (!selectedClient) return;
    setIsGeneratingHashtags(true);
    try {
      const res = await fetch('/api/social/posts/generate-hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          captionContext: caption,
          mediaContext: mediaList[0]?.name,
        }),
      });
      const data = await res.json();
      if (data.hashtags?.length > 0) {
        const combined = Array.from(new Set([...hashtags, ...data.hashtags]));
        setHashtags(combined);
      }
    } catch (err) {
      console.warn('Hashtag generator notice:', err);
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  const addCustomHashtag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = newTagInput.trim().replace(/^#/, '');
      if (val && !hashtags.includes(`#${val}`)) {
        setHashtags([...hashtags, `#${val}`]);
        setNewTagInput('');
      }
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (!selectedClient || !caption.trim()) {
      setStatusFeedback({ type: 'error', text: 'Caption is required to save a draft.' });
      return;
    }

    setSubmitting(true);
    setStatusFeedback(null);

    try {
      const endpoint = editId ? `/api/social/posts/${editId}` : '/api/social/posts';
      const method = editId ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          platforms,
          caption: caption.trim(),
          hashtags,
          location,
          media: mediaList,
          music: selectedMusic,
          status: 'DRAFT',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save draft');

      setStatusFeedback({ type: 'success', text: 'Post saved to Drafts successfully!' });
      setTimeout(() => router.push('/social/drafts'), 900);
    } catch (err: any) {
      setStatusFeedback({ type: 'error', text: err.message || 'Error saving draft.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Schedule
  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !caption.trim() || !scheduleDate) return;

    setSubmitting(true);
    setStatusFeedback(null);

    const scheduledIso = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();

    try {
      const res = await fetch('/api/social/posts/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: editId || undefined,
          postData: {
            clientId: selectedClient.id,
            platforms,
            caption: caption.trim(),
            hashtags,
            location,
            media: mediaList,
            music: selectedMusic,
          },
          scheduledAt: scheduledIso,
          timezone: scheduleTimezone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to schedule post');

      setShowScheduleModal(false);
      setStatusFeedback({ type: 'success', text: 'POST SCHEDULED ✓' });
      setTimeout(() => router.push('/social/scheduled'), 1000);
    } catch (err: any) {
      setStatusFeedback({ type: 'error', text: err.message || 'Scheduling failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Direct Publish Now
  const handlePublishNow = async () => {
    if (!selectedClient || !caption.trim()) {
      setStatusFeedback({ type: 'error', text: 'Caption is required to publish.' });
      return;
    }

    if (!window.confirm(`Publish this post immediately to ${platforms.join(' & ')} for ${selectedClient.name}?`)) {
      return;
    }

    setSubmitting(true);
    setStatusFeedback(null);

    try {
      const res = await fetch('/api/social/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: editId || undefined,
          postData: {
            clientId: selectedClient.id,
            platforms,
            caption: caption.trim(),
            hashtags,
            location,
            media: mediaList,
            music: selectedMusic,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publishing failed');

      if (data.success) {
        setStatusFeedback({ type: 'success', text: 'Post published successfully to official platforms!' });
        setTimeout(() => router.push('/social/published'), 1200);
      } else {
        setStatusFeedback({ type: 'error', text: `Publishing notice: ${data.failureReason || 'Check connected accounts.'}` });
        setTimeout(() => router.push('/social/failed'), 2000);
      }
    } catch (err: any) {
      setStatusFeedback({ type: 'error', text: err.message || 'Publishing failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard allowedDepartments={['Digital Marketing', 'Social Media', 'Marketing']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>AI Social Media Composer & Studio</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {editId ? 'Edit Social Post' : 'Create Social Post'}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Generate high-converting copy with client brand memory, attach visual media, and schedule to Meta.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ClientSelector
                selectedClientId={selectedClient?.id || null}
                onSelectClient={(c) => setSelectedClient(c)}
              />
            </div>
          </div>

          <SocialSubNav />

          {statusFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 shadow-xs ${
                statusFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusFeedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusFeedback(null)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main 2-Column Composer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ================= LEFT COLUMN: MEDIA UPLOAD & ASSETS ================= */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Media Upload Area
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {mediaList.length} files attached
                  </span>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                />

                {/* Drag & Drop / Upload Box */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-6 text-center transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center mx-auto shadow-xs group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="text-xs font-bold text-slate-900">
                      Upload Image or Video
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Drag and drop, or browse your files (PNG, JPG, MP4, MOV)
                    </p>
                  </div>
                </div>

                {/* Media Thumbnails Carousel */}
                {mediaList.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-slate-500 block">Attached Media:</span>
                    <div className="grid grid-cols-3 gap-2.5">
                      {mediaList.map((item, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-950"
                        >
                          {item.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center text-white text-[10px]">
                              <VideoIcon className="w-6 h-6 text-pink-400" />
                            </div>
                          ) : (
                            <img
                              src={item.url}
                              alt={`Upload ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMedia(idx);
                              }}
                              className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-md"
                              title="Remove media"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Preset Creatives */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] mb-2 font-bold text-slate-400">
                    <span>QUICK PRESET ASSETS</span>
                    <span className="text-[10px] text-blue-600 font-semibold">1-Click Insert</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        title: 'Aura Vitality Suite',
                        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
                      },
                      {
                        title: 'Facial Aesthetics Care',
                        url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
                      },
                      {
                        title: 'Holistic Wellness Consultation',
                        url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
                      },
                    ].map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setMediaList([
                            ...mediaList,
                            { url: preset.url, type: 'image', name: preset.title },
                          ])
                        }
                        className="rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500 transition-all text-left group"
                      >
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-full h-14 object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="block p-1 text-[9px] font-bold text-slate-700 truncate bg-slate-50">
                          {preset.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Realistic Preview Component Embedded */}
              <PostPreview
                clientName={selectedClient?.businessName || selectedClient?.name || 'Aura Vital Star'}
                username={selectedClient?.name.includes('Aura') ? '@auravitalstar' : '@kairo_client'}
                pageName={selectedClient?.businessName || selectedClient?.name || 'Aura Vital Star'}
                avatarUrl={selectedClient?.logoUrl}
                caption={caption}
                hashtags={hashtags}
                location={location}
                media={mediaList}
                music={selectedMusic}
                platforms={platforms}
              />
            </div>

            {/* ================= RIGHT COLUMN: COMPOSER CONTROLS ================= */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-5">
                {/* 1. Target Platforms */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Publish To *</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => togglePlatform('INSTAGRAM')}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                        platforms.includes('INSTAGRAM')
                          ? 'border-purple-600 bg-purple-50/50 text-purple-950 font-bold shadow-2xs'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                        IG
                      </div>
                      <span className="text-xs">Instagram</span>
                      {platforms.includes('INSTAGRAM') && <Check className="w-3.5 h-3.5 text-purple-600 ml-1" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePlatform('FACEBOOK')}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                        platforms.includes('FACEBOOK')
                          ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-bold shadow-2xs'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                        FB
                      </div>
                      <span className="text-xs">Facebook</span>
                      {platforms.includes('FACEBOOK') && <Check className="w-3.5 h-3.5 text-blue-600 ml-1" />}
                    </button>
                  </div>
                </div>

                {/* 2. Caption Text Area & AI Actions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Caption Content *
                    </label>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {caption.length} characters
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    required
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write or generate your primary caption, hook, and call to action..."
                    className="w-full p-4 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 leading-relaxed font-sans"
                  />

                  {/* AI Quick Buttons Bar */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>KAIRO Social AI Engine</span>
                      </div>
                      {isGeneratingCaption && (
                        <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Generating...</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isGeneratingCaption}
                        onClick={() => handleGenerateCaption('generate')}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Generate with AI</span>
                      </button>

                      <button
                        type="button"
                        disabled={isGeneratingCaption}
                        onClick={() => handleGenerateCaption('regenerate')}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all disabled:opacity-60"
                      >
                        Regenerate
                      </button>

                      <button
                        type="button"
                        disabled={isGeneratingCaption || !caption.trim()}
                        onClick={() => handleGenerateCaption('improve')}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all disabled:opacity-60"
                      >
                        Improve
                      </button>

                      <button
                        type="button"
                        disabled={isGeneratingCaption || !caption.trim()}
                        onClick={() => handleGenerateCaption('shorten')}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all disabled:opacity-60"
                      >
                        Shorten
                      </button>

                      <button
                        type="button"
                        disabled={isGeneratingCaption || !caption.trim()}
                        onClick={() => handleGenerateCaption('make_professional')}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all disabled:opacity-60"
                      >
                        Make Professional
                      </button>

                      <button
                        type="button"
                        disabled={isGeneratingCaption || !caption.trim()}
                        onClick={() => handleGenerateCaption('make_engaging')}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all disabled:opacity-60"
                      >
                        Make Engaging
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Hashtags Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>Hashtags</span>
                    </label>
                    <button
                      type="button"
                      disabled={isGeneratingHashtags}
                      onClick={handleGenerateHashtags}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {isGeneratingHashtags ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>[Generate Hashtags]</span>
                      )}
                    </button>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                      {hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200/60 text-[11px] font-semibold"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeHashtag(tag)}
                            className="text-blue-400 hover:text-blue-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={addCustomHashtag}
                      placeholder="Type custom hashtag and press Enter..."
                      className="w-full text-xs p-2 rounded-xl border border-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                    />
                  </div>
                </div>

                {/* 4. Default Client Location */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Default Client Location
                      </div>
                      {editingLocation ? (
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="text-xs font-bold text-slate-900 border border-slate-300 rounded px-2 py-0.5 mt-0.5"
                        />
                      ) : (
                        <div className="text-xs font-bold text-slate-900 truncate">
                          📍 {location || 'No location set'}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingLocation(!editingLocation)}
                    className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                  >
                    {editingLocation ? 'Save' : '[Change Location]'}
                  </button>
                </div>

                {/* 5. Music Section */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                      <Music2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Background Music
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {selectedMusic ? `🎵 ${selectedMusic.title} (${selectedMusic.artist})` : 'No track attached'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMusicModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                  >
                    [Select Music]
                  </button>
                </div>

                {/* Action Buttons Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSaveDraft}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowScheduleModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-102 disabled:opacity-60 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule Post</span>
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handlePublishNow}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all hover:scale-102 disabled:opacity-60 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Publish Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Music Selector Modal */}
          <MusicSelectorModal
            isOpen={showMusicModal}
            onClose={() => setShowMusicModal(false)}
            currentTrack={selectedMusic}
            onSelectTrack={(track) => setSelectedMusic(track)}
          />

          {/* Scheduling Modal */}
          {showScheduleModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Schedule Post</h3>
                      <p className="text-xs text-slate-500">Pick date, time, and timezone to publish automatically</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="text-slate-400 hover:text-slate-700 p-1"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleConfirmSchedule} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Publication Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Timezone
                      </label>
                      <select
                        value={scheduleTimezone}
                        onChange={(e) => setScheduleTimezone(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/Toronto">America/Toronto (EST)</option>
                        <option value="America/Vancouver">America/Vancouver (PST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                    <div className="font-bold">Autonomous Server-Side Queue:</div>
                    <p>
                      The post will publish automatically at the scheduled time using official Meta Graph API. Your browser does not need to stay open.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      {submitting ? 'Scheduling...' : 'Confirm Schedule'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default function CreateSocialPostPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading KAIRO Social Composer...</span>
        </div>
      }
    >
      <CreateSocialPostContent />
    </Suspense>
  );
}

