/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Check, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ==========================================================
// MAIN
// ==========================================================
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Simple email validation
  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const canSubmit = isValidEmail && !submitting;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);

    try {
      const { error: supaError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          // Where the user lands after clicking the email link
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (supaError) throw supaError;
      setSent(true);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      // We deliberately show the same success state even if the email
      // doesn't exist, to avoid leaking which emails are registered.
      // Only network/server errors surface.
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('rate')) {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else if (msg.toLowerCase().includes('network')) {
        setError('Network error. Check your connection and try again.');
      } else {
        // Still show success — the email may or may not exist
        setSent(true);
      }
    } finally {
      setSubmitting(false);
    }
  }, [email, canSubmit]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* ============================================
            LOGO
            ============================================ */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img
              src="/192.png"
              alt="Nursefolio"
              className="w-10 h-10 rounded-xl object-cover"
            />
          </Link>

          {!sent ? (
            <>
              <h1 className="text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                Reset your password
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Enter the email you used to create your Nursefolio account. We'll send you a
                link to reset your password.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <h1 className="text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                Check your email
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                If an account exists for <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>,
                you'll receive a password reset link shortly.
              </p>
            </>
          )}
        </div>

        {/* ============================================
            FORM or SUCCESS STATE
            ============================================ */}
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  disabled={submitting}
                  className="w-full text-sm pl-11 pr-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition disabled:opacity-60"
                />
              </div>
              {email.length > 0 && !isValidEmail && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5">
                  Please enter a valid email address
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Didn't get the email?
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
                <li>• Check your spam or promotions folder</li>
                <li>• Make sure you used the email you signed up with</li>
                <li>• Wait a minute — delivery can take up to 60 seconds</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                setSent(false);
                setError('');
              }}
              className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px]"
            >
              Try a different email
            </button>
          </div>
        )}

        {/* ============================================
            FOOTER — back to login
            ============================================ */}
        <div className="text-center mt-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 active:text-teal-600 dark:active:text-teal-400 transition"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to sign in
          </Link>
        </div>

      </div>
    </div>
  );
}