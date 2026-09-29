'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/dashboard-layout';
import { AuthGuard } from '../../components/auth-guard';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FileText, 
  Lightbulb, 
  RefreshCw, 
  CheckCircle2, 
  Download, 
  Maximize2,
  Zap,
  PlusCircle,
  X,
  Sliders,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function CreativeStudioPage() {
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'copy' | 'concepts'>('images');
  const [creatives, setCreatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // New Generation State
  const [customPrompt, setCustomPrompt] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customAspectRatio, setCustomAspectRatio] = useState<'1:1' | '4:5' | '16:9' | '9:16'>('4:5');
  const [customClientName, setCustomClientName] = useState('');
  const [generationError, setGenerationError] = useState('');

  const samplePrompts = [
    'Laser Eye Surgery & LASIK Consultation in Downtown Toronto',
    'Advanced Cataract Screening Clinic with Precision Laser Care',
    'Cosmetic Dentistry & Smile Makeover Specialists in Vancouver',
    'Comprehensive Physiotherapy and Direct Billing Spine Clinic'
  ];

  const fetchCreatives = async () => {
    try {
      const res = await fetch('/api/creatives');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCreatives(data);
        }
      }
    } catch (err) {
      console.warn('Creatives note: Using fallback baseline', err);
    }
  };

  useEffect(() => {
    fetchCreatives();
  }, []);

  const handleSelectAsset = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/creatives/${id}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCreatives(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      }
    } catch (err) {
      console.error('Error updating asset status:', err);
    }
  };

  const handleGenerateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsGenerating(true);
    setGenerationError('');

    try {
      const res = await fetch('/api/creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt.trim(),
          title: customTitle.trim() || undefined,
          aspectRatio: customAspectRatio,
          clientName: customClientName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate visual');
      }

      const createdItem = await res.json();
      setCreatives(prev => [createdItem, ...prev]);
      setShowGenerateModal(false);
      setCustomPrompt('');
      setCustomTitle('');
    } catch (err: any) {
      setGenerationError(err.message || 'Error generating creative with Gemini');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (asset: any) => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/creatives/${asset.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: asset.campaignId,
          prompt: asset.prompt,
          aspectRatio: asset.aspectRatio,
          provider: 'gemini',
        }),
      });
      if (res.ok) {
        const newAsset = await res.json();
        setCreatives(prev => [newAsset, ...prev]);
      }
    } catch (err) {
      console.error('Error regenerating asset:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const imagesList = creatives.filter(c => c.type === 'IMAGE');
  const videosList = creatives.filter(c => c.type === 'VIDEO');

  return (
    <AuthGuard allowedDepartments={['Digital Marketing', 'Social Media', 'Marketing']}>
      <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Google Gemini AI Asset Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Creative Studio
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Generate, store, and manage custom AI advertising visuals with SQLite persistence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-5 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Zap className="w-4 h-4" />
              <span>Generate Visual with Gemini</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'images'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Visual Images ({imagesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'videos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <VideoIcon className="w-4 h-4" />
            <span>Video Concepts ({videosList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('copy')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'copy'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Search Copy Variations</span>
          </button>

          <button
            onClick={() => setActiveTab('concepts')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'concepts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Storyboards</span>
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading creative assets from database...</span>
          </div>
        ) : activeTab === 'images' ? (
          imagesList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No creative images generated yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use Google Gemini to generate high-converting ad banners and clinical visual creatives tailored to your campaigns.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Generate Your First Visual</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {imagesList.map((asset) => (
                <div key={asset.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-3 hover:shadow-md transition-shadow">
                  <div className="relative group bg-slate-950 flex items-center justify-center min-h-[220px]">
                    <img
                      src={asset.downloadUrl}
                      alt={asset.prompt}
                      className="w-full h-56 object-contain bg-slate-950"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('data:image/svg+xml')) {
                          target.src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80';
                        }
                      }}
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-white backdrop-blur-xs border border-white/10">
                        {asset.aspectRatio}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                        {asset.provider}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 z-20">
                      <button
                        onClick={() => setSelectedAsset(asset)}
                        className="p-2.5 bg-white rounded-xl text-slate-900 hover:scale-105 transition-all shadow-md"
                        title="Expand Preview"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <a
                        href={asset.downloadUrl}
                        download={`gemini_creative_${asset.id}.svg`}
                        className="p-2.5 bg-white rounded-xl text-slate-900 hover:scale-105 transition-all shadow-md"
                        title="Download Asset"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-relaxed">
                      "{asset.prompt}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        asset.status === 'FINAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {asset.status}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRegenerate(asset)}
                          disabled={isGenerating}
                          className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
                        >
                          Regenerate
                        </button>
                        <button
                          onClick={() => handleSelectAsset(asset.id, 'FINAL')}
                          className="text-xs font-bold text-emerald-600 hover:underline"
                        >
                          Use in Campaign
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'videos' ? (
          <div className="grid md:grid-cols-2 gap-6">
            {videosList.map((asset) => (
              <div key={asset.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-3">
                <div className="relative bg-slate-900 h-64 flex items-center justify-center text-white">
                  <video
                    src={asset.downloadUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white">
                      {asset.aspectRatio}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                      {asset.provider}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-700 font-medium">"{asset.prompt}"</p>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      {asset.status}
                    </span>
                    <button
                      onClick={() => handleSelectAsset(asset.id, 'FINAL')}
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      Use in Campaign
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'copy' ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Search Ad Variations (Health Canada Verified)</h3>
            <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
              <li>Eye Surgery Consultation in Toronto — Board-Certified Specialists</li>
              <li>Top-Rated Toronto Laser Eye Screening — Book Consultation Online</li>
              <li>Ready for Clear Vision? Schedule Your Comprehensive Diagnostic Examination</li>
            </ul>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Creative Concepts & Storyboards</h3>
            <p className="text-xs text-slate-600">Scene 1: Toronto clinic arrival → Scene 2: Diagnostic scan → Scene 3: CTA Consultation</p>
          </div>
        )}
      </div>

      {/* Modal: Generate New Visual with Gemini */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 md:p-8 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Generate Visual with Gemini</h2>
                  <p className="text-xs text-slate-500">Live AI banner & asset generator with database persistence</p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {generationError}
              </div>
            )}

            <form onSubmit={handleGenerateNew} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Creative Prompt / Visual Direction *
                </label>
                <textarea
                  rows={3}
                  required
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Modern eye surgery consultation suite with friendly specialist reviewing 3D scan with patient in Toronto..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              {/* Sample Prompts */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Quick sample ideas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {samplePrompts.map((sp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomPrompt(sp)}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {sp.slice(0, 35)}...
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Campaign Title / Headline
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Clear Vision Consultation"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Client / Brand Name
                  </label>
                  <input
                    type="text"
                    value={customClientName}
                    onChange={(e) => setCustomClientName(e.target.value)}
                    placeholder="e.g. G1 Sphere / iCare"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Aspect Ratio / Format
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: '4:5', label: '4:5 (Feed Ad)' },
                    { key: '1:1', label: '1:1 (Square)' },
                    { key: '9:16', label: '9:16 (Story)' },
                    { key: '16:9', label: '16:9 (Display)' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCustomAspectRatio(item.key as any)}
                      className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold transition-all ${
                        customAspectRatio === item.key
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !customPrompt.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate & Save Creative</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Details Full Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">Creative Asset Preview & Details</h2>
              <button onClick={() => setSelectedAsset(null)} className="text-xs font-bold text-slate-400 hover:text-slate-700">Close</button>
            </div>

            <div className="bg-slate-950 rounded-xl p-2 flex items-center justify-center min-h-[260px]">
              <img
                src={selectedAsset.downloadUrl}
                alt={selectedAsset.prompt}
                className="max-h-80 w-auto object-contain rounded-lg"
              />
            </div>

            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p><strong>Prompt:</strong> {selectedAsset.prompt}</p>
              <p><strong>Provider & Model:</strong> {selectedAsset.provider} ({selectedAsset.model})</p>
              <p><strong>Aspect Ratio:</strong> {selectedAsset.aspectRatio}</p>
              <p><strong>Database Status:</strong> {selectedAsset.status}</p>
              <p className="text-[11px] text-slate-400">Created: {new Date(selectedAsset.createdAt).toLocaleString()}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={selectedAsset.downloadUrl}
                download={`creative_${selectedAsset.id}.svg`}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download SVG Image</span>
              </a>

              <button
                onClick={() => {
                  handleSelectAsset(selectedAsset.id, 'FINAL');
                  setSelectedAsset(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
              >
                Set as Active Creative
              </button>
            </div>
          </div>
        </div>
      )}
      </DashboardLayout>
    </AuthGuard>
  );
}
