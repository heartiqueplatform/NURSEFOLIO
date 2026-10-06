/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import StreakCandle from './StreakCandle';
import {
  Home, User, FileText, ArrowUpRight, Menu, Palette,
  Briefcase, GraduationCap, Award, BookOpen, BarChart3,
  Settings, Heart, LogOut, X, Compass, Sun, Moon,
  Shield, Users
} from 'lucide-react';

// ==========================================================
// MENU ITEM — reusable flat row
// ==========================================================
const MenuItem = React.memo<{
  to: string;
  icon: any;
  label: string;
  onNavigate: () => void;
}>(({ to, icon: Icon, label, onNavigate }) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${isActive
        ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
        : 'text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-zinc-900'
      }`
    }
  >
    <Icon className="w-4 h-4 flex-shrink-0" />
    <span className="truncate">{label}</span>
  </NavLink>
));
MenuItem.displayName = 'MenuItem';

// ==========================================================
// MAIN COMPONENT
// ==========================================================
export const MobileNav: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [showGoodbyeModal, setShowGoodbyeModal] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  const startY = useRef(0);

  // Sync theme from DOM on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setThemeMode(isDark ? 'dark' : 'light');
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (openMenu || showGoodbyeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [openMenu, showGoodbyeModal]);

  // Escape closes drawer / modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showGoodbyeModal) setShowGoodbyeModal(false);
        else if (openMenu) setOpenMenu(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openMenu, showGoodbyeModal]);

  const toggleThemeMode = useCallback(() => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [themeMode]);

  const handleSignOut = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  const handleExitClick = useCallback(() => {
    setOpenMenu(false);
    setShowGoodbyeModal(true);
  }, []);

  const closeMenu = useCallback(() => setOpenMenu(false), []);

  // ---- Drag-to-close ----
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const diffY = e.touches[0].clientY - startY.current;
    if (diffY > 0) setDragY(diffY * 0.7);
  }, [isDragging]);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragY > 100) setOpenMenu(false);
    setDragY(0);
  }, [dragY]);

  const backdropOpacity = Math.max(0, 1 - dragY / 300);

  return (
    <>
      {/* ============================================
          GOODBYE MODAL
          ============================================ */}
      {showGoodbyeModal && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/50"
            onClick={() => setShowGoodbyeModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-sheet-up">
            <div
              className="bg-white dark:bg-zinc-950 rounded-t-3xl px-6 pt-5 border-t border-slate-100 dark:border-zinc-900"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="w-10 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto mb-5" />

              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-rose-500 fill-rose-400" />
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
                  onClick={() => setShowGoodbyeModal(false)}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 active:bg-indigo-700 text-white text-sm font-bold transition min-h-[48px]"
                >
                  Stay signed in
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px]"
                >
                  Sign me out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================
          BOTTOM NAV BAR
          — flat, unified with rest of app
          ============================================ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-900 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex h-16 items-center justify-around px-2">
          <TabItem to="/dashboard" end icon={Home} label="Overview" />
          <TabItem to="/explore" icon={Compass} label="Explore" />
          <TabItem to="/locum" icon={Briefcase} label="Locum" />
          <TabItem to="/feed" icon={FileText} label="Pulse" />

          {/* More / Menu */}
          <button
            onClick={() => setOpenMenu(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 active:opacity-60 transition"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">More</span>
          </button>
        </div>
      </nav>

      {/* ============================================
          FULL MENU DRAWER — flat bottom sheet
          ============================================ */}
      {openMenu && (
        <div className="fixed inset-0 z-[9999] flex items-end">
          <div
            className="absolute inset-0 bg-black/50"
            style={{ opacity: backdropOpacity }}
            onClick={closeMenu}
          />

          <div
            className="relative w-full bg-white dark:bg-zinc-950 rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{
              transform: `translateY(${dragY}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div
              className="flex-shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0 border-b border-slate-100 dark:border-zinc-900">
              <div className="min-w-0">
                <h2 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  Menu
                </h2>
                {user && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-0.5 truncate">
                    @{user.username}
                  </p>
                )}
              </div>
              <button
                onClick={closeMenu}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-slate-400 active:bg-slate-200 dark:active:bg-zinc-800 transition"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">

              {/* Profile (if logged in) */}
              {user && (
                <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-2xl bg-slate-50 dark:bg-zinc-900 transition">
                  <NavLink
                    to={`/nurse/${user.username}`}
                    onClick={closeMenu}
                    className="flex items-center gap-3 flex-1 min-w-0 active:opacity-70 transition"
                  >
                    <img
                      src={user.avatar_url || '/192.png'}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-zinc-800 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        View public profile
                      </p>
                    </div>
                  </NavLink>

                  {/* Streak candle — inline, right of the profile link */}
                  <div className="relative flex-shrink-0 flex items-center justify-center">
                    <StreakCandle variant="mobile" />
                  </div>
                </div>
              )}

              {/* Section label */}
              <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                My Portfolio
              </p>

              <div className="space-y-0.5">
                <MenuItem to="/dashboard" icon={Home} label="Overview" onNavigate={closeMenu} />
                <MenuItem to="/dashboard/edit-profile" icon={User} label="Edit profile" onNavigate={closeMenu} />
                <MenuItem to="/dashboard/experiences" icon={Briefcase} label="Experience" onNavigate={closeMenu} />
                <MenuItem to="/dashboard/education" icon={GraduationCap} label="Education" onNavigate={closeMenu} />
                <MenuItem to="/dashboard/skills" icon={Award} label="Skills" onNavigate={closeMenu} />
                <MenuItem to="/dashboard/certifications" icon={Shield} label="Certifications" onNavigate={closeMenu} />
                <MenuItem to="/dashboard/publications" icon={BookOpen} label="Research" onNavigate={closeMenu} />
              </div>

              {/* Section label */}
              <p className="px-3 pt-5 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Career Tools
              </p>
              <div className="space-y-0.5">
                <MenuItem to="/cv" icon={FileText} label="My CV" onNavigate={closeMenu} />
                <MenuItem to="/dashboard/cv" icon={ArrowUpRight} label="Upload CV" onNavigate={closeMenu} />
                <MenuItem to="/dashboard/analytics" icon={BarChart3} label="Analytics" onNavigate={closeMenu} />
              </div>

              {/* Section label */}
              <p className="px-3 pt-5 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Community
              </p>
              <div className="space-y-0.5">
                <MenuItem to="/explore" icon={Users} label="Explore nurses" onNavigate={closeMenu} />
                <MenuItem to="/feed" icon={FileText} label="Nurse Pulse" onNavigate={closeMenu} />
                <MenuItem to="/locum" icon={Briefcase} label="Locum shifts" onNavigate={closeMenu} />
              </div>

              {/* Section label */}
              <p className="px-3 pt-5 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Settings
              </p>
              <div className="space-y-0.5">
                <MenuItem to="/dashboard/theme" icon={Palette} label="Portfolio theme" onNavigate={closeMenu} />
                <MenuItem to="/dashboard/settings" icon={Settings} label="Account settings" onNavigate={closeMenu} />

                {/* Theme toggle */}
                <button
                  onClick={toggleThemeMode}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-zinc-900 transition-colors"
                >
                  {themeMode === 'dark' ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
                  <span>{themeMode === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                </button>
              </div>

              {/* Sign out */}
              {user && (
                <div className="pt-5 pb-3">
                  <button
                    onClick={handleExitClick}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm font-bold active:bg-rose-100 dark:active:bg-rose-950/50 transition min-h-[48px]"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sheet-up {
          0%   { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        .animate-sheet-up {
          animation: sheet-up 0.32s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
      `}</style>
    </>
  );
};

// ==========================================================
// TAB ITEM — extracted for memoization
// ==========================================================
const TabItem = React.memo<{
  to: string;
  end?: boolean;
  icon: any;
  label: string;
}>(({ to, end, icon: Icon, label }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${isActive
        ? 'text-teal-600 dark:text-teal-400'
        : 'text-slate-500 dark:text-slate-400'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon className="w-5 h-5" />
        <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
          {label}
        </span>
      </>
    )}
  </NavLink>
));
TabItem.displayName = 'TabItem';