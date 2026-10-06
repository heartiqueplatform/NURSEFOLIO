/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, MessageSquare, MapPin, Phone, Check, Loader2,
  ArrowRight, HelpCircle, ShieldCheck, AlertCircle,
  FileText, Building
} from 'lucide-react';

// ==========================================================
// CONTACT INFO
// ==========================================================
const CONTACT_INFO = {
  email: 'medraenursing@gmail.com',
  phone: '+254704473503',
  phoneDisplay: '0704 473 503',
  location: 'Nyeri, Kenya',
};

// ==========================================================
// FAQ — answers the most common questions up front
// ==========================================================
const FAQ = [
  {
    icon: ShieldCheck,
    question: 'How do I verify my NCK license?',
    answer: 'Go to Dashboard → Settings. Submit your NCK ID number and issuing board. Our admin team cross-checks against the register and updates your badge within 24 hours.',
  },
  {
    icon: FileText,
    question: 'Why is my CV not downloading?',
    answer: 'Your CV is generated from your profile data. Make sure you\'ve added at least work experience and one certification before generating. If it still fails, email us.',
  },
  {
    icon: Building,
    question: 'Do you offer institutional plans?',
    answer: 'Yes — for hospitals, nursing schools, and locum agencies. Email us with your organization name and estimated number of nurses.',
  },
  {
    icon: HelpCircle,
    question: 'I found a bug or a wrong profile.',
    answer: 'Tell us the profile URL and what looks wrong. We investigate every report within one business day.',
  },
];

// ==========================================================
// MAIN
// ==========================================================
export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // The form is only valid when all required fields are non-empty
  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
      message.trim().length >= 10
    );
  }, [name, email, message]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Please fill in all required fields with valid details.');
      return;
    }

    setSubmitting(true);
    try {
      // Open the user's email client with a prefilled message.
      // This is the honest MVP — a real backend endpoint can replace this later.
      const mailtoSubject = encodeURIComponent(subject.trim() || 'Nursefolio Contact');
      const mailtoBody = encodeURIComponent(
        `From: ${name.trim()} <${email.trim()}>\n\n${message.trim()}`
      );
      window.location.href = `mailto:${CONTACT_INFO.email}?subject=${mailtoSubject}&body=${mailtoBody}`;

      // Small delay so the mailto transition feels intentional
      setTimeout(() => setSubmitted(true), 400);
    } catch (err) {
      console.error('Contact submit failed:', err);
      setError('Could not open your email client. Please copy the address below.');
    } finally {
      setSubmitting(false);
    }
  }, [name, email, subject, message, canSubmit]);

  const handleReset = useCallback(() => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setSubmitted(false);
    setError('');
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">

        {/* ============================================
            HEADER
            ============================================ */}
        <header className="max-w-2xl mb-10 md:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-xs font-bold">
            <MessageSquare className="w-3.5 h-3.5" />
            Get help
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mt-4">
            We read every message.
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
            Verification issues, bugs, institutional plans, or just feedback — pick the fastest
            route below.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

          {/* ============================================
              LEFT COLUMN — contact info + FAQ
              ============================================ */}
          <div className="md:col-span-5 space-y-6">

            {/* Direct contact */}
            <div className="bg-slate-100 dark:bg-zinc-900 rounded-3xl p-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Direct contact
              </h2>
              <ul className="space-y-3">
                <ContactItem
                  icon={Mail}
                  label="Email"
                  value={CONTACT_INFO.email}
                  href={`mailto:${CONTACT_INFO.email}`}
                />
                <ContactItem
                  icon={Phone}
                  label="Phone"
                  value={CONTACT_INFO.phoneDisplay}
                  href={`tel:${CONTACT_INFO.phone}`}
                />
                <ContactItem
                  icon={MapPin}
                  label="Office"
                  value={CONTACT_INFO.location}
                />
              </ul>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 px-1">
                Common questions
              </h2>
              <div className="space-y-2">
                {FAQ.map((item, i) => (
                  <FAQItem key={i} {...item} />
                ))}
              </div>
            </div>

          </div>

          {/* ============================================
              RIGHT COLUMN — Form
              ============================================ */}
          <div className="md:col-span-7">
            <div className="bg-white dark:bg-zinc-950 md:rounded-3xl md:bg-slate-100 md:dark:bg-zinc-900 p-0 md:p-6">

              {submitted ? (
                <SuccessState onReset={handleReset} />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="mb-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Send us a message
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      We reply within one business day.
                    </p>
                  </div>

                  {error && (
                    <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      Your name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jackline Mildred"
                      autoComplete="name"
                      className="w-full text-sm px-4 py-3 bg-white dark:bg-zinc-950 md:bg-slate-50 md:dark:bg-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      inputMode="email"
                      className="w-full text-sm px-4 py-3 bg-white dark:bg-zinc-950 md:bg-slate-50 md:dark:bg-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      Subject <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Verification issue, Bug report, Institutional plan"
                      className="w-full text-sm px-4 py-3 bg-white dark:bg-zinc-950 md:bg-slate-50 md:dark:bg-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      placeholder="Tell us what's going on. Include URLs or screenshots if relevant."
                      className="w-full text-sm px-4 py-3 bg-white dark:bg-zinc-950 md:bg-slate-50 md:dark:bg-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition resize-none"
                    />
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                      {message.length}/1000 characters
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="w-full py-3.5 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Opening email
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send message
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                    This opens your email client with the message pre-filled. You can also email
                    us directly at{' '}
                    <a
                      href={`mailto:${CONTACT_INFO.email}`}
                      className="text-teal-600 dark:text-teal-400 font-semibold"
                    >
                      {CONTACT_INFO.email}
                    </a>
                    .
                  </p>
                </form>
              )}
            </div>
          </div>

        </div>

        {/* ============================================
            BOTTOM CTA
            ============================================ */}
        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-zinc-900">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Ready to build your portfolio?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                It takes about ten minutes.
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[44px]"
            >
              Create your portfolio
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================================
// SUBCOMPONENTS
// ==========================================================
const ContactItem = React.memo<{
  icon: any;
  label: string;
  value: string;
  href?: string;
}>(({ icon: Icon, label, value, href }) => {
  const inner = (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-2xl bg-white dark:bg-zinc-950 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
          {value}
        </p>
      </div>
    </div>
  );
  if (href) {
    return (
      <li>
        <a href={href} className="block active:opacity-70 transition">
          {inner}
        </a>
      </li>
    );
  }
  return <li>{inner}</li>;
});
ContactItem.displayName = 'ContactItem';

const FAQItem = React.memo<{
  icon: any;
  question: string;
  answer: string;
}>(({ icon: Icon, question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left active:opacity-70 transition"
        aria-expanded={open}
      >
        <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
        <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
          {question}
        </span>
        <span className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="px-4 pb-3.5 pl-11">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
});
FAQItem.displayName = 'FAQItem';

const SuccessState = React.memo<{ onReset: () => void }>(({ onReset }) => (
  <div className="text-center py-10 px-6">
    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-4">
      <Check className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
      Ready to send
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
      We've opened your email client with the message pre-filled. Just hit send and we'll reply
      within one business day.
    </p>
    <button
      onClick={onReset}
      className="mt-6 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-xs font-bold active:opacity-70 transition"
    >
      Send another message
    </button>
  </div>
));
SuccessState.displayName = 'SuccessState';