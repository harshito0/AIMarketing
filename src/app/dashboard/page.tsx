'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../components/dashboard-layout';
import { AuthGuard } from '../../components/auth-guard';
import { useAuth } from '../../lib/auth/auth-context';
import { useCountUp } from '../../lib/hooks/use-count-up';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Briefcase, 
  CheckSquare, 
  AlertCircle, 
  ArrowUpRight, 
  Layers, 
  Clock, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  Receipt,
  FileCheck2,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Send,
  ExternalLink
} from 'lucide-react';

export default function DashboardPage() {
  const { profile, role } = useAuth();
  const isOwner = role === 'ADMIN' || profile?.email === 'aman@codekap.com';

  const [data, setData] = useState({
    revenue: 0,
    collections: 0,
    outstanding: 0,
    expenses: 0,
    operatingSurplus: 0,
    activeProjects: 0,
    openLeads: 0,
    wonDeals: 0,
    pendingTasks: 0,
    teamSize: 0,
    recentProjects: [] as any[],
    recentTasks: [] as any[],
    recentLogs: [] as any[],
    recentSops: [] as any[],
    myTasks: [] as any[],
    myWorkLogs: [] as any[],
    myPendingTasksCount: 0,
    myCompletedTasksCount: 0,
    myTotalHoursLogged: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Smooth Count-Up Animations for KPI numbers (250–450ms ease-out)
  const animatedRevenue = useCountUp(data.revenue, 400);
  const animatedCollections = useCountUp(data.collections, 400);
  const animatedOutstanding = useCountUp(data.outstanding, 400);
  const animatedSurplus = useCountUp(data.operatingSurplus, 400);

  const animatedActiveProjects = useCountUp(data.activeProjects, 350);
  const animatedOpenLeads = useCountUp(data.openLeads, 350);
  const animatedPendingTasks = useCountUp(data.pendingTasks, 350);
  const animatedTeamSize = useCountUp(data.teamSize, 350);

  const animatedMyPendingTasks = useCountUp(data.myPendingTasksCount, 350);
  const animatedMyCompletedTasks = useCountUp(data.myCompletedTasksCount, 350);
  const animatedMyHoursLogged = useCountUp(data.myTotalHoursLogged, 350);
  const animatedSopsCount = useCountUp(data.recentSops.length, 350);

  // Quick Work Log Form State (For Team Members)
  const [workCompleted, setWorkCompleted] = useState('');
  const [hoursSpent, setHoursSpent] = useState('4');
  const [submittingLog, setSubmittingLog] = useState(false);
  const [logSuccessMsg, setLogSuccessMsg] = useState('');

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const query = new URLSearchParams();
      if (profile?.uid) query.set('userId', profile.uid);
      if (profile?.email) query.set('userEmail', profile.email);

      const res = await fetch(`/api/dashboard/overview?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json) {
          setData(json);
        }
      }
    } catch (err) {
      console.warn('[Dashboard fetch error]:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchDashboardData();
    // Real-time background synchronization every 12 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Quick Task Status Toggle
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Work Log Submit (Team Member)
  const handleQuickSubmitWorkLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workCompleted.trim()) return;

    setSubmittingLog(true);
    try {
      const res = await fetch('/api/work-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: profile?.uid || 'emp_user',
          employeeName: profile?.name || 'Team Member',
          employeeEmail: profile?.email || 'member@codekap.com',
          workCompleted: workCompleted.trim(),
          timeSpentHours: Number(hoursSpent) || 4,
          date: new Date().toISOString().split('T')[0],
          tomorrowPlan: 'Continue assigned milestones and client tasks',
        }),
      });

      if (res.ok) {
        setWorkCompleted('');
        setLogSuccessMsg('Work log submitted successfully!');
        setTimeout(() => setLogSuccessMsg(''), 4000);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingLog(false);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* ========================================================================= */}
        {/* SKELETON SHIMMER LOADING STATE                                            */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="space-y-8 animate-fade-in">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-8 w-64 rounded-xl skeleton-shimmer" />
                <div className="h-4 w-96 rounded-lg skeleton-shimmer" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-24 rounded-xl skeleton-shimmer" />
                <div className="h-9 w-28 rounded-xl skeleton-shimmer" />
              </div>
            </div>

            {/* 4 KPI Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 rounded skeleton-shimmer" />
                    <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                  </div>
                  <div className="h-7 w-32 rounded-lg skeleton-shimmer" />
                  <div className="h-3 w-28 rounded skeleton-shimmer" />
                </div>
              ))}
            </div>

            {/* Content Split Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 h-72 rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 skeleton-shimmer" />
              <div className="h-72 rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 skeleton-shimmer" />
            </div>
          </div>
        ) : isOwner ? (
          <div className="animate-fade-in">
            {/* View 1: Executive Business Owner Dashboard */}
            {/* Owner Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Executive Owner Dashboard
                  </h1>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-colors duration-150">
                    Super Admin
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  Real-time live operational health, sales pipeline, GST invoicing & team metrics.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => fetchDashboardData(true)}
                  disabled={refreshing}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-2xs cursor-pointer btn-press"
                  title="Refresh live data"
                >
                  <RefreshCw className={`w-4 h-4 transition-transform duration-300 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
                </button>
                <Link
                  href="/admin/team"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs shadow-purple-600/20 transition-all duration-200 btn-press"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Invite & Passcode</span>
                </Link>
                <Link
                  href="/crm/leads"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all duration-200 btn-press"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Lead</span>
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all duration-200 btn-press"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </Link>
              </div>
            </div>

            {/* 1. Core Financial KPIs with smooth Card Lift and Count-Up */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Revenue */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-lift group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-700 transition-colors duration-200">
                    Total Revenue
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">
                  {formatINR(animatedRevenue)}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {data.revenue === 0 ? 'No invoices raised yet' : 'Real-time billing total'}
                </div>
              </div>

              {/* Collections */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-lift group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700 transition-colors duration-200">
                    Collections
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-emerald-700 mb-1 tracking-tight">
                  {formatINR(animatedCollections)}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {data.revenue > 0 ? `${Math.round((data.collections / data.revenue) * 100)}% realization rate` : '₹0 collected'}
                </div>
              </div>

              {/* Outstanding */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-lift group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors duration-200">
                    Outstanding
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-200">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-amber-600 mb-1 tracking-tight">
                  {formatINR(animatedOutstanding)}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {data.outstanding > 0 ? 'Pending invoice balance' : 'Zero pending dues'}
                </div>
              </div>

              {/* Operating Surplus */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-lift group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-700 transition-colors duration-200">
                    Operating Surplus
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-purple-700 mb-1 tracking-tight">
                  {formatINR(animatedSurplus)}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Revenue minus recorded expenses
                </div>
              </div>
            </div>

            {/* 2. Operations & Pipeline Metrics with count-up & lift */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <Link href="/projects" className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-400 card-lift group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-900">{animatedActiveProjects}</div>
                    <div className="text-xs font-semibold text-slate-500">Active Projects</div>
                  </div>
                </div>
              </Link>

              <Link href="/crm/leads" className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-cyan-400 card-lift group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-900">{animatedOpenLeads}</div>
                    <div className="text-xs font-semibold text-slate-500">Open CRM Leads</div>
                  </div>
                </div>
              </Link>

              <Link href="/tasks" className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-amber-400 card-lift group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-900">{animatedPendingTasks}</div>
                    <div className="text-xs font-semibold text-slate-500">Pending Tasks</div>
                  </div>
                </div>
              </Link>

              <Link href="/admin/team" className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-400 card-lift group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-900">{animatedTeamSize}</div>
                    <div className="text-xs font-semibold text-slate-500">Workspace Members</div>
                  </div>
                </div>
              </Link>
            </div>

            {/* 3. Live Project Delivery & Activity Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Active Projects Table Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden card-lift">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-900">Active Client Projects</h2>
                  </div>
                  <Link href="/projects" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 group">
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
                  </Link>
                </div>

                <div className="p-4">
                  {data.recentProjects.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">No projects created yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 mb-4">Create your first client project to track delivery milestones.</p>
                      <Link
                        href="/projects"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition-all duration-200 btn-press"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create Project
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-2.5 px-3">Project</th>
                            <th className="py-2.5 px-3">Client</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Progress</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {data.recentProjects.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                              <td className="py-3 px-3 font-bold text-slate-900">{p.name}</td>
                              <td className="py-3 px-3 text-slate-600">{p.clientName || 'General'}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${p.progress || 0}%` }} />
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <Link href="/projects" className="text-blue-600 hover:underline font-bold text-[11px] inline-flex items-center gap-1 group">
                                  <span>Manage</span>
                                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-150" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Activity Stream Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden card-lift">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-slate-900">Activity Stream</h2>
                  </div>
                  <Link href="/audit-log" className="text-xs font-bold text-blue-600 hover:underline">
                    View Log
                  </Link>
                </div>
                <div className="p-4">
                  {data.recentLogs.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-xs font-bold text-slate-700">No activity logged yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">System operations will be streamed here in real time.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.recentLogs.map((log) => (
                        <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-50/90 text-xs transition-all duration-150 animate-fade-in">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 truncate max-w-[140px]">{log.userName || log.agentName || 'System'}</span>
                            <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-600 font-medium leading-snug">{log.action}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: TEAM MEMBER WORKSPACE DASHBOARD                                   */
          /* ========================================================================= */
          <div className="animate-fade-in">
            {/* Team Member Greeting Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-950/20 mb-8 relative overflow-hidden card-lift">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-blue-200 mb-3 border border-white/10">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Team Member Workspace — {profile?.title || 'Codekap Contributor'}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Welcome back, {profile?.name || 'Colleague'}! 👋
                  </h1>
                  <p className="text-blue-200 text-sm mt-1 max-w-xl font-normal">
                    Here is your live personal workspace. Review assigned milestones, check SOP blueprints, and log your daily progress.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchDashboardData(true)}
                    disabled={refreshing}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition-all duration-200 flex items-center gap-2 cursor-pointer btn-press"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-300 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                  <Link
                    href="/tasks"
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/30 transition-all duration-200 flex items-center gap-1.5 btn-press"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>My Tasks</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Member Personal KPI Cards with Count-Up and Lift */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* My Pending Tasks */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-lift group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors duration-200">
                    My Pending Tasks
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-200">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">{animatedMyPendingTasks}</div>
                <div className="text-xs text-amber-600 font-medium">Awaiting completion</div>
              </div>

              {/* Completed Tasks */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-lift group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700 transition-colors duration-200">
                    Completed Tasks
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-emerald-700 mb-1 tracking-tight">{animatedMyCompletedTasks}</div>
                <div className="text-xs text-emerald-600 font-medium">Delivered successfully</div>
              </div>

              {/* Logged Hours */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-lift group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-700 transition-colors duration-200">
                    Logged Hours
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-blue-700 mb-1 tracking-tight">{animatedMyHoursLogged} hrs</div>
                <div className="text-xs text-blue-600 font-medium">Across daily work logs</div>
              </div>

              {/* Available SOPs */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-lift group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-700 transition-colors duration-200">
                    SOP Library
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-purple-700 mb-1 tracking-tight">{animatedSopsCount}</div>
                <div className="text-xs text-purple-600 font-medium">Ready execution guidelines</div>
              </div>
            </div>

            {/* Member Tasks & Quick Daily Work Log Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Assigned Tasks List */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden card-lift">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-900">Tasks Assigned to Me</h2>
                  </div>
                  <Link href="/tasks" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 group">
                    <span>Task Hub</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
                  </Link>
                </div>

                <div className="p-4">
                  {data.myTasks.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">All caught up! No pending tasks.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Tasks assigned to you by Super Admin will appear here in real time.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.myTasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                task.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {task.priority}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                task.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {task.status}
                              </span>
                              {task.clientName && (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                  {task.clientName}
                                </span>
                              )}
                            </div>
                            <h3 className="text-xs font-bold text-slate-900">{task.title}</h3>
                            {task.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {task.status === 'TODO' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all duration-150 cursor-pointer btn-press"
                              >
                                Start Task
                              </button>
                            )}
                            {task.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all duration-150 shadow-2xs cursor-pointer btn-press"
                              >
                                Mark Done ✓
                              </button>
                            )}
                            {task.status === 'COMPLETED' && (
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Work Log Submission Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden card-lift">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-slate-900">Quick Daily Log</h2>
                  </div>
                  <Link href="/work-logs" className="text-xs font-bold text-blue-600 hover:underline">
                    View Logs
                  </Link>
                </div>

                <div className="p-5">
                  {logSuccessMsg && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{logSuccessMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleQuickSubmitWorkLog} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Work Completed Today *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={workCompleted}
                        onChange={(e) => setWorkCompleted(e.target.value)}
                        placeholder="e.g. Designed and reviewed 3 eye care campaign visuals; verified mobile responsive layouts."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Hours Spent
                      </label>
                      <select
                        value={hoursSpent}
                        onChange={(e) => setHoursSpent(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white font-medium transition-all duration-200"
                      >
                        <option value="2">2 Hours</option>
                        <option value="4">4 Hours (Half Day)</option>
                        <option value="6">6 Hours</option>
                        <option value="8">8 Hours (Full Day)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingLog || !workCompleted.trim()}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-60 transition-all duration-200 cursor-pointer btn-press"
                    >
                      {submittingLog ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Log...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Work Log</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* SOP Quick Access for Team Member */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 mb-8 card-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm font-bold text-slate-900">Standard Operating Procedures (SOPs)</h2>
                </div>
                <Link href="/sop" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 group">
                  <span>Open SOP Hub</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-150" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recentSops.map((sop: any) => (
                  <div key={sop.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {sop.code}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {sop.department}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors duration-150">{sop.title}</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{sop.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
