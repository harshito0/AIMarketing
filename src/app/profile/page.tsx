'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/dashboard-layout';
import { AuthGuard } from '../../components/auth-guard';
import { useAuth } from '../../lib/auth/auth-context';
import {
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Save,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const { profile, getIdToken, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [title, setTitle] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreviewInfo, setImagePreviewInfo] = useState<string | null>(null);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (profile && !hasInitializedRef.current) {
      setName(profile.name || '');
      setUsername(profile.username || '');
      setAvatar(profile.avatar || '');
      setTitle(profile.title || '');
      hasInitializedRef.current = true;
    }
  }, [profile]);

  // Client-side image resizing & base64 converter
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (.png, .jpg, .jpeg, .webp).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Selected image is too large (max 10MB). Please choose a smaller image.');
      return;
    }

    setUploadingImage(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 250x250 for lightweight super-fast storage & crisp rendering
        const maxDimension = 250;
        let { width, height } = img;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Get optimized lightweight base64 (~15-20 KB)
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setAvatar(optimizedDataUrl);
          setImagePreviewInfo(`Optimized: ${file.name} (${Math.round(optimizedDataUrl.length / 1024)} KB)`);
        }
        setUploadingImage(false);
      };
      img.onerror = () => {
        setError('Failed to process image file. Please try another image.');
        setUploadingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    setImagePreviewInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) return setError('Full name is required.');
    if (!username.trim()) return setError('Username is required.');

    setLoading(true);
    try {
      const token = await getIdToken().catch(() => null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['X-User-Id'] = profile?.uid || 'usr_aman';
      if (profile?.email) headers['X-User-Email'] = profile.email;
      if (profile?.role) headers['X-User-Role'] = profile.role;

      const payload = {
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/^@/, ''),
        avatar: (avatar || '').trim(),
        title: (title || '').trim(),
      };

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        const errorMsg = data.error || (res.statusText ? `Request failed (${res.status} ${res.statusText})` : 'Failed to update profile. Please try again.');
        setError(errorMsg);
      } else {
        setSuccess('Profile details and photo updated successfully!');
        setImagePreviewInfo(null);

        // Update form state directly with saved response
        if (data.name) setName(data.name);
        if (data.username) setUsername(data.username);
        if (data.avatar !== undefined) setAvatar(data.avatar);
        if (data.title !== undefined) setTitle(data.title);

        // Update local session storage immediately for instant UI update
        const updatedSession = { ...(profile || {}), ...payload, ...(data || {}) };
        try {
          localStorage.setItem('agent_ai_user_session', JSON.stringify(updatedSession));
        } catch {}

        try {
          await refreshProfile();
        } catch (rfErr) {
          console.warn('[Profile refresh warning]:', rfErr);
        }
      }
    } catch (err: any) {
      console.error('[Profile update submit error]:', err);
      setError(err?.message || 'Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentAvatarDisplay = avatar || (profile?.uid ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}` : '');

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
              <User className="w-4 h-4" />
              <span>Personal Account & Identity</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              User Profile & Avatar Settings
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Manage your display name, official title, username handle, and custom profile photo.
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Hidden File Input for PC Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Profile Card & Photo Uploader */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs text-center space-y-5 card-lift">
              {/* Interactive Avatar Circle with Camera Overlay */}
              <div className="relative w-28 h-28 mx-auto group">
                <img
                  src={currentAvatarDisplay}
                  alt={name || profile?.name || 'User Profile Photo'}
                  className="w-28 h-28 rounded-full border-3 border-blue-600 object-cover shadow-md transition-all duration-200 group-hover:brightness-90"
                />

                {/* Upload Trigger Button Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white cursor-pointer"
                  title="Click to choose a photo from PC"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Change Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                  title="Upload from PC"
                >
                  {uploadingImage ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Upload from PC Button & Controls */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer btn-press"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingImage ? 'Processing Image...' : 'Upload Photo from PC'}</span>
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="w-full py-1.5 px-3 rounded-xl text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Photo</span>
                  </button>
                )}

                {imagePreviewInfo && (
                  <p className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 py-1 px-2 rounded-lg border border-emerald-100">
                    ✓ {imagePreviewInfo}
                  </p>
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">{name || profile?.name}</h2>
                <p className="text-xs font-semibold text-blue-600">@{username || profile?.username}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{title || profile?.title || 'Team Member'}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-left">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Role:</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[10px]">
                    {profile?.role === 'ADMIN' ? 'Super Admin / Owner' : profile?.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {profile?.status || 'ACTIVE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[150px]">
                    {profile?.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Editable Profile Form */}
            <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs card-lift">
              <h3 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100 mb-6">
                Edit Profile Information
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aman Sir"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Username Handle *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 font-bold text-sm pointer-events-none">@</span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="aman"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Unique identifier for task delegation and mentions</p>
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ''}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Managed via workspace authentication settings</p>
                </div>

                {/* Title / Role Designation */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Designation / Role Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Founder & CEO / Lead Growth Strategist"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                {/* Photo Upload / Image URL Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Profile Photo</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose from Computer</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={avatar.startsWith('data:') ? 'Custom Photo Uploaded from PC' : avatar}
                      onChange={(e) => {
                        if (!e.target.value.startsWith('Custom Photo')) {
                          setAvatar(e.target.value);
                          setImagePreviewInfo(null);
                        }
                      }}
                      placeholder="Or paste an image URL (https://...)"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer btn-press shrink-0"
                    >
                      Browse...
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="py-3 px-6 rounded-2xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/25 flex items-center gap-2 disabled:opacity-60 cursor-pointer btn-press"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Profile Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
