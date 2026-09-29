'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, Plus, Shield, CheckCircle, Clock, MessageSquare, CheckSquare, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useScreenTime } from '@/components/screen-time-tracker';

function normalizeDept(dept?: string): 'DEVELOPMENT' | 'MARKETING' | 'SALES' | 'MANAGEMENT' | 'ALL' {
  if (!dept) return 'DEVELOPMENT';
  const d = dept.toLowerCase();
  if (d === 'all') return 'ALL';
  if (d.includes('dev') || d.includes('eng') || d.includes('tech') || d.includes('soft')) return 'DEVELOPMENT';
  if (d.includes('market') || d.includes('social') || d.includes('content') || d.includes('creative')) return 'MARKETING';
  if (d.includes('sale') || d.includes('crm') || d.includes('lead') || d.includes('biz') || d.includes('business')) return 'SALES';
  if (d.includes('admin') || d.includes('manage') || d.includes('exec') || d.includes('owner') || d.includes('ceo') || d.includes('finance')) return 'MANAGEMENT';
  return 'DEVELOPMENT';
}

export function Topbar() {
  const router = useRouter();
  const { profile, role, department, activeDepartment } = useAuth();
  const { formattedTodayTime, isTabActive } = useScreenTime();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const userNormDept = normalizeDept(activeDepartment || department);
  const isAdmin = role === 'ADMIN' || profile?.email === 'aman@codekap.com';

  const quickSearchItems = [
    { title: 'Screen Time & Work Activity', category: 'Analytics', href: '/analytics/screen-time', departments: ['ALL', 'DEVELOPMENT', 'MARKETING', 'SALES', 'MANAGEMENT'] },
    { title: 'Website Development SOP', category: 'SOP', href: '/sop', departments: ['DEVELOPMENT', 'MANAGEMENT'] },
    { title: 'Development Workspace', category: 'Engineering', href: '/workspaces/dev', departments: ['DEVELOPMENT', 'MANAGEMENT'] },
    { title: 'My Sprint Tasks', category: 'Tasks', href: '/tasks', departments: ['DEVELOPMENT', 'MARKETING', 'SALES', 'MANAGEMENT'] },
    { title: 'Daily Work Logs', category: 'Logs', href: '/work-logs', departments: ['DEVELOPMENT', 'MARKETING', 'SALES', 'MANAGEMENT'] },
    { title: 'Create Social Post', category: 'Social', href: '/social/create', departments: ['MARKETING', 'MANAGEMENT'] },
    { title: 'Social Accounts & Analytics', category: 'Social', href: '/social/accounts', departments: ['MARKETING', 'MANAGEMENT'] },
    { title: 'Creative AI Studio', category: 'Marketing', href: '/creative-studio', departments: ['MARKETING', 'MANAGEMENT'] },
    { title: 'Performance Marketing Campaign', category: 'Marketing', href: '/workspaces/marketing', departments: ['MARKETING', 'MANAGEMENT'] },
    { title: 'Lead Pipeline Kanban', category: 'CRM', href: '/crm/pipeline', departments: ['SALES', 'MANAGEMENT'] },
    { title: 'Leads Directory', category: 'CRM', href: '/crm/leads', departments: ['SALES', 'MANAGEMENT'] },
    { title: 'Tax & GST Invoices', category: 'Finance', href: '/finance/invoices', departments: ['MANAGEMENT'] },
    { title: 'Client Business Hub', category: 'Clients', href: '/clients', departments: ['SALES', 'MANAGEMENT'] },
  ];

  const allowedSearchItems = quickSearchItems.filter((item) => {
    if (userNormDept === 'ALL' && isAdmin) return true;
    return item.departments.includes(userNormDept) || item.departments.includes('ALL');
  });

  const filteredItems = allowedSearchItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  let searchPlaceholder = 'Search leads, projects, invoices, SOPs... (Ctrl+K)';
  let quickActionButton = {
    label: 'New Lead / Project',
    href: '/crm/leads',
    icon: Plus,
  };

  if (userNormDept === 'DEVELOPMENT') {
    searchPlaceholder = 'Search tasks, repos, dev SOPs... (Ctrl+K)';
    quickActionButton = {
      label: 'My Tasks',
      href: '/tasks',
      icon: CheckSquare,
    };
  } else if (userNormDept === 'MARKETING') {
    searchPlaceholder = 'Search social posts, accounts, creatives... (Ctrl+K)';
    quickActionButton = {
      label: 'Create Post',
      href: '/social/create',
      icon: Plus,
    };
  } else if (userNormDept === 'SALES') {
    searchPlaceholder = 'Search leads, pipeline, quotations... (Ctrl+K)';
    quickActionButton = {
      label: 'New Lead',
      href: '/crm/leads',
      icon: Plus,
    };
  }

  const QuickIcon = quickActionButton.icon;

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Global Search Bar */}
      <div className="relative w-80">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none transition-colors duration-200" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-2xs"
          />
        </div>

        {/* Quick Search Dropdown with smooth entrance */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-accordion">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Suggestions ({userNormDept === 'DEVELOPMENT' ? 'Developer' : userNormDept === 'MARKETING' ? 'Social Media' : userNormDept === 'SALES' ? 'Sales' : 'All'})
            </div>
            {filteredItems.map((item, idx) => (
              <button
                key={idx}
                onMouseDown={() => router.push(item.href)}
                className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between group transition-colors duration-150 cursor-pointer btn-press"
              >
                <span className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors duration-150">
                  {item.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors duration-150">
                  {item.category}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Department Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-[11px] font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span>
            {userNormDept === 'DEVELOPMENT'
              ? '💻 Engineering'
              : userNormDept === 'MARKETING'
              ? '📱 Social & Marketing'
              : userNormDept === 'SALES'
              ? '💼 Sales & CRM'
              : '👑 All Access'}
          </span>
        </div>

        {/* Live Screen Time Badge */}
        <Link
          href="/analytics/screen-time"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-mono font-bold transition-all duration-200 btn-press shadow-xs group"
          title="Click to view Workspace Screen Time & Activity Analytics"
        >
          <span className={`w-2 h-2 rounded-full ${isTabActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
          <span>{formattedTodayTime}</span>
        </Link>

        {/* Dynamic Department Quick Action Button */}
        <Link
          href={quickActionButton.href}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-blue-600/20 transition-all duration-200 btn-press"
        >
          <QuickIcon className="w-3.5 h-3.5" />
          <span>{quickActionButton.label}</span>
        </Link>

        {/* Team Chat Icon */}
        <Link
          href="/chat"
          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 relative btn-press shadow-2xs"
          title="KAIRO Team Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </Link>

        {/* Notifications Icon */}
        <Link
          href="/notifications"
          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 relative btn-press shadow-2xs"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5 ring-2 ring-white" />
        </Link>
      </div>
    </header>
  );
}
