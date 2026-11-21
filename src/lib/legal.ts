import type { AuditIssue, IssueCategory, Place, PlaceType } from '../types/sugampath';

/**
 * Strict-verification legal report engine.
 * No generated legal text. Clauses come from the fixed table below, chosen only by issue category and place type.
 * Have counsel review CLAUSES and TEXT before official use.
 */

export type IssueTier = 'structural' | 'maintenance' | 'transient';
export type ReportTrack = 'structural' | 'municipal' | 'none';

export const THRESHOLDS = {
  /** A maintenance fault (e.g. broken lift) must stay unresolved this long. */
  prolongedHours: 48,
  /** Minimum AI confidence when relying on a single clear photo. */
  minConfidence: 0.75,
  /** Independent audits / sensor traces that can replace a high-confidence photo. */
  minConfirmed: 2,
} as const;

interface CategoryRule {
  tier: IssueTier;
  track: ReportTrack;
  group: 'building' | 'transport' | 'civic' | 'none';
  action: string;
}

const RULES: Record<IssueCategory, CategoryRule> = {
  no_ramp: {
    tier: 'structural',
    track: 'structural',
    group: 'building',
    action: 'Construct a compliant ramp (gradient not steeper than 1:12, handrails on both sides) at the identified entrance.',
  },
  steep_ramp: {
    tier: 'structural',
    track: 'structural',
    group: 'building',
    action: 'Rebuild or re-grade the ramp to the gradient and handrail standard in the Harmonised Guidelines.',
  },
  broken_lift: {
    tier: 'maintenance',
    track: 'structural',
    group: 'building',
    action: 'Repair the lift and restore step-free access. Display status and an alternative accessible route until repaired.',
  },
  missing_tactile: {
    tier: 'structural',
    track: 'structural',
    group: 'building',
    action: 'Install continuous tactile guiding and warning paving along the accessible route to the entrance.',
  },
  no_low_floor_bus: {
    tier: 'structural',
    track: 'structural',
    group: 'transport',
    action: 'Deploy low-floor accessible buses on this route and provide an accessible boarding area.',
  },
  blocked_tactile: {
    tier: 'transient',
    track: 'municipal',
    group: 'civic',
    action: 'Clear the obstruction from the tactile path and enforce no-parking / no-vending on the footpath.',
  },
  obstruction: {
    tier: 'transient',
    track: 'municipal',
    group: 'civic',
    action: 'Clear the footpath obstruction and enforce no-parking / no-vending on the footpath.',
  },
  open_drain: {
    tier: 'maintenance',
    track: 'municipal',
    group: 'civic',
    action: 'Cover or fence the open drain adjacent to the public footpath.',
  },
  other: { tier: 'transient', track: 'none', group: 'none', action: '' },
};

export interface Clause {
  ref: string;
  text: string;
}

const SEC = (n: number, text: string): Clause => ({ ref: `RPwD Act, 2016, Section ${n}`, text });
const S40 = SEC(40, 'Rules for accessibility standards.');
const S41 = SEC(41, 'Accessibility in transport (bus stops, railway stations, airports).');
const S44 = SEC(44, 'Building plans and completion of public buildings must adhere to the accessibility rules.');
const S45 = SEC(45, 'Existing public buildings to be made accessible within the prescribed time-limit.');
const S46 = SEC(46, 'Service providers to provide accessible services within the prescribed time-limit.');
const S89 = SEC(89, 'Penalty for contravention of the Act or its rules.');
const HGUA: Clause = {
  ref: 'Harmonised Guidelines and Standards for Universal Accessibility in India, 2021 (MoHUA)',
  text: 'Technical standard for ramps, lifts, doorways, tactile paving and approach paths.',
};
const RAJIVE: Clause = {
  ref: 'Rajive Raturi v. Union of India, 2024 INSC 858 (Supreme Court, 8 November 2024)',
  text: 'Accessibility is part of Articles 14, 19 and 21; compliance with accessibility standards is mandatory.',
};

const TRANSIT: PlaceType[] = ['railway_station', 'bus_stand', 'bus_stop', 'metro_station'];

export function clausesFor(category: IssueCategory, placeType: PlaceType): Clause[] {
  const rule = RULES[category];
  if (rule.track !== 'structural') return [];
  if (rule.group === 'transport') return [S40, S41, S89, RAJIVE];
  const list = [S40, S44, S45, S46];
  if (TRANSIT.includes(placeType)) list.push(S41);
  list.push(S89, HGUA, RAJIVE);
  return list;
}

export interface Eligibility {
  eligible: boolean;
  track: ReportTrack;
  tier: IssueTier;
  /** Plain-language reasons the report is blocked. Empty when eligible. */
  blockers: string[];
  ageHours: number;
}

