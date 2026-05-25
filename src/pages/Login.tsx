/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Mail, Lock, Sparkles, Check } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registeredEmail = searchParams.get('registered_email') || '';

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
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl overflow-hidden shadow-xl max-w-md w-full border border-slate-100 p-8 space-y-6">

        {/* Title */}
        <div className="text-center space-y-2">
          <Link id="login-logo-link" to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
              <Activity className="w-5.5 h-5.5" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
            Sign in to Nursefolio
          </h2>
          <p className="text-xs text-slate-550 max-w-xs mx-auto">
            Access your career space, portfolio config, check status reports or compile resumes.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Success notification from register redirects */}
        {registeredEmail && !error && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4.5 h-4.5" />
            <span>Registration completed successfully! Sign in to initialize.</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Email Coordinates</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="login-input-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="brian@example.com"
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-500">Security Password</label>
              <Link to="/forgot-password" className="text-[10px] font-bold text-teal-650 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login-input-password"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800 transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition shadow-sm active:scale-95 cursor-pointer flex items-center justify-center"
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
          <p className="text-xs text-slate-450 font-medium">
            Don't have a portfolio folder?{' '}
            <Link to="/register" className="text-teal-655 font-bold hover:underline">
              Create one now
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
