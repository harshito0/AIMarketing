'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../../components/dashboard-layout';
import { AuthGuard } from '../../../components/auth-guard';
import { LeadItem, LeadStatus } from '../../../lib/types';
import { Layers, Plus, ArrowRight, DollarSign, Building2, Phone, CheckCircle2, ChevronRight, Filter } from 'lucide-react';

const STAGES: { key: LeadStatus; label: string; color: string }[] = [
  { key: 'NEW', label: 'New Leads', color: 'border-slate-300 bg-slate-50' },
  { key: 'CONTACTED', label: 'Contacted', color: 'border-blue-300 bg-blue-50/40' },
  { key: 'INTERESTED', label: 'Interested', color: 'border-cyan-300 bg-cyan-50/40' },
  { key: 'REQUIREMENT', label: 'Requirement', color: 'border-amber-300 bg-amber-50/40' },
  { key: 'QUOTATION', label: 'Quotation Sent', color: 'border-purple-300 bg-purple-50/40' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'border-rose-300 bg-rose-50/40' },
  { key: 'WON', label: 'Won Deals', color: 'border-emerald-400 bg-emerald-50/50' },
];

export default function SalesPipelinePage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/leads');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setLeads(data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const moveStage = async (id: string, nextStatus: LeadStatus) => {
    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status: nextStatus } : l));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getNextStage = (curr: LeadStatus): LeadStatus | null => {
    const order: LeadStatus[] = ['NEW', 'CONTACTED', 'INTERESTED', 'REQUIREMENT', 'QUOTATION', 'NEGOTIATION', 'WON'];
    const idx = order.indexOf(curr);
    if (idx !== -1 && idx < order.length - 1) return order[idx + 1];
    return null;
  };

  return (
    <AuthGuard allowedDepartments={['Sales & Business Development', 'Sales', 'CRM', 'Administration & Management']}>
      <DashboardLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-amber-600" />
              <span>Sales Pipeline (Kanban)</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Visual pipeline from initial lead capture through quotation to won conversion.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/crm/leads"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <span>Table View</span>
            </Link>
            <Link
              href="/crm/leads"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Deal</span>
            </Link>
          </div>
        </div>

        {/* Kanban Board Container */}
        <div className="flex gap-4 overflow-x-auto pb-6">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter(l => l.status === stage.key);
            const totalStageValue = stageLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

            return (
              <div
                key={stage.key}
                className="w-72 shrink-0 bg-slate-100/70 border border-slate-200 rounded-2xl p-3.5 flex flex-col max-h-[calc(100vh-220px)]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{stage.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 font-extrabold text-slate-700">
                      {stageLeads.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    ₹{(totalStageValue / 1000).toFixed(0)}k
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {stageLeads.map((lead) => {
                    const nextSt = getNextStage(lead.status);

                    return (
                      <div
                        key={lead.id}
                        className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-blue-300 transition-all text-xs"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {lead.leadCode}
                          </span>
                          <span className="font-bold text-slate-900">
                            ₹{(lead.estimatedValue || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 mb-0.5">{lead.contactName}</h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{lead.company}</span>
                        </p>

                        <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-3">
                          {lead.service}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                            {lead.phone}
                          </span>

                          {nextSt && (
                            <button
                              onClick={() => moveStage(lead.id, nextSt)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 cursor-pointer"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                          {lead.status === 'WON' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Won</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {stageLeads.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      No deals in {stage.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
