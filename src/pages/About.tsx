/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Heart, ShieldAlert, Award, Users, Compass,
  FileText, ShieldCheck, Stethoscope, MapPin, ArrowRight,
  CheckCircle2, Briefcase, GraduationCap, TrendingUp
} from 'lucide-react';

// ==========================================================
// CONSTANTS
// ==========================================================
const PRINCIPLES = [
  {
    title: 'Built for nursing, not sales',
    body: 'Generic CV tools treat medical specialties like standard office jobs. Nursefolio understands NCK licenses, CPD points, ward specialties, and the difference between a rotation and a role.',
    icon: Activity,
  },
  {
    title: 'Credentials you can trust',
    body: 'Every profile with a verified badge has had its NCK ID cross-checked against the official register. No badge, no claim. Simple as that.',
    icon: Award,
  },
  {
    title: 'Students matter equally',
    body: "Nursing students can log rotations, track completed procedures with supervisor signatures, and arrive at graduation with a decade of career history already documented.",
    icon: GraduationCap,
  },
];

const PROBLEMS = [
  {
    icon: FileText,
    title: "A CV lost in WhatsApp",
    body: "You've sent it to five recruiters. Four lost it. One asked you to resend it. You don't know which version they have.",
  },
  {
    icon: Award,
    title: 'Certificates scattered',
    body: 'NCK license, BLS, ACLS, PALS, CPD certificates — spread across PDFs, photos, and paper files. Hard to present, easy to lose.',
  },
  {
    icon: Compass,
    title: 'Invisible to recruiters',
    body: "Hospitals and locum coordinators can't find you. They ask around. Opportunities go to whoever they already know.",
  },
];

const AUDIENCES = [
  {
    icon: Briefcase,
    title: 'Practicing nurses',
    body: 'RNs, KRCHNs, clinical specialists. Show your full career on one page — hospitals, wards, certifications, and current shift availability.',
  },
  {
    icon: GraduationCap,
    title: 'Nursing students',
    body: 'Track clinical hours, procedures, and certifications as you go. Graduate with a portfolio, not a blank CV.',
  },
  {
    icon: Users,
    title: 'Locum coordinators',
    body: 'Search verified nurses by specialty and location. See who\'s actually available this week without a phone tree.',
  },
];

// ==========================================================
// MAIN
// ==========================================================
export default function About() {
  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">

        {/* ============================================
            HEADER
            ============================================ */}
        <header className="max-w-2xl mb-12 md:mb-16">

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mt-4">
            Every nurse deserves a career page as serious as their work.
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mt-5">
            Nurses carry more clinical responsibility than almost any other profession, yet they're
            stuck presenting their careers through WhatsApp PDFs and email attachments. Nursefolio
            exists to fix that.
          </p>
        </header>

        {/* ============================================
            PROBLEM SECTION
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white mb-6">
            The problem we started with
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-3xl">
            Hospital hiring boards process hundreds of PDF CVs every month. Confirming which
            certifications are real takes weeks. Locum coordinators waste days calling nurses to
            find one available shift. Meanwhile, nurses themselves have no permanent home for
            their career — every new application means starting from a blank page again.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PROBLEMS.map(problem => (
              <ProblemCard key={problem.title} {...problem} />
            ))}
          </div>
        </section>

        {/* ============================================
            WHAT WE BUILT
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white mb-6">
            What we built instead
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-3xl">
            A single shareable link that contains your entire professional identity as a nurse —
            verified credentials, complete work history, clinical logbook, availability, and a
            CV that regenerates itself every time you update your profile.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRINCIPLES.map(principle => (
              <PrincipleCard key={principle.title} {...principle} />
            ))}
          </div>
        </section>

        {/* ============================================
            WHO IT'S FOR
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white mb-6">
            Who uses Nursefolio
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-3xl">
            The platform serves three groups, each with a different need, all served by the
            same core profile.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AUDIENCES.map(audience => (
              <AudienceCard key={audience.title} {...audience} />
            ))}
          </div>
        </section>

        {/* ============================================
            OUR COMMITMENTS
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white mb-6">
            Our commitments
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-3xl">
            Anyone can list "values" on a website. These are specific promises we've built
            into the product, backed by the way it actually works.
          </p>

          <div className="space-y-3">
            <CommitmentRow
              icon={ShieldCheck}
              title="Your credentials are verified against the source."
              body="Every verified badge traces back to a real check against the Nursing Council of Kenya register or an equivalent authority. We don't take anyone's word for it — not even ours."
            />
            <CommitmentRow
              icon={ShieldAlert}
              title="Your data belongs to you, and you can delete it."
              body="Full account deletion is a self-service button in Settings, not a support ticket. When you delete, it's gone within 30 days, including backups."
            />
            <CommitmentRow
              icon={MapPin}
              title="Built for Kenya, aligned with international standards."
              body="Our primary users are nurses across Kenya and the East African corridor. Our data practices align with Kenya's Data Protection Act 2019 and the EU GDPR, so your profile works anywhere your career takes you."
            />
            <CommitmentRow
              icon={TrendingUp}
              title="No advertising. No data selling. Ever."
              body="We don't embed trackers, we don't sell profile analytics to insurers, and we don't share your data with third-party recruiters without your action. If we ever introduce paid features, they'll be opt-in and clearly priced."
            />
            <CommitmentRow
              icon={Stethoscope}
              title="No patient data, no clinical advice."
              body="Nursefolio is a professional portfolio, not a medical service. You can document procedures in your logbook, but never patient identifiers. Nothing on the platform constitutes medical advice."
            />
          </div>
        </section>

        {/* ============================================
            CONTACT
            ============================================ */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white mb-6">
            Say hello
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6 max-w-3xl">
            Have feedback, a story about how Nursefolio helped your career, or a partnership
            request? We read everything.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[48px]"
            >
              Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px]"
            >
              Create your portfolio
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
const ProblemCard = React.memo<{
  icon: any;
  title: string;
  body: string;
}>(({ icon: Icon, title, body }) => (
  <div className="bg-slate-100 dark:bg-zinc-900 rounded-3xl p-5">
    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-950 flex items-center justify-center mb-4">
      <Icon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
    </div>
    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
      {title}
    </h3>
    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
      {body}
    </p>
  </div>
));
ProblemCard.displayName = 'ProblemCard';

const PrincipleCard = React.memo<{
  icon: any;
  title: string;
  body: string;
}>(({ icon: Icon, title, body }) => (
  <div className="bg-slate-100 dark:bg-zinc-900 rounded-3xl p-5">
    <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center mb-4">
      <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
    </div>
    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
      {title}
    </h3>
    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
      {body}
    </p>
  </div>
));
PrincipleCard.displayName = 'PrincipleCard';

const AudienceCard = React.memo<{
  icon: any;
  title: string;
  body: string;
}>(({ icon: Icon, title, body }) => (
  <div className="bg-slate-100 dark:bg-zinc-900 rounded-3xl p-5">
    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-950 flex items-center justify-center mb-4">
      <Icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
    </div>
    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
      {title}
    </h3>
    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
      {body}
    </p>
  </div>
));
AudienceCard.displayName = 'AudienceCard';

const CommitmentRow = React.memo<{
  icon: any;
  title: string;
  body: string;
}>(({ icon: Icon, title, body }) => (
  <div className="flex gap-4 p-5 bg-white dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-900">
    <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center flex-shrink-0">
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