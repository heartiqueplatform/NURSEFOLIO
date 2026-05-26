/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { ThemeSelector } from '../components/ThemeSelector';
import { PortfolioTheme } from '../types';
import { Check, Palette, ArrowRight } from 'lucide-react';

export default function PortfolioThemePage() {
  const { user, refreshUser } = useAuth();
  const [selected, setSelected] = useState<PortfolioTheme>(user?.profile_theme || 'modern');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleSaveTheme = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await databaseService.updateProfile(user.id, {
        profile_theme: selected
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="md:bg-white md:dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-0 md:p-6 lg:p-8 md:shadow-sm space-y-4 md:space-y-8 font-sans -mx-3 md:mx-0">

      {/* Header Section */}
      <div className="border-b border-slate-100 dark:border-zinc-800 md:dark:border-slate-800 pb-4 md:pb-5 px-3 md:px-0 pt-2 md:pt-0">
        <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 md:gap-2">
          <Palette className="w-4 h-4 md:w-5 md:h-5 text-teal-600 dark:text-teal-400" />
          <span>Select Public Display Options</span>
        </h2>
        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">
          Customize typography grids and accent colors across your portfolio.
        </p>
      </div>

      {saved && (
        <div id="theme-save-alert" className="mx-3 md:mx-0 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-2.5 md:p-3.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-semibold flex items-center gap-1.5 md:gap-2">
          <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>Display theme saved change successfully!</span>
        </div>
      )}

      {/* Theme Selector - full width on mobile */}
      <div className="px-3 md:px-0">
        <ThemeSelector
          id="theme-selector-panel"
          selectedTheme={selected}
          onChange={(t) => setSelected(t)}
        />
      </div>

      {/* Action Buttons - stacked on mobile */}
      <div className="pt-4 md:pt-6 border-t border-slate-100 dark:border-zinc-800 md:dark:border-slate-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 md:gap-4 px-3 md:px-0">
        <a
          id="theme-btn-preview"
          href={`/nurse/${user.username}`}

          className="text-[10px] md:text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center justify-center sm:justify-start gap-1 md:gap-1.5 py-2"
        >
          <span>Open live page to test</span>
          <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </a>

        <button
          id="theme-save-btn"
          onClick={handleSaveTheme}
          disabled={saving}
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 md:py-3 px-6 md:px-8 rounded-lg md:rounded-xl cursor-pointer active:scale-95 transition text-[11px] md:text-xs flex items-center justify-center gap-1.5 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            'Save Theme Settings'
          )}
        </button>
      </div>

    </div>
  );
}