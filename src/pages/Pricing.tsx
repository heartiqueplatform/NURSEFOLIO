/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Check, ShieldCheck, Users, Briefcase, ArrowRight,
  HelpCircle, Mail, ChevronDown
} from 'lucide-react';

// ==========================================================
// PLANS — free forever, with honest scope
// ==========================================================
const PLANS = [
  {
    id: 'student',
    name: 'Student',
    audience: 'Nursing students',
    price: 'Free',
    period: 'forever',
    description: 'Everything you need to build your clinical record while you study.',
    features: [
      'Public portfolio page',
      'Clinical logbook with supervisor signatures',
      'Track rotations and procedures',
      'Store certificates and licenses',
      'Auto-generated CV',
      'All portfolio themes',
    ],
    cta: 'Start as a student',
    ctaTo: '/register?role=student',
    tone: 'neutral' as const,
  },
  {
    id: 'nurse',
    name: 'Nurse',
    audience: 'Practicing nurses',
    price: 'Free',
    period: 'forever',
    description: 'Full portfolio, verified credentials, and locum shift board.',
    features: [
      'Everything in Student, plus:',
      'NCK license verification & badge',
      'Unlimited work experience entries',
      'Locum shift board access',
      'Peer endorsements',
      'Analytics: who viewed and downloaded',
      'Priority support',
    ],
    cta: 'Create your portfolio',
    ctaTo: '/register?role=nurse',
    tone: 'featured' as const,
  },
  {
    id: 'agency',
    name: 'Agency',
    audience: 'Hospitals & locum coordinators',
    price: 'Talk to us',
    period: '',
    description: 'For institutions hiring or coordinating nurses at scale.',
    features: [
      'Everything in Nurse, plus:',
      'Multi-seat recruiter access',
      'Advanced candidate search filters',
      'Post vacancy and locum listings',
      'Bulk CV downloads with consent',
      'Institutional billing',
    ],
    cta: 'Contact sales',
    ctaTo: '/contact',
    tone: 'neutral' as const,
  },
];

// ==========================================================
// COMMITMENTS — WhatsApp-style future pricing promise
// ==========================================================
const COMMITMENTS = [
  {
    icon: ShieldCheck,
    title: 'What you have today stays free',
    body: 'Every feature listed above is free forever for the users who already have it. If we ever introduce paid features, they\'ll be new additions — never a paywall on what you already use.',
  },
  {
    icon: Users,
    title: 'One price for the whole journey',
    body: 'Students start free and stay free when they graduate. No forced migration to a paid tier, no "your plan expires" emails, no artificial limits on how long you can use the free account.',
  },
  {
    icon: Briefcase,
    title: 'Paid features will be opt-in, never forced',
    body: 'If we add something paid — an advanced theme pack, priority verification review, a hospital dashboard — it will be clearly labeled, clearly priced, and optional. Nothing you already rely on will move behind a paywall.',
  },
];

// ==========================================================
// FAQ — the questions users actually ask
// ==========================================================
const FAQ = [
  {
    q: 'Is Nursefolio really free?',
    a: 'Yes. Every feature on this page is free and always will be. We don\'t have a paid tier that removes ads (because there are no ads), and we don\'t charge per portfolio, per CV, or per verification.',
  },
  {
    q: 'What happens when I graduate from student to nurse?',
    a: 'Nothing. Your account is the same. Your portfolio, logbook, and certifications carry over automatically. You just get access to the nurse-tier features like the locum board.',
  },
  {
    q: 'Will you ever charge for features I already use?',
    a: 'No. This is our public commitment. If we ever add paid features, they\'ll be new things you can choose to opt into. Everything existing stays free.',
  },
  {
    q: 'How do you make money then?',
    a: 'Today, we don\'t. Nursefolio is funded by its founders. If we add paid features later — most likely institutional tools for hospitals and agencies — that\'s what will fund the free tier for individual nurses.',
  },
  {
    q: 'What does the Agency plan cost?',
    a: 'Depends on what you need. Book a call and we\'ll put together a quote based on your team size and hiring volume. Institutional pricing starts when you have a real use case, not a PDF with inflated numbers.',
  },
];

