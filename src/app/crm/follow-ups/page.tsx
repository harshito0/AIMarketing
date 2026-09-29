'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../../components/dashboard-layout';
import { AuthGuard } from '../../../components/auth-guard';
import { LeadItem } from '../../../lib/types';
import { Calendar, Phone, Mail, Clock, CheckCircle2, AlertCircle, ChevronRight, User } from 'lucide-react';

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/leads')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeads(data);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard allowedDepartments={['Sales & Business Development', 'Sales', 'CRM', 'Administration & Management']}>
      <DashboardLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span>Sales Follow-ups & Reminders</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Never lose a warm lead. Scheduled calls, client touchpoints and proposal follow-ups.
            </p>
          </div>

          <Link
            href="/crm/leads"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>All Leads</span>
          </Link>
        </div>

        {/* Schedule List */}
        <div className="space-y-4">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-blue-300 transition-all text-xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-slate-900">{lead.contactName}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                      {lead.company}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {lead.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-1.5">{lead.requirementNotes || lead.service}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {lead.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {lead.email}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Assigned: {lead.assignedToName || 'Aman Sir'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Follow-up Date</span>
                  <span className="text-xs font-bold text-slate-900">{lead.nextFollowUpDate || '2026-08-30'}</span>
                </div>

                <a
                  href={`tel:${lead.phone}`}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
