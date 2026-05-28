/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { ShieldCheck, LogOut, Activity, ArrowUpRight, Sun, Moon, Heart } from 'lucide-react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { OnboardingTour } from '../components/onboarding/OnboardingTour';

export const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { themeMode, toggleThemeMode } = useThemeMode();

  // ── NEW: goodbye overlay state ──
  const [showGoodbyeModal, setShowGoodbyeModal] = useState(false);

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  // ── NEW: open overlay instead of signing out directly ──
  const handleExitClick = () => {
    setShowGoodbyeModal(true);
  };

  return (
    <>
      {/* ── NEW: Goodbye Overlay Modal ── */}
      {showGoodbyeModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowGoodbyeModal(false)}
        >
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center border border-slate-100 dark:border-slate-800 animate-goodbye-pop"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center animate-goodbye-pulse">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              Goodbye, {user?.first_name} 👋
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 leading-relaxed">
              We'll miss you around here. 💙
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 leading-relaxed italic">
              "Every nurse you meet carries a little piece of their patients with them. Thank you for the care you give every day."
            </p>
            <div className="flex justify-center gap-2 mb-6 text-xl">
              <span title="Safe travels">🌸</span>
              <span title="You're amazing">✨</span>
              <span title="Come back soon">🏥</span>
              <span title="We care">💛</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSignOut}
                className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-all shadow-md shadow-rose-200 dark:shadow-rose-950/40"
              >
                Yes, sign me out
              </button>
              <button
                onClick={() => setShowGoodbyeModal(false)}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-all"
              >
                Actually, I'll stay 🙂
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ORIGINAL LAYOUT — fully preserved ── */}
      {/* MAMA'S CHANGE: Changed min-h-screen to h-screen and added overflow-hidden to lock the page */}
      <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-zinc-950 font-sans text-slate-950 dark:text-slate-50">
        {/* Onboarding Interactive Tour */}
        <OnboardingTour />

        {/* Sidebar for Desktop - This is now sticky because the parent is h-screen */}
        <Sidebar />

        {/* Main Panel Content Area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top bar - MAMA'S CHANGE: Added flex-shrink-0 to ensure header never squishes */}
          <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 z-10">
            <div className="flex items-center gap-2.5 lg:hidden">
              <img
                src="/192.png"
                alt="Nursefolio Logo"
                className="w-8 h-8 rounded-lg object-cover shadow-md shadow-indigo-600/10"
              />
              <span className="font-bold text-indigo-950 dark:text-indigo-400 text-base tracking-tight">
                Nurse<span className="text-indigo-600">folio</span>
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <h1 className="font-display font-bold text-slate-900 dark:text-white text-lg tracking-tight">Management Portal</h1>
              <span className="text-[10px] font-mono uppercase bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-100 dark:border-indigo-800">
                Live Connection
              </span>
            </div>

            {/* Quick Stats or Actions */}
            <div className="flex items-center gap-3">

              {user && (
                <>
                  <Link
                    id="dashboard-header-btn-view"
                    to={`/nurse/${user.username}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-all border border-indigo-100/40 dark:border-indigo-800"
                  >
                    <span>Preview Portfolio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                  {/* ── CHANGED: onClick now opens overlay ── */}
                  <button
                    id="dashboard-header-btn-logout"
                    onClick={handleExitClick}
                    className="lg:hidden p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-5 h-5 animate-pulse" />
                  </button>
                </>
              )}
            </div>
          </header>

          {/* Dynamic content scroll frame */}
          {/* MAMA'S CHANGE: This area is now the ONLY thing that scrolls on the whole page */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
            <div className="max-w-5xl mx-auto w-full pb-20 lg:pb-0">
              {children || <Outlet />}
            </div>
          </main>
        </div>

        {/* Bottom Floating Navigation for Mobile/Tablet */}
        <MobileNav />

        {/* Mama's Styling Tip for the internal scrollbar */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 10px;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #1e293b;
          }

          /* ── NEW: goodbye overlay animations ── */
          @keyframes goodbye-pop {
            0%   { opacity: 0; transform: scale(0.88) translateY(12px); }
            70%  { transform: scale(1.03) translateY(-2px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes goodbye-pulse {
            0%, 100% { transform: scale(1); }
            50%       { transform: scale(1.15); }
          }
          .animate-goodbye-pop {
            animation: goodbye-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .animate-goodbye-pulse {
            animation: goodbye-pulse 1.6s ease-in-out infinite;
          }
        `}</style>
      </div>
    </>
  );
};
