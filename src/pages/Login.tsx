/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import {
  Mail, Lock, Check, ShieldCheck, GraduationCap,
  ArrowRight, User, Loader2, AlertCircle, Eye, EyeOff
} from 'lucide-react';

// ==========================================================
// MAIN
// ==========================================================
export default function Login() {
  const { login, signInWithGoogle, user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registeredEmail = searchParams.get('registered_email') || '';

  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);

  // ----------------------------------------------------------
  // Auto-redirect or complete Google signup
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    // Completed user → straight to dashboard
    if (user.onboarding_completed === true) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Incomplete user (just signed in with Google but no role chosen yet)
    setShowRoleModal(true);
  }, [user?.id, user?.onboarding_completed, navigate]);

  // ----------------------------------------------------------
  // Validation
  // ----------------------------------------------------------
  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [email]
  );
  const passwordValid = useMemo(() => password.length >= 6, [password]);
  const canSubmit = emailValid && passwordValid && !loading;

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------
  const handleSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!emailValid) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!passwordValid) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('invalid')) {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.toLowerCase().includes('confirm')) {
        setError('Please confirm your email before signing in.');
      } else {
        setError(msg || 'Could not sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, emailValid, passwordValid, login, navigate]);

  const handleGoogleSignIn = useCallback(async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Google sign-in could not start. Please try again.');
      setGoogleLoading(false);
    }
  }, [signInWithGoogle]);

  const handleRoleSelection = useCallback(async (selectedRole: UserRole) => {
    if (!user || roleSaving) return;
    setError('');
    setRoleSaving(true);
    try {
      await updateProfile(user.id, {
        role: selectedRole,
        onboarding_completed: true,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Failed to save role:', err);
      setError('Could not save your role. Please try again.');
      setRoleSaving(false);
    }
  }, [user, roleSaving, updateProfile, navigate]);

  const closeRoleModal = useCallback(() => {
    if (roleSaving) return;
    setShowRoleModal(false);
  }, [roleSaving]);

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md">

        {/* ============================================
            LOGO + TITLE
            ============================================ */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <img
              src="/192.png"
              alt="Nursefolio"
              className="w-10 h-10 rounded-xl object-cover"
            />
          </Link>
          <h1 className="text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Sign in to your Nursefolio account
          </p>
        </div>

        {/* ============================================
            MESSAGES
            ============================================ */}
        {error && (
          <div className="mb-5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {registeredEmail && !error && (
          <div className="mb-5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-start gap-2">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Account created. Sign in to continue.</span>
          </div>
        )}

        {/* ============================================
            GOOGLE
            ============================================ */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 active:bg-slate-200 dark:active:bg-zinc-800 transition disabled:opacity-50 min-h-[48px]"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-600 dark:text-slate-400" />
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Continue with Google
              </span>
            </>
          )}
        </button>

        {/* ============================================
            DIVIDER
            ============================================ */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-grow border-t border-slate-100 dark:border-zinc-900" />
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            or
          </span>
          <div className="flex-grow border-t border-slate-100 dark:border-zinc-900" />
        </div>

        {/* ============================================
            FORM
            ============================================ */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                className="w-full text-sm pl-11 pr-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
              />
            </div>
            {email.length > 0 && !emailValid && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5">
                Enter a valid email address
              </p>
            )}
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-teal-600 dark:text-teal-400 active:opacity-70"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className="w-full text-sm pl-11 pr-12 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 dark:text-slate-500 active:bg-slate-200 dark:active:bg-zinc-800 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px] mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* ============================================
            FOOTER
            ============================================ */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-600 dark:text-teal-400 font-bold active:opacity-70">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* ============================================
          ROLE MODAL — Google sign-in completion
          ============================================ */}
      {showRoleModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-black/60"
          onClick={closeRoleModal}
        >
          <div
            className="bg-white dark:bg-zinc-950 w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 md:p-8 animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="md:hidden flex justify-center mb-5">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-800 rounded-full" />
            </div>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                One last thing
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Tell us who you are so we can set up your portfolio
              </p>
            </div>

            <div className="space-y-2.5">
              <RoleChoiceButton
                icon={ShieldCheck}
                title="Licensed nurse"
                subtitle="I have my NCK license"
                tone="teal"
                onClick={() => handleRoleSelection('nurse')}
                disabled={roleSaving}
              />
              <RoleChoiceButton
                icon={GraduationCap}
                title="Nursing student"
                subtitle="I'm still in school"
                tone="indigo"
                onClick={() => handleRoleSelection('student')}
                disabled={roleSaving}
              />
            </div>

            {roleSaving && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Setting up your account…
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================================
// SUBCOMPONENTS
// ==========================================================
const RoleChoiceButton = React.memo<{
  icon: any;
  title: string;
  subtitle: string;
  tone: 'teal' | 'indigo';
  onClick: () => void;
  disabled?: boolean;
}>(({ icon: Icon, title, subtitle, tone, onClick, disabled }) => {
  const tones = {
    teal: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 active:bg-slate-200 dark:active:bg-zinc-800 transition disabled:opacity-50 text-left min-h-[64px]"
    >
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
    </button>
  );
});
RoleChoiceButton.displayName = 'RoleChoiceButton';