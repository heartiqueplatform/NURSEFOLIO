/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, LogOut, Activity, ArrowUpRight } from 'lucide-react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { OnboardingTour } from '../components/onboarding/OnboardingTour';

export const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-950">
      {/* Onboarding Interactive Tour */}
      <OnboardingTour />

      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">

        {/* Top bar for Mobile/Tablet/Desktop viewports */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">N+</div>
            <span className="font-bold text-indigo-950 text-base tracking-tight">Nursefolio</span>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <h1 className="font-display font-bold text-slate-900 text-lg tracking-tight">Management Portal</h1>
            <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-100">
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100/40"
                >
                  <span>Preview Portfolio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  id="dashboard-header-btn-logout"
                  onClick={handleSignOut}
                  className="lg:hidden p-2 text-slate-400 hover:text-slate-900 transition cursor-pointer"
                  title="Log Out"
                >
                  <LogOut className="w-5 h-5 animate-pulse" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Dynamic content scroll frame styled with Bento spacing */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* Bottom Floating Navigation for Mobile/Tablet */}
      <MobileNav />
    </div>
  );
};
