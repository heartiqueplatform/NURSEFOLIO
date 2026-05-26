/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, User, Palette, FileText, ArrowUpRight } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 lg:hidden safe-bottom shadow-lg">
      <div className="flex h-16 items-center justify-around px-2">
        <NavLink
          id="mobilenav-link-home"
          to="/dashboard"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive
              ? 'text-teal-600 dark:text-teal-400'
              : 'text-slate-450 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Overview</span>
        </NavLink>

        <NavLink
          id="mobilenav-link-edit"
          to="/dashboard/edit-profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive
              ? 'text-teal-600 dark:text-teal-400'
              : 'text-slate-455 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </NavLink>

        <NavLink
          id="mobilenav-link-theme"
          to="/dashboard/theme"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive
              ? 'text-teal-600 dark:text-teal-400'
              : 'text-slate-460 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`
          }
        >
          <Palette className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Themes</span>
        </NavLink>

        <NavLink
          id="mobilenav-link-cv"
          to="/dashboard/cv"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive
              ? 'text-teal-600 dark:text-teal-400'
              : 'text-slate-465 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`
          }
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">CV</span>
        </NavLink>

        {user && (
          <a
            id="mobilenav-link-preview"
            href={`/nurse/${user.username}`}

            className="flex flex-col items-center justify-center flex-1 py-1 text-emerald-600 dark:text-emerald-400"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Live Page</span>
          </a>
        )}
      </div>
    </nav>
  );
};