export function checkEligibility(issue: AuditIssue, now = Date.now()): Eligibility {
  const rule = RULES[issue.category];
  const ageHours = Math.max(0, (now - Date.parse(issue.created_at)) / 3600_000);
  const blockers: string[] = [];

  if (rule.track === 'none') {
    blockers.push('This category has no fixed legal mapping. It needs human review.');
  }
  if (issue.status === 'fixed' || issue.status === 'wont_fix') {
    blockers.push('The issue is already closed.');
  }
  if (rule.tier === 'maintenance' && ageHours < THRESHOLDS.prolongedHours) {
    const left = Math.ceil(THRESHOLDS.prolongedHours - ageHours);
    blockers.push(
      `A maintenance fault must stay unresolved for ${THRESHOLDS.prolongedHours} hours before it can be reported. About ${left} more hours.`
    );
  }

  const clearPhoto =
    Boolean(issue.proof_photo) &&
    issue.findings.image_quality === 'good' &&
    issue.findings.ai_confidence >= THRESHOLDS.minConfidence;
  const independent = issue.confirmations >= THRESHOLDS.minConfirmed;

  if (rule.tier === 'transient') {
    // Temporary clutter is only ever summarised as a repeat municipal hazard, never from one sighting.
    if (!independent) {
      blockers.push(`Repeat sightings needed: ${issue.confirmations} of ${THRESHOLDS.minConfirmed} independent reports.`);
    }
  } else if (!clearPhoto && !independent) {
    blockers.push(
      `Not enough evidence. Needs a clear photo at confidence ${THRESHOLDS.minConfidence} or higher, or ${THRESHOLDS.minConfirmed} independent confirmations.`
    );
  }

  return {
    eligible: blockers.length === 0 && rule.track !== 'none',
    track: rule.track,
    tier: rule.tier,
    blockers,
    ageHours,
  };
}

export interface VerifiedReport {
  auditId: string;
  track: 'structural' | 'municipal';
  title: string;
  generatedAt: number;
  issueId: string;
  placeName: string;
  gateName: string;
  city: string;
  lat: number;
  lng: number;
  firstReportedAt: string;
  verificationCount: number;
  confidence: number;
  evidenceHash: string;
  evidenceSummary: string;
  finding: string;
  clauses: Clause[];
  correctiveAction: string;
  addressee: string;
  disclaimer: string;
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Throws if not eligible. Callers must check eligibility first. */
export async function buildReport(issue: AuditIssue, place: Place, now = Date.now()): Promise<VerifiedReport> {
  const elig = checkEligibility(issue, now);
  if (!elig.eligible || elig.track === 'none') throw new Error('Report is not eligible');

  const rule = RULES[issue.category];
  const evidenceHash = await sha256Hex(
    JSON.stringify({
      id: issue.id,
      created_at: issue.created_at,
      photo: issue.proof_photo ?? null,
      findings: issue.findings,
      confirmations: issue.confirmations,
    })
  );
  const track = elig.track as 'structural' | 'municipal';
  const gateName = issue.gate_name ?? 'Entrance not specified';

  return {
    auditId: `SP-${issue.id}-${evidenceHash.slice(0, 8).toUpperCase()}`,
    track,
    title:
      track === 'structural'
        ? 'Verified Accessibility Non-Compliance Report'
        : 'Municipal / Traffic Enforcement Hazard Summary',
    generatedAt: now,
    issueId: issue.id,
    placeName: place.name,
    gateName,
    city: place.city_name,
    lat: place.lat,
    lng: place.lng,
    firstReportedAt: issue.created_at,
    verificationCount: issue.confirmations,
    confidence: issue.findings.ai_confidence,
    evidenceHash,
    evidenceSummary: `${issue.proof_photo ? 'Time-stamped photo, ' : ''}${issue.confirmations} independent confirmation(s), AI confidence ${issue.findings.ai_confidence.toFixed(2)}, open for ${Math.floor(elig.ageHours)} hours.`,
    finding: issue.title,
    clauses: track === 'structural' ? clausesFor(issue.category, place.type) : [],
    correctiveAction: rule.action,
    addressee:
      track === 'structural'
        ? 'Station Superintendent / Building Owner / CPGRAMS (Department of Administrative Reforms and Public Grievances)'
        : 'Municipal Ward Officer / Traffic Police (Enforcement)',
    disclaimer:
      track === 'structural'
        ? 'Compiled automatically from citizen-collected evidence. Statutory references are fixed text selected by issue type, not legal advice. Findings are subject to inspection by the competent authority.'
        : 'This is a footpath encroachment and enforcement summary. It does not allege a building-plan or structural violation under RPwD Act Section 44. Compiled automatically from citizen-collected evidence.',
  };
}
