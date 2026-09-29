'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth/auth-context';
import { UserRole } from '../lib/types';
import { ShieldAlert, RefreshCw, Lock, AlertTriangle } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  allowedDepartments?: string[];
  requireEmailVerification?: boolean;
}

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

export function AuthGuard({
  children,
  allowedRoles,
  allowedDepartments,
  requireEmailVerification = true,
}: AuthGuardProps) {
  const { isAuthenticated, isEmailVerified, profile, status, loading, role, department, activeDepartment, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [timeoutExpired, setTimeoutExpired] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutExpired(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const isEffectiveLoading = loading && !timeoutExpired;
    if (!isEffectiveLoading && !isAuthenticated) {
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
    } else if (!isEffectiveLoading && isAuthenticated && requireEmailVerification && !isEmailVerified) {
      router.push('/verify-email');
    }
  }, [loading, timeoutExpired, isAuthenticated, isEmailVerified, requireEmailVerification, pathname, router]);

  if (loading && !timeoutExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-700">Verifying session & permissions...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Account Suspended or Disabled check
  if (status === 'SUSPENDED' || status === 'DISABLED') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-xl overflow-hidden text-center p-8">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Account Access Suspended</h2>
          <p className="text-sm text-slate-600 mt-2">
            Your Agent AI account has been suspended or disabled by an administrator.
          </p>
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => signOut()}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Email verification check
  if (requireEmailVerification && !isEmailVerified) {
    return null; // Will redirect via useEffect to /verify-email
  }

  // Role Access check
  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200 shadow-xl overflow-hidden text-center p-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">403 — Access Denied</h2>
          <p className="text-sm text-slate-600 mt-2">
            Your assigned role (<span className="font-bold text-slate-900">{role}</span>) does not have permission to access this area.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Required role: {allowedRoles.join(', ')}
          </p>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => router.push('/dashboard')}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Department Access check
  const isAdmin = role === 'ADMIN' || profile?.email === 'aman@codekap.com';
  if (!isAdmin && allowedDepartments && allowedDepartments.length > 0) {
    const userNormDept = normalizeDept(activeDepartment || department);
    const hasDeptAccess = allowedDepartments.some((d) => {
      const targetNorm = normalizeDept(d);
      return targetNorm === userNormDept || targetNorm === 'ALL';
    });

    if (!hasDeptAccess) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-indigo-200 shadow-xl overflow-hidden text-center p-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Department Access Restricted</h2>
            <p className="text-sm text-slate-600 mt-2">
              This module is designated for the <span className="font-bold text-slate-900">{allowedDepartments.join(', ')}</span> department.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Your active department: <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{activeDepartment || department || 'Development'}</span>
            </p>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => router.push('/dashboard')}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Return to My Workspace
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
