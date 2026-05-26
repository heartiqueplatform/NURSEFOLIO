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
    <div className="bg-slate-50/40 mt-16 dark:bg-zinc-950/40 min-h-screen py-8 md:py-16">
      <div className="max-w-4xl mx-auto px-0 md:px-4 lg:px-8">

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-16 space-y-3 md:space-y-4 px-4 md:px-0">
          <span className="text-[10px] md:text-xs bg-teal-50 dark:bg-teal-950/50 border border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-400 font-bold px-2.5 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-wider font-sans">
            Get Support
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Contact Support Teams
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Need help configuring custom domain names, reviewing badged records, or managing hospital enterprise portals? Fill out the docket.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-8 items-start">

          {/* Support options column - full width on mobile */}
          <div className="md:col-span-4 bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 md:shadow-sm space-y-4 md:space-y-6 border-b border-slate-100 dark:border-slate-800 md:border-b md:border-slate-100">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm">Office Resources</h3>
            <div className="space-y-3 md:space-y-4 text-[11px] md:text-xs font-normal text-slate-500 dark:text-slate-400">
              <div className="flex items-start gap-2 md:gap-3">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                <span>Nyeri </span>
              </div>
              <div className="flex items-start gap-2 md:gap-3">
                <Phone className="w-4 h-4 md:w-5 md:h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                <span>+254704473503</span>
              </div>
              <div className="flex items-start gap-2 md:gap-3">
                <Mail className="w-4 h-4 md:w-5 md:h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                <span>medraenursing@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Form Docket - full width on mobile */}
          <div className="md:col-span-8 bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-8 md:shadow-sm">
            {submitted ? (
              <div className="text-center py-6 md:p-8 space-y-3 md:space-y-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto md:shadow-sm">
                  <Check className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white font-sans">Docket Submitted Successfully</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm max-w-sm mx-auto leading-relaxed">
                  Thank you! Our medical support specialists will review your inquiry and follow up within one business day.
                </p>
                <div className="pt-1 md:pt-2">
                  <button
                    id="contact-btn-reset"
                    onClick={() => {
                      setName('');
                      setEmail('');
                      setMessage('');
                      setSubmitted(false);
                    }}
                    className="text-[10px] md:text-xs font-bold text-teal-600 dark:text-teal-400 cursor-pointer underline"
                  >
                    Submit another docket
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Your Full Name</label>
                  <input
                    id="contact-input-name"
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jackline Mildred"
                    className="w-full text-[11px] md:text-xs px-3 md:px-3.5 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Email Registration</label>
                  <input
                    id="contact-input-email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. jckline@example.com"
                    className="w-full text-[11px] md:text-xs px-3 md:px-3.5 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Inquiry Description</label>
                  <textarea
                    id="contact-input-msg"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="State details on license problems, enterprise configurations or pricing plans..."
                    className="w-full text-[11px] md:text-xs px-3 md:px-3.5 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-400 text-slate-800 dark:text-slate-200 dark:bg-slate-800/50 transition"
                  ></textarea>
                </div>

                <div className="pt-1 md:pt-2">
                  <button
                    id="contact-btn-submit"
                    type="submit"
                    className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[11px] md:text-xs py-2.5 md:py-3 px-5 md:px-6 rounded-lg md:rounded-xl cursor-pointer active:scale-95 transition"
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