/**
 * CVPrintFallback.tsx
 *
 * HTML rendering of the CV. Used in two places:
 *
 * 1. Browser print (Cmd+P / Share > Print on iOS). Browsers print HTML,
 *    not PDF-in-an-iframe reliably. This component renders the CV as
 *    semantic HTML with a dedicated print stylesheet so what comes out
 *    of the printer is the same A4 document the PDF produces.
 *
 * 2. PDFViewer failure. If @react-pdf/renderer throws or fails to load,
 *    we swap to this so the user still sees their CV. Degrade, never blank.
 *
 * Turn G changes:
 * - Header renders the new contact line (phone + WhatsApp) below the meta
 *   line — same shape as CVTemplate.tsx.
 * - New Work Preferences section: shift, relocation, locum.
 *
 * WHY HTML mirrors the PDF exactly:
 * The layout spec (Step 1) is a fixed grid. Both this HTML version and the
 * PDF version express the same grid. If we change one, we change both —
 * the print CSS in cvPrint.css is the contract between them.
 */

import type { CVBundle } from '../../services/cvBuilder';
import {
    orderedVisibleSections,
    type CVPreferences,
} from '../../hooks/useCVPreferences';
import { sectionMeta, type CVSectionId } from '../../lib/cvSections';

interface Props {
    bundle: CVBundle;
    prefs: CVPreferences;
}

export function CVPrintFallback({ bundle, prefs }: Props) {
    const { document: doc, header, profile } = bundle;

    const leftSections = orderedVisibleSections(prefs, 'left');
    const rightSections = orderedVisibleSections(prefs, 'right');

    return (
        <article className="cv-print" aria-label={`${header.name} CV`}>
            <header className="cv-print__header">
                {prefs.showPhoto && profile.avatar_url && (
                    <img
                        src={profile.avatar_url}
                        alt=""
                        className="cv-print__photo"
                    />
                )}
                <div className="cv-print__identity">
                    <h1 className="cv-print__name">{header.name}</h1>
                    <p className="cv-print__title">{header.title}</p>
                    {header.meta && <p className="cv-print__meta">{header.meta}</p>}
                    {header.contact && (
                        <p className="cv-print__contact">{header.contact}</p>
                    )}
                </div>
            </header>

            <div className="cv-print__body">
                <aside className="cv-print__col cv-print__col--left">
                    {leftSections.map((id) => (
                        <SectionPrint key={id} id={id} doc={doc} />
                    ))}
                </aside>
                <main className="cv-print__col cv-print__col--right">
                    {rightSections.map((id) => (
                        <SectionPrint key={id} id={id} doc={doc} />
                    ))}
                </main>
            </div>

            {doc.licenseNote && (
                <footer className="cv-print__license">{doc.licenseNote}</footer>
            )}
        </article>
    );
}

// ---------------------------------------------------------------------------

interface SectionPrintProps {
    id: CVSectionId;
    doc: CVBundle['document'];
}

function SectionPrint({ id, doc }: SectionPrintProps) {
    const meta = sectionMeta(id);
    const title = <h2 className="cv-print__heading">{meta.label}</h2>;

    switch (id) {
        case 'summary':
            if (!doc.summary) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    <p>{doc.summary}</p>
                </section>
            );

        case 'skills':
            if (!doc.skills.length) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    <ul>
                        {doc.skills.map((s) => (
                            <li key={s}>{s}</li>
                        ))}
                    </ul>
                </section>
            );

        case 'competencies':
            if (!doc.competencies.length) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    <ul>
                        {doc.competencies.map((c) => (
                            <li key={c.name}>{c.text}</li>
                        ))}
                    </ul>
                </section>
            );

        case 'certifications':
            if (!doc.certifications.length) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    <ul>
                        {doc.certifications.map((c) => (
                            <li key={c.text}>{c.text}</li>
                        ))}
                    </ul>
                </section>
            );

        case 'languages':
            if (!doc.languages.length) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    <p>{doc.languages.join('  •  ')}</p>
                </section>
            );

        case 'work_preferences': {
            const wp = doc.workPreferences;
            const hasAny = Boolean(wp.shift || wp.relocation || wp.locum);
            if (!hasAny) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    <dl className="cv-print__prefs">
                        {wp.shift && (
                            <>
                                <dt>Shift</dt>
                                <dd>{wp.shift}</dd>
                            </>
                        )}
                        {wp.relocation && (
                            <>
                                <dt>Location</dt>
                                <dd>{wp.relocation}</dd>
                            </>
                        )}
                        {wp.locum && (
                            <>
                                <dt>Locum</dt>
                                <dd>{wp.locum}</dd>
                            </>
                        )}
                    </dl>
                </section>
            );
        }

        case 'experience':
            if (!doc.experiences.length) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    {doc.experiences.map((e, i) => (
                        <div key={i} className="cv-print__entry">
                            <p className="cv-print__entry-header">{e.header}</p>
                            <p className="cv-print__entry-dates">
                                {[e.dates, e.location].filter(Boolean).join('  ·  ')}
                            </p>
                            {e.body && <p>{e.body}</p>}
                        </div>
                    ))}
                </section>
            );

        case 'leadership':
            if (!doc.leadership.length) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    {doc.leadership.map((l, i) => (
                        <div key={i} className="cv-print__entry">
                            <p className="cv-print__entry-header">{l.header}</p>
                            {l.dates && <p className="cv-print__entry-dates">{l.dates}</p>}
                            {l.body && <p>{l.body}</p>}
                        </div>
                    ))}
                </section>
            );

        case 'education':
            if (!doc.education.length) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    {doc.education.map((e, i) => (
                        <div key={i} className="cv-print__entry">
                            <p className="cv-print__entry-header">{e.header}</p>
                            <p className="cv-print__entry-dates">{e.dates}</p>
                            {e.description && <p>{e.description}</p>}
                        </div>
                    ))}
                </section>
            );

        case 'endorsements':
            if (!doc.endorsements.length) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    {doc.endorsements.map((e, i) => (
                        <div key={i} className="cv-print__entry">
                            <p className="cv-print__quote">{e.quote}</p>
                            <p className="cv-print__entry-dates">{e.attribution}</p>
                        </div>
                    ))}
                </section>
            );

        case 'strengths':
            if (!doc.strengths.length) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    <p className="cv-print__inline-list">
                        {doc.strengths.join('  •  ')}
                    </p>
                </section>
            );

        case 'interests':
            if (!doc.interests.length) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    <p className="cv-print__inline-list">
                        {doc.interests.join('  •  ')}
                    </p>
                </section>
            );

        case 'awards':
            if (!doc.awards.length) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    {doc.awards.map((a, i) => (
                        <div key={i} className="cv-print__entry">
                            <p className="cv-print__entry-header">{a.header}</p>
                            {a.date && <p className="cv-print__entry-dates">{a.date}</p>}
                            {a.body && <p>{a.body}</p>}
                        </div>
                    ))}
                </section>
            );

        case 'referees':
            if (!doc.referees.length) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    {doc.referees.map((r, i) => (
                        <div key={i} className="cv-print__referee">
                            <p className="cv-print__referee-name">{r.name}</p>
                            {r.line && <p className="cv-print__referee-line">{r.line}</p>}
                            {r.contact && <p className="cv-print__referee-contact">{r.contact}</p>}
                        </div>
                    ))}
                </section>
            );

        case 'availability':
            if (!doc.availability) return null;
            return (
                <section className="cv-print__section">
                    {title}
                    <p>{doc.availability}</p>
                </section>
            );

        default:
            return null;
    }
}