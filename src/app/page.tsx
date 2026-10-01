'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  Layers,
  Receipt,
  Users,
  Code2,
  Zap,
  Lock,
  ChevronRight,
  KeyRound,
  BarChart3,
  Bot
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Floating Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-2xs transition-all duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/images/codekap-logo.png"
              alt="CodeKap"
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform duration-200 shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-base tracking-tight group-hover:text-blue-600 transition-colors">
                  CodeKap OS
                </span>
                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  Enterprise
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold">Autonomous Business Operating System</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Platform Modules</a>
            <a href="#solutions" className="hover:text-blue-600 transition-colors">CRM & Finance</a>
            <a href="#security" className="hover:text-blue-600 transition-colors">Security & Passcodes</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 btn-press"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="px-4 py-2 rounded-xl text-slate-700 hover:text-blue-600 text-xs font-bold transition-all hover:bg-slate-100 btn-press"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 btn-press"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Join with Passcode</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        {/* Subtle Background Glow Accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-400/10 via-indigo-400/15 to-purple-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-6 shadow-2xs animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Autonomous AI Performance Marketing & Business OS</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.12] mb-6">
            Scale Client Delivery, CRM & Finance with <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">CodeKap OS</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
            An all-in-one executive platform powering multi-channel ads automation, lead pipelines, GST invoicing, team task delegation, and SOP blueprints.
          </p>

          {/* Action Button Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16">
            <Link
              href="/signin"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] btn-press"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-2xs flex items-center justify-center gap-2 transition-all hover:border-slate-300 btn-press"
            >
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Enter Joining Passcode</span>
            </Link>
          </div>

          {/* Live Mockup / Interactive Feature Preview */}
          <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 card-lift relative overflow-hidden text-left">
            {/* Top Mock Window Controls */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="ml-2 text-xs font-bold text-slate-500 font-mono">codekap-os.executive.portal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Engine Active
                </span>
              </div>
            </div>

            {/* Dashboard Mockup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Live Pipeline Value</span>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">₹18,45,000</p>
                <span className="text-[10px] text-emerald-600 font-bold">↑ +24.8% realization rate</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Operating Surplus</span>
                  <Receipt className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-emerald-700 tracking-tight">₹12,80,000</p>
                <span className="text-[10px] text-slate-500 font-medium">Revenue minus expenses</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Active Client Projects</span>
                  <Briefcase className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-black text-purple-700 tracking-tight">14 Deliverables</p>
                <span className="text-[10px] text-purple-600 font-bold">100% On-Track milestones</span>
              </div>
            </div>

            {/* Bottom Showcase Row */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Automated Multi-Agent Creative Engine</h4>
                  <p className="text-[11px] text-slate-300">Generates Google Ads headlines, Meta visuals, and marketing copy in seconds.</p>
                </div>
              </div>
              <Link
                href="/signin"
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-sm transition-all btn-press shrink-0"
              >
                Access System →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Modules */}
      <section id="features" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-2 block">
              Architected for Performance
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Unified Operating System for Modern Agencies
            </h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Eliminate disjointed tools. CodeKap OS integrates every dimension of your workflow under a single governable command hub.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-2xs card-lift space-y-3 group">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Lead Pipeline & CRM Kanban</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Track deal velocity from initial discovery to Won contracts. Automated follow-up alerts prevent any qualified lead from going cold.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-2xs card-lift space-y-3 group">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">GST Billing & Financial Surplus</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Generate compliant GST invoices with automated 18% CGST/SGST/IGST breakdown, real-time realization tracking, and expense balance sheets.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-2xs card-lift space-y-3 group">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Task Delegation & SOP Blueprints</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Delegate client milestones directly to team members with priority levels, deadline tracking, and standardized operating procedures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Access Callout */}
      <section id="security" className="py-16 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Role-Governed Team Access & Passcodes
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed font-medium">
            Super Admins generate instant 6-character team passcodes (`AGENT-XXXX`) allowing colleagues to join the workspace with designated role permissions without friction.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all btn-press"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Register with Team Passcode</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">CodeKap OS</span>
            <span>•</span>
            <span>Enterprise Marketing Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 font-semibold">
            <Link href="/signin" className="hover:text-blue-600">Sign In</Link>
            <Link href="/signup" className="hover:text-blue-600">Register</Link>
            <Link href="/dashboard" className="hover:text-blue-600">Executive Hub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
