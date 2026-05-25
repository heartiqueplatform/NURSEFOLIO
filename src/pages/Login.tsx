/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { Activity, Mail, Lock, Sparkles, Check, Sun, Moon } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registeredEmail = searchParams.get('registered_email') || '';
  const { themeMode, toggleThemeMode } = useThemeMode();

  const [email, setEmail] = useState(registeredEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid registration credential combinations.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockClick = (mockEmail: string) => {
    setEmail(mockEmail);
    setPassword('password123');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4 relative">
      {/* Theme Toggle Button */}
      <button
        id="login-theme-btn"
        onClick={toggleThemeMode}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-lg hover:shadow-xl transition-all cursor-pointer"
        title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {themeMode === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl max-w-md w-full border border-slate-100 dark:border-slate-800 p-8 space-y-6">

        {/* Title */}
        <div className="text-center space-y-2">
          <Link id="login-logo-link" to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
              <Activity className="w-5.5 h-5.5" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            Sign in to Nursefolio
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-400 max-w-xs mx-auto">
            Access your career space, portfolio config, check status reports or compile resumes.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-3.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Success notification from register redirects */}
        {registeredEmail && !error && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4.5 h-4.5" />
            <span>Registration completed successfully! Sign in to initialize.</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Email Coordinates</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 dark:text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="login-input-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="brian@example.com"
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Security Password</label>
              <Link to="/forgot-password" className="text-[10px] font-bold text-teal-650 dark:text-teal-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login-input-password"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50 transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition shadow-sm active:scale-95 cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </div>
        </form>

        {/* Footer actions */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-450 dark:text-slate-400 font-medium">
            Don't have a portfolio folder?{' '}
            <Link to="/register" className="text-teal-655 dark:text-teal-400 font-bold hover:underline">
              Create one now
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}