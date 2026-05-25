/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { UserRole } from '../types';
import { Activity, Mail, User, ShieldCheck, ArrowRight, ClipboardCheck, Sun, Moon } from 'lucide-react';

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryRole = (searchParams.get('role') as UserRole) || 'nurse';
  const { themeMode, toggleThemeMode } = useThemeMode();

  const [role, setRole] = useState<UserRole>(queryRole);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate username layout
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('Username must be 3-20 characters using only alphanumeric or underscores (no spaces).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, username, firstName, lastName, role);
      // Automatically sign in the user to establish the active session immediately
      try {
        await login(email, password);
      } catch (loginErr: any) {
        console.warn('Auto-login post-registration skipped:', loginErr);
      }
      // On success, redirect to onboarding / dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try separate details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4 py-12 relative">
      {/* Theme Toggle Button */}
      <button
        id="register-theme-btn"
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

      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl max-w-lg w-full border border-slate-100 dark:border-slate-800 p-8 sm:p-10 space-y-6">

        {/* Title */}
        <div className="text-center space-y-2">
          <Link id="register-logo-link" to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
              <Activity className="w-5.5 h-5.5" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            Register on Nursefolio
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Build your credential badged web profile, generate downloadable resumes and share placements.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-150 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-3.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          {/* Custom Role selection tabs */}
          <div>
            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5">What is your current career step?</span>
            <div className="grid grid-cols-2 gap-4">
              <button
                id="role-tab-nurse"
                type="button"
                onClick={() => setRole('nurse')}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl text-center select-none active:scale-98 transition cursor-pointer ${role === 'nurse'
                  ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 font-bold ring-2 ring-teal-500/10'
                  : 'border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
              >
                <ShieldCheck className="w-5 h-5 mb-2 text-teal-650 dark:text-teal-400" />
                <span className="text-xs font-bold">Licensed Nurse</span>
                <span className="text-[9px] text-slate-450 dark:text-slate-500 font-normal mt-0.5 mt-1">LPN, RN, FNP-C, APRN</span>
              </button>

              <button
                id="role-tab-student"
                type="button"
                onClick={() => setRole('student')}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl text-center select-none active:scale-98 transition cursor-pointer ${role === 'student'
                  ? 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 font-bold ring-2 ring-cyan-500/10'
                  : 'border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
              >
                <ClipboardCheck className="w-5 h-5 mb-2 text-cyan-650 dark:text-cyan-400" />
                <span className="text-xs font-bold">Nursing Student</span>
                <span className="text-[9px] text-slate-450 dark:text-slate-500 font-normal mt-1">BSN/LPN School Years</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">First Name</label>
              <input
                id="register-input-first"
                required
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Lucy"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Last Name</label>
              <input
                id="register-input-last"
                required
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Munini"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Email Coordinator</label>
              <input
                id="register-input-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lucy@example.com"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50 transition"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Pick Custom Username</label>
                <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">No spaces</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                  @
                </span>
                <input
                  id="register-input-username"
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="lucymunini"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Security Password</label>
            <input
              id="register-input-password"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (at least 6 characters)"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50 transition"
            />
          </div>

          <div className="pt-2">
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Create Nursefolio Portfolio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Bottom checks */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-450 dark:text-slate-400 font-medium font-sans">
            Already verified?{' '}
            <Link to="/login" className="text-teal-605 dark:text-teal-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}