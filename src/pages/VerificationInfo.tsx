/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ClipboardCheck, Award, FileText, Lock,
  ArrowRight, Check, ChevronDown, HelpCircle, Users,
  TrendingUp, Building, Search, Stethoscope, Clock,
  CheckCircle2, Mail, UserCheck
} from 'lucide-react';

// ==========================================================
// WHAT YOU CAN GET VERIFIED
// ==========================================================
const VERIFICATION_ITEMS = [
  {
    icon: ClipboardCheck,
    title: 'NCK nursing license',
    body: 'Submit your Nursing Council of Kenya registration number. We cross-check it against the official register and stamp your profile as verified.',
    time: 'Reviewed within 24 hours',
  },
  {
    icon: Award,
    title: 'Specialty certifications',
    body: 'ACLS, BLS, PALS, CCRN, and other board certifications. Add the issuing organization and certifying body. We verify what we can, and link to the source when we can\'t.',
    time: 'Reviewed within 24 hours',
  },
  {
    icon: FileText,
    title: 'Student registration',
    body: 'Nursing students can verify their enrollment with a student ID, externship letter, or a signed supervisor statement from their clinical placement.',
    time: 'Reviewed within 24 hours',
  },
];

// ==========================================================
// WHAT YOU ACTUALLY GET
// ==========================================================
const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'A verified badge on your profile',
    body: 'The badge appears next to your name on your public profile and in every profile card in Explore. Recruiters see it before they even open your profile.',
  },
  {
    icon: Search,
    title: 'Priority ranking in searches',
    body: 'Verified profiles rank above unverified ones when hospitals and locum coordinators search by specialty and location. You get seen first.',
  },
  {
    icon: Users,
    title: 'More endorsements from peers',
    body: 'Colleagues are more likely to endorse someone who looks professional and verified. The badge is a trust signal that compounds.',
  },
  {
    icon: TrendingUp,
    title: 'Higher conversion on your CV downloads',
    body: 'When recruiters browse your profile, a verified badge tells them the credentials on the CV are real. That\'s the difference between "maybe" and "let\'s talk."',
  },
];

// ==========================================================
// HOW IT WORKS
// ==========================================================
const STEPS = [
  {
    number: '1',
    title: 'Submit your credentials',
    body: 'From Dashboard → Settings, enter your license number, certification details, or upload a student ID. It takes about two minutes.',
  },
  {
    number: '2',
    title: 'We verify against the source',
    body: 'Our team cross-checks your submission against the Nursing Council of Kenya register, or the relevant certifying body. Most reviews complete within 24 hours.',
  },
  {
    number: '3',
    title: 'Your badge goes live',
    body: 'Once approved, the verified badge appears on your public profile immediately. You\'ll also appear higher in search results.',
  },
];

// ==========================================================
// FAQ
// ==========================================================
const FAQ = [
  {
    q: 'How long does verification take?',
    a: 'Most requests are reviewed within 24 hours. During high-volume periods (start of the semester, end of the year), it may take up to 48 hours. You\'ll receive an email when your status changes.',
  },
  {
    q: 'Is my uploaded documentation secure?',
    a: 'Yes. Any documents you upload are stored in access-controlled storage, readable only by you and by our verification team. They\'re never shared with other users, never sold, and never used for anything other than verifying your credential.',
  },
  {
    q: 'Does verification cost anything?',
    a: 'No. Verification is free for every nurse and nursing student. It always has been, and it always will be — this is part of our commitment that the core of Nursefolio stays free forever.',
  },
  {
    q: 'What if my submission is rejected?',
    a: 'You\'ll receive a note explaining what went wrong — usually a low-resolution scan, a name mismatch, or an expired document. You can fix it and resubmit as many times as you need. There\'s no penalty for a rejected first attempt.',
  },
  {
    q: 'Can I verify multiple credentials?',
    a: 'Yes. Your NCK license, your specialty certifications, and your student registration (if applicable) can all be verified. Each one shows up as a separate verified item on your profile.',
  },
  {
    q: 'What if I haven\'t received my NCK license yet?',
    a: 'If you\'re a nursing student, verify your student registration instead. Once you receive your NCK license, you can update your verification to the full license. Your student-verified status stays on record.',
  },
];

