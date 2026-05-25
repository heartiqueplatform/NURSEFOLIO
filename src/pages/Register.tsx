/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Activity, Mail, User, ShieldCheck, ArrowRight, ClipboardCheck } from 'lucide-react';

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryRole = (searchParams.get('role') as UserRole) || 'nurse';

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
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-3xl overflow-hidden shadow-xl max-w-lg w-full border border-slate-100 p-8 sm:p-10 space-y-6">

        {/* Title */}
        <div className="text-center space-y-2">
          <Link id="register-logo-link" to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
              <Activity className="w-5.5 h-5.5" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
            Register on Nursefolio
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Build your credential badged web profile, generate downloadable resumes and share placements.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-150 text-rose-700 p-3.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          {/* Custom Role selection tabs */}
          <div>
            <span className="block text-xs font-bold text-slate-500 mb-2.5">What is your current career step?</span>
            <div className="grid grid-cols-2 gap-4">
              <button
                id="role-tab-nurse"
                type="button"
                onClick={() => setRole('nurse')}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl text-center select-none active:scale-98 transition cursor-pointer ${role === 'nurse'
                    ? 'border-teal-500 bg-teal-50/20 text-teal-800 font-bold ring-2 ring-teal-500/10'
                    : 'border-slate-150 bg-white text-slate-650 hover:bg-slate-50'
                  }`}
              >
                <ShieldCheck className="w-5 h-5 mb-2 text-teal-650" />
                <span className="text-xs font-bold">Licensed Nurse</span>
                <span className="text-[9px] text-slate-450 font-normal mt-0.5 mt-1">LPN, RN, FNP-C, APRN</span>
              </button>

              <button
                id="role-tab-student"
                type="button"
                onClick={() => setRole('student')}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl text-center select-none active:scale-98 transition cursor-pointer ${role === 'student'
                    ? 'border-cyan-500 bg-cyan-50/20 text-cyan-800 font-bold ring-2 ring-cyan-500/10'
                    : 'border-slate-150 bg-white text-slate-655 hover:bg-slate-50'
                  }`}
              >
                <ClipboardCheck className="w-5 h-5 mb-2 text-cyan-650" />
                <span className="text-xs font-bold">Nursing Student</span>
                <span className="text-[9px] text-slate-450 font-normal mt-1">BSN/LPN School Years</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">First Name</label>
              <input
                id="register-input-first"
                required
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Lucy"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Last Name</label>
              <input
                id="register-input-last"
                required
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Munini"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email Coordinator</label>
              <input
                id="register-input-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lucy@example.com"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-500">Pick Custom Username</label>
                <span className="text-[9px] text-slate-450 font-medium">No spaces</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[10px] font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                  @
                </span>
                <input
                  id="register-input-username"
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="lucymunini"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Security Password</label>
            <input
              id="register-input-password"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (at least 6 characters)"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 focus:bg-white text-slate-800"
            />
          </div>

          <div className="pt-2">
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2"
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
          <p className="text-xs text-slate-450 font-medium font-sans">
            Already verified?{' '}
            <Link to="/login" className="text-teal-605 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
