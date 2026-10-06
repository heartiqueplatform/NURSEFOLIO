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
  const [isDragging, setIsDragging] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState(false);
  const [showGoodbyeModal, setShowGoodbyeModal] = React.useState(false);
  const startY = React.useRef(0);

  // Theme state
  const [themeMode, setThemeMode] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setThemeMode(isDark ? 'dark' : 'light');
  }, []);

  // Lock body scroll when drawer is open
  React.useEffect(() => {
    if (openMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [openMenu]);

  const toggleThemeMode = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
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

  // -------------------------------
  // Drag-to-close handlers (drawer)
  // -------------------------------
  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diffY = e.touches[0].clientY - startY.current;
    if (diffY > 0) {
      // resistance for smooth feel
      setDragY(diffY * 0.7);
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) {
      setOpenMenu(false);
    }
    setDragY(0);
  };

  // Drawer opacity tied to drag position
  const backdropOpacity = Math.max(0, 1 - dragY / 300);

  return (
    <>
      {/* ── Goodbye Bottom Sheet ── */}
      {showGoodbyeModal && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            onClick={() => setShowGoodbyeModal(false)}
          />

          <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-sheet-up">
            <div className="bg-white dark:bg-zinc-950 rounded-t-3xl shadow-2xl px-6 pt-5 pb-24 border-t border-slate-100 dark:border-zinc-800">
              <div className="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full mx-auto mb-5" />

              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center animate-goodbye-pulse">
                  <Heart className="w-7 h-7 text-rose-500 fill-rose-400" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-1">
                Goodbye, {user?.first_name}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-1 leading-relaxed">
                We'll miss you around here.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-5 leading-relaxed italic px-2">
                "Every nurse you meet carries a little piece of their patients with them. Thank you for the care you give every day."
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowGoodbyeModal(false)}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950/40 active:scale-[98%]"
                >
                  Stay signed in
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full py-2 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
                >
                  Sign me out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── BOTTOM NAV BAR ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-100 dark:border-zinc-800 lg:hidden safe-bottom shadow-lg">
        <div className="flex h-16 items-center justify-around px-2">
          {/* Overview */}
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Overview</span>
          </NavLink>

          {/* Explore */}
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Explore</span>
          </NavLink>

          {/* Locum — NEW */}
          <NavLink
            to="/locum"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Locum</span>
          </NavLink>

          {/* Pulse */}
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Pulse</span>
          </NavLink>

          {/* Menu */}
          <button
            onClick={() => setOpenMenu(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">More</span>
          </button>
        </div>
      </nav>

      {/* ── FULL MENU DRAWER (Instagram-comment-style bottom sheet) ── */}
      {openMenu && (
        <div className="fixed inset-0 z-[9999] flex items-end">
          {/* Backdrop — fades as you drag down */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            style={{ opacity: backdropOpacity }}
            onClick={() => setOpenMenu(false)}
          />

          {/* Sheet — attached to bottom, drag-to-close */}
          <div
            className="relative w-full bg-white dark:bg-zinc-950 rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{
              transform: `translateY(${dragY}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle — also the drag surface */}
            <div
              className="flex-shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-5 pb-4 flex-shrink-0 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h2 className="font-bold text-base text-slate-800 dark:text-slate-100 leading-tight">
                  Menu
                </h2>
                {user && (
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mt-0.5">
                    @{user.username}
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpenMenu(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition active:scale-95"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {/* Menu grid */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <NavLink
                  to="/dashboard"
                  onClick={() => setOpenMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  <Home className="w-4 h-4 flex-shrink-0" />
                  Overview
                </NavLink>

                <NavLink
                  to="/dashboard/edit-profile"
                  onClick={() => setOpenMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  <User className="w-4 h-4 flex-shrink-0" />
                  Profile
                </NavLink>

                <NavLink
                  to="/dashboard/experiences"
                  onClick={() => setOpenMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  <Briefcase className="w-4 h-4 flex-shrink-0" />
                  Experience
                </NavLink>

                <NavLink
                  to="/dashboard/cv"
                  onClick={() => setOpenMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  Upload CV
                </NavLink>

                <NavLink
                  to="/dashboard/skills"
                  onClick={() => setOpenMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  <Award className="w-4 h-4 flex-shrink-0" />
                  Skills
                </NavLink>

                <NavLink
                  to="/dashboard/education"
                  onClick={() => setOpenMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  <GraduationCap className="w-4 h-4 flex-shrink-0" />
                  Education
                </NavLink>

                <NavLink
                  to="/dashboard/certifications"
                  onClick={() => setOpenMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  <Award className="w-4 h-4 flex-shrink-0" />
                  Certifications
                </NavLink>

                <NavLink
                  to="/dashboard/publications"
                  onClick={() => setOpenMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  Research
                </NavLink>

                <NavLink
                  to="/dashboard/analytics"
                  onClick={() => setOpenMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  <BarChart3 className="w-4 h-4 flex-shrink-0" />
                  Analytics
                </NavLink>

                {user && (
                  <NavLink
                    to={`/nurse/${user.username}`}
                    onClick={() => setOpenMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                        ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                        : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`
                    }
                  >
                    <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                    Live
                  </NavLink>
                )}

                <NavLink
                  to="/dashboard/settings"
                  onClick={() => setOpenMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  Settings
                </NavLink>
              </div>

              {/* Theme + Exit */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                <NavLink
                  to="/dashboard/theme"
                  onClick={() => setOpenMenu(false)}
                  className="w-full py-3 rounded-xl bg-slate-100 dark:bg-zinc-900 text-sm font-semibold flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Palette className="w-4 h-4" />
                  Theme Settings
                </NavLink>

                <button
                  onClick={toggleThemeMode}
                  className="w-full py-3 rounded-xl bg-slate-100 dark:bg-zinc-900 text-sm font-semibold flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </button>

                {user && (
                  <button
                    onClick={handleExitClick}
                    className="flex items-center gap-1.5 mx-auto mt-3 text-xs text-slate-400 dark:text-slate-600 hover:text-rose-400 dark:hover:text-rose-500 transition"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Exit Portal</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes sheet-up {
          0%   { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes goodbye-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
        .animate-sheet-up {
          animation: sheet-up 0.32s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        .animate-goodbye-pulse {
          animation: goodbye-pulse 1.6s ease-in-out infinite;
        }
        /* Safe area for iPhone notch devices */
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      `}</style>
    </>
  );
};