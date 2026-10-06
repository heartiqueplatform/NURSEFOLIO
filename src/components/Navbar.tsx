/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu, X, User, CheckSquare, Sun, Moon, ShieldCheck
} from 'lucide-react';
import { useThemeMode } from '../contexts/ThemeContext';

// ==========================================================
// NAV LINKS
// ==========================================================
const NAV_LINKS = [
  { name: 'Explore', path: '/explore' },
  { name: 'Locum', path: '/locum' },
  { name: 'Verification', path: '/verification-info' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'About', path: '/about' },
];

// ==========================================================
// MAIN
// ==========================================================
export const Navbar: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { themeMode, toggleThemeMode } = useThemeMode();

  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Escape closes mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const toggleMobileOpen = useCallback(() => setMobileOpen(prev => !prev), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      {/* ============================================
          NAVBAR
          ============================================ */}
      <nav className="fixed top-0 left-0 right-0 w-full z-[60] bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/192.png"
                  alt="Nursefolio"
                  className="w-9 h-9 rounded-xl object-cover"
                />
                <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                  Nurse<span className="text-teal-600 dark:text-teal-400">folio</span>
                </span>
              </Link>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm transition-colors ${isActive(link.path)
                    ? 'text-teal-600 dark:text-teal-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 font-medium active:text-slate-900 dark:active:text-white'
                    }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop auth controls */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              {/* Theme toggle */}
              <button
                onClick={toggleThemeMode}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition-colors"
                aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {themeMode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {loading ? (
                /* Skeleton while auth resolves */
                <div className="w-32 h-10 rounded-full bg-slate-100 dark:bg-zinc-900 animate-pulse" />
              ) : user ? (
                <>
                  {/* User pill */}
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2.5 pl-1 pr-4 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 active:bg-slate-200 dark:active:bg-zinc-800 transition"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-7 h-7 rounded-full object-cover bg-slate-200 dark:bg-zinc-800"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                    )}
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        {user.first_name || 'Nurse'}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        @{user.username}
                      </span>
                    </div>
                  </Link>

                  {/* Admin */}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 active:bg-rose-100 dark:active:bg-rose-950/60 px-3.5 py-2 rounded-full transition"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Admin</span>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-bold text-slate-600 dark:text-slate-300 active:text-slate-900 dark:active:text-white px-3 py-2 transition"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-bold text-white bg-teal-600 active:bg-teal-700 transition"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile controls */}
            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={toggleThemeMode}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition"
                aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {themeMode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleMobileOpen}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ============================================
            MOBILE MENU
            ============================================ */}
        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-900 animate-in slide-in-from-top-2 fade-in duration-150">
            <div className="px-4 py-3 space-y-1">
              {/* Nav links */}
              {NAV_LINKS.map(link => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={closeMobile}
                    className={`block px-4 py-3 rounded-2xl text-sm transition-colors ${active
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 font-semibold active:bg-slate-100 dark:active:bg-zinc-900'
                      }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-900 space-y-2">
                {loading ? (
                  <>
                    <div className="w-full h-11 rounded-2xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />
                    <div className="w-full h-11 rounded-2xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />
                  </>
                ) : user ? (
                  <>
                    {/* User summary */}
                    <Link
                      to="/dashboard"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 active:bg-slate-100 dark:active:bg-zinc-800 transition"
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-zinc-800 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
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
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    </Link>

                    {/* Admin */}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={closeMobile}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-sm font-bold active:bg-rose-100 dark:active:bg-rose-950/60 transition"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Admin panel
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={closeMobile}
                      className="block w-full py-3 rounded-2xl text-center text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-zinc-900 active:opacity-70 transition"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      onClick={closeMobile}
                      className="block w-full py-3 rounded-2xl text-center text-sm font-bold text-white bg-teal-600 active:bg-teal-700 transition"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};