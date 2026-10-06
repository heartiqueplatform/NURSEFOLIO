/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import StreakCandle from './StreakCandle';
import {
  Briefcase, GraduationCap, Award, BookOpen,
  Palette, FileText, Settings, BarChart3,
  Home, UserPlus, LogOut, ShieldCheck,
  ChevronLeft, ChevronRight, Compass, Sun, Moon,
  Heart, FileSignature, Loader2
} from 'lucide-react';

// ==========================================================
// MENU STRUCTURE — grouped for scannability
// ==========================================================
const MENU_GROUPS = [
  {
    id: 'daily',
    label: 'Daily',
    items: [
      { id: 'feed', name: 'Daily Pulse', path: '/feed', icon: FileText },
      { id: 'overview', name: 'Overview', path: '/dashboard', icon: Home },
      { id: 'explore', name: 'Explore Registry', path: '/explore', icon: Compass },
      { id: 'locum', name: 'Locum & Cover', path: '/locum', icon: Briefcase },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    items: [
      { id: 'edit-profile', name: 'Edit Profile', path: '/dashboard/edit-profile', icon: UserPlus },
      { id: 'skills', name: 'Skills & Logbook', path: '/dashboard/skills', icon: Award },
      { id: 'pending-verifications', name: 'Verify Procedures', path: '/verify/pending', icon: FileSignature },
      { id: 'work-experience', name: 'Work Experience', path: '/dashboard/experiences', icon: Briefcase },
      { id: 'education', name: 'Education & Degrees', path: '/dashboard/education', icon: GraduationCap },
      { id: 'certifications', name: 'Certifications', path: '/dashboard/certifications', icon: Award },
      { id: 'research', name: 'Clinical Research', path: '/dashboard/publications', icon: BookOpen },
    ],
  },
  {
    id: 'tools',
    label: 'Career Tools',
    items: [
      { id: 'cv-generator', name: 'My CV', path: '/cv', icon: FileText },
      { id: 'upload-cv', name: 'Upload CV', path: '/dashboard/cv', icon: FileText },
      { id: 'theme', name: 'Portfolio Theme', path: '/dashboard/theme', icon: Palette },
      { id: 'analytics', name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
      { id: 'settings', name: 'Settings', path: '/dashboard/settings', icon: Settings },
    ],
  },
];

// ==========================================================
// MENU LINK — reusable, memoized
// ==========================================================
const MenuLink = React.memo<{
  to: string;
  end?: boolean;
  icon: any;
  label: string;
  collapsed: boolean;
  isExplore?: boolean;
}>(({ to, end, icon: Icon, label, collapsed, isExplore }) => (
  <NavLink
    to={to}
    end={end}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-colors ${collapsed ? 'justify-center' : ''
      } ${isActive
        ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-bold'
        : isExplore
          ? 'text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 font-medium'
          : 'text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 font-medium'
      }`
    }
  >
    <Icon className={`w-4 h-4 flex-shrink-0 ${isExplore && !collapsed ? 'text-amber-500 dark:text-amber-400' : ''}`} />
    {!collapsed && <span className="truncate">{label}</span>}
  </NavLink>
));
MenuLink.displayName = 'MenuLink';

// ==========================================================
// MAIN
// ==========================================================
export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { themeMode, toggleThemeMode } = useThemeMode();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [showExitModal, setShowExitModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Persist collapse state
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', String(next));
      } catch (err) {
        console.warn('Failed to persist sidebar state', err);
      }
      return next;
    });
  }, []);

  // Escape closes modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showExitModal) setShowExitModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showExitModal]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  }, [logout, navigate]);

  const handleExitClick = useCallback(() => setShowExitModal(true), []);
  const handleCancelExit = useCallback(() => setShowExitModal(false), []);

  const userInitials = useMemo(() => {
    if (!user) return '';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;
  }, [user]);

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
          SIDEBAR — flat, no shadows/borders clutter
          ============================================ */}
      <aside
        className={`sticky top-0 h-screen overflow-hidden hidden lg:flex flex-col flex-shrink-0 bg-white dark:bg-zinc-950 border-r border-slate-100 dark:border-zinc-900 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Collapse toggle — small floating chevron */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-6 w-7 h-7 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-800 rounded-full flex items-center justify-center transition z-50"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Header */}
        <div className={`flex items-center gap-2 mb-4 mt-4 flex-shrink-0 ${isCollapsed ? 'justify-center px-2' : 'px-5'}`}>
          <img
            src="/192.png"
            alt="Nursefolio"
            className="w-8 h-8 rounded-xl flex-shrink-0 object-cover"
          />
          {!isCollapsed && (
            <Link
              to="/"
              className="font-display font-bold text-lg text-slate-900 dark:text-white tracking-tight"
            >
              Nursefolio
            </Link>
          )}
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">

          {/* User card */}
          {user && (
            <Link
              to={`/nurse/${user.username}`}
              className={`block mb-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 active:bg-slate-100 dark:active:bg-zinc-800 transition ${isCollapsed ? 'p-2' : 'p-3'
                }`}
            >
              <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-9 h-9 rounded-full object-cover bg-slate-200 dark:bg-zinc-800 flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold text-xs flex-shrink-0">
                    {userInitials}
                  </div>
                )}

                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      {user.verification_status === 'verified' && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      @{user.username}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          )}

          {/* Menu groups */}
          {MENU_GROUPS.map(group => (
            <div key={group.id} className="mb-4 last:mb-2">
              {!isCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {group.label}
                </p>
              )}
              <nav className="space-y-0.5">
                {group.items.map(item => (
                  <MenuLink
                    key={item.id}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    icon={item.icon}
                    label={item.name}
                    collapsed={isCollapsed}
                    isExplore={item.id === 'explore'}
                  />
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer — streak candle + theme toggle + view public + sign out */}
        <div className="flex-shrink-0 px-3 py-3 border-t border-slate-100 dark:border-zinc-900 space-y-1">
          {/* Streak candle — compact tile, sits above the theme toggle */}
          <StreakCandle variant="sidebar" />

          {/* Theme toggle */}
          <button
            onClick={toggleThemeMode}
            title={isCollapsed ? (themeMode === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition-colors ${isCollapsed ? 'justify-center' : ''
              }`}
          >
            {themeMode === 'dark' ? (
              <Sun className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Moon className="w-4 h-4 flex-shrink-0" />
            )}
            {!isCollapsed && <span>{themeMode === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
          </button>

          {/* View public hub */}
          {user && (
            <Link
              to={`/nurse/${user.username}`}
              title={isCollapsed ? 'View public profile' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition-colors ${isCollapsed ? 'justify-center' : ''
                }`}
            >
              <Compass className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Public profile</span>}
            </Link>
          )}

          {/* Sign out */}
          {user && (
            <button
              onClick={handleExitClick}
              title={isCollapsed ? 'Sign out' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-slate-600 dark:text-slate-400 active:bg-rose-50 dark:active:bg-rose-950/30 active:text-rose-600 dark:active:text-rose-400 transition-colors ${isCollapsed ? 'justify-center' : ''
                }`}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Sign out</span>}
            </button>
          )}
        </div>

        {/* Scrollbar styling */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        `}</style>
      </aside>
    </>
  );
};