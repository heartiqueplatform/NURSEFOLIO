/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Palette, Check } from 'lucide-react';
import { PortfolioTheme } from '../types';

interface ThemeSelectorProps {
  id: string;
  selectedTheme: PortfolioTheme;
  onChange: (theme: PortfolioTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ id, selectedTheme, onChange }) => {
  const options: { value: PortfolioTheme; label: string; desc: string; preview: string }[] = [
    {
      value: 'modern',
      label: 'Modern Premium',
      desc: 'Teal gradients, transparent glass card style, startup feel.',
      preview: 'bg-gradient-to-r from-teal-500 to-emerald-400'
    },
    {
      value: 'minimal',
      label: 'Sleek Minimal',
      desc: 'Warm stone canvas, charcoal outlines, perfect high-contrast.',
      preview: 'bg-gradient-to-r from-stone-400 to-stone-600'
    },
    {
      value: 'clinical',
      label: 'Clinical Clinical',
      desc: 'Clean medical blue accents with structured details.',
      preview: 'bg-gradient-to-r from-blue-500 to-sky-400'
    },
    {
      value: 'academic',
      label: 'Academic Navy',
      desc: 'Serif headings and indigo accent border, perfect for research.',
      preview: 'bg-gradient-to-r from-indigo-900 to-indigo-700'
    },
    {
      value: 'dark',
      label: 'Obsidian Night',
      desc: 'Deep cosmic slate slate background with glowing accents.',
      preview: 'bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800'
    }
  ];

  return (
    <div id={id} className="space-y-4">
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-base">
        <Palette className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <h6>Select Portfolio Display Theme</h6>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Choose a premium visual theme for your public profile link. Changes apply instantly across desktop and mobile.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((opt) => {
          const isSelected = selectedTheme === opt.value;
          return (
            <button
              key={opt.value}
              id={`theme-select-${opt.value}`}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-start text-left p-4 rounded-xl border transition-all duration-200 active:scale-[99%] cursor-pointer ${isSelected
                ? 'border-teal-600 bg-teal-50/25 dark:bg-teal-950/30 ring-2 ring-teal-600/10'
                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm'
                }`}
            >
              <div className={`w-10 h-10 rounded-lg flex-shrink-0 mr-4 flex items-center justify-center text-white font-bold text-xs ${opt.preview}`}>
                {isSelected && <Check className="w-5 h-5 drop-shadow" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block font-semibold text-slate-800 dark:text-slate-200 text-sm">{opt.label}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{opt.desc}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};