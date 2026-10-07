/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { useAuth } from '../contexts/AuthContext';
import { ArrowUpRight, Heart, Loader2 } from 'lucide-react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { OnboardingTour } from '../components/onboarding/OnboardingTour';
import NotificationBell from '../components/notifications/NotificationBell';

// ==========================================================
// GREETING
// ==========================================================
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// ==========================================================
// PAGE TITLES — maps route → display title
// ==========================================================
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/edit-profile': 'Edit profile',
  '/dashboard/experiences': 'Experience',
  '/dashboard/education': 'Education',
  '/dashboard/skills': 'Skills',
  '/dashboard/certifications': 'Certifications',
  '/dashboard/publications': 'Research',
  '/dashboard/theme': 'Portfolio theme',
  '/dashboard/cv': 'Upload CV',
  '/dashboard/settings': 'Settings',
  '/dashboard/analytics': 'Analytics',
  '/explore': 'Explore',
  '/feed': 'Daily Pulse',
  '/locum': 'Locum shifts',
  '/locum/new': 'Post a shift',
  '/cv': 'My CV',
  '/admin': 'Admin',
};

// ==========================================================
// MAIN
// ==========================================================
export const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showExitModal, setShowExitModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Escape key closes modal
  useEffect(() => {
    if (!showExitModal || signingOut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowExitModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showExitModal, signingOut]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  }, [logout, navigate]);

  const handleCancelExit = useCallback(() => setShowExitModal(false), []);

  // Page title from route
  const pageTitle = PAGE_TITLES[location.pathname] || null;

  // Greeting — only on the dashboard home
  const isDashboardHome = location.pathname === '/dashboard';

  return (
    <>
      {/* ============================================
          EXIT MODAL
          ============================================ */}
      {showExitModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 bg-black/70"
          onClick={() => !signingOut && handleCancelExit()}
        >
          <div
            className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-3xl max-w-md w-full p-6 md:p-8 animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">
              Sign out, {user?.first_name || 'Nurse'}?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1 leading-relaxed">
              Your streak stays active for 3 days if you come back.
            </p>

            <div className="flex flex-col gap-2 mt-6">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full py-3.5 rounded-2xl bg-rose-600 active:bg-rose-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
              >
                {signingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing out
                  </>
                ) : (
                  'Yes, sign me out'
                )}
              </button>
              <button
                onClick={handleCancelExit}
                disabled={signingOut}
                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition disabled:opacity-50 min-h-[48px]"
              >
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          LAYOUT SHELL
          ============================================ */}
      <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-zinc-950">
        <OnboardingTour />
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* ============================================
              TOP BAR — mobile header + desktop page title
              ============================================ */}
          {/* ============================================
    TOP BAR — mobile header + desktop page title
    ============================================ */}
          <header
            className="h-14 md:h-16 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between px-4 lg:px-8 flex-shrink-0"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Mobile: logo + page context */}
            <div className="flex items-center gap-2.5 lg:hidden min-w-0">
              <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
                <img
                  src="/192.png"
                  alt=""
                  className="w-7 h-7 rounded-lg object-cover"
                />
              </Link>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {pageTitle || (user ? `Hi, ${user.first_name || 'Nurse'}` : 'Nursefolio')}
                </p>
                {isDashboardHome && user && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {getGreeting()} — let's make progress today
                  </p>
                )}
              </div>
            </div>

            {/* Desktop: page title only */}
            <div className="hidden lg:flex items-center gap-2 min-w-0">
              <h1 className="font-display font-bold text-slate-900 dark:text-white text-lg tracking-tight truncate">
                {pageTitle || 'Dashboard'}
              </h1>
            </div>

            {/* Actions — notifications + preview */}
            <div className="flex items-center gap-2">
              {/* Notifications — inline, sits next to Preview */}
              <NotificationBell variant="inline" />

              {/* Preview portfolio — always shows "My preview" on all screen sizes */}
              {user && (
                <Link
                  to={`/nurse/${user.username}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-zinc-900 active:bg-slate-200 dark:active:bg-zinc-800 transition whitespace-nowrap"
                >
                  <span>My preview</span>
                  <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                </Link>
              )}
            </div>
          </header>
          {/* ============================================
              SCROLLABLE CONTENT
              ============================================ */}
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-5xl mx-auto w-full pb-24 lg:pb-8">
              {children || <Outlet />}
            </div>
          </main>
        </div>

        <MobileNav />

        {/* Scrollbar styling */}
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
            background: #27272a;
          }
        `}</style>
      </div>
    </>
  );
};