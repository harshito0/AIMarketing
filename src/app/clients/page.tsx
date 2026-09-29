'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/dashboard-layout';
import { useAuth } from '../../lib/auth/auth-context';
import { Client } from '../../lib/types';
import { 
  Building2, 
  Globe, 
  MapPin, 
  Plus, 
  Mail, 
  Phone,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Edit,
  Upload,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  X,
  Code2,
  Rocket,
  Copy,
  Check,
  Shield,
  Layers
} from 'lucide-react';

export const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'cli_jeevansphere_default',
    name: 'Jeevansphere',
    businessName: 'Jeevansphere',
    clientCode: 'CK-JEEV-2001',
    website: 'http://jeevansphere.com/',
    industry: 'Eye Care / Healthcare Platform',
    country: 'India',
    province: 'Delhi',
    city: 'CP, New Delhi',
    contactName: 'Deepak Yadav',
    contactEmail: 'jeevansphere@com.in',
    contactPhone: '9690922001',
    deploymentUrl: 'http://jeevansphere.com/',
    githubRepo: 'https://github.com/harshito0/AIMarketing',
    description: 'jeevanSphere is a purpose-driven platform focused on creating meaningful impact by connecting people, ideas, and opportunities. It aims to build an inclusive ecosystem that supports growth, awareness, and positive social transformation.',
    brandTone: 'Professional, Modern, High-Converting',
    logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=Jeevansphere',
    status: 'ACTIVE',
    createdAt: '2026-08-25T00:00:00.000Z',
  },
];