// ==========================================================
// MAIN
// ==========================================================
export default function VerificationInfo() {
  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16">

        {/* ============================================
            HERO
            ============================================ */}
        <header className="max-w-2xl mb-14 md:mb-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Free verification for every nurse
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mt-4">
            A verified badge recruiters actually trust.
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mt-5 max-w-xl">
            Nursefolio verifies your NCK license against the official register. Once you're verified,
            your profile carries a badge — and recruiters know your credentials are real before they
            even open your CV.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[48px]"
            >
              Start verification
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard/settings"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px]"
            >
              Already have an account? Verify now
            </Link>
          </div>
        </header>

        {/* ============================================
            WHAT YOU GET VERIFIED
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              What can be verified
            </h2>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
              Three things can earn a verified badge on your profile. All three are free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VERIFICATION_ITEMS.map(item => (
              <VerificationCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        {/* ============================================
            WHY IT MATTERS — BENEFITS
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Why verification matters
            </h2>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
              Unverified profiles look like everyone else. Verified profiles get acted on.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BENEFITS.map(b => (
              <BenefitCard key={b.title} {...b} />
            ))}
          </div>
        </section>

        {/* ============================================
            HOW IT WORKS
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              How it works
            </h2>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
              Three steps, about two minutes of your time.
            </p>
          </div>

          <div className="space-y-3">
            {STEPS.map(step => (
              <StepRow key={step.number} {...step} />
            ))}
          </div>
        </section>

        {/* ============================================
            THE BADGE EXPLAINED
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <div className="bg-slate-100 dark:bg-zinc-900 rounded-3xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

              {/* Left: explanation */}
              <div>
                <div className="w-11 h-11 rounded-2xl bg-white dark:bg-zinc-950 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
                  What the badge means
                </h2>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
                  The Nursefolio verified badge is not a paid upgrade, not a marketing label, and not
                  automatic. It means a human on our team checked your credentials against the
                  issuing authority before it went live.
                </p>
                <ul className="mt-5 space-y-2.5">
                  <BadgePoint text="NCK license number checked against the official register" />
                  <BadgePoint text="Certifications verified with the issuing body" />
                  <BadgePoint text="Student status confirmed with the institution" />
                  <BadgePoint text="Revoked if credentials expire and aren't renewed" />
                </ul>
              </div>

              {/* Right: mock verification card */}
              <div className="bg-white dark:bg-zinc-950 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Sample verification record
                </p>

                <div className="space-y-3">
                  <VerificationRow
                    label="NCK registration"
                    value="Verified"
                    status="passed"
                  />
                  <VerificationRow
                    label="BLS certification"
                    value="Verified"
                    status="passed"
                  />
                  <VerificationRow
                    label="ACLS certification"
                    value="Verified"
                    status="passed"
                  />
                  <VerificationRow
                    label="PALS certification"
                    value="Under review"
                    status="pending"
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Each credential is verified independently. Your profile shows only the ones that
                    have passed.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================
            FAQ
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Common questions
            </h2>
          </div>

          <div className="space-y-2 max-w-3xl">
            {FAQ.map((item, i) => (
              <FAQItem key={i} question={item.q} answer={item.a} defaultOpen={i === 0} />
            ))}
          </div>
        </section>

        {/* ============================================
            TRUST & PRIVACY
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Your documents stay private
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TrustCard
              icon={Lock}
              title="Access-controlled storage"
              body="Documents you upload are stored in isolated buckets, readable only by you and by our verification team during review."
            />
            <TrustCard
              icon={UserCheck}
              title="Never shown publicly"
              body="Your license scans, student ID, and any uploaded documents are never visible on your public profile — only the badge is."
            />
            <TrustCard
              icon={FileText}
              title="Deletable any time"
              body="You can withdraw your verification documents at any time. Deleted documents are removed from our systems within 30 days."
            />
          </div>
        </section>

        {/* ============================================
            FINAL CTA
            ============================================ */}
        <section className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
            Ready to get verified?
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
            Create your free Nursefolio account, then submit your credentials from Settings.
            Most badges go live within a day.
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
              Ask a question
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

// ==========================================================
// SUBCOMPONENTS
// ==========================================================
const VerificationCard = React.memo<{
  icon: any;
  title: string;
  body: string;
  time: string;
}>(({ icon: Icon, title, body, time }) => (
  <div className="bg-slate-100 dark:bg-zinc-900 rounded-3xl p-5">
    <div className="w-11 h-11 rounded-2xl bg-white dark:bg-zinc-950 flex items-center justify-center mb-4">
      <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
    </div>
    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
      {title}
    </h3>
    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
      {body}
    </p>
    <p className="mt-3 text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
      <Clock className="w-3 h-3" />
      {time}
    </p>
  </div>
));
VerificationCard.displayName = 'VerificationCard';

const BenefitCard = React.memo<{
  icon: any;
  title: string;
  body: string;
}>(({ icon: Icon, title, body }) => (
  <div className="bg-slate-100 dark:bg-zinc-900 rounded-3xl p-5 flex gap-4">
    <div className="w-11 h-11 rounded-2xl bg-white dark:bg-zinc-950 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
    </div>
    <div className="min-w-0">
      <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {body}
      </p>
    </div>
  </div>
));
BenefitCard.displayName = 'BenefitCard';

const StepRow = React.memo<{
  number: string;
  title: string;
  body: string;
}>(({ number, title, body }) => (
  <div className="flex gap-4 p-5 bg-slate-100 dark:bg-zinc-900 rounded-3xl">
    <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
      <span className="font-display font-extrabold text-white text-sm">{number}</span>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1.5">
        {body}
      </p>
    </div>
  </div>
));
StepRow.displayName = 'StepRow';

const BadgePoint = React.memo<{ text: string }>(({ text }) => (
  <li className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
    <Check className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
    <span className="leading-relaxed">{text}</span>
  </li>
));
BadgePoint.displayName = 'BadgePoint';

const VerificationRow = React.memo<{
  label: string;
  value: string;
  status: 'passed' | 'pending';
}>(({ label, value, status }) => {
  const isPassed = status === 'passed';
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
        {label}
      </p>
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${isPassed
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
        }`}>
        {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
        {value}
      </span>
    </div>
  );
});
VerificationRow.displayName = 'VerificationRow';

const TrustCard = React.memo<{
  icon: any;
  title: string;
  body: string;
}>(({ icon: Icon, title, body }) => (
  <div className="bg-slate-100 dark:bg-zinc-900 rounded-3xl p-5">
    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-950 flex items-center justify-center mb-3">
      <Icon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
    </div>
    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">
      {title}
    </h3>
    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
      {body}
    </p>
  </div>
));
TrustCard.displayName = 'TrustCard';

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