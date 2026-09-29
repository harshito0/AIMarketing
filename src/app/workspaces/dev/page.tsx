'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../../components/dashboard-layout';
import { AuthGuard } from '../../../components/auth-guard';
import { Code2, GitBranch, Terminal, CheckCircle2, AlertTriangle, Layers, Users, ExternalLink, Plus } from 'lucide-react';

export default function DevWorkspacePage() {
  return (
    <AuthGuard allowedDepartments={['Development', 'Engineering']}>
      <DashboardLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Code2 className="w-6 h-6 text-blue-600" />
              <span>Development Operations Workspace</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Active engineering repos, Next.js builds, API security, QA passes & sprint deliverables.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/sop"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <span>Development SOP</span>
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Dev Project</span>
            </Link>
          </div>
        </div>

        {/* Engineering KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Repos</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">4 Repositories</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Engineers Load</span>
            <div className="text-xl font-extrabold text-blue-600 mt-1">85% Capacity</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">QA Test Coverage</span>
            <div className="text-xl font-extrabold text-emerald-600 mt-1">98% Passed</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Blockers</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">0 Critical</div>
          </div>
        </div>

        {/* Active Development Projects */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  CK-PRJ-2001
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Jeevansphere Eye Care Platform & Portal</h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sprint 3 / Phase 2
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Architecture</span>
                <p className="font-semibold text-slate-800">Next.js 16 + TypeScript + SQLite/Postgres</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Lead Engineer</span>
                <p className="font-semibold text-slate-800">Harshit Singh (Lead Architect)</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Build Health</span>
                <p className="font-semibold text-emerald-600">✓ Production Build Passing</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-500">
              <div className="flex items-center gap-4 text-[11px]">
                <a
                  href="https://github.com/harshito0/AIMarketing"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>github.com/harshito0/AIMarketing</span>
                </a>
                <a
                  href="http://jeevansphere.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-slate-700 hover:underline font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>jeevansphere.com</span>
                </a>
              </div>

              <Link href="/tasks" className="text-blue-600 hover:underline font-bold">
                Sprint Tasks →
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
