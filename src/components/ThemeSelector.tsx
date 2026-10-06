/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, Palette } from 'lucide-react';
import { PortfolioTheme } from '../types';
import { useThemeMode } from '../contexts/ThemeContext';

// ==========================================================
// TYPES
// ==========================================================
interface ThemeSelectorProps {
  id: string;
  selectedTheme: PortfolioTheme;
  onChange: (theme: PortfolioTheme) => void;
}

interface ThemeOption {
  value: PortfolioTheme;
  label: string;
  description: string;
  previewLight: string;
  previewDark: string;
}

// ==========================================================
// OPTIONS — hoisted to module scope
// ==========================================================
const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'modern',
    label: 'Modern',
    description: 'Teal gradients and glass cards. The default startup look.',
    previewLight: 'bg-gradient-to-br from-teal-500 to-emerald-400',
    previewDark: 'bg-gradient-to-br from-teal-600 to-emerald-500',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Warm stone canvas with charcoal outlines. High contrast.',
    previewLight: 'bg-gradient-to-br from-stone-400 to-stone-600',
    previewDark: 'bg-gradient-to-br from-stone-500 to-stone-700',
  },
  {
    value: 'clinical',
    label: 'Clinical',
    description: 'Clean medical blue accents and structured detail.',
    previewLight: 'bg-gradient-to-br from-blue-500 to-sky-400',
    previewDark: 'bg-gradient-to-br from-blue-600 to-sky-500',
  },
  {
    value: 'academic',
    label: 'Academic',
    description: 'Serif headings and indigo borders. Good for research.',
    previewLight: 'bg-gradient-to-br from-indigo-600 to-indigo-800',
    previewDark: 'bg-gradient-to-br from-indigo-700 to-indigo-900',
  },
  {
    value: 'dark',
    label: 'Night',
    description: 'Deep slate background with glowing accents.',
    previewLight: 'bg-gradient-to-br from-slate-800 to-slate-900',
    previewDark: 'bg-gradient-to-br from-slate-900 to-slate-950',
  },
];

// ==========================================================
// MAIN
// ==========================================================
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  id,
  selectedTheme,
  onChange,
}) => {
  const { themeMode } = useThemeMode();

  return (
    <div id={id}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <Palette className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Portfolio theme
        </h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
        How your public profile looks to visitors. Changes apply immediately after saving.
      </p>

      {/* Options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {THEME_OPTIONS.map(opt => {
          const isSelected = selectedTheme === opt.value;
          const previewClass = themeMode === 'dark' ? opt.previewDark : opt.previewLight;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={isSelected}
              className={`flex items-start gap-3 p-3.5 rounded-2xl text-left transition-colors ${isSelected
                ? 'bg-teal-50 dark:bg-teal-950/40 ring-2 ring-teal-500/40'
                : 'bg-slate-100 dark:bg-zinc-900 active:bg-slate-200 dark:active:bg-zinc-800'
                }`}
            >
              {/* Swatch */}
              <div
                className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center text-white ${previewClass}`}
              >
                {isSelected && <Check className="w-4 h-4" />}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pt-0.5">
                <span
                  className={`block text-sm font-bold leading-tight ${isSelected
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-slate-900 dark:text-white'
                    }`}
                >
                  {opt.label}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {opt.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Note */}
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 leading-relaxed">
        Your portfolio theme is independent from the app's light/dark mode.
        Visitors see the theme regardless of their device settings.
      </p>
    </div>
  );
};