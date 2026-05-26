/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, Heart, ShieldAlert, Award } from 'lucide-react';

export default function About() {
  const values = [
    {
      title: 'Designed for Medicine',
      desc: 'Traditional resume tools treat medical specialties like standard sales jobs. Nursefolio respects board certifications and clinical hours.',
      icon: Activity
    },
    {
      title: 'Compliant & Certified',
      desc: 'We verify state board IDs to weed out fake applications and guarantee actual credentials.',
      icon: Award
    },
    {
      title: 'Empowering Students',
      desc: 'Our student rotative loggers allow medical students to build up active placement scorecards before finishing board exams.',
      icon: Heart
    }
  ];

  return (
    <div className="bg-slate-50/40 dark:bg-zinc-950/40 min-h-screen py-8 mt-16 md:py-16 font-sans">
      <div className="max-w-4xl mx-auto px-0 md:px-4 lg:px-8">

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-16 space-y-3 md:space-y-4 px-4 md:px-0">
          <span className="text-[10px] md:text-xs bg-teal-50 dark:bg-teal-950/50 border border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-400 font-bold px-2.5 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-wider">
            Our Purpose
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            About Nursefolio
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            Building the digital career registry for the modern medical environment.
          </p>
        </div>

        {/* Content detail - full width on mobile */}
        <div className="bg-white dark:bg-zinc-950 md:rounded-3xl md:border md:border-slate-100 md:dark:border-slate-800 p-5 md:p-8 lg:p-12 md:shadow-sm space-y-6 md:space-y-8 md:mb-12">

          {/* First section */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">The healthcare hiring bottleneck</h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Hospital hiring boards process thousands of pdf templates daily. Confirming check authenticity across varying state licensing registries takes weeks. Nursefolio solves this problem by giving nursing experts a central, badged digital hub which compiles experiences, published studies, and state board verifications.
            </p>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800"></div>

          {/* Core Standards section */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6">Our Core Standards</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 md:gap-6">
              {values.map((val, index) => {
                const Icon = val.icon;
                return (
                  <div
                    key={val.title}
                    className={`space-y-2 md:space-y-3 py-4 md:py-0 px-4 md:px-0 ${index < values.length - 1
                      ? 'border-b border-slate-100 dark:border-slate-800 md:border-b-0'
                      : ''
                      }`}
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-800">
                      <Icon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-sm">{val.title}</h4>
                    <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{val.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}