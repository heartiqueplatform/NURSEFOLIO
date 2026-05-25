/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center border border-slate-100 shadow-sm space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">404 - Ward Not Found</h2>
          <p className="text-xs text-slate-500 font-medium">Under Construction or Invalid Directory Location</p>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed font-normal">
          The routing index you seek is outside Nursefolio parameters. Return to the lobby.
        </p>
        <div className="pt-2">
          <Link
            id="notfound-all-nurses-redirect"
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Home className="w-4 h-4" />
            <span>Return to Lobby</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
