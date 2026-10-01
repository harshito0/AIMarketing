'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/auth/auth-context';
import {
  ArrowRight,
  Lock,
  AlertCircle,
  RefreshCw,
  Shield,
  KeyRound,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  User,
  Check
} from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || '/dashboard';
  const urlMessage = searchParams?.get('message');

  const { signIn, signInAsSuperAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Super Admin 6-Digit PIN Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [showInvalidPopup, setShowInvalidPopup] = useState(false);

  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [authLoading, isAuthenticated, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your email address or username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(identifier.trim(), password);

      if (result.success) {
        router.push(redirectUrl);
      } else {
        setError(result.error || 'Invalid credentials. Please verify your email and password.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifySuperAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinValue.trim();

    if (cleanPin !== '090807') {
      setShowInvalidPopup(true);
      return;
    }

    setPinLoading(true);
    try {
      const result = await signInAsSuperAdmin(cleanPin);

      if (result.success) {
        setIsPinModalOpen(false);
        router.push(redirectUrl);
      } else {
        setShowInvalidPopup(true);
      }
    } catch {
      setShowInvalidPopup(true);
    } finally {
      setPinLoading(false);
    }
  };

  const quickLoginAs = async (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setLoading(true);
    setError('');
    try {
      const result = await signIn(email, pass);
      if (result.success) {
        router.push(redirectUrl);
      } else {
        setError(result.error || 'Quick login failed');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
      setLoading(false);
    }
  };

  return (
    <div className="p-8 sm:p-10">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Sign In to CodeKap OS</h3>
        <p className="text-xs text-slate-500 font-medium mt-1">Access campaign automation, creative engine, and team controls</p>
      </div>

      {/* 1-Click Super Admin Access with 6-Digit Verification */}
      <div className="mb-3 p-4 rounded-2xl bg-purple-50/80 border border-purple-200/90 flex items-center justify-between gap-3 shadow-2xs card-lift">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-600/20 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-purple-950">Super Admin Access</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-200 text-purple-900 font-extrabold uppercase">PIN Protected</span>
            </div>
            <p className="text-[10px] text-purple-700 font-medium">Aman Sir (@aman) • 6-digit PIN verification</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setPinValue('');
            setShowInvalidPopup(false);
            setIsPinModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-sm hover:scale-[1.02] cursor-pointer btn-press shrink-0"
        >
          Super Admin →
        </button>
      </div>

      {/* Quick Role & Department Sign-In Presets */}
      <div className="mb-6 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Test Department Access</span>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-200/70 px-2 py-0.5 rounded-full">1-Click Fast Login</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => quickLoginAs('harshitsingh19622@gmail.com', 'password123')}
            disabled={loading}
            className="p-3 rounded-xl border border-blue-200 bg-white hover:bg-blue-50/60 text-left transition-all hover:scale-[1.01] cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">💻</span>
              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Developer</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium truncate">Harshit • Development</p>
            <p className="text-[9px] text-blue-600 font-bold mt-0.5">🚫 No Social / No Leads</p>
          </button>

          <button
            type="button"
            onClick={() => quickLoginAs('pooja.sharma@codekap.com', 'password123')}
            disabled={loading}
            className="p-3 rounded-xl border border-pink-200 bg-white hover:bg-pink-50/60 text-left transition-all hover:scale-[1.01] cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">📱</span>
              <span className="text-xs font-bold text-slate-900 group-hover:text-pink-600">Social Media</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium truncate">Pooja • Marketing</p>
            <p className="text-[9px] text-pink-600 font-bold mt-0.5">🚫 No GitHub / No Dev</p>
          </button>
        </div>
      </div>

      {urlMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium text-center animate-fade-in">
          {urlMessage}
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Email or Username
          </label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter email or username"
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 block">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer btn-press"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Team Member Join with Passcode CTA */}
      <div className="mt-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5 card-lift">
        <span className="text-[11px] text-slate-500 font-medium block">Have an invite passcode from your Super Admin?</span>
        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Join Team with Passcode →</span>
        </Link>
      </div>

      <div className="mt-5 text-center">
        <p className="text-xs text-slate-500 font-medium">
          Need a workspace account?{' '}
          <Link href="/signup" className="text-blue-600 font-bold hover:underline">
            Register / Join
          </Link>
        </p>
      </div>

      {/* Modal: 6-Digit Super Admin PIN Verification */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 md:p-8 border border-slate-200 shadow-2xl space-y-5 text-center relative overflow-hidden card-lift">
            <button
              onClick={() => setIsPinModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-xs">
              <Shield className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">Super Admin PIN Verification</h3>
              <p className="text-xs text-slate-500 mt-1">Enter your confidential 6-digit security PIN to access Super Admin privileges.</p>
            </div>

            <form onSubmit={handleVerifySuperAdminPin} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  required
                  placeholder="••••••"
                  value={pinValue}
                  onChange={(e) => {
                    setPinValue(e.target.value.replace(/\D/g, ''));
                    setShowInvalidPopup(false);
                  }}
                  className="w-full text-center text-2xl font-mono font-black tracking-[0.5em] px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-purple-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {showInvalidPopup && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 animate-fade-in">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Invalid Security PIN. Access Denied.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={pinLoading || pinValue.length < 6}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer btn-press"
              >
                {pinLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Security PIN...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize Super Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <img
            src="/images/codekap-logo.png"
            alt="CodeKap"
            className="w-11 h-11 object-contain group-hover:scale-105 transition-transform duration-200 shrink-0"
          />
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 text-lg tracking-tight">CodeKap OS</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200">v1.0</span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold">Autonomous Business Operating System</p>
          </div>
        </Link>
      </div>

      {/* Main Form Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden card-lift animate-fade-in">
          <Suspense fallback={
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading Sign In portal...</span>
            </div>
          }>
            <SignInForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
