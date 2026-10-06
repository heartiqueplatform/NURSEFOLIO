/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Shield, FileText, Scale, MapPin, CheckCircle2, Download,
  UserX, Building, Lock, AlertTriangle, Mail, Phone,
  ArrowUp, Clock, ExternalLink
} from 'lucide-react';

// ==========================================================
// TYPES
// ==========================================================
type LegalTab = 'privacy' | 'terms' | 'compliance';

const TABS: Array<{ id: LegalTab; label: string; shortLabel: string; icon: any }> = [
  { id: 'privacy', label: 'Privacy Policy', shortLabel: 'Privacy', icon: Shield },
  { id: 'terms', label: 'Terms of Service', shortLabel: 'Terms', icon: FileText },
  { id: 'compliance', label: 'Compliance & Kenya Regulations', shortLabel: 'Compliance', icon: Scale },
];

const LAST_UPDATED = 'May 25, 2026';
const VERSION = '1.2.0';

const CONTACT = {
  email: 'medraenursing@gmail.com',
  privacyEmail: 'brianmuthomi851@gmail.com',
  phone: '0704473503',
  office: 'Nairobi, Kenya',
  odpcEmail: 'complaints@odpc.go.ke',
};

// ==========================================================
// MAIN
// ==========================================================
export default function LegalPages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as LegalTab | null;

  const [activeTab, setActiveTab] = useState<LegalTab>(() => {
    if (tabParam === 'privacy' || tabParam === 'terms' || tabParam === 'compliance') {
      return tabParam;
    }
    return 'privacy';
  });

  // Sync tab when URL changes (e.g. from footer links)
  useEffect(() => {
    if (tabParam === 'privacy' || tabParam === 'terms' || tabParam === 'compliance') {
      setActiveTab(tabParam);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [tabParam]);

  const handleTabChange = useCallback((tab: LegalTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">

        {/* ============================================
            HEADER
            ============================================ */}
        <header className="mb-8 md:mb-12">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3">
            <Link to="/" className="active:text-teal-600 dark:active:text-teal-400 transition">
              Home
            </Link>
            <span className="text-slate-300 dark:text-zinc-700">/</span>
            <span className="text-slate-700 dark:text-slate-300">Legal</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                Legal & Privacy
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-xl">
                Our commitments on data, credentials, and how we operate in Kenya and beyond.
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-xs font-bold active:opacity-70 transition min-h-[40px] flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          </div>
        </header>

        {/* ============================================
            TAB NAVIGATION
            ============================================ */}
        <div className="sticky top-16 z-20 -mx-4 px-4 py-3 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-900 mb-8">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap flex-shrink-0 ${isActive
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 active:bg-slate-200 dark:active:bg-zinc-800'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================
            CONTENT
            ============================================ */}
        <article className="prose-custom">
          {activeTab === 'privacy' && <PrivacyPolicy />}
          {activeTab === 'terms' && <TermsOfService />}
          {activeTab === 'compliance' && <Compliance />}
        </article>

        {/* ============================================
            FOOTER — contact block
            ============================================ */}
        <footer className="mt-16 pt-8 border-t border-slate-100 dark:border-zinc-900">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Contact
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <a href={`mailto:${CONTACT.email}`} className="active:text-teal-600 dark:active:text-teal-400">
                    {CONTACT.email}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <a href={`tel:${CONTACT.phone}`} className="active:text-teal-600 dark:active:text-teal-400">
                    {CONTACT.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  {CONTACT.office}
                </li>
              </ul>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed md:text-right md:max-w-xs">
              <p className="flex items-center gap-1.5 md:justify-end text-slate-600 dark:text-slate-300 font-semibold mb-1.5">
                <Clock className="w-3.5 h-3.5" />
                Version {VERSION}
              </p>
              <p>
                Last updated {LAST_UPDATED}. We'll notify you by email when these terms materially change.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ==========================================================
// SHARED UI PRIMITIVES
// ==========================================================
const SectionTitle = React.memo<{ number: string; children: React.ReactNode }>(
  ({ number, children }) => (
    <h2 className="flex items-start gap-3 text-base md:text-lg font-display font-bold text-slate-900 dark:text-white mt-10 mb-3">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-xs font-bold flex-shrink-0 mt-0.5">
        {number}
      </span>
      <span className="leading-snug">{children}</span>
    </h2>
  )
);
SectionTitle.displayName = 'SectionTitle';

const Callout = React.memo<{
  tone: 'info' | 'warning' | 'danger' | 'success';
  icon: any;
  title: string;
  children: React.ReactNode;
}>(({ tone, icon: Icon, title, children }) => {
  const tones = {
    info: {
      bg: 'bg-slate-100 dark:bg-zinc-900',
      icon: 'text-slate-600 dark:text-slate-400',
      title: 'text-slate-900 dark:text-white',
      body: 'text-slate-700 dark:text-slate-300',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      icon: 'text-amber-600 dark:text-amber-400',
      title: 'text-amber-900 dark:text-amber-300',
      body: 'text-amber-800 dark:text-amber-400',
    },
    danger: {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      icon: 'text-rose-600 dark:text-rose-400',
      title: 'text-rose-900 dark:text-rose-300',
      body: 'text-rose-800 dark:text-rose-400',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      icon: 'text-emerald-600 dark:text-emerald-400',
      title: 'text-emerald-900 dark:text-emerald-300',
      body: 'text-emerald-800 dark:text-emerald-400',
    },
  };
  const t = tones[tone];

  return (
    <div className={`rounded-2xl p-4 md:p-5 my-5 ${t.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${t.icon}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${t.title}`}>{title}</p>
          <div className={`text-sm leading-relaxed mt-1.5 ${t.body}`}>{children}</div>
        </div>
      </div>
    </div>
  );
});
Callout.displayName = 'Callout';

const Bullet = React.memo<{ children: React.ReactNode }>(({ children }) => (
  <li className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
    <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
    <span>{children}</span>
  </li>
));
Bullet.displayName = 'Bullet';

const Paragraph = React.memo<{ children: React.ReactNode }>(({ children }) => (
  <p className="text-sm md:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
    {children}
  </p>
));
Paragraph.displayName = 'Paragraph';

const List = React.memo<{ children: React.ReactNode }>(({ children }) => (
  <ul className="space-y-2.5 my-3">{children}</ul>
));
List.displayName = 'List';

// ==========================================================
// PRIVACY POLICY
// ==========================================================
function PrivacyPolicy() {
  return (
    <>
      <header className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-xs font-bold">
          <Shield className="w-3.5 h-3.5" />
          Kenya DPA 2019 & GDPR aligned
        </span>
        <h2 className="text-xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white mt-4">
          Privacy Policy
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          How we handle your data as a Nursefolio member.
        </p>
      </header>

      <Paragraph>
        Nursefolio is a professional portfolio service for nurses and nursing students. This policy
        explains what data we collect, why we collect it, and the controls you have over it. It
        applies to everyone with a Nursefolio account and to visitors of public profiles.
      </Paragraph>

      <Paragraph>
        We process personal data under the <strong className="text-slate-900 dark:text-white">Kenya Data Protection Act, 2019</strong>,
        and in line with the <strong className="text-slate-900 dark:text-white">EU GDPR</strong> where
        it applies. Our lawful basis for processing is your <strong className="text-slate-900 dark:text-white">explicit consent</strong>,
        which you give when creating an account and when submitting credentials for verification.
      </Paragraph>

      {/* 1 */}
      <SectionTitle number="1">What we collect and why</SectionTitle>
      <Paragraph>
        We collect only what's needed to run a professional portfolio. This breaks down into four categories:
      </Paragraph>
      <List>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Account details</strong> — name, email address,
          username, password (hashed, never stored in plain text). Used to sign you in and identify your account.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Professional records</strong> — work history,
          education, certifications, publications, and skills that you choose to add. Used to build your
          public portfolio and CV.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Verification items</strong> — your Nursing
          Council of Kenya (NCK) license number, and where applicable, supporting documents. Used exclusively
          to verify your credentials. Never shown publicly in full.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Usage data</strong> — profile view counts,
          CV download counts, and search impressions (only aggregated counts, not who viewed you).
          Used to show you how your profile is performing.
        </Bullet>
      </List>

      <Callout tone="info" icon={Lock} title="What we don't collect">
        We don't collect patient data, we don't read your clinical logbook entries for any purpose other
        than displaying them to you, and we don't sell or rent your data to insurers, advertisers, or
        third-party recruiters. Ever.
      </Callout>

      {/* 2 */}
      <SectionTitle number="2">How your data is stored and protected</SectionTitle>
      <List>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Access controls</strong> — every table in
          our database enforces row-level security. Your records are readable and writable only by you.
          No other user and no external viewer can access them.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Encrypted transport</strong> — all traffic
          between your device and our servers runs over TLS. Passwords are stored using industry-standard
          hashing.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Isolated file storage</strong> — uploaded
          documents (CVs, license copies) sit in access-restricted storage buckets. They're reachable only
          by the account that uploaded them and, during review, by our verification team.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">No third-party analytics</strong> — we don't
          embed Google Analytics, Facebook Pixel, or any tracker that follows you across other sites.
        </Bullet>
      </List>

      {/* 3 */}
      <SectionTitle number="3">Your rights</SectionTitle>
      <Paragraph>
        Under the Kenya DPA (2019), Chapter IV, you have the following rights. These aren't aspirational —
        they're enforceable, and our tools support every one of them:
      </Paragraph>
      <List>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Right to be informed</strong> — you know what
          we collect and why, from this page.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Right to access</strong> — request a copy of
          everything we hold about you. Email {CONTACT.privacyEmail}.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Right to correction</strong> — edit any
          information yourself in Dashboard → Edit Profile.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Right to erasure</strong> — delete your entire
          account and all data yourself in Dashboard → Settings → Danger Zone. No email ticket required.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Right to object</strong> — you can request we
          stop specific processing. Email us.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Right to portability</strong> — export your
          profile and records. Email us and we'll send you the data.
        </Bullet>
      </List>

      <Callout tone="danger" icon={UserX} title="Right of erasure in practice">
        The Kenya DPA (2019) Sec 26 and the EU GDPR Art 17 grant you the right to have your data erased.
        Nursefolio implements this as a self-service feature, not a support request. When you delete your
        account, your profile, certifications, work history, uploaded files, and clinical logbook entries
        are permanently removed from our production systems within 30 days.
      </Callout>

      {/* 4 */}
      <SectionTitle number="4">Third parties we work with</SectionTitle>
      <Paragraph>
        We use a small number of infrastructure partners to run Nursefolio. Each is bound by contract to
        process data only on our behalf:
      </Paragraph>
      <List>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Supabase</strong> — authentication and
          database hosting. Data is stored in their managed PostgreSQL infrastructure with row-level
          security enabled.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Cloudinary</strong> — image hosting for
          profile photos and cover images. Only images you upload are stored here.
        </Bullet>
      </List>

      {/* 5 */}
      <SectionTitle number="5">Data retention</SectionTitle>
      <Paragraph>
        Active account data is retained for as long as your account exists. When you delete your account,
        your data is queued for permanent removal, which completes within 30 days. Backup snapshots may
        retain data for up to 90 days before rolling off.
      </Paragraph>
      <Paragraph>
        Verification records (license numbers and any submitted documents) are retained for as long as your
        account is active, so the verified badge stays valid. On deletion, they're removed on the same
        30-day schedule.
      </Paragraph>

      {/* 6 */}
      <SectionTitle number="6">Children and minors</SectionTitle>
      <Paragraph>
        Nursefolio is intended for nursing students and practicing nurses, aged 18 and above. We do not
        knowingly collect data from anyone under 18. If you believe a minor has created an account,
        contact us and we'll remove it.
      </Paragraph>

      {/* 7 */}
      <SectionTitle number="7">Changes to this policy</SectionTitle>
      <Paragraph>
        We'll update this page whenever our practices change. For material changes — new categories of
        data, new third parties — we'll notify you by email before the change takes effect. The version
        number and last-updated date sit at the bottom of every page.
      </Paragraph>

      {/* 8 */}
      <SectionTitle number="8">Contact</SectionTitle>
      <Paragraph>
        Data protection questions, requests, or complaints should go to our designated privacy contact:
      </Paragraph>
      <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-4 md:p-5 my-4">
        <div className="flex items-start gap-3">
          <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <p className="font-bold text-slate-900 dark:text-white mb-1">Privacy contact</p>
            <p>Email: <a href={`mailto:${CONTACT.privacyEmail}`} className="text-teal-600 dark:text-teal-400 font-semibold">{CONTACT.privacyEmail}</a></p>
            <p>Office: {CONTACT.office}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800 leading-relaxed">
          If we don't resolve your concern, you can escalate to the Office of the Data Protection
          Commissioner (ODPC) at <a href={`mailto:${CONTACT.odpcEmail}`} className="text-teal-600 dark:text-teal-400 font-semibold">{CONTACT.odpcEmail}</a>.
        </p>
      </div>
    </>
  );
}

// ==========================================================
// TERMS OF SERVICE
// ==========================================================
function TermsOfService() {
  return (
    <>
      <header className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-xs font-bold">
          <FileText className="w-3.5 h-3.5" />
          User agreement
        </span>
        <h2 className="text-xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white mt-4">
          Terms of Service
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          The rules of using Nursefolio.
        </p>
      </header>

      <Paragraph>
        By creating a Nursefolio account, you agree to these terms. If you don't agree, please don't
        use the service. These terms cover your use of Nursefolio, the content you post, and the
        limits of what we're responsible for.
      </Paragraph>

      {/* 1 */}
      <SectionTitle number="1">Who can use Nursefolio</SectionTitle>
      <Paragraph>
        Nursefolio is intended for:
      </Paragraph>
      <List>
        <Bullet>Registered nurses and other licensed healthcare practitioners</Bullet>
        <Bullet>Nursing students enrolled in accredited programs</Bullet>
        <Bullet>Hospitals, clinics, and locum coordinators seeking qualified nurses</Bullet>
      </List>
      <Paragraph>
        You must be 18 or older to create an account. If you're a student under 18, please use Nursefolio
        through your institution.
      </Paragraph>

      {/* 2 */}
      <SectionTitle number="2">Your account and your credentials</SectionTitle>
      <Paragraph>
        You're responsible for the accuracy of everything you publish on Nursefolio, especially:
      </Paragraph>
      <List>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">License claims.</strong> If you say you're
          an RN, a KRCHN, or a student nurse, that must be true. We verify against the Nursing Council
          of Kenya (NCK) register, and false claims result in immediate account termination.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Certification records.</strong> Certifications
          you list (ACLS, BLS, PALS, etc.) must be current and yours.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Work history.</strong> The hospitals,
          facilities, and roles you claim must reflect your real work.
        </Bullet>
      </List>

      <Callout tone="danger" icon={AlertTriangle} title="Fraudulent credentials">
        Claiming a nursing credential you don't hold — whether to get hired, to attract students, or
        for any other reason — is a serious matter. Nursefolio will:
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Immediately terminate the account and remove all content</li>
          <li>Report the incident to the Nursing Council of Kenya</li>
          <li>Cooperate with any law enforcement inquiry that follows</li>
        </ul>
      </Callout>

      {/* 3 */}
      <SectionTitle number="3">No medical advice or patient data</SectionTitle>

      <Callout tone="warning" icon={AlertTriangle} title="Nursefolio is not a medical service">
        <p>
          Nursefolio is a portfolio and CV hosting platform. It does not provide healthcare, clinical
          advice, diagnostic decisions, or patient triage. Nothing you read on a nurse's profile should
          be construed as medical advice.
        </p>
        <p className="mt-3">
          <strong>You may not upload patient data.</strong> This includes patient names, initials,
          photos, hospital file numbers, medical charts, HIPAA-protected records, or any other patient
          identifiers — even partially anonymized. This prohibition applies to your profile, your
          clinical logbook entries, endorsement messages, and every other part of Nursefolio.
        </p>
      </Callout>

      {/* 4 */}
      <SectionTitle number="4">Content you post</SectionTitle>
      <Paragraph>
        You retain ownership of the content you post on Nursefolio. By posting it, you grant us the
        licence needed to display it (on your profile, in search results, and in the CV we generate
        for you).
      </Paragraph>
      <Paragraph>
        You may not post content that is:
      </Paragraph>
      <List>
        <Bullet>False or misleading, especially about credentials</Bullet>
        <Bullet>Harassing, abusive, or defamatory</Bullet>
        <Bullet>Sexually explicit, violent, or otherwise unprofessional</Bullet>
        <Bullet>Infringing on someone else's intellectual property</Bullet>
        <Bullet>Spam, advertising, or promotional content unrelated to nursing practice</Bullet>
      </List>
      <Paragraph>
        We reserve the right to remove content that violates these rules, and to suspend accounts that
        repeatedly do so.
      </Paragraph>

      {/* 5 */}
      <SectionTitle number="5">Pricing</SectionTitle>
      <Paragraph>
        Nursefolio is free to use for a standard profile: portfolio hosting, credential listing, work
        and education history, and access to the Explore and Locum boards.
      </Paragraph>
      <Paragraph>
        Optional paid features — priority verification review, additional portfolio themes, advanced
        analytics — are described on the Pricing page. Any paid feature requires clear opt-in before
        you're charged.
      </Paragraph>

      {/* 6 */}
      <SectionTitle number="6">Service availability</SectionTitle>
      <Paragraph>
        We aim for high uptime but don't guarantee uninterrupted service. Occasional maintenance
        windows, upstream outages, or infrastructure incidents may cause temporary unavailability.
      </Paragraph>
      <Paragraph>
        We provide Nursefolio "as is". We don't warrant that any individual feature will always work,
        or that the service will meet your specific requirements.
      </Paragraph>

      {/* 7 */}
      <SectionTitle number="7">Account suspension and termination</SectionTitle>
      <Paragraph>
        You can delete your account at any time from Dashboard → Settings. No support ticket required.
      </Paragraph>
      <Paragraph>
        We may suspend or terminate your account if you:
      </Paragraph>
      <List>
        <Bullet>Violate these terms, particularly the credential claims section</Bullet>
        <Bullet>Attempt to compromise the service, other accounts, or our infrastructure</Bullet>
        <Bullet>Post prohibited content and fail to remove it when asked</Bullet>
      </List>

      {/* 8 */}
      <SectionTitle number="8">Limitation of liability</SectionTitle>
      <Paragraph>
        To the extent permitted by law, Nursefolio is not liable for indirect, incidental, or
        consequential losses arising from your use of the service. This includes losses from
        missed employment opportunities, verification delays, or third-party actions.
      </Paragraph>
      <Paragraph>
        Our total liability in any twelve-month period is limited to the amount you paid us during
        that period. For free accounts, that's zero.
      </Paragraph>

      {/* 9 */}
      <SectionTitle number="9">Governing law</SectionTitle>
      <Paragraph>
        These terms are governed by the laws of Kenya. Any dispute is subject to the exclusive
        jurisdiction of the courts of Nairobi, Kenya.
      </Paragraph>

      {/* 10 */}
      <SectionTitle number="10">Changes to these terms</SectionTitle>
      <Paragraph>
        We may update these terms from time to time. Material changes will be announced by email
        before they take effect. Continuing to use Nursefolio after an update means you accept the
        new terms.
      </Paragraph>
    </>
  );
}

// ==========================================================
// COMPLIANCE
// ==========================================================
function Compliance() {
  return (
    <>
      <header className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-xs font-bold">
          <Scale className="w-3.5 h-3.5" />
          Kenya & African Union frameworks
        </span>
        <h2 className="text-xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white mt-4">
          Regulatory Compliance
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          How Nursefolio works with Kenyan and international healthcare regulation.
        </p>
      </header>

      <Paragraph>
        Nursefolio serves nurses across Kenya and the East African corridor. This page documents the
        regulatory frameworks we operate under and the bodies we align with — useful for users, for
        institutional partners, and for app store reviewers.
      </Paragraph>

      {/* Section A — Kenya regulations */}
      <SectionTitle number="A">Kenyan regulatory alignment</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        <RegulatoryCard
          title="Kenya Data Protection Act, 2019"
          body="Full compliance with the DPA framework for lawful processing, consent, and rights of data subjects."
        />
        <RegulatoryCard
          title="Nursing Council of Kenya (NCK)"
          body="Verification of RN, KRCHN, and student nurse credentials against the official NCK register."
        />
        <RegulatoryCard
          title="Office of the Data Protection Commissioner (ODPC)"
          body="Registered data controller. Verifiable complaint escalation path for users."
        />
        <RegulatoryCard
          title="Kenya Health Professions Oversight Authority"
          body="Alignment with KHPOA standards for health professional credentials and practice compliance."
        />
      </div>

      <Callout tone="info" icon={Lock} title="Kenya Digital Health Act (2023)">
        Nursefolio collects professional records only with the explicit consent of the individual nurse.
        We do not aggregate, sell, or share workforce statistics without authorization. Attempting to
        leak, compromise, or register unauthorized healthcare workforce data is prohibited on this
        platform and enforced under Kenyan law.
      </Callout>

      {/* Section B — App store compliance */}
      <SectionTitle number="B">App Store and Play Store compliance</SectionTitle>
      <Paragraph>
        Nursefolio is distributed through web and native mobile apps. The following items are
        configured to conform with Apple Developer Guidelines and Google Play policies:
      </Paragraph>

      <div className="space-y-3 my-4">
        <ComplianceItem
          code="5.1.1(a)(i)"
          title="Data collection disclosure"
          body="Every data field we collect has a corresponding purpose explained during signup and in the Privacy Policy. No silent background scraping or hidden tracker processes."
        />
        <ComplianceItem
          code="5.1.1(b)(ii)"
          title="Self-service account deletion"
          body="Users can delete their account entirely from Dashboard → Settings, without contacting support. App store guidelines require this in-app; Nursefolio complies."
        />
        <ComplianceItem
          code="5.1.1(b)(vii)"
          title="Professional verification"
          body="Licensed practitioner status is verified against the NCK register by our admin team. New accounts default to unverified and cannot display a verification badge until approved."
        />
        <ComplianceItem
          code="Play Store"
          title="Data Safety declaration"
          body="Nursefolio's Data Safety declaration matches the Privacy Policy exactly. Data categories, purposes, and sharing practices are consistent across both."
        />
      </div>

      {/* Section C — GDPR */}
      <SectionTitle number="C">International alignment (EU GDPR)</SectionTitle>
      <Paragraph>
        Users accessing Nursefolio from the European Union receive the same protections as Kenyan
        users, plus specific GDPR rights where they apply:
      </Paragraph>
      <List>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Lawful basis:</strong> Explicit consent
          for all processing, with the ability to withdraw consent at any time by deleting your account.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Data minimisation:</strong> We collect
          only what's necessary to provide the service, and retain it only as long as needed.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">Right to lodge a complaint:</strong> EU
          users may escalate concerns to their national data protection authority. Kenyan users may
          escalate to the ODPC.
        </Bullet>
        <Bullet>
          <strong className="text-slate-900 dark:text-white">International transfers:</strong> Data
          is stored in Supabase infrastructure which uses EU or US regions. Standard contractual
          clauses are in place with all sub-processors.
        </Bullet>
      </List>

      {/* Section D — Contact */}
      <SectionTitle number="D">Regulatory contact</SectionTitle>
      <Paragraph>
        Regulatory bodies, institutional partners, or users with compliance concerns should reach
        our designated contact:
      </Paragraph>

      <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-4 md:p-5 my-4 space-y-3">
        <div className="flex items-start gap-3">
          <Building className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-white">Nursefolio Compliance</p>
            <p>Office: {CONTACT.office}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-white">General enquiries</p>
            <a href={`mailto:${CONTACT.email}`} className="text-teal-600 dark:text-teal-400 font-semibold">
              {CONTACT.email}
            </a>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ExternalLink className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-white">ODPC escalation</p>
            <a href={`mailto:${CONTACT.odpcEmail}`} className="text-teal-600 dark:text-teal-400 font-semibold">
              {CONTACT.odpcEmail}
            </a>
          </div>
        </div>
      </div>

      <Callout tone="success" icon={CheckCircle2} title="Last reviewed">
        This compliance page was last reviewed against current Kenyan regulation and app store
        guidelines on {LAST_UPDATED}. We re-review quarterly.
      </Callout>
    </>
  );
}

// ==========================================================
// SUBCOMPONENTS
// ==========================================================
const RegulatoryCard = React.memo<{ title: string; body: string }>(({ title, body }) => (
  <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-4">
    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
      {title}
    </h3>
    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
      {body}
    </p>
  </div>
));
RegulatoryCard.displayName = 'RegulatoryCard';

const ComplianceItem = React.memo<{ code: string; title: string; body: string }>(
  ({ code, title, body }) => (
    <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-mono font-bold bg-white dark:bg-zinc-950 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
          {code}
        </span>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        {body}
      </p>
    </div>
  )
);
ComplianceItem.displayName = 'ComplianceItem';