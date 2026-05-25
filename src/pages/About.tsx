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
    <div className="bg-slate-50/40 min-h-screen py-16 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs bg-teal-50 border border-teal-150 text-teal-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Our Purpose
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            About Nursefolio
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed font-normal">
            Building the digital career registry for the modern medical environment.
          </p>
        </div>

        {/* Content detail */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 shadow-sm space-y-8 mb-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-slate-900">The healthcare hiring bottleneck</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-normal">
              Hospital hiring boards process thousands of pdf templates daily. Confirming check authenticity across varying state licensing registries takes weeks. Nursefolio solves this problem by giving nursing experts a central, badged digital hub which compiles experiences, published studies, and state board verifications.
            </p>
          </div>

          <div className="h-[1px] bg-slate-100"></div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Our Core Standards</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {values.map((val) => {
                const Icon = val.icon;
                return (
                  <div key={val.title} className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">{val.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{val.desc}</p>
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