export default function ClientsPage() {
  const { profile, role, department, activeDepartment } = useAuth();
  const [clients, setClients] = useState<Client[]>(DEFAULT_CLIENTS);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperOrManager = role === 'ADMIN' || role === 'MANAGER' || profile?.email === 'aman@codekap.com';
  const effectiveDept = activeDepartment || department || profile?.department || '';
  const isMarketingOnly = (effectiveDept.toLowerCase().includes('market') || effectiveDept.toLowerCase().includes('social')) && role !== 'ADMIN';

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    clientCode: '',
    githubRepo: '',
    deploymentUrl: '',
    website: '',
    industry: '',
    country: 'Canada',
    province: 'Ontario',
    city: 'Toronto',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    logoUrl: '',
    description: '',
    brandTone: 'Professional, Modern, High-Converting',
  });

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setClients(data);
          try {
            localStorage.setItem('cached_clients', JSON.stringify(data));
          } catch {}
          return;
        }
      }
      // Check cached clients
      try {
        const cached = localStorage.getItem('cached_clients');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setClients(parsed);
          }
        }
      } catch {}
    } catch (err) {
      console.warn('Clients note: Using cached baseline', err);
    }
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem('cached_clients');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClients(parsed);
        }
      }
    } catch {}
    fetchClients();
  }, []);

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      businessName: '',
      clientCode: '',
      githubRepo: '',
      deploymentUrl: '',
      website: '',
      industry: '',
      country: 'Canada',
      province: 'Ontario',
      city: 'Toronto',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      logoUrl: '',
      description: '',
      brandTone: 'Professional, Modern, High-Converting',
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      businessName: client.businessName || '',
      clientCode: client.clientCode || '',
      githubRepo: client.githubRepo || '',
      deploymentUrl: client.deploymentUrl || '',
      website: client.website || '',
      industry: client.industry || '',
      country: client.country || 'Canada',
      province: client.province || '',
      city: client.city || '',
      contactName: client.contactName || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      logoUrl: client.logoUrl || '',
      description: client.description || '',
      brandTone: client.brandTone || 'Professional, Modern, High-Converting',
    });
    setError('');
    setShowModal(true);
  };

  // Local file upload from Downloads/PC
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (.png, .jpg, .svg, .webp).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({
          ...prev,
          logoUrl: event.target?.result as string,
        }));
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...formData,
        logoUrl: formData.logoUrl.trim() || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(formData.name.trim())}`,
      };

      const isEdit = !!editingClient;
      const url = '/api/clients';
      const method = isEdit ? 'PATCH' : 'POST';
      const body = isEdit ? JSON.stringify({ id: editingClient.id, ...payload }) : JSON.stringify(payload);

      let savedClient: any = null;
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body,
        });

        if (res.ok) {
          savedClient = await res.json();
        }
      } catch (e) {
        console.warn('Network note:', e);
      }

      if (!savedClient) {
        savedClient = {
          id: editingClient?.id || `cli_${Date.now()}`,
          ...payload,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };
      }

      setClients((prev) => {
        let updated: Client[];
        if (isEdit) {
          updated = prev.map((c) => (c.id === editingClient.id ? { ...c, ...savedClient } : c));
        } else {
          updated = [savedClient, ...prev.filter((c) => c.name !== savedClient.name)];
        }
        try {
          localStorage.setItem('cached_clients', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setShowModal(false);
      fetchClients();
    } catch (err: any) {
      setError(err.message || 'Error processing client.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchClients();
      }
    } catch (err) {
      console.error('Error deleting client:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
              <Building2 className="w-4 h-4" />
              <span>Workspace Client Management & Code Repos</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Client & Business Hub
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Central client database. Clients added by Super Admin generate unique codes, link to GitHub code repos, and feature live deployment URLs visible to all team members.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client Business</span>
            </button>
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading clients from database...</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Businesses or Clients Added Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Add your first client business to automatically generate unique client codes, configure logo branding, and connect GitHub repositories and live deployments.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Business</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clients.map((client) => {
              const displayCode = client.clientCode || `CK-${client.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)}-${client.id.slice(-4).toUpperCase()}`;

              return (
                <div
                  key={client.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Logo, Name, Code, and Controls */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={client.logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(client.name)}`}
                          alt={client.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 bg-slate-50 shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 truncate">{client.name}</h3>
                          </div>
                          <p className="text-xs font-medium text-slate-500 truncate">{client.businessName || client.name}</p>
                          
                          {/* Auto-Generated Client Code Badge */}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-mono font-bold text-[10px] border border-purple-200/80">
                              <Code2 className="w-3 h-3 text-purple-600" />
                              <span>{displayCode}</span>
                            </span>
                            <button
                              onClick={() => copyToClipboard(displayCode, client.id)}
                              className="p-1 rounded text-slate-400 hover:text-purple-700 transition-colors"
                              title="Copy Client Code"
                            >
                              {copiedCode === client.id ? (
                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-100 mr-1">
                          {client.country}
                        </span>
                        
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                          title="Edit Business"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {isSuperOrManager && (
                          <button
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                            title="Delete Business"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Deployment & Code Repository Section */}
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                          <Rocket className="w-3.5 h-3.5 text-blue-600" />
                          <span>Live Deployment:</span>
                        </span>
                        {client.deploymentUrl ? (
                          <a
                            href={client.deploymentUrl.startsWith('http') ? client.deploymentUrl : `https://${client.deploymentUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all hover:scale-[1.02]"
                          >
                            <span>Open App</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                            Pending Deployment Link
                          </span>
                        )}
                      </div>

                      {!isMarketingOnly && client.githubRepo && (
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Code Repo:</span>
                          </span>
                          <a
                            href={client.githubRepo.startsWith('http') ? client.githubRepo : `https://${client.githubRepo}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                          >
                            <span className="truncate">{client.githubRepo.replace(/^https?:\/\/(github\.com\/)?/, '')}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}
                    </div>

                    {client.description && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 line-clamp-2">
                        {client.description}
                      </p>
                    )}

                    {/* Metadata Details Grid */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{client.industry || 'General Industry'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{client.city}, {client.province}</span>
                      </div>
                      {client.website && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <a
                            href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>{client.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}
                      {client.contactPhone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate font-mono">{client.contactPhone}</span>
                        </div>
                      )}
                      {client.contactEmail && (
                        <div className="flex items-center gap-2 text-slate-600 col-span-2">
                          <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{client.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                    <span className="text-slate-500 font-medium">
                      Tone: <strong className="text-slate-700">{client.brandTone || 'Professional'}</strong>
                    </span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Workspace Shared
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Add / Edit Client Profile */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 border border-slate-200 shadow-2xl my-8 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {editingClient ? 'Edit Client Business Profile' : 'Add Client Business Profile'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Auto-generates unique client code, connects GitHub repository, and configures live deployment link.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Logo Upload Section (Manual Upload from PC/Downloads) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-800 block">
                    Business Logo (Upload from Downloads or Enter URL)
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group w-18 h-18 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-7 h-7 text-slate-300" />
                      )}
                    </div>

                    <div className="space-y-2 flex-1 w-full">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload from Downloads / PC</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const seed = formData.name.trim() || 'business';
                            setFormData({
                              ...formData,
                              logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`,
                            });
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>Generate Logo</span>
                        </button>

                        {formData.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, logoUrl: '' })}
                            className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <input
                        type="url"
                        placeholder="Or paste direct image URL (https://...)"
                        value={formData.logoUrl.startsWith('data:') ? '' : formData.logoUrl}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                        className="w-full text-[11px] p-2 rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-blue-600 text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Business Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Eye Care Centre"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Registered Legal Business Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Health Solutions Inc."
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                </div>

                {/* Code & Deployment Links */}
                <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-purple-900 block mb-1 flex items-center gap-1.5">
                        <Rocket className="w-3.5 h-3.5 text-purple-600" />
                        <span>Live Deployment Link (Vercel / Web)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="https://client-demo.vercel.app"
                        value={formData.deploymentUrl}
                        onChange={(e) => setFormData({ ...formData, deploymentUrl: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-purple-900 block mb-1 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>GitHub Code Repo Link</span>
                      </label>
                      <input
                        type="text"
                        placeholder="https://github.com/codekap/client-repo"
                        value={formData.githubRepo}
                        onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-purple-900 block mb-1">
                      Custom Client Code (Leave blank to auto-generate)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CK-EYEC-8921 (Auto-generated if blank)"
                      value={formData.clientCode}
                      onChange={(e) => setFormData({ ...formData, clientCode: e.target.value.toUpperCase() })}
                      className="w-full text-xs p-2 rounded-xl border border-purple-200 bg-white font-mono text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Website URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Industry / Niche *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dental Care, Real Estate, SaaS"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. John Smith"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      placeholder="contact@business.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Mobile / Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 019-2834"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                </div>

                {/* Location Details */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Province / State</label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                    />
                  </div>
                </div>

                {/* Brand Description */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Brand Description & Services
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe core services, target audience, key value proposition..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{editingClient ? 'Updating Profile...' : 'Saving Profile...'}</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4" />
                        <span>{editingClient ? 'Save Changes' : 'Save Business & Generate Code'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
