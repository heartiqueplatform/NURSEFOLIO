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
    <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-8 font-sans">
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Palette className="w-5.5 h-5.5 text-teal-600" />
          <span>Select Public Display Options</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Customize typography grids and accent colors across your portfolio.
        </p>
      </div>

      {saved && (
        <div id="theme-save-alert" className="bg-emerald-50 border border-emerald-100 text-emerald-705 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Display theme saved change successfully!</span>
        </div>
      )}

      {/* Selector */}
      <ThemeSelector
        id="theme-selector-panel"
        selectedTheme={selected}
        onChange={(t) => setSelected(t)}
      />

      {/* Buttons */}
      <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <a
          id="theme-btn-preview"
          href={`/nurse/${user.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-teal-605 hover:underline flex items-center gap-1.5"
        >
          <span>Open live page to test</span>
          <ArrowRight className="w-4 h-4" />
        </a>

        <button
          id="theme-save-btn"
          onClick={handleSaveTheme}
          disabled={saving}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl cursor-pointer active:scale-95 transition text-xs flex items-center gap-2"
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            'Save Theme Settings'
          )}
        </button>
      </div>
    </div>
  );
}
