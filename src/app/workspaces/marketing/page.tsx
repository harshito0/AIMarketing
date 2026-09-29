'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../../components/dashboard-layout';
import { AuthGuard } from '../../../components/auth-guard';
import { Megaphone, Sparkles, TrendingUp, DollarSign, Eye, MousePointer, Award, Plus, Calendar, ExternalLink } from 'lucide-react';

export default function MarketingWorkspacePage() {
  return (
    <AuthGuard allowedDepartments={['Digital Marketing', 'Social Media', 'Marketing']}>
      <DashboardLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Megaphone className="w-6 h-6 text-pink-600" />
              <span>Digital Marketing & Ads Workspace</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Monthly editorial content calendars, ad spend tracking, Meta Reels, Google Ads & ROAS.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/creative-studio"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Creative Studio</span>
            </Link>
            <Link
              href="/campaigns/create"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Campaign</span>
            </Link>
          </div>
        </div>

        {/* Marketing Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Ad Budget</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">₹1,20,000</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Impressions</span>
            <div className="text-xl font-extrabold text-blue-600 mt-1">14,200 Views</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Average CTR</span>
            <div className="text-xl font-extrabold text-emerald-600 mt-1">6.27% CTR</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Qualified Leads</span>
            <div className="text-xl font-extrabold text-purple-600 mt-1">48 Consultations</div>
          </div>
        </div>

        {/* Active Content & Campaign Cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  Google Ads & Meta Reels
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">
                  Jeevansphere — Delhi Eye Care Consultation Ads
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE • Scaled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Target Location</span>
                <span className="font-bold text-slate-800">Delhi NCR, India</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Daily Budget</span>
                <span className="font-bold text-slate-800">₹2,500 / day</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Cost Per Lead (CPA)</span>
                <span className="font-bold text-emerald-600">₹8.76 avg</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Lead Conversion Rate</span>
                <span className="font-bold text-purple-600">5.39%</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500">
              <span className="text-[11px]">Assigned Strategist: <strong>Pooja Sharma</strong></span>
              <Link href="/campaigns" className="text-blue-600 font-bold hover:underline">
                View Campaign Metrics →
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
