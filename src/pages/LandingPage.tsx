/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ShieldCheck, FileText, Palette, ArrowRight,
  HeartHandshake, Activity, Sparkles, MapPin, Award,
  Briefcase, CheckCircle2, Users, Clock, BookOpen,
  Stethoscope, Compass, TrendingUp, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from '../components/PageLoader';

// ==========================================================
// MAIN
// ==========================================================
export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true });
  }, [authLoading, user, navigate]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/explore?search=${encodeURIComponent(q)}`);
    else navigate('/explore');
  }, [searchQuery, navigate]);

  if (authLoading || user) return <PageLoader />;

  return (
    <div className="bg-white dark:bg-zinc-950">

      {/* ============================================
          HERO — sells the outcome, not the product
          ============================================ */}
      <section className="pt-10 md:pt-16 lg:pt-20 pb-14 md:pb-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">

          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-xs font-bold">
              <MapPin className="w-3.5 h-3.5" />
              Built for Kenyan nurses
            </span>

            <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.05]">
              Your nursing career,
              <br className="hidden sm:block" />
              {' '}in one link.
            </h1>

            <p className="mt-5 md:mt-6 text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Nursefolio is a professional portfolio for nurses. Instead of sending
              your CV on WhatsApp for the fifth time, share one link — with your license,
              experience, certifications, and available shifts.
            </p>

            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[48px]"
              >
                Create your free portfolio
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px]"
              >
                Browse nurses
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Free to use · No credit card · Your data stays yours
            </p>
          </div>

          {/* Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-10 md:mt-14 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2"
          >
            <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-full focus-within:ring-2 focus-within:ring-teal-500/40 transition">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by specialty, county, or name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition whitespace-nowrap min-h-[48px]"
            >
              Find nurses
            </button>
          </form>

          <div className="mt-4 text-center flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Popular searches:</span>
            <Link to="/explore?specialty=ICU" className="active:text-teal-600">ICU</Link>
            <span className="text-slate-300 dark:text-zinc-700">·</span>
            <Link to="/explore?specialty=Pediatrics" className="active:text-teal-600">Pediatrics</Link>
            <span className="text-slate-300 dark:text-zinc-700">·</span>
            <Link to="/explore?specialty=Emergency" className="active:text-teal-600">Emergency</Link>
            <span className="text-slate-300 dark:text-zinc-700">·</span>
            <Link to="/explore?specialty=Maternity" className="active:text-teal-600">Maternity</Link>
            <span className="text-slate-300 dark:text-zinc-700">·</span>
            <Link to="/locum" className="active:text-teal-600">Locum shifts</Link>
          </div>
        </div>
      </section>

      {/* ============================================
          PROBLEM — names the pain, honestly
          ============================================ */}
      <section className="py-16 md:py-24 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Right now, nursing careers live in three places
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            <ProblemCard
              icon={FileText}
              title="A CV lost in WhatsApp"
              body="You've sent it to five recruiters. Four lost it. One asked you to resend it. You don't know which version they have."
            />
            <ProblemCard
              icon={Award}
              title="Certificates in a drawer"
              body="NCK license, BLS, ACLS, PALS, CPD points — scattered across PDFs, photos, and paper. Hard to show, easy to lose."
            />
            <ProblemCard
              icon={Compass}
              title="Invisible to recruiters"
              body="Hospitals and locum coordinators can't find you. They ask around. Opportunities pass to whoever they already know."
            />
          </div>

          <div className="mt-12 md:mt-16 max-w-2xl mx-auto text-center">
            <p className="text-lg md:text-xl font-display font-bold text-slate-900 dark:text-white">
              Nursefolio gives you <span className="text-teal-600 dark:text-teal-400">one link</span> that solves all three.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          PRODUCT SHOWCASE — plain, looks like a screenshot
          ============================================ */}
      <section className="py-16 md:py-24 border-t border-slate-100 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">

          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              What your Nursefolio looks like
            </h2>
            <p className="mt-4 text-base text-slate-500 dark:text-slate-400">
              Everything a recruiter needs to make a decision — on a single page.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <PortfolioPreview />
          </div>

          {/* Below the preview: what's included */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { icon: ShieldCheck, label: 'Verified NCK ID' },
              { icon: BookOpen, label: 'Clinical logbook' },
              { icon: Briefcase, label: 'Work history' },
              { icon: Clock, label: 'Shift availability' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900"
              >
                <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS — 3 steps, no fluff
          ============================================ */}
      <section className="py-16 md:py-24 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">

          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              You're done in about 10 minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <StepCard
              number="1"
              title="Sign up with your email"
              body="Create an account as a nurse or a student. No lengthy onboarding — you're in immediately."
            />
            <StepCard
              number="2"
              title="Add what you already have"
              body="Work history, certifications, education, specialties. Upload or paste. Everything gets organised into sections."
            />
            <StepCard
              number="3"
              title="Share your link"
              body="Paste it in your CV, WhatsApp bio, LinkedIn, or email signature. Recruiters see everything on one page."
            />
          </div>
        </div>
      </section>

      {/* ============================================
          FEATURES — anchored to real nursing tasks
          ============================================ */}
      <section className="py-16 md:py-24 border-t border-slate-100 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">

          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              What you actually get
            </h2>
            <p className="mt-4 text-base text-slate-500 dark:text-slate-400">
              Every feature maps to something a nurse does every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={ShieldCheck}
              title="NCK verification"
              body="Submit your Nursing Council of Kenya ID. Once verified, your profile carries a badge recruiters trust."
            />
            <FeatureCard
              icon={Stethoscope}
              title="Clinical logbook"
              body="Log procedures with supervisor signatures. Automatically tracks your CPD-eligible hours for NCK renewal."
            />
            <FeatureCard
              icon={FileText}
              title="Auto-built CV"
              body="Your experience, education, and certifications become a clean PDF — updated every time you edit your profile."
            />
            <FeatureCard
              icon={Briefcase}
              title="Locum shift board"
              body="See open shifts near you, filtered by specialty. Post your own cover requests when you need help."
            />
            <FeatureCard
              icon={Palette}
              title="Portfolio themes"
              body="Pick how your public page looks — modern, clinical, minimal, or academic. Same content, different presentation."
            />
            <FeatureCard
              icon={Users}
              title="Peer endorsements"
              body="Colleagues can vouch for your skills. Real names, real quotes, no anonymous reviews."
            />
          </div>
        </div>
      </section>

      {/* ============================================
          FOR NURSES vs FOR STUDENTS
          ============================================ */}
      <section className="py-16 md:py-24 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">

          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Made for both stages of the career
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RoleCard
              tone="teal"
              icon={HeartHandshake}
              title="Practicing nurses"
              bullets={[
                'Show NCK license and current certifications',
                'List hospital experience with wards and specialties',
                'Collect peer endorsements from colleagues',
                'Appear in locum searches near your location',
                'Publish research and clinical case studies',
              ]}
              ctaLabel="Create your portfolio"
              ctaTo="/register?role=nurse"
            />
            <RoleCard
              tone="indigo"
              icon={Activity}
              title="Nursing students"
              bullets={[
                'Log clinical hours and rotations as you go',
                'Track completed procedures with supervisor sign-off',
                'Store certificates from each placement',
                'Arrive at graduation with a complete profile',
                'Stand out in externship and graduate recruitment',
              ]}
              ctaLabel="Start your logbook"
              ctaTo="/register?role=student"
            />
          </div>
        </div>
      </section>

      {/* ============================================
          TRUST — why this is safe
          ============================================ */}
      <section className="py-16 md:py-24 border-t border-slate-100 dark:border-zinc-900">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              You stay in control
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <TrustCard
              icon={Lock}
              title="Your profile, your permissions"
              body="Mark fields as public or private. Decide exactly what recruiters see. Nothing is shared without your input."
            />
            <TrustCard
              icon={ShieldCheck}
              title="Verified against the source"
              body="NCK IDs are cross-checked. Certifications can link to issuer registries. Nothing is taken on trust alone."
            />
            <TrustCard
              icon={Users}
              title="You can delete everything"
              body="Full account deletion in Settings. No emails, no wait times, no data held back. Your career, your data."
            />
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="py-16 md:py-24 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
            Your career deserves its own home.
          </h2>
          <p className="mt-4 text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
            It takes ten minutes to set up. It stays with you for years.
            It costs nothing to start.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[48px]"
            >
              <Sparkles className="w-4 h-4" />
              Create your portfolio
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px]"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

// ==========================================================
// PORTFOLIO PREVIEW — plain, looks like a screenshot
// ==========================================================
const PortfolioPreview = React.memo(() => (
  <div className="rounded-2xl bg-slate-100 dark:bg-zinc-900 p-2">
    <div className="bg-white dark:bg-zinc-950 rounded-xl overflow-hidden">

      {/* Simple header strip — no gradient, no glow */}
      <div className="h-20 bg-slate-700 dark:bg-zinc-800" />

      {/* Content */}
      <div className="px-5 pb-6 -mt-10">
        {/* Avatar circle */}
        <div className="w-16 h-16 rounded-full border-4 border-white dark:border-zinc-950 bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
          AK
        </div>

        {/* Name */}
        <div className="mt-3 flex items-center gap-1.5">
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
            Amina K.
          </h3>
          <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span className="text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full">
            VERIFIED
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
          Registered Nurse · ICU
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Nairobi, Kenya
        </p>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <span className="flex-1 py-2 rounded-full bg-teal-600 text-white text-xs font-bold text-center">
            Contact
          </span>
          <span className="flex-1 py-2 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-xs font-bold text-center">
            Download CV
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <div>
            <p className="text-lg font-display font-extrabold text-slate-900 dark:text-white">8</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Years exp
            </p>
          </div>
          <div>
            <p className="text-lg font-display font-extrabold text-slate-900 dark:text-white">24</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Endorsements
            </p>
          </div>
          <div>
            <p className="text-lg font-display font-extrabold text-slate-900 dark:text-white">4</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Certifications
            </p>
          </div>
        </div>

        {/* Focus areas */}
        <div className="mt-5">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Focus areas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['ICU', 'Cardiology', 'Emergency', 'Post-op'].map(s => (
              <span
                key={s}
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Endorsement sample */}
        <div className="mt-5">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Endorsed by
          </p>
          <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              "Exceptional clinical judgment under pressure. Mentored three cohorts of new nurses."
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1.5">
              — J.M., Senior RN · Kenyatta National Hospital
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
));
PortfolioPreview.displayName = 'PortfolioPreview';

// ==========================================================
// PROBLEM CARD
// ==========================================================
const ProblemCard = React.memo<{
  icon: any;
  title: string;
  body: string;
}>(({ icon: Icon, title, body }) => (
  <div className="bg-white dark:bg-zinc-950 rounded-3xl p-5 md:p-6">
    <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mb-4">
      <Icon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
    </div>
    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
      {title}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
      {body}
    </p>
  </div>
));
ProblemCard.displayName = 'ProblemCard';

// ==========================================================
// STEP CARD
// ==========================================================
const StepCard = React.memo<{
  number: string;
  title: string;
  body: string;
}>(({ number, title, body }) => (
  <div>
    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center mb-4">
      <span className="font-display font-extrabold text-white text-base">{number}</span>
    </div>
    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
      {title}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
      {body}
    </p>
  </div>
));
StepCard.displayName = 'StepCard';

// ==========================================================
// FEATURE CARD
// ==========================================================
const FeatureCard = React.memo<{
  icon: any;
  title: string;
  body: string;
}>(({ icon: Icon, title, body }) => (
  <div className="bg-white dark:bg-zinc-950 rounded-3xl p-5 md:p-6">
    <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center mb-4">
      <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
    </div>
    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
      {title}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
      {body}
    </p>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

// ==========================================================
// ROLE CARD
// ==========================================================
const RoleCard = React.memo<{
  tone: 'teal' | 'indigo';
  icon: any;
  title: string;
  bullets: string[];
  ctaLabel: string;
  ctaTo: string;
}>(({ tone, icon: Icon, title, bullets, ctaLabel, ctaTo }) => {
  const tones = {
    teal: {
      iconBg: 'bg-teal-50 dark:bg-teal-950/40',
      iconColor: 'text-teal-600 dark:text-teal-400',
      checkColor: 'text-teal-500',
      ctaBg: 'bg-teal-600 active:bg-teal-700 text-white',
    },
    indigo: {
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      checkColor: 'text-indigo-500',
      ctaBg: 'bg-indigo-600 active:bg-indigo-700 text-white',
    },
  };
  const t = tones[tone];

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 md:p-8 flex flex-col">
      <div className={`w-11 h-11 rounded-2xl ${t.iconBg} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${t.iconColor}`} />
      </div>
      <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white mb-4">
        {title}
      </h3>
      <ul className="space-y-2.5 mb-6 flex-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-slate-600 dark:text-slate-400">
            <CheckCircle2 className={`w-4 h-4 ${t.checkColor} flex-shrink-0 mt-0.5`} />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
      <Link
        to={ctaTo}
        className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition min-h-[48px] ${t.ctaBg}`}
      >
        {ctaLabel}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
});
RoleCard.displayName = 'RoleCard';

// ==========================================================
// TRUST CARD
// ==========================================================
const TrustCard = React.memo<{
  icon: any;
  title: string;
  body: string;
}>(({ icon: Icon, title, body }) => (
  <div className="bg-slate-50 dark:bg-zinc-900 rounded-3xl p-5 md:p-6">
    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-950 flex items-center justify-center mb-4">
      <Icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
    </div>
    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
      {title}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
      {body}
    </p>
  </div>
));
TrustCard.displayName = 'TrustCard';