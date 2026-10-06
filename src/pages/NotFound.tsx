/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center">

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-7 h-7 text-slate-400 dark:text-slate-500" />
        </div>

        {/* Heading */}
        <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">
          404
        </p>
        <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
          Page not found
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed mt-3 max-w-sm mx-auto">
          The page you're looking for doesn't exist, or it may have been moved.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[48px]"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>

        {/* Helpful links */}
        <div className="mt-10 pt-8 border-t border-slate-100 dark:border-zinc-900">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
            <Link to="/explore" className="font-semibold text-slate-600 dark:text-slate-400 active:text-teal-600 dark:active:text-teal-400 transition">
              Explore nurses
            </Link>
            <span className="text-slate-300 dark:text-zinc-700">·</span>
            <Link to="/locum" className="font-semibold text-slate-600 dark:text-slate-400 active:text-teal-600 dark:active:text-teal-400 transition">
              Locum shifts
            </Link>
            <span className="text-slate-300 dark:text-zinc-700">·</span>
            <Link to="/contact" className="font-semibold text-slate-600 dark:text-slate-400 active:text-teal-600 dark:active:text-teal-400 transition">
              Contact
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}