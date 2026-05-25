/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Target, FileLock, Search, Sparkles, ArrowRight, ClipboardCheck, Award } from 'lucide-react';

export default function VerificationInfo() {
  const requirements = [
    {
      title: 'Practicing Nursing License',
      desc: 'A scan of your state registry or national board certificate. Must match the profile name and state location.',
      icon: ClipboardCheck,
      color: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border-indigo-150 dark:border-indigo-800',
    },
    {
      title: 'Student Registration ID',
      desc: 'For nursing students, a valid clinical externship pass or university student registration document.',
      icon: Award,
      color: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-205 dark:border-slate-700',
    },
    {
      title: 'Board Certifications',
      desc: 'Credential attachments for specialty designations like CCRN, FNP-C, PALS or other recognized seals.',
      icon: ShieldCheck,
      color: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border-indigo-150 dark:border-indigo-800',
    }
  ];

  return (
    <div className="bg-slate-50/40 dark:bg-slate-950/40 min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-155 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
            Verified Professional Credential Systems
          </span>
          <h1 className="text-4xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Build trust with verified nursing profiles
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto leading-relaxed font-normal">
            Hospitals and recruiters are overwhelmed with applications. A verified Nursefolio badge signals that your credentials have been verified.
          </p>
        </div>

        {/* Big visual banner block */}
        <div className="bg-slate-900 dark:bg-slate-950 rounded-[32px] p-8 md:p-12 mb-16 relative overflow-hidden text-white shadow-xl border border-slate-800 dark:border-slate-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

            <div className="md:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recruiter Trusted Standards</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">The Verification Badge Difference</h2>
              <p className="text-sm text-slate-400 leading-relaxed font-normal">
                Nurses with verification status receive on average <span className="text-white font-bold">4.2x more profile views</span> and are twice as likely to receive recruitment requests. It signals compliance, authenticity, and professionalism.
              </p>
              <div className="flex gap-6 pt-2 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span>Board Checked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span>Secure Storage</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span>Real-time Sync</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 flex justify-center">
              <div className="bg-slate-800/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-700/60 dark:border-slate-700/60 p-6 w-full max-w-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-wider font-bold text-indigo-400 uppercase">Verification Check</span>
                  <span className="text-[10px] text-slate-400">ID: N-9842</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Registry State Board</span>
                    <span className="text-emerald-400">PASSED ✓</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-emerald-500 rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>BSN Educational Audit</span>
                    <span className="text-emerald-400">PASSED ✓</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-emerald-500 rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Clinical ID Check</span>
                    <span className="text-amber-405 dark:text-amber-400">COMPILING...</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-amber-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Requirements grid */}
        <div className="space-y-8 mb-16">
          <h3 className="text-2xl font-bold font-sans text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800/60 pb-4">What documentation is required?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {requirements.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">{item.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-normal">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 sm:p-12 mb-16 space-y-8 shadow-sm">
          <h3 className="text-2xl font-bold font-sans text-slate-900 dark:text-white">Verification Frequently Asked Questions</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">How long does my verification request take to resolve?</h4>
              <p className="text-slate-550 dark:text-slate-400 leading-relaxed">
                Our admin audit teams verify state license parameters within 24 to 48 hours of documents upload.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Is uploading sensitive IDs secure?</h4>
              <p className="text-slate-550 dark:text-slate-400 leading-relaxed">
                Yes. Any license scans or student card IDs are handled safely via Supabase Storage buckets utilizing top-grade end-to-end cloud encryption.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Does verification cost money?</h4>
              <p className="text-slate-550 dark:text-slate-400 leading-relaxed">
                Verification checks for graduates, entry-level clinical nurses, and senior nursing students are completely free!
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 font-sans">Can I reapply if my check gets declined?</h4>
              <p className="text-slate-550 dark:text-slate-400 leading-relaxed">
                Absolutely. If an audit fails due to low photo resolution or incomplete names, admins will outline notes on how to reupload documents inside your settings portal.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-[24px] max-w-xl mx-auto space-y-4">
          <h4 className="text-xl font-bold font-display text-slate-850 dark:text-slate-200">Ready to boost your credentials?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Create an account, fill out your experience panel, and submit your registration check inside your portal.
          </p>
          <div className="pt-2">
            <Link
              id="verification-cta-btn"
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition active:scale-95"
            >
              <span>Build My Portfolio Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}