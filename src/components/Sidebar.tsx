/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import {
  Briefcase, GraduationCap, Award, BookOpen,
  Palette, FileText, Settings, BarChart3,
  Home, UserPlus, LogOut, ArrowLeft, ShieldCheck,
  ChevronLeft, ChevronRight, Compass, Sun, Moon,
  Heart
} from 'lucide-react';

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

  // ── NEW: controls the goodbye overlay ──
  const [showGoodbyeModal, setShowGoodbyeModal] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', String(newVal));
      } catch (err) {
        console.warn('Failed to persist sidebar state', err);
      }
      return newVal;
    });
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  // ── NEW: open the overlay instead of signing out immediately ──
  const handleExitClick = () => {
    setShowGoodbyeModal(true);
  };

  const menuItems = [
    { id: 'overview', name: 'Overview', path: '/dashboard', icon: Home },
    { id: 'explore', name: 'Explore Registry', path: '/explore', icon: Compass },
    { id: 'edit-profile', name: 'Edit Profile', path: '/dashboard/edit-profile', icon: UserPlus },
    { id: 'work-experience', name: 'Work Experience', path: '/dashboard/experiences', icon: Briefcase },
    { id: 'skills', name: 'Clinical Specialties', path: '/dashboard/skills', icon: Award },
    { id: 'education', name: 'Education & Degrees', path: '/dashboard/education', icon: GraduationCap },
    { id: 'certifications', name: 'Certifications', path: '/dashboard/certifications', icon: Award },
    { id: 'research', name: 'Clinical Research', path: '/dashboard/publications', icon: BookOpen },
    { id: 'theme', name: 'Portfolio Theme', path: '/dashboard/theme', icon: Palette },
    { id: 'upload-cv', name: 'Upload CV / Resume', path: '/dashboard/cv', icon: FileText },
    { id: 'analytics', name: 'Analytics Board', path: '/dashboard/analytics', icon: BarChart3 },
    { id: 'settings', name: 'General Settings', path: '/dashboard/settings', icon: Settings },
  ];

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
            {/* Animated heart */}
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

            {/* Emotion dots */}
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

      {/* ── ORIGINAL SIDEBAR — fully preserved ── */}
      {/* MAMA'S CHANGE 1: Added h-screen sticky top-0 to keep the sidebar fixed while the rest of the page scrolls */}
      <aside className={`transition-all duration-300 sticky top-0 h-screen overflow-hidden ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-zinc-950 text-slate-900 dark:text-white flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 p-4 hidden lg:flex flex-shrink-0`}>

        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-8 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-full shadow-md cursor-pointer z-50 flex items-center justify-center transition"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Header (Non-scrolling) */}
        <div className={`flex items-center gap-2 mb-8 mt-2 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm tracking-tighter flex-shrink-0 shadow-sm shadow-indigo-650/10">N+</div>
          {!isCollapsed && (
            <Link to="/" className="font-sans font-bold text-xl text-indigo-900 dark:text-indigo-400 tracking-tight transition animate-fade-in">
              Nursefolio
            </Link>
          )}
        </div>

        {/* MAMA'S CHANGE 2: Wrapped Nav & User Info in a container with overflow-y-auto */}
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar pr-1">

          {/* User Info block */}
          {user && (
            <div className={`mb-6 pb-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 flex-shrink-0 ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}>
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Profile"
                  className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-700 shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs flex-shrink-0">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
              )}

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                    {user.first_name} {user.last_name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate">@{user.username}</span>
                    {user.verification_status === 'verified' && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Links Navigation */}
          <nav className="space-y-1 pb-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isExplore = item.id === 'explore';

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  title={isCollapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isCollapsed ? 'justify-center' : ''} ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-800/50 shadow-sm font-semibold'
                      : isExplore
                        ? 'hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-400 text-slate-500 dark:text-slate-400 border border-transparent'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 text-slate-500 dark:text-slate-400 border border-transparent'
                    }`
                  }
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isExplore && !isCollapsed ? 'text-amber-500 dark:text-amber-400' : ''}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer controls (Non-scrolling) */}
        <div className="space-y-4 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleThemeMode}
            className={`flex items-center gap-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer w-full ${isCollapsed ? 'justify-center px-0' : 'px-3.5'
              } bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700`}
            title={isCollapsed ? (themeMode === 'dark' ? 'Light Mode' : 'Dark Mode') : (themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode')}
          >
            {themeMode === 'dark' ? (
              <Sun className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Moon className="w-4 h-4 flex-shrink-0" />
            )}
            {!isCollapsed && <span>{themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {user && (
            <div className="p-4 bg-slate-900 dark:bg-slate-800 rounded-2xl text-white hidden sm:block">
              {!isCollapsed ? (
                <>
                  <p className="text-[10px] text-slate-400 mb-1 font-mono uppercase tracking-wider">Verification Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.verification_status === 'verified' ? 'bg-emerald-400' : 'bg-rose-450'}`}></div>
                    <span className="text-xs font-semibold capitalize">{user.verification_status}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-center">
                  <div className={`w-2 h-2 rounded-full ${user.verification_status === 'verified' ? 'bg-emerald-400' : 'bg-rose-450'}`}></div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Link
              to={`/nurse/${user?.username}`}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition ${isCollapsed ? 'px-0' : 'px-3.5'}`}
            >
              <ArrowLeft className={`w-4 h-4 ${isCollapsed ? '' : 'rotate-180'}`} />
              {!isCollapsed && <span>View My Public Hub</span>}
            </Link>

            {/* ── CHANGED: onClick now opens overlay instead of signing out directly ── */}
            <button
              onClick={handleExitClick}
              className={`flex items-center gap-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 w-full transition cursor-pointer ${isCollapsed ? 'justify-center px-0' : 'px-3.5'}`}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Exit Portal</span>}
            </button>
          </div>
        </div>

        {/* Mama's Styling Tip: Add this to your global CSS or Tailwind config to make the scrollbar look pretty */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 10px;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #334155;
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
      </aside>
    </>
  );
};