// ==========================================================
// MAIN
// ==========================================================
export default function Pricing() {
  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16">

        {/* ============================================
            HEADER
            ============================================ */}
        <header className="max-w-2xl mx-auto text-center mb-12 md:mb-16">

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mt-4">
            Free, and staying that way.
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mt-5">
            Nursefolio is free for every nurse and nursing student. No credit card, no trial,
            no feature that disappears behind a paywall later.
          </p>
        </header>

        {/* ============================================
            PLANS
            ============================================ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-16 md:mb-20">
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </section>

        {/* ============================================
            COMMITMENTS
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Our commitment on pricing
            </h2>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
              We're following the WhatsApp model: launch free, stay free, add paid features
              only for new things institutions and power users ask for. Here's exactly what
              that means:
            </p>
          </div>

          <div className="space-y-3">
            {COMMITMENTS.map((c, i) => (
              <CommitmentRow key={i} {...c} />
            ))}
          </div>
        </section>

        {/* ============================================
            FAQ
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Questions about pricing
            </h2>
          </div>

          <div className="space-y-2 max-w-3xl">
            {FAQ.map((item, i) => (
              <FAQItem key={i} question={item.q} answer={item.a} defaultOpen={i === 0} />
            ))}
          </div>
        </section>

        {/* ============================================
            FINAL CTA
            ============================================ */}
        <section className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
            Start your free portfolio
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
            Takes about ten minutes. No card, no trial period, no catch.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[48px]"
            >
              Create your portfolio
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px]"
            >
              <Mail className="w-4 h-4" />
              Talk to us
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

// ==========================================================
// PLAN CARD
// ==========================================================
const PlanCard = React.memo<{
  plan: typeof PLANS[number];
}>(({ plan }) => {
  const isFeatured = plan.tone === 'featured';

  return (
    <div
      className={`rounded-3xl p-6 flex flex-col ${isFeatured
        ? 'bg-teal-600 dark:bg-teal-700 text-white'
        : 'bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-white'
        }`}
    >
      {/* Header */}
      <div>
        <p
          className={`text-[10px] font-bold uppercase tracking-wider ${isFeatured ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'
            }`}
        >
          {plan.audience}
        </p>
        <h3 className="text-xl md:text-2xl font-display font-bold tracking-tight mt-1.5">
          {plan.name}
        </h3>
        <p
          className={`text-sm leading-relaxed mt-2 ${isFeatured ? 'text-teal-50' : 'text-slate-600 dark:text-slate-400'
            }`}
        >
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-3xl md:text-4xl font-display font-extrabold tracking-tight">
          {plan.price}
        </span>
        {plan.period && (
          <span
            className={`text-xs font-semibold ${isFeatured ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'
              }`}
          >
            {plan.period}
          </span>
        )}
      </div>

      {/* CTA */}
      <Link
        to={plan.ctaTo}
        className={`mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition min-h-[44px] ${isFeatured
          ? 'bg-white text-teal-700 active:bg-teal-50'
          : 'bg-white dark:bg-zinc-950 text-slate-900 dark:text-white active:bg-slate-50 dark:active:bg-zinc-900'
          }`}
      >
        {plan.cta}
        <ArrowRight className="w-4 h-4" />
      </Link>

      {/* Features */}
      <ul className="mt-6 pt-6 border-t space-y-3 flex-1"
        style={{
          borderColor: isFeatured ? 'rgba(255,255,255,0.2)' : undefined,
        }}
      >
        <div className={isFeatured ? '' : 'border-slate-200 dark:border-zinc-800'}>
          {plan.features.map((feat, i) => (
            <li key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
              <Check
                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isFeatured ? 'text-teal-100' : 'text-teal-600 dark:text-teal-400'
                  }`}
              />
              <span
                className={`text-sm leading-snug ${isFeatured ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                  }`}
              >
                {feat}
              </span>
            </li>
          ))}
        </div>
      </ul>
    </div>
  );
});
PlanCard.displayName = 'PlanCard';

// ==========================================================
// COMMITMENT ROW
// ==========================================================
const CommitmentRow = React.memo<{
  icon: any;
  title: string;
  body: string;
}>(({ icon: Icon, title, body }) => (
  <div className="flex gap-4 p-5 bg-slate-100 dark:bg-zinc-900 rounded-3xl">
    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-950 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base leading-snug">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1.5">
        {body}
      </p>
    </div>
  </div>
));
CommitmentRow.displayName = 'CommitmentRow';

// ==========================================================
// FAQ ITEM
// ==========================================================
const FAQItem = React.memo<{
  question: string;
  answer: string;
  defaultOpen?: boolean;
}>(({ question, answer, defaultOpen }) => {
  const [open, setOpen] = useState(!!defaultOpen);

  const toggle = useCallback(() => setOpen(v => !v), []);

  return (
    <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-70 transition"
        aria-expanded={open}
      >
        <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
        <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white leading-snug">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''
            }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pl-11">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
});
FAQItem.displayName = 'FAQItem';