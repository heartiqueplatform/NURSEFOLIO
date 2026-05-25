/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { ShieldCheck, LogOut, Activity, ArrowUpRight, Sun, Moon } from 'lucide-react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { OnboardingTour } from '../components/onboarding/OnboardingTour';

export const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { themeMode, toggleThemeMode } = useThemeMode();

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  return (
    /* MAMA'S CHANGE: Changed min-h-screen to h-screen and added overflow-hidden to lock the page */
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-950 dark:text-slate-50">
      {/* Onboarding Interactive Tour */}
      <OnboardingTour />

      {/* Sidebar for Desktop - This is now sticky because the parent is h-screen */}
      <Sidebar />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar - MAMA'S CHANGE: Added flex-shrink-0 to ensure header never squishes */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 z-10">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">N+</div>
            <span className="font-bold text-indigo-950 dark:text-indigo-400 text-base tracking-tight">Nursefolio</span>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <h1 className="font-display font-bold text-slate-900 dark:text-white text-lg tracking-tight">Management Portal</h1>
            <span className="text-[10px] font-mono uppercase bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-100 dark:border-indigo-800">
              Live Connection
            </span>
          </div>

          {/* Quick Stats or Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button in Dashboard Header */}
            <button
              id="dashboard-header-theme-btn"
              onClick={toggleThemeMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {themeMode === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

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
                <button
                  id="dashboard-header-btn-logout"
                  onClick={handleSignOut}
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
      `}</style>
    </div>
  );
};