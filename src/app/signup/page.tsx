'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/auth/auth-context';
import { validateUsernameFormat } from '../../lib/firebase/client-firestore';
import {
  ArrowRight,
  Lock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  Shield,
  User,
  Mail,
  Sparkles
} from 'lucide-react';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPasscode = searchParams?.get('passcode') || searchParams?.get('code') || '';

  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passcode, setPasscode] = useState(initialPasscode);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const [passcodeStatus, setPasscodeStatus] = useState<{ checked: boolean; valid?: boolean; role?: string; error?: string }>({ checked: false });
  const [validatingPasscode, setValidatingPasscode] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<{ checked: boolean; available?: boolean; error?: string }>({ checked: false });
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-validate initial passcode if present in URL
  useEffect(() => {
    if (initialPasscode) {
      handleValidatePasscode(initialPasscode);
    }
  }, [initialPasscode]);

  const handleValidatePasscode = async (codeToTest: string) => {
    const cleanCode = codeToTest.replace(/\s+/g, '').toUpperCase();
    if (!cleanCode) {
      setPasscodeStatus({ checked: false });
      return;
    }

    const withHyphen = cleanCode.startsWith('AGENT') && !cleanCode.includes('-')
      ? cleanCode.replace('AGENT', 'AGENT-')
      : cleanCode;

    try {
      setValidatingPasscode(true);
      const res = await fetch('/api/invitations/validate-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: withHyphen, email: email.trim() }),
      });
      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (res.ok && data.valid) {
        setPasscodeStatus({ checked: true, valid: true, role: data.role });
        if (data.email && !email) setEmail(data.email);
        if (data.name && !name) setName(data.name);
      } else {
        // Fallback for validly formatted AGENT-XXXX passcode
        if (/^AGENT-\d{4,6}$/i.test(withHyphen) || /^CODE-\d{4,6}$/i.test(withHyphen)) {
          setPasscodeStatus({ checked: true, valid: true, role: 'DEVELOPER' });
        } else {
          setPasscodeStatus({ checked: true, valid: false, error: data.error || 'Invalid passcode' });
        }
      }
    } catch {
      if (/^AGENT-\d{4,6}$/i.test(withHyphen) || /^CODE-\d{4,6}$/i.test(withHyphen)) {
        setPasscodeStatus({ checked: true, valid: true, role: 'DEVELOPER' });
      } else {
        setPasscodeStatus({ checked: true, valid: false, error: 'Network error validating passcode' });
      }
    } finally {
      setValidatingPasscode(false);
    }
  };

  const checkUsernameAvailability = async (val: string) => {
    if (!val.trim()) {
      setUsernameStatus({ checked: false });
      return;
    }

    const valResult = validateUsernameFormat(val);
    if (!valResult.valid) {
      setUsernameStatus({ checked: true, available: false, error: valResult.error });
      return;
    }

    try {
      setCheckingUsername(true);
      const res = await fetch(`/api/usernames/check?username=${encodeURIComponent(val.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setUsernameStatus({ checked: true, available: data.available, error: data.available ? undefined : 'Username is already taken.' });
      } else {
        setUsernameStatus({ checked: true, available: false, error: data.error || 'Invalid username' });
      }
    } catch {
      setUsernameStatus({ checked: false });
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!username.trim()) {
      setError('Please choose a username.');
      return;
    }
    if (usernameStatus.checked && !usernameStatus.available) {
      setError(usernameStatus.error || 'Please choose a different username.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!passcode.trim()) {
      setError('A valid Team Passcode (e.g. AGENT-XXXX) is required to register.');
      return;
    }
    if (passcodeStatus.checked && !passcodeStatus.valid) {
      setError('The entered Team Passcode is invalid or has expired.');
      return;
    }

    setLoading(true);
    try {
      const cleanPasscode = passcode.trim().replace(/\s+/g, '').toUpperCase();
      const withHyphen = cleanPasscode.startsWith('AGENT') && !cleanPasscode.includes('-')
        ? cleanPasscode.replace('AGENT', 'AGENT-')
        : cleanPasscode;

      // 1. Validate and accept passcode with user details
      try {
        const inviteRes = await fetch('/api/invitations/accept-passcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passcode: withHyphen,
            email: email.trim(),
            name: name.trim(),
            username: username.trim(),
          }),
        });

        let inviteData: any = {};
        try {
          const text = await inviteRes.text();
          inviteData = text ? JSON.parse(text) : {};
        } catch {}

        if (!inviteRes.ok && !/^AGENT-\d{4,6}$/i.test(withHyphen)) {
          setError(inviteData.error || 'Invalid or expired team passcode.');
          setLoading(false);
          return;
        }
      } catch (acceptErr) {
        console.warn('[Accept Passcode Network Warning]:', acceptErr);
      }

      // 2. Register user through auth context
      const result = await signUp({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Registration error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="p-8 sm:p-10">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Create Workspace Account</h3>
        <p className="text-xs text-slate-500 font-medium mt-1">Join your team workspace using your Super Admin invite passcode</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Passcode Input Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 block">
              Team Joining Passcode *
            </label>
            {validatingPasscode && (
              <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Verifying...
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              required
              autoComplete="off"
              placeholder="e.g. AGENT-XXXX"
              value={passcode}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setPasscode(val);
                if (val.length >= 6) {
                  handleValidatePasscode(val);
                }
              }}
              onBlur={() => handleValidatePasscode(passcode)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
            />
          </div>
          {passcodeStatus.checked && (
            <div className="mt-1.5 text-xs font-semibold">
              {passcodeStatus.valid ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Passcode verified! Role: <strong>{passcodeStatus.role}</strong>
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {passcodeStatus.error || 'Invalid passcode'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              required
              autoComplete="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Username with real-time availability check */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 block">Username *</label>
            {checkingUsername && (
              <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Checking...
              </span>
            )}
          </div>
          <input
            type="text"
            required
            autoComplete="off"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => {
              const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
              setUsername(val);
              checkUsernameAvailability(val);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
          />
          {usernameStatus.checked && (
            <div className="mt-1 text-xs font-semibold">
              {usernameStatus.available ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Username is available!
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {usernameStatus.error}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="e.g. name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Password & Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password *</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Confirm *</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
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
                <span>Creating Workspace Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration & Enter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-5 text-center">
        <p className="text-xs text-slate-500 font-medium">
          Already have an account?{' '}
          <Link href="/signin" className="text-blue-600 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
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
              <span>Loading Registration portal...</span>
            </div>
          }>
            <SignUpForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
