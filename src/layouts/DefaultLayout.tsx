/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navbar } from '../components/Navbar';
import { Link, Outlet } from 'react-router-dom';
import { Activity, Sun, Moon } from 'lucide-react';
import { useThemeMode } from '../contexts/ThemeContext';

export const DefaultLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { themeMode, toggleThemeMode } = useThemeMode();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 font-sans text-slate-950 dark:text-slate-50">
      <Navbar />
      <main className="flex-grow">
        {children || <Outlet />}
      </main>

      {/* Premium minimal footer in Bento style */}
      <footer className="bg-white dark:bg-zinc-950 border-t border-slate-200/60 dark:border-slate-800/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex justify-between h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link
                  id="nav-logo"
                  to="/"
                  className="flex items-center gap-2 group"
                >
                  {/* Logo Image */}
                  <img
                    src="/192.png"
                    alt="Nursefolio Logo"
                    className="w-9 h-9 rounded-xl object-cover shadow-md shadow-indigo-600/10 transition-transform group-hover:scale-105"
                  />

                  {/* Brand Text */}
                  <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                    Nurse<span className="text-indigo-600">folio</span>
                  </span>
                </Link>
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} Nursefolio Applet. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-end text-xs text-slate-550 dark:text-slate-400 font-semibold">
              <Link to="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</Link>
              <Link to="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</Link>
              <Link to="/verification-info" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold text-indigo-600 dark:text-indigo-400">Verification Hub</Link>
              <Link to="/legal?tab=privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
              <Link to="/legal?tab=terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link>
              <Link to="/legal?tab=compliance" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Regulatory Compliance</Link>
              <Link to="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact & Help</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};