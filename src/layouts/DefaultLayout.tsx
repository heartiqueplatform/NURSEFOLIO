/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navbar } from '../components/Navbar';
import { Link, Outlet } from 'react-router-dom';
import { Activity } from 'lucide-react';

export const DefaultLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-950">
      <Navbar />
      <main className="flex-grow">
        {children || <Outlet />}
      </main>
      
      {/* Premium minimal footer in Bento style */}
      <footer className="bg-white border-t border-slate-200/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/10 group-hover:scale-105 transition-transform">
                <span className="font-bold text-sm tracking-tighter">N+</span>
              </div>
              <span className="font-display font-bold text-slate-900 tracking-tight">
                Nurse<span className="text-indigo-600">folio</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} Nursefolio Applet. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-end text-xs text-slate-550 font-semibold">
              <Link to="/about" className="hover:text-indigo-600 transition-colors">About</Link>
              <Link to="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
              <Link to="/verification-info" className="hover:text-indigo-600 transition-colors font-bold text-indigo-600">Verification Hub</Link>
              <Link to="/legal?tab=privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
              <Link to="/legal?tab=terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
              <Link to="/legal?tab=compliance" className="hover:text-indigo-600 transition-colors">Regulatory Compliance</Link>
              <Link to="/contact" className="hover:text-indigo-600 transition-colors">Contact & Help</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
