/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, HelpCircle, Check, MapPin, Phone } from 'lucide-react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      setSubmitted(true);
    }
  };

  return (
    <div className="bg-slate-50/40 dark:bg-zinc-950/40 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs bg-teal-50 dark:bg-teal-950/50 border border-teal-150 dark:border-teal-800 text-teal-700 dark:text-teal-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider font-sans">
            Get Support
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Contact Support Teams
          </h1>
          <p className="text-sm text-slate-550 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Need help configuring custom domain names, reviewing badged records, or managing hospital enterprise portals? Fill out the docket.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

          {/* Support options column */}
          <div className="md:col-span-4 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm h-4">Office Resources</h3>
            <div className="space-y-4 text-xs font-normal text-slate-500 dark:text-slate-400">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-650 dark:text-teal-400 flex-shrink-0" />
                <span>Boston Clinical Innovation Hub, MA, 02111</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-teal-650 dark:text-teal-400 flex-shrink-0" />
                <span>+1 (800) NURSE-PORT</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-teal-650 dark:text-teal-400 flex-shrink-0" />
                <span>support@nursefolio.com</span>
              </div>
            </div>
          </div>

          {/* Form Docket */}
          <div className="md:col-span-8 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            {submitted ? (
              <div className="text-center p-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-105 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-905 dark:text-white font-sans">Docket Submitted Successfully</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                  Thank you! Our medical support specialists will review your inquiry and follow up within one business day.
                </p>
                <div className="pt-2">
                  <button
                    id="contact-btn-reset"
                    onClick={() => {
                      setName('');
                      setEmail('');
                      setMessage('');
                      setSubmitted(false);
                    }}
                    className="text-xs font-bold text-teal-605 dark:text-teal-400 cursor-pointer underline"
                  >
                    Submit another docket
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Your Full Name</label>
                  <input
                    id="contact-input-name"
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Brain Muthomi"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Email Registration</label>
                  <input
                    id="contact-input-email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. brian@example.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-slate-850 dark:text-slate-200 dark:bg-slate-800/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Inquiry Description</label>
                  <textarea
                    id="contact-input-msg"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="State details on license problems, enterprise configurations or pricing plans..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button
                    id="contact-btn-submit"
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-3 px-6 rounded-xl cursor-pointer active:scale-95 transition"
                  >
                    Submit Support Docket
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}