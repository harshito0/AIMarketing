'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../../components/dashboard-layout';
import { AuthGuard } from '../../../components/auth-guard';
import { LeadItem, LeadStatus } from '../../../lib/types';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Building2, 
  DollarSign, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  X,
  Layers,
  Sparkles,
  Edit,
  Trash2
} from 'lucide-react';

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);
  const [formData, setFormData] = useState({
    contactName: '',
    company: '',
    phone: '',
    email: '',
    service: 'Fullstack Next.js Web App',
    source: 'Website Form',
    status: 'NEW' as LeadStatus,
    estimatedValue: 250000,
    requirementNotes: '',
    nextFollowUpDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/leads');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setLeads(data);
      }
    } catch (e) {
      console.warn('Error loading leads:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const openCreateLeadModal = () => {
    setEditingLead(null);
    setFormData({
      contactName: '',
      company: '',
      phone: '',
      email: '',
      service: 'Fullstack Next.js Web App',
      source: 'Website Form',
      status: 'NEW',
      estimatedValue: 250000,
      requirementNotes: '',
      nextFollowUpDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const openEditLeadModal = (lead: LeadItem) => {
    setEditingLead(lead);
    setFormData({
      contactName: lead.contactName || '',
      company: lead.company || '',
      phone: lead.phone || '',
      email: lead.email || '',
      service: lead.service || 'Fullstack Next.js Web App',
      source: lead.source || 'Website Form',
      status: lead.status || 'NEW',
      estimatedValue: lead.estimatedValue || 250000,
      requirementNotes: lead.requirementNotes || '',
      nextFollowUpDate: lead.nextFollowUpDate || '',
    });
    setShowModal(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactName || !formData.email || !formData.phone) return;

    try {
      const isEdit = !!editingLead;
      const url = isEdit ? `/api/crm/leads/${editingLead.id}` : '/api/crm/leads';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingLead(null);
        fetchLeads();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete lead "${name}"?`)) return;

    setLeads((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/crm/leads/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting lead:', e);
    }
  };

  const updateLeadStatus = async (id: string, newStatus: LeadStatus) => {
    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = leads.filter(l => {
    const matchSearch = l.contactName.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.leadCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (st: LeadStatus) => {
    switch (st) {
      case 'WON': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'QUOTATION': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'INTERESTED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REQUIREMENT': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'NEGOTIATION': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'LOST': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <AuthGuard allowedDepartments={['Sales & Business Development', 'Sales', 'CRM', 'Administration & Management']}>
      <DashboardLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <span>Sales CRM — Leads Directory</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Capture requirements, track deal values, follow up, and convert won deals into projects.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/crm/pipeline"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Pipeline Kanban</span>
            </Link>            <button
              onClick={openCreateLeadModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search leads by name, company, email, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            {['ALL', 'NEW', 'CONTACTED', 'INTERESTED', 'REQUIREMENT', 'QUOTATION', 'NEGOTIATION', 'WON', 'LOST'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Lead Code</th>
                  <th className="py-3 px-4">Lead Contact</th>
                  <th className="py-3 px-4">Service Required</th>
                  <th className="py-3 px-4">Estimated Value</th>
                  <th className="py-3 px-4">Stage / Status</th>
                  <th className="py-3 px-4">Next Follow-Up</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {lead.leadCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{lead.contactName}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                        <span>{lead.company}</span>
                        <span>•</span>
                        <span>{lead.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {lead.service}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{lead.estimatedValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer ${getStatusBadge(lead.status)}`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="INTERESTED">INTERESTED</option>
                        <option value="REQUIREMENT">REQUIREMENT</option>
                        <option value="QUOTATION">QUOTATION</option>
                        <option value="NEGOTIATION">NEGOTIATION</option>
                        <option value="WON">WON (Convert)</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {lead.nextFollowUpDate || 'Not scheduled'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => openEditLeadModal(lead)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Lead"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.contactName)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {lead.status === 'WON' ? (
                          <Link
                            href="/clients"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Client Active</span>
                          </Link>
                        ) : (
                          <button
                            onClick={() => updateLeadStatus(lead.id, 'WON')}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 cursor-pointer"
                          >
                            <span>Convert</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create / Edit Lead */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {editingLead ? 'Edit Sales Lead' : 'Create New Sales Lead'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingLead(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveLead} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Malhotra"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Company / Brand *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nexus Logix Ltd"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9811122334"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. vikram@nexuslogix.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Service Required</label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500 bg-white"
                    >
                      <option value="Fullstack Next.js Web App">Fullstack Next.js Web App</option>
                      <option value="Performance Digital Marketing">Performance Digital Marketing</option>
                      <option value="SEO & Growth Architecture">SEO & Growth Architecture</option>
                      <option value="Branding & Creative Studio">Branding & Creative Studio</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Est. Deal Value (INR)</label>
                    <input
                      type="number"
                      value={formData.estimatedValue}
                      onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Requirement Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Key specifications, pain points, budget expectations..."
                    value={formData.requirementNotes}
                    onChange={(e) => setFormData({ ...formData, requirementNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs cursor-pointer"
                  >
                    {editingLead ? 'Save Lead Changes' : 'Create Lead'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
