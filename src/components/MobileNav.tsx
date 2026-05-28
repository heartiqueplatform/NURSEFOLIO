/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  User,
  FileText,
  ArrowUpRight,
  Menu,
  Palette,
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  BarChart3,
  Settings,
  Heart,
  LogOut,
  X,
  Compass,
  Sun,
  Moon
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dragY, setDragY] = React.useState(0);
  const [dragX, setDragX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState(false);
  const [showGoodbyeModal, setShowGoodbyeModal] = React.useState(false);
  const startY = React.useRef(0);
  const startX = React.useRef(0);
  const currentY = React.useRef(0);

  // Get theme mode from localStorage or system preference
  const [themeMode, setThemeMode] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    // Check current theme on mount
    const isDark = document.documentElement.classList.contains('dark');
    setThemeMode(isDark ? 'dark' : 'light');
  }, []);

  const toggleThemeMode = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);

    // Toggle dark class on html element
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const handleExitClick = () => {
    setOpenMenu(false);
    setShowGoodbyeModal(true);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const y = e.touches[0].clientY;
    const x = e.touches[0].clientX;
    const diffY = y - startY.current;
    const diffX = x - startX.current;

    // Allow dragging left or right with resistance
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal drag
      const resistance = diffX * 0.6;
      setDragX(resistance);
    } else if (diffY > 0) {
      // Vertical drag (downward only, with resistance)
      const resistance = diffY * 0.6;
      setDragY(resistance);
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);

    // If pulled down enough → close
    if (dragY > 120) {
      setOpenMenu(false);
    }

    // If pulled left enough → close
    if (dragX < -100) {
      setOpenMenu(false);
    }

    // If pulled right enough → close
    if (dragX > 100) {
      setOpenMenu(false);
    }

    // Reset positions
    setDragY(0);
    setDragX(0);
  };

  return (
    <>
      {/* ── Goodbye Bottom Sheet (slides up from beneath the nav bar) ── */}
      {showGoodbyeModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            onClick={() => setShowGoodbyeModal(false)}
          />

          {/* Bottom sheet — sits ABOVE the nav bar (pb-20 clears it) */}
          <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-sheet-up">
            <div className="bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl px-6 pt-5 pb-24 border-t border-slate-100 dark:border-slate-800">

              {/* Drag handle */}
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-5" />

              {/* Pulsing heart */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center animate-goodbye-pulse">
                  <Heart className="w-7 h-7 text-rose-500 fill-rose-400" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-1">
                Goodbye, {user?.first_name} 👋
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-1 leading-relaxed">
                We'll miss you around here. 💙
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-5 leading-relaxed italic px-2">
                "Every nurse you meet carries a little piece of their patients with them. Thank you for the care you give every day."
              </p>

              <div className="flex justify-center gap-3 mb-6 text-lg">
                <span title="Safe travels">🌸</span>
                <span title="You're amazing">✨</span>
                <span title="Come back soon">🏥</span>
                <span title="We care">💛</span>
              </div>

              <div className="flex flex-col gap-2">
                {/* Stay button — big & encouraging */}
                <button
                  onClick={() => setShowGoodbyeModal(false)}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950/40"
                >
                  Actually, I'll stay 🙂
                </button>

                {/* Sign out — small & subtle to discourage */}
                <button
                  onClick={handleSignOut}
                  className="w-full py-2 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
                >
                  No, sign me out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ───── BOTTOM NAV ───── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 lg:hidden safe-bottom shadow-lg">
        <div className="flex h-16 items-center justify-around px-2">

          {/* Overview */}
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Overview</span>
          </NavLink>

          {/* Profile */}
          <NavLink
            to="/dashboard/edit-profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Profile</span>
          </NavLink>



          <NavLink
            to="/feed"
            onClick={() => setOpenMenu(false)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Pulse</span>
          </NavLink>
          {/* CV */}
          <NavLink
            to="/explore"
            onClick={() => setOpenMenu(false)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Explore</span>
          </NavLink>
          {/* MENU BUTTON */}
          <button
            onClick={() => setOpenMenu(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">More</span>
          </button>

        </div>
      </nav>

      {/* ───── FULL MENU DRAWER ───── */}
      {openMenu && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-end pb-20" onClick={() => setOpenMenu(false)}>
          <div
            className="w-full bg-white dark:bg-zinc-950 rounded-t-3xl rounded-b-xl p-5 overflow-hidden relative transition-transform duration-200 ease-out"
            style={{
              transform: `translate(${dragX}px, ${dragY}px)`,
              transition: isDragging ? 'none' : 'transform 0.25s ease-out'
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={e => e.stopPropagation()}
          >

            {/* Ghost Rubik's Cube SVG Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden rounded-t-3xl rounded-b-xl">
              <div className="animate-cube-spin opacity-[0.04] dark:opacity-[0.07]">
                <svg width="300" height="300" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="130,20 20,80 20,180 130,130" fill="#6366f1" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round" />
                  <polygon points="130,20 240,80 240,180 130,130" fill="#4f46e5" stroke="#4f46e5" strokeWidth="1.5" strokeLinejoin="round" />
                  <polygon points="130,20 20,80 130,130 240,80" fill="#818cf8" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round" />
                  <line x1="57" y1="60" x2="57" y2="157" stroke="#6366f1" strokeWidth="1" opacity="0.6" />
                  <line x1="93" y1="40" x2="93" y2="143" stroke="#6366f1" strokeWidth="1" opacity="0.6" />
                  <line x1="20" y1="113" x2="130" y2="63" stroke="#6366f1" strokeWidth="1" opacity="0.6" />
                  <line x1="20" y1="146" x2="130" y2="96" stroke="#6366f1" strokeWidth="1" opacity="0.6" />
                  <line x1="167" y1="40" x2="167" y2="143" stroke="#4f46e5" strokeWidth="1" opacity="0.6" />
                  <line x1="203" y1="60" x2="203" y2="157" stroke="#4f46e5" strokeWidth="1" opacity="0.6" />
                  <line x1="130" y1="63" x2="240" y2="113" stroke="#4f46e5" strokeWidth="1" opacity="0.6" />
                  <line x1="130" y1="96" x2="240" y2="146" stroke="#4f46e5" strokeWidth="1" opacity="0.6" />
                  <line x1="57" y1="60" x2="167" y2="40" stroke="#818cf8" strokeWidth="1" opacity="0.6" />
                  <line x1="93" y1="40" x2="203" y2="60" stroke="#818cf8" strokeWidth="1" opacity="0.6" />
                  <polygon points="130,20 20,80 20,180 130,240 240,180 240,80" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
                  <line x1="130" y1="20" x2="130" y2="240" stroke="#6366f1" strokeWidth="1.5" opacity="0.5" />
                  <line x1="20" y1="80" x2="240" y2="80" stroke="#818cf8" strokeWidth="1.5" opacity="0.5" />
                  <line x1="20" y1="180" x2="240" y2="180" stroke="#6366f1" strokeWidth="1" opacity="0.4" />
                  <line x1="20" y1="130" x2="240" y2="130" stroke="#6366f1" strokeWidth="1" opacity="0.3" />
                </svg>
              </div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-5 relative z-10">
              <div>
                <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">Dashboard Menu</h2>
                {user && (
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mt-0.5">@{user.username}</p>
                )}
              </div>
              <button
                onClick={() => setOpenMenu(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MENU GRID */}
            <div className="grid grid-cols-2 gap-2 text-sm relative z-10">

              <NavLink to="/dashboard" onClick={() => setOpenMenu(false)}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Home className="w-4 h-4 flex-shrink-0" />Overview
              </NavLink>

              <NavLink to="/dashboard/edit-profile" onClick={() => setOpenMenu(false)}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <User className="w-4 h-4 flex-shrink-0" />Profile
              </NavLink>

              <NavLink to="/dashboard/experiences" onClick={() => setOpenMenu(false)}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Briefcase className="w-4 h-4 flex-shrink-0" />Experience
              </NavLink>
              <NavLink
                to="/dashboard/cv"
                onClick={() => setOpenMenu(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                Upload CV
              </NavLink>
              <NavLink to="/dashboard/skills" onClick={() => setOpenMenu(false)}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Award className="w-4 h-4 flex-shrink-0" />Skills
              </NavLink>

              <NavLink to="/dashboard/education" onClick={() => setOpenMenu(false)}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <GraduationCap className="w-4 h-4 flex-shrink-0" />Education
              </NavLink>

              <NavLink to="/dashboard/certifications" onClick={() => setOpenMenu(false)}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Award className="w-4 h-4 flex-shrink-0" />Certifications
              </NavLink>

              <NavLink to="/dashboard/publications" onClick={() => setOpenMenu(false)}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <BookOpen className="w-4 h-4 flex-shrink-0" />Research
              </NavLink>

              <NavLink to="/dashboard/analytics" onClick={() => setOpenMenu(false)}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <BarChart3 className="w-4 h-4 flex-shrink-0" />Analytics
              </NavLink>
              {user && (
                <NavLink
                  to={`/nurse/${user.username}`}
                  onClick={() => setOpenMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                  Live
                </NavLink>
              )}
              <NavLink to="/dashboard/settings" onClick={() => setOpenMenu(false)}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Settings className="w-4 h-4 flex-shrink-0" />Settings
              </NavLink>
            </div>
            {/* THEME BUTTON + LOGOUT */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">

              {/* Theme Settings Link - Go to Theme Page */}
              <NavLink
                to="/dashboard/theme"
                onClick={() => setOpenMenu(false)}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Palette className="w-4 h-4" />
                Theme Settings
              </NavLink>

              {/* Mobile Theme Toggle - Quick toggle without leaving page */}
              <button
                id="mobile-btn-theme"
                onClick={toggleThemeMode}
                className="w-full mt-2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </button>

              {/* Exit button — small & subtle, doesn't encourage logout */}
              {user && (
                <button
                  onClick={handleExitClick}
                  className="flex items-center gap-1.5 mx-auto mt-3 text-xs text-slate-400 dark:text-slate-600 hover:text-rose-400 dark:hover:text-rose-500 transition cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Exit Portal</span>
                </button>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Animations ── */}
      <style>{`
        @keyframes cube-spin {
          0%   { transform: rotate(0deg) rotateX(20deg) rotateY(0deg); }
          100% { transform: rotate(360deg) rotateX(20deg) rotateY(360deg); }
        }
        @keyframes sheet-up {
          0%   { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes goodbye-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
        .animate-cube-spin {
          animation: cube-spin 18s linear infinite;
          transform-style: preserve-3d;
        }
        .animate-sheet-up {
          animation: sheet-up 0.32s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        .animate-goodbye-pulse {
          animation: goodbye-pulse 1.6s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};