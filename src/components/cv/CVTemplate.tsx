/**
 * CVTemplate.tsx
 *
 * The A4 CV as a @react-pdf/renderer Document.
 *
 * Turn F changes:
 * - Header now renders a dedicated contact line (phone + WhatsApp) below
 *   the meta line (location · KNC · exp). Two rows because they answer
 *   different questions.
 * - New Work Preferences section, rendered in the left column under
 *   Languages. Shows shift preference, relocation, locum availability.
 * - No layout regressions: all existing sections unchanged.
 */

import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
} from '@react-pdf/renderer';
import type { CVBundle } from '../../services/cvBuilder';
import {
    orderedVisibleSections,
    type CVPreferences,
} from '../../hooks/useCVPreferences';
import type { CVSectionId } from '../../lib/cvSections';

const styles = StyleSheet.create({
    page: {
        backgroundColor: '#ffffff',
        color: '#18181b',
        paddingTop: 14,
        paddingBottom: 14,
        paddingLeft: 14,
        paddingRight: 14,
        fontFamily: 'Helvetica',
        fontSize: 9.5,
        lineHeight: 1.35,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
        borderBottomWidth: 0.3,
        borderBottomColor: '#d4d4d8',
        marginBottom: 8,
    },
    photoWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        overflow: 'hidden',
        marginRight: 8,
        backgroundColor: '#f4f4f5',
    },
    photoImg: { width: 26, height: 26, objectFit: 'cover' },
    photoEmpty: {
        width: 26,
        height: 26,
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a1a1aa',
        fontSize: 7,
    },
    headerText: { flex: 1 },
    name: {
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: -0.2,
        color: '#18181b',
        lineHeight: 1.15,
    },
    title: { fontSize: 10.5, color: '#3f3f46', marginTop: 2 },
    meta: { fontSize: 9, color: '#71717a', marginTop: 1.5 },
    contact: { fontSize: 9, color: '#3f3f46', marginTop: 1.5, fontWeight: 500 },
    body: { flexDirection: 'row', gap: 6 },
    leftCol: { width: 55, flexDirection: 'column', gap: 4 },
    rightCol: { flex: 1, flexDirection: 'column', gap: 4 },
    section: { marginBottom: 0 },
    sectionTitle: {
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        color: '#3f3f46',
        borderBottomWidth: 0.3,
        borderBottomColor: '#e4e4e7',
        paddingBottom: 2,
        marginBottom: 3,
    },
    para: { fontSize: 9.5, color: '#27272a', lineHeight: 1.4 },
    bullet: { flexDirection: 'row', marginBottom: 1.5 },
    bulletDot: { width: 6, color: '#a1a1aa' },
    bulletText: { flex: 1, fontSize: 9.5, color: '#27272a' },
    entry: { marginBottom: 5 },
    entryHeader: { fontSize: 9.5, fontWeight: 700, color: '#18181b' },
    entryDates: { fontSize: 8.5, color: '#71717a', marginTop: 1 },
    entryBody: { fontSize: 9, color: '#3f3f46', marginTop: 2, lineHeight: 1.4 },
    quote: { fontSize: 9, fontStyle: 'italic', color: '#3f3f46', lineHeight: 1.4 },
    attribution: { fontSize: 8.5, color: '#71717a', marginTop: 1.5 },
    license: {
        position: 'absolute',
        bottom: 8,
        left: 14,
        right: 14,
        fontSize: 8,
        color: '#a1a1aa',
        textAlign: 'center',
    },
    inlineList: {
        fontSize: 9.5,
        color: '#27272a',
        lineHeight: 1.45,
    },
    referee: { marginBottom: 4 },
    refereeName: { fontSize: 9.5, fontWeight: 700, color: '#18181b' },
    refereeLine: { fontSize: 8.5, color: '#52525b', marginTop: 0.5 },
    refereeContact: { fontSize: 8.5, color: '#71717a', marginTop: 0.5 },
    prefRow: { flexDirection: 'row', marginBottom: 2 },
    prefLabel: { width: 42, fontSize: 8.5, color: '#71717a' },
    prefValue: { flex: 1, fontSize: 9, color: '#27272a' },
});

interface Props {
    bundle: CVBundle;
    prefs: CVPreferences;
}

export function CVTemplate({ bundle, prefs }: Props) {
    const { document: doc, header, profile } = bundle;

    const leftSections = orderedVisibleSections(prefs, 'left');
    const rightSections = orderedVisibleSections(prefs, 'right');

    return (
        <Document
            title={`${header.name} — CV`}
            author={header.name}
            creator="Nursefolio"
            producer="Nursefolio"
        >
            <Page size="A4" style={styles.page} wrap>
                <View style={styles.header} wrap={false}>
                    {prefs.showPhoto && (
                        <View style={styles.photoWrap}>
                            {profile.avatar_url ? (
                                <Image src={profile.avatar_url} style={styles.photoImg} />
                            ) : (
                                <View style={styles.photoEmpty}>
                                    <Text>PHOTO</Text>
                                </View>
                            )}
                        </View>
                    )}
                    <View style={styles.headerText}>
                        <Text style={styles.name}>{header.name}</Text>
                        <Text style={styles.title}>{header.title}</Text>
                        {!!header.meta && <Text style={styles.meta}>{header.meta}</Text>}
                        {!!header.contact && <Text style={styles.contact}>{header.contact}</Text>}
                    </View>
                </View>

                <View style={styles.body}>
                    <View style={styles.leftCol}>
                        {leftSections.map((id) => (
                            <Section key={id} id={id} doc={doc} />
                        ))}
                    </View>
                    <View style={styles.rightCol}>
                        {rightSections.map((id) => (
                            <Section key={id} id={id} doc={doc} />
                        ))}
                    </View>
                </View>

                {!!doc.licenseNote && (
                    <Text style={styles.license} fixed>
                        {doc.licenseNote}
                    </Text>
                )}
            </Page>
        </Document>
    );
}

// ---------------------------------------------------------------------------
// Section dispatcher
// ---------------------------------------------------------------------------

interface SectionProps {
    id: CVSectionId;
    doc: CVBundle['document'];
}

function Section({ id, doc }: SectionProps) {
    switch (id) {
        case 'summary':
            if (!doc.summary) return null;
            return (
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>Professional Summary</Text>
                    <Text style={styles.para}>{doc.summary}</Text>
                </View>
            );

        case 'skills':
            if (!doc.skills.length) return null;
            return (
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>Core Skills</Text>
                    {doc.skills.map((s) => (
                        <View key={s} style={styles.bullet}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>{s}</Text>
                        </View>
                    ))}
                </View>
            );

        case 'competencies':
            if (!doc.competencies.length) return null;
            return (
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>Clinical Competencies</Text>
                    {doc.competencies.map((c) => (
                        <View key={c.name} style={styles.bullet}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>{c.text}</Text>
                        </View>
                    ))}
                </View>
            );

        case 'certifications':
            if (!doc.certifications.length) return null;
            return (
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>Certifications</Text>
                    {doc.certifications.map((c) => (
                        <View key={c.text} style={styles.bullet}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>{c.text}</Text>
                        </View>
                    ))}
                </View>
            );

        case 'languages':
            if (!doc.languages.length) return null;
            return (
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>Languages</Text>
                    <Text style={styles.para}>{doc.languages.join('  •  ')}</Text>
                </View>
            );

        case 'work_preferences': {
            const wp = doc.workPreferences;
            const hasAny = Boolean(wp.shift || wp.relocation || wp.locum);
            if (!hasAny) return null;
            return (
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>Work Preferences</Text>
                    {!!wp.shift && (
                        <View style={styles.prefRow}>
                            <Text style={styles.prefLabel}>Shift</Text>
                            <Text style={styles.prefValue}>{wp.shift}</Text>
                        </View>
                    )}
                    {!!wp.relocation && (
                        <View style={styles.prefRow}>
                            <Text style={styles.prefLabel}>Location</Text>
                            <Text style={styles.prefValue}>{wp.relocation}</Text>
                        </View>
                    )}
                    {!!wp.locum && (
                        <View style={styles.prefRow}>
                            <Text style={styles.prefLabel}>Locum</Text>
                            <Text style={styles.prefValue}>{wp.locum}</Text>
                        </View>
                    )}
                </View>
            );
        }

        case 'experience':
            if (!doc.experiences.length) return null;
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Experience</Text>
                    {doc.experiences.map((e, i) => (
                        <View key={i} style={styles.entry} wrap={false}>
                            <Text style={styles.entryHeader}>{e.header}</Text>
                            <Text style={styles.entryDates}>
                                {[e.dates, e.location].filter(Boolean).join('  ·  ')}
                            </Text>
                            {!!e.body && <Text style={styles.entryBody}>{e.body}</Text>}
                        </View>
                    ))}
                </View>
            );

        case 'leadership':
            if (!doc.leadership.length) return null;
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Leadership & Development</Text>
                    {doc.leadership.map((l, i) => (
                        <View key={i} style={styles.entry} wrap={false}>
                            <Text style={styles.entryHeader}>{l.header}</Text>
                            {!!l.dates && <Text style={styles.entryDates}>{l.dates}</Text>}
                            {!!l.body && <Text style={styles.entryBody}>{l.body}</Text>}
                        </View>
                    ))}
                </View>
            );

        case 'education':
            if (!doc.education.length) return null;
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Education</Text>
                    {doc.education.map((e, i) => (
                        <View key={i} style={styles.entry} wrap={false}>
                            <Text style={styles.entryHeader}>{e.header}</Text>
                            <Text style={styles.entryDates}>{e.dates}</Text>
                            {!!e.description && (
                                <Text style={styles.entryBody}>{e.description}</Text>
                            )}
                        </View>
                    ))}
                </View>
            );

        case 'endorsements':
            if (!doc.endorsements.length) return null;
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Endorsements</Text>
                    {doc.endorsements.map((e, i) => (
                        <View key={i} style={styles.entry} wrap={false}>
                            <Text style={styles.quote}>{e.quote}</Text>
                            <Text style={styles.attribution}>{e.attribution}</Text>
                        </View>
                    ))}
                </View>
            );

        case 'strengths':
            if (!doc.strengths.length) return null;
            return (
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>Professional Strengths</Text>
                    <Text style={styles.inlineList}>
                        {doc.strengths.join('  •  ')}
                    </Text>
                </View>
            );

        case 'interests':
            if (!doc.interests.length) return null;
            return (
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>Interests</Text>
                    <Text style={styles.inlineList}>
                        {doc.interests.join('  •  ')}
                    </Text>
                </View>
            );

        case 'awards':
            if (!doc.awards.length) return null;
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Awards & Honors</Text>
                    {doc.awards.map((a, i) => (
                        <View key={i} style={styles.entry} wrap={false}>
                            <Text style={styles.entryHeader}>{a.header}</Text>
                            {!!a.date && <Text style={styles.entryDates}>{a.date}</Text>}
                            {!!a.body && <Text style={styles.entryBody}>{a.body}</Text>}
                        </View>
                    ))}
                </View>
            );

        case 'referees':
            if (!doc.referees.length) return null;
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Referees</Text>
                    {doc.referees.map((r, i) => (
                        <View key={i} style={styles.referee} wrap={false}>
                            <Text style={styles.refereeName}>{r.name}</Text>
                            {!!r.line && <Text style={styles.refereeLine}>{r.line}</Text>}
                            {!!r.contact && <Text style={styles.refereeContact}>{r.contact}</Text>}
                        </View>
                    ))}
                </View>
            );

        case 'availability':
            if (!doc.availability) return null;
            return (
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>Availability</Text>
                    <Text style={styles.para}>{doc.availability}</Text>
                </View>
            );

        default:
            return null;
    }
}