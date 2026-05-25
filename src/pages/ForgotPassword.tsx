/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Check, Activity } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [scenarios, setScenarios] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setScenarios(true);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white">
              <Activity className="w-5.5 h-5.5" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
            Reset Password
          </h2>
          <p className="text-xs text-slate-500">
            Tell us your email coordinates and we will generate recovery channels.
          </p>
        </div>

        {scenarios ? (
          <div className="text-center p-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-110 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Reset link dispatched</h3>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
              We have generated a recovery token and forwarded it to <span className="font-bold text-slate-700">{email}</span>. Click the link inside the letter to update security boards.
            </p>
            <div className="pt-2">
              <Link to="/login" className="text-xs text-teal-650 font-bold hover:underline">
                Return to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email Coordinator</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="forgotpw-email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. nurse@example.com"
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:border-teal-400 text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="forgotpw-btn"
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Forward Recovery Email
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs text-slate-500 hover:text-teal-600 font-bold">
            Cancel reset
          </Link>
        </div>

      </div>
    </div>
  );
}
