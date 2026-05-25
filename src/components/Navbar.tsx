/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Menu, X, User, LogOut, CheckSquare } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Discover Nurses', path: '/explore' },
    { name: 'Verification Info', path: '/verification-info' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'About', path: '/about' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link id="nav-logo" to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform shadow-md shadow-indigo-600/10">
                <span className="text-sm tracking-tighter">N+</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-900">
                Nurse<span className="text-indigo-600">folio</span>
              </span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                id={`nav-link-${link.path.replace('/', '')}`}
                to={link.path}
                className={`text-sm font-medium transition-colors ${isActive(link.path)
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Controls */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  id="nav-btn-dashboard"
                  to="/dashboard"
                  className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group shadow-sm"
                >
                  {/* AVATAR OR INITIALS */}
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Me"
                      className="w-8 h-8 rounded-lg object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                  )}

                  <div className="flex flex-col text-left">
                    <span className="text-xs font-extrabold text-slate-800 leading-none">
                      Hi, {user.first_name || 'Nurse'}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-500 mt-0.5 opacity-80">
                      @{user.username}
                    </span>
                  </div>
                </Link>
                {user.role === 'admin' && (
                  <Link
                    id="nav-btn-admin"
                    to="/admin"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-4 py-2 rounded-xl transition-all"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button
                  id="nav-btn-logout"
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  id="nav-btn-login"
                  to="/login"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 transition"
                >
                  Sign In
                </Link>
                <Link
                  id="nav-btn-register"
                  to="/register"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-600/10 transition-all select-none"
                >
                  Create Nursefolio
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburguer */}
          <div className="flex md:hidden items-center">
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileOpen && (
        <div className="md:hidden border-b border-slate-150/40 bg-white animate-in slide-in-from-top-4 duration-200">
          <div className="px-2 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                id={`mobile-link-${link.path.replace('/', '')}`}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-base font-semibold transition-all ${isActive(link.path)
                  ? 'text-indigo-600 bg-indigo-50/50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-100 px-3 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    id="mobile-btn-dashboard"
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-center text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-xl"
                  >
                    <User className="w-4 h-4" />
                    <span>Go to My Portal</span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      id="mobile-btn-admin"
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-center text-sm font-semibold text-rose-700 bg-rose-50 rounded-xl"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  <button
                    id="mobile-btn-logout"
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="w-full py-2.5 text-center text-sm font-semibold text-slate-500 bg-slate-50 rounded-xl cursor-pointer"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    id="mobile-btn-login"
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 bg-slate-50 rounded-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    id="mobile-btn-register"
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2.5 text-center text-sm font-semibold text-white bg-indigo-600 rounded-xl"
                  >
                    Create Portfolio
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
