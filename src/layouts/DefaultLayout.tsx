/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navbar } from '../components/Navbar';
import { Link, Outlet } from 'react-router-dom';

// ==========================================================
// FOOTER LINK GROUPS
// ==========================================================
const FOOTER_GROUPS = [
  {
    label: 'Product',
    links: [
      { name: 'Explore nurses', to: '/explore' },
      { name: 'Locum shifts', to: '/locum' },
      { name: 'Pricing', to: '/pricing' },
      { name: 'Verification', to: '/verification-info' },
    ],
  },
  {
    label: 'Company',
    links: [
      { name: 'About', to: '/about' },
      { name: 'Contact', to: '/contact' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { name: 'Privacy', to: '/legal?tab=privacy' },
      { name: 'Terms', to: '/legal?tab=terms' },
      { name: 'Compliance', to: '/legal?tab=compliance' },
    ],
  },
];

// ==========================================================
// MAIN
// ==========================================================
export const DefaultLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-slate-900 dark:text-white">
      <Navbar />

      {/* Main content — top padding clears the fixed navbar */}
      <main className="flex-1 pt-16">
        {children || <Outlet />}
      </main>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="border-t border-slate-100 dark:border-zinc-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Top: brand + link groups */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img
                  src="/192.png"
                  alt="Nursefolio"
                  className="w-8 h-8 rounded-xl object-cover"
                />
                <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                  Nurse<span className="text-teal-600 dark:text-teal-400">folio</span>
                </span>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                The professional home for nurses — portfolios, credentials, and shift cover.
              </p>
            </div>

            {/* Link groups */}
            {FOOTER_GROUPS.map(group => (
              <div key={group.label}>
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  {group.label}
                </h3>
                <ul className="space-y-2">
                  {group.links.map(link => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-slate-600 dark:text-slate-400 active:text-slate-900 dark:active:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom: copyright */}
          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              © {year} Nursefolio. All rights reserved.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Made for Kenyan nurses 🇰🇪
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};