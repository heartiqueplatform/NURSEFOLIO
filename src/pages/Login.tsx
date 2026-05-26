/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { UserRole } from '../types';
import {
  Activity,
  Mail,
  Lock,
  Sparkles,
  Check,
  Sun,
  Moon,
  ShieldCheck,
  ClipboardCheck,
  User
} from 'lucide-react';

export default function Login() {
  const { login, signInWithGoogle, user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registeredEmail = searchParams.get('registered_email') || '';
  const { themeMode, toggleThemeMode } = useThemeMode();

  const [email, setEmail] = useState(registeredEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Magic Watcher: If Google logs them in but they have no role, show the cute overlay
  useEffect(() => {
    if (user && !user.onboarding_completed) {
      setShowRoleModal(true);
    } else if (user && user.onboarding_completed) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError('Google sign-in failed. Please try again.');
    }
  };

  const handleRoleSelection = async (selectedRole: UserRole) => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user.id, {
        role: selectedRole,
        onboarding_completed: true
      });
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to save your career step.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 min-h-screen flex items-center justify-center p-0 md:p-4 relative">


      <div className="bg-white dark:bg-zinc-950 md:rounded-3xl overflow-hidden md:shadow-xl w-full md:max-w-md md:border md:border-slate-100 md:dark:border-slate-800 p-6 md:p-8 space-y-5 md:space-y-6 min-h-screen md:min-h-0 flex flex-col justify-center">

        {/* Title */}
        <div className="text-center space-y-1.5 md:space-y-2">
          <Link id="login-logo-link" to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
              <Activity className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </Link>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            Sign in to Nursefolio
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Access your career space, portfolio config, and compile resumes.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-2.5 md:p-3.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Success notification */}
        {registeredEmail && !error && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-2.5 md:p-3.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold flex items-center gap-1.5 md:gap-2">
            <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Registration successful! Sign in to continue.</span>
          </div>
        )}

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 md:gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-zinc-800 py-2.5 md:py-3 rounded-lg md:rounded-xl transition-all font-bold text-slate-700 dark:text-slate-200 md:shadow-sm cursor-pointer text-xs md:text-sm"
        >
          {/* Google SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="w-4 h-4 md:w-5 md:h-5"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>

          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center gap-3 md:gap-4 py-1 md:py-2">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">OR</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-3 md:space-y-4 text-[11px] md:text-xs">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Email Coordinates</label>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 md:left-3 text-slate-400 dark:text-slate-500">
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </span>
              <input
                id="login-input-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="brian@example.com"
                className="w-full text-[11px] md:text-xs pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400">Security Password</label>
              <Link to="/forgot-password" className="text-[9px] md:text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 md:left-3 text-slate-400 dark:text-slate-500">
                <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </span>
              <input
                id="login-input-password"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-[11px] md:text-xs pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50 transition"
              />
            </div>
          </div>

          <div className="pt-1 md:pt-2">
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 md:py-3 rounded-lg md:rounded-xl transition md:shadow-sm active:scale-95 cursor-pointer flex items-center justify-center disabled:opacity-50 text-xs md:text-sm"
            >
              {loading ? (
                <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-1 md:pt-2">
          <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-400 font-medium">
            Don't have a portfolio?{' '}
            <Link to="/register" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
              Create one now
            </Link>
          </p>
        </div>
      </div>

      {/* Role Selection Modal - Bottom sheet on mobile */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 md:p-8 shadow-2xl border border-teal-500/20 text-center space-y-4 md:space-y-6 max-h-[90vh] overflow-y-auto">

            {/* Drag handle for mobile */}
            <div className="md:hidden flex justify-center mb-1">
              <div className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
            </div>

            <div className="w-16 h-16 md:w-20 md:h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto">
              <User className="w-8 h-8 md:w-10 md:h-10 text-teal-600" />
            </div>

            <div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Welcome!</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 md:mt-2 text-xs md:text-sm">To personalize your portfolio, tell us who you are:</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:gap-4">
              <button
                onClick={() => handleRoleSelection('nurse')}
                className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all text-left cursor-pointer"
              >
                <div className="p-2 md:p-3 bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-500 group-hover:text-white rounded-lg md:rounded-xl transition-colors">
                  <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Registered Nurse</div>
                  <div className="text-[10px] md:text-xs text-slate-500">Licensed Professional</div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelection('student')}
                className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all text-left cursor-pointer"
              >
                <div className="p-2 md:p-3 bg-slate-100 dark:bg-slate-800 group-hover:bg-cyan-500 group-hover:text-white rounded-lg md:rounded-xl transition-colors">
                  <ClipboardCheck className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Nursing Student</div>
                  <div className="text-[10px] md:text-xs text-slate-500">In Training / School</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